use crate::managers::audio::AudioRecordingManager;
use crate::managers::transcription::TranscriptionManager;
use crate::shortcut;
use crate::TranscriptionCoordinator;
use log::info;
use std::sync::Arc;
use tauri::{AppHandle, Manager};

// Re-export all utility modules for easy access
// pub use crate::audio_feedback::*;
pub use crate::clipboard::*;
pub use crate::overlay::*;
pub use crate::tray::*;

/// Centralized cancellation function that can be called from anywhere in the app.
/// Handles cancelling both recording and transcription operations and updates UI state.
pub fn cancel_current_operation(app: &AppHandle) {
    info!("Initiating operation cancellation...");

    // Unregister the cancel shortcut asynchronously
    shortcut::unregister_cancel_shortcut(app);

    // Cancel any ongoing recording
    let audio_manager = app.state::<Arc<AudioRecordingManager>>();
    let recording_was_active = audio_manager.is_recording();
    audio_manager.cancel_recording();

    // Abandon any live streaming transcription
    let tm = app.state::<Arc<TranscriptionManager>>();
    tm.cancel_stream();

    // Update tray icon and hide overlay
    change_tray_icon(app, crate::tray::TrayIconState::Idle);
    hide_recording_overlay(app);

    // Unload model if immediate unload is enabled
    tm.maybe_unload_immediately("cancellation");

    // Notify coordinator so it can keep lifecycle state coherent.
    if let Some(coordinator) = app.try_state::<TranscriptionCoordinator>() {
        coordinator.notify_cancel(recording_was_active);
    }

    info!("Operation cancellation completed - returned to idle state");
}

/// Check if using the Wayland display server protocol
#[cfg(target_os = "linux")]
pub fn is_wayland() -> bool {
    std::env::var("WAYLAND_DISPLAY").is_ok()
        || std::env::var("XDG_SESSION_TYPE")
            .map(|v| v.to_lowercase() == "wayland")
            .unwrap_or(false)
}

/// Check if running on KDE Plasma desktop environment
#[cfg(target_os = "linux")]
pub fn is_kde_plasma() -> bool {
    std::env::var("XDG_CURRENT_DESKTOP")
        .map(|v| v.to_uppercase().contains("KDE"))
        .unwrap_or(false)
        || std::env::var("KDE_SESSION_VERSION").is_ok()
}

/// Check if running on KDE Plasma with Wayland
#[cfg(target_os = "linux")]
pub fn is_kde_wayland() -> bool {
    is_wayland() && is_kde_plasma()
}

/// Name of the frontmost application (the dictation target). Used for the
/// `${app}` post-processing prompt variable so prompts can adapt tone to the
/// target app.
#[cfg(target_os = "macos")]
pub fn frontmost_app_name() -> Option<String> {
    use objc2_app_kit::NSWorkspace;
    let workspace = NSWorkspace::sharedWorkspace();
    let app = workspace.frontmostApplication()?;
    app.localizedName().map(|name| name.to_string())
}

// ponytail: macOS only; Windows (GetForegroundWindow) / Linux when needed
#[cfg(not(target_os = "macos"))]
pub fn frontmost_app_name() -> Option<String> {
    None
}

#[cfg(target_os = "macos")]
fn copy_attr(
    el: &objc2_application_services::AXUIElement,
    name: &str,
) -> Option<objc2_core_foundation::CFRetained<objc2_core_foundation::CFType>> {
    use objc2_application_services::AXError;
    use objc2_core_foundation::{CFRetained, CFString, CFType};
    use std::ptr::NonNull;

    let attr = CFString::from_str(name);
    let mut value: *const CFType = std::ptr::null();
    let err = unsafe { el.copy_attribute_value(&attr, NonNull::from(&mut value)) };
    if err != AXError::Success {
        return None;
    }
    NonNull::new(value.cast_mut()).map(|v| unsafe { CFRetained::from_raw(v) })
}

#[cfg(target_os = "macos")]
fn as_text(v: objc2_core_foundation::CFRetained<objc2_core_foundation::CFType>) -> Option<String> {
    let s = v
        .downcast::<objc2_core_foundation::CFString>()
        .ok()?
        .to_string();
    if s.trim().is_empty() {
        None
    } else {
        Some(s)
    }
}

/// Selected text and full text value of the focused UI element, read via the
/// Accessibility API. Uses the same TCC Accessibility grant the app already
/// requires for shortcuts; any failure (trust revoked, no focused element,
/// non-text element) yields None and callers fall back to the clipboard path.
#[cfg(target_os = "macos")]
pub fn ax_focused_texts() -> (Option<String>, Option<String>) {
    use objc2_application_services::AXUIElement;

    let system = unsafe { AXUIElement::new_system_wide() };
    let Some(focused) =
        copy_attr(&system, "AXFocusedUIElement").and_then(|v| v.downcast::<AXUIElement>().ok())
    else {
        return (None, None);
    };
    let selected = copy_attr(&focused, "AXSelectedText").and_then(as_text);
    // ponytail: no size cap on the field value; truncate if giant text views
    // ever blow the LLM context
    let value = copy_attr(&focused, "AXValue").and_then(as_text);
    (selected, value)
}

#[cfg(not(target_os = "macos"))]
pub fn ax_focused_texts() -> (Option<String>, Option<String>) {
    (None, None) // ponytail: clipboard fallback covers other platforms
}

/// Last `max_chars` characters of `s`, char-boundary safe.
pub(crate) fn tail_chars(s: &str, max_chars: usize) -> &str {
    if max_chars == 0 {
        return "";
    }
    match s.char_indices().rev().nth(max_chars - 1) {
        Some((i, _)) => &s[i..],
        None => s, // fewer than max_chars chars
    }
}

/// Visible text of the frontmost app's focused window, gathered by walking its
/// Accessibility tree. Gives Command Mode conversation-level context (message
/// threads, terminal output) beyond the focused field. Best effort: any
/// failure yields None and commands behave as if no window text existed.
///
/// The walk visits children in REVERSE document order and collects each node's
/// value after its children, then reverses the pieces at the end — exact
/// pre-order output, but every cap (nodes, chars, deadline) trims the HEAD of
/// the window, never the tail, so "the last message" always survives.
#[cfg(target_os = "macos")]
pub fn ax_window_text(max_chars: usize) -> Option<String> {
    use objc2_app_kit::NSWorkspace;
    use objc2_application_services::AXUIElement;
    use objc2_core_foundation::{kCFBooleanTrue, CFArray, CFString};
    use std::time::{Duration, Instant};

    const MAX_DEPTH: usize = 40; // Chromium AX trees nest deep
    const MAX_NODES: usize = 2000; // belt; the deadline is the real time bound

    fn walk(
        el: &AXUIElement,
        depth: usize,
        nodes: &mut usize,
        chars: &mut usize,
        max_chars: usize,
        deadline: Instant,
        pieces: &mut Vec<String>,
    ) {
        if depth == 0 || *nodes == 0 || *chars >= max_chars || Instant::now() > deadline {
            return;
        }
        *nodes -= 1;
        if let Some(children) =
            copy_attr(el, "AXChildren").and_then(|v| v.downcast::<CFArray>().ok())
        {
            // Safety: AXChildren is documented to contain AXUIElements.
            let children = unsafe { children.cast_unchecked::<AXUIElement>() };
            for i in (0..children.len()).rev() {
                if let Some(child) = children.get(i) {
                    walk(&child, depth - 1, nodes, chars, max_chars, deadline, pieces);
                }
            }
        }
        if let Some(text) = copy_attr(el, "AXValue").and_then(as_text) {
            *chars += text.chars().count() + 1;
            pieces.push(text);
        } else if let Some(desc) = copy_attr(el, "AXDescription").and_then(as_text) {
            // Transcript views (e.g. Messages bubbles) expose their text via
            // AXDescription, not AXValue — including the sender's name. Take
            // it as a fallback, but skip control chrome whose descriptions
            // are UI labels ("Send", "emoji picker"), not content.
            let role = copy_attr(el, "AXRole").and_then(as_text).unwrap_or_default();
            let chrome = role.contains("Button")
                || role == "AXMenuItem"
                || role == "AXImage"
                || role == "AXToolbar";
            if !chrome {
                *chars += desc.chars().count() + 1;
                pieces.push(desc);
            }
        }
    }

    let started = Instant::now();
    let pid = NSWorkspace::sharedWorkspace()
        .frontmostApplication()?
        .processIdentifier();
    let app_el = unsafe { AXUIElement::new_application(pid) };
    // Bound each AX IPC call so a hung app can't stall the walk (default is 6s).
    let _ = unsafe { app_el.set_messaging_timeout(0.25) };
    // Best-effort: Electron/Chromium apps only build their AX tree when asked.
    if let Some(b) = unsafe { kCFBooleanTrue } {
        let err = unsafe {
            app_el.set_attribute_value(&CFString::from_str("AXManualAccessibility"), b.as_ref())
        };
        log::debug!("AXManualAccessibility set: {:?}", err);
    }
    let window = copy_attr(&app_el, "AXFocusedWindow")?
        .downcast::<AXUIElement>()
        .ok()?;

    let deadline = Instant::now() + Duration::from_millis(800);
    let mut pieces = Vec::new();
    let (mut nodes, mut chars) = (MAX_NODES, 0usize);
    walk(
        &window,
        MAX_DEPTH,
        &mut nodes,
        &mut chars,
        max_chars,
        deadline,
        &mut pieces,
    );
    if pieces.is_empty() {
        log::debug!("window text walk: empty after {:?}", started.elapsed());
        return None;
    }
    pieces.reverse();
    // Window title first: in chat apps the 1:1 window title IS the contact's
    // name, which instructions like "address them by name" depend on.
    if let Some(title) = copy_attr(&window, "AXTitle").and_then(as_text) {
        let app = frontmost_app_name().unwrap_or_default();
        pieces.insert(0, format!("[{} — {}]", app, title));
    }
    let joined = pieces.join("\n");
    let text = tail_chars(&joined, max_chars).to_string();
    log::debug!(
        "window text walk: {} chars in {:?} (nodes left {})",
        text.chars().count(),
        started.elapsed(),
        nodes
    );
    Some(text)
}

#[cfg(not(target_os = "macos"))]
pub fn ax_window_text(_max_chars: usize) -> Option<String> {
    None // ponytail: macOS only; UIA/AT-SPI walks if other platforms need it
}

#[cfg(test)]
mod tests {
    use super::tail_chars;

    #[test]
    fn tail_chars_passthrough_and_truncation() {
        assert_eq!(tail_chars("hello", 10), "hello");
        assert_eq!(tail_chars("hello", 5), "hello");
        assert_eq!(tail_chars("hello world", 5), "world");
        assert_eq!(tail_chars("", 5), "");
    }

    #[test]
    fn tail_chars_respects_char_boundaries() {
        assert_eq!(tail_chars("日本語テスト", 3), "テスト");
        assert_eq!(tail_chars("aé😀b", 2), "😀b");
    }

    #[test]
    fn tail_chars_zero_is_empty() {
        assert_eq!(tail_chars("hello", 0), "");
    }
}
