import React from "react";
import { useTranslation } from "react-i18next";

import { useSettings } from "../../hooks/useSettings";

import { ShortcutInput } from "./ShortcutInput";
import { PushToTalk } from "./PushToTalk";
import { VoiceActivityDetection } from "./VoiceActivityDetection";
import { MicrophoneSelector } from "./MicrophoneSelector";
import { MuteWhileRecording } from "./MuteWhileRecording";
import { AudioFeedback } from "./AudioFeedback";
import { OutputDeviceSelector } from "./OutputDeviceSelector";
import { VolumeSlider } from "./VolumeSlider";
import { ModelUnloadTimeoutSetting } from "./ModelUnloadTimeout";
import { AccelerationSelector } from "./AccelerationSelector";
import { LazyStreamClose } from "./LazyStreamClose";
import { PostProcessingToggle } from "./PostProcessingToggle";
import { Snippets } from "./Snippets";
import { CustomWords } from "./CustomWords";
import { AppendTrailingSpace } from "./AppendTrailingSpace";
import { PasteMethodSetting } from "./PasteMethod";
import { TypingToolSetting } from "./TypingTool";
import { ClipboardHandlingSetting } from "./ClipboardHandling";
import { AutoSubmit } from "./AutoSubmit";
import { ThemeSelector } from "./ThemeSelector";
import { AppLanguageSelector } from "./AppLanguageSelector";
import { StartHidden } from "./StartHidden";
import { AutostartToggle } from "./AutostartToggle";
import { ShowTrayIcon } from "./ShowTrayIcon";
import { ShowOverlay } from "./ShowOverlay";
import { UpdateChecksToggle } from "./UpdateChecksToggle";
import { ShowWhatsNewOnUpdate } from "./ShowWhatsNewOnUpdate";
import { HistoryLimit } from "./HistoryLimit";
import { RecordingRetentionPeriodSelector } from "./RecordingRetentionPeriod";
import { AppDataDirectory } from "./AppDataDirectory";
import { KeyboardImplementationSelector } from "./debug/KeyboardImplementationSelector";
import { ModelSettingsCard } from "./general/ModelSettingsCard";
import { ModelsSettings } from "./models/ModelsSettings";
import { HistorySettings } from "./history/HistorySettings";
import { PostProcessingSettings } from "./post-processing/PostProcessingSettings";
import { DebugSettings } from "./debug/DebugSettings";
import { AboutSettings } from "./about/AboutSettings";

/**
 * Settings are organized by what they do, not by which project shipped them —
 * snippets sit beside custom words, and AI cleanup is a normal group rather
 * than a section you have to unlock.
 *
 * Every item carries the same translation key its control renders, so search
 * matches the text actually on screen in the user's language. `keywords` are
 * additional English-only aliases; they can only widen a match, never replace
 * the localized label.
 */
export interface SettingsItem {
  id: string;
  /** i18n key for the label search matches against. */
  labelKey: string;
  /** Untranslated search aliases (old section names, synonyms, jargon). */
  keywords?: string;
  /**
   * "row" sits inside a shared card with its siblings; "block" is a
   * self-contained section that brings its own chrome and renders full width.
   */
  kind?: "row" | "block";
  /** Visibility gate. Omitted means always visible. */
  when?: (settings: SettingsFlags) => boolean;
  render: () => React.ReactNode;
}

export interface SettingsGroupDef {
  id: string;
  titleKey: string;
  items: SettingsItem[];
}

/** Only the flags the gates read. */
type SettingsFlags = {
  post_process_enabled?: boolean;
  debug_mode?: boolean;
} | null;

const row = (node: React.ReactNode) => () => node;

const GROUPS: SettingsGroupDef[] = [
  {
    id: "dictation",
    titleKey: "settings.groups.dictation",
    items: [
      {
        id: "shortcut-transcribe",
        labelKey: "settings.general.shortcut.bindings.transcribe.name",
        keywords: "hotkey binding record dictate general",
        render: row(<ShortcutInput shortcutId="transcribe" grouped />),
      },
      {
        id: "shortcut-post-process",
        labelKey:
          "settings.general.shortcut.bindings.transcribe_with_post_process.name",
        keywords: "hotkey binding llm ai cleanup post process",
        render: row(
          <ShortcutInput shortcutId="transcribe_with_post_process" grouped />,
        ),
      },
      {
        id: "push-to-talk",
        labelKey: "settings.general.pushToTalk.label",
        keywords: "hold release toggle",
        render: row(<PushToTalk descriptionMode="tooltip" grouped />),
      },
      {
        id: "shortcut-cancel",
        labelKey: "settings.general.shortcut.bindings.cancel.name",
        keywords: "hotkey escape abort",
        render: row(<ShortcutInput shortcutId="cancel" grouped />),
      },
      {
        id: "vad",
        labelKey: "settings.advanced.voiceActivityDetection.title",
        keywords: "vad silero silence trim",
        render: row(
          <VoiceActivityDetection descriptionMode="tooltip" grouped />,
        ),
      },
    ],
  },
  {
    id: "audio",
    titleKey: "settings.sound.title",
    items: [
      {
        id: "microphone",
        labelKey: "settings.sound.microphone.title",
        keywords: "input device mic",
        render: row(<MicrophoneSelector descriptionMode="tooltip" grouped />),
      },
      {
        id: "mute-while-recording",
        labelKey: "settings.debug.muteWhileRecording.label",
        keywords: "duck pause other audio",
        render: row(<MuteWhileRecording descriptionMode="tooltip" grouped />),
      },
      {
        id: "audio-feedback",
        labelKey: "settings.sound.audioFeedback.label",
        keywords: "chime beep sound start stop",
        render: row(<AudioFeedback descriptionMode="tooltip" grouped />),
      },
      {
        id: "output-device",
        labelKey: "settings.sound.outputDevice.title",
        keywords: "speaker headphones",
        render: row(<OutputDeviceSelector descriptionMode="tooltip" grouped />),
      },
      {
        id: "volume",
        labelKey: "settings.sound.volume.title",
        keywords: "loudness",
        render: row(<VolumeSlider />),
      },
    ],
  },
  {
    id: "models",
    titleKey: "sidebar.models",
    items: [
      {
        id: "model-picker",
        labelKey: "sidebar.models",
        keywords: "whisper parakeet download install gguf size accuracy",
        kind: "block",
        render: () => <ModelsSettings />,
      },
      {
        id: "model-settings",
        labelKey: "settings.general.language.title",
        keywords: "locale spoken translate english transcription",
        kind: "block",
        // Renders nothing unless the loaded model supports language selection
        // or translation.
        render: () => <ModelSettingsCard />,
      },
      {
        id: "unload-timeout",
        labelKey: "settings.advanced.modelUnload.title",
        keywords: "memory ram idle",
        render: row(
          <ModelUnloadTimeoutSetting descriptionMode="tooltip" grouped />,
        ),
      },
      {
        id: "acceleration",
        labelKey: "settings.advanced.acceleration.transcribe.title",
        keywords: "gpu metal vulkan cpu",
        render: row(<AccelerationSelector descriptionMode="tooltip" grouped />),
      },
      {
        id: "lazy-stream-close",
        labelKey: "settings.advanced.lazyStreamClose.label",
        keywords: "streaming latency",
        render: row(<LazyStreamClose descriptionMode="tooltip" grouped />),
      },
    ],
  },
  {
    id: "text",
    titleKey: "settings.groups.text",
    items: [
      {
        id: "post-processing",
        labelKey: "settings.debug.postProcessingToggle.label",
        keywords: "llm ollama ai cleanup polish post processing",
        render: row(<PostProcessingToggle descriptionMode="tooltip" grouped />),
      },
      {
        id: "snippets",
        labelKey: "settings.advanced.snippets.title",
        keywords: "expansion shortcut text",
        render: row(<Snippets descriptionMode="tooltip" grouped />),
      },
      {
        id: "custom-words",
        labelKey: "settings.advanced.customWords.title",
        keywords: "vocabulary spelling names replacement",
        render: row(<CustomWords descriptionMode="tooltip" grouped />),
      },
      {
        id: "trailing-space",
        labelKey: "settings.debug.appendTrailingSpace.label",
        keywords: "output paste",
        render: row(<AppendTrailingSpace descriptionMode="tooltip" grouped />),
      },
      {
        id: "post-processing-config",
        labelKey: "sidebar.postProcessing",
        keywords: "ollama openai anthropic api key model prompt llm provider",
        kind: "block",
        when: (settings) => settings?.post_process_enabled ?? false,
        render: () => <PostProcessingSettings />,
      },
    ],
  },
  {
    id: "output",
    titleKey: "settings.advanced.groups.output",
    items: [
      {
        id: "paste-method",
        labelKey: "settings.advanced.pasteMethod.title",
        keywords: "clipboard keystroke enigo",
        render: row(<PasteMethodSetting descriptionMode="tooltip" grouped />),
      },
      {
        id: "typing-tool",
        labelKey: "settings.advanced.typingTool.title",
        keywords: "enigo ydotool",
        render: row(<TypingToolSetting descriptionMode="tooltip" grouped />),
      },
      {
        id: "clipboard",
        labelKey: "settings.advanced.clipboardHandling.title",
        keywords: "restore preserve",
        render: row(
          <ClipboardHandlingSetting descriptionMode="tooltip" grouped />,
        ),
      },
      {
        id: "auto-submit",
        labelKey: "settings.advanced.autoSubmit.title",
        keywords: "enter return send",
        render: row(<AutoSubmit descriptionMode="tooltip" grouped />),
      },
    ],
  },
  {
    id: "app",
    titleKey: "settings.advanced.groups.app",
    items: [
      {
        id: "theme",
        labelKey: "theme.title",
        keywords: "dark light appearance",
        render: row(<ThemeSelector descriptionMode="tooltip" grouped />),
      },
      {
        id: "app-language",
        labelKey: "appLanguage.title",
        keywords: "interface locale i18n",
        render: row(<AppLanguageSelector descriptionMode="tooltip" grouped />),
      },
      {
        id: "overlay",
        labelKey: "settings.advanced.overlay.style.title",
        keywords: "hud indicator recording",
        render: row(<ShowOverlay descriptionMode="tooltip" grouped />),
      },
      {
        id: "tray-icon",
        labelKey: "settings.advanced.showTrayIcon.label",
        keywords: "tray systray menu bar",
        render: row(<ShowTrayIcon descriptionMode="tooltip" grouped />),
      },
      {
        id: "start-hidden",
        labelKey: "settings.advanced.startHidden.label",
        keywords: "launch background",
        render: row(<StartHidden descriptionMode="tooltip" grouped />),
      },
      {
        id: "autostart",
        labelKey: "settings.advanced.autostart.label",
        keywords: "startup boot login",
        render: row(<AutostartToggle descriptionMode="tooltip" grouped />),
      },
      {
        id: "update-checks",
        labelKey: "settings.debug.updateChecks.label",
        keywords: "upgrade version",
        render: row(<UpdateChecksToggle descriptionMode="tooltip" grouped />),
      },
      {
        id: "whats-new",
        labelKey: "settings.about.whatsNewUpdates.label",
        keywords: "release notes changelog",
        render: row(<ShowWhatsNewOnUpdate descriptionMode="tooltip" grouped />),
      },
      {
        id: "keyboard-implementation",
        labelKey: "settings.debug.keyboardImplementation.title",
        keywords: "rdev shortcuts backend",
        render: row(
          <KeyboardImplementationSelector descriptionMode="tooltip" grouped />,
        ),
      },
    ],
  },
  {
    id: "history",
    titleKey: "sidebar.history",
    items: [
      {
        id: "history-limit",
        labelKey: "settings.debug.historyLimit.title",
        keywords: "transcripts retention",
        render: row(<HistoryLimit descriptionMode="tooltip" grouped />),
      },
      {
        id: "retention",
        labelKey: "settings.debug.recordingRetention.title",
        keywords: "audio wav delete retention",
        render: row(
          <RecordingRetentionPeriodSelector
            descriptionMode="tooltip"
            grouped
          />,
        ),
      },
      {
        id: "data-dir",
        labelKey: "settings.about.appDataDirectory.title",
        keywords: "path disk storage folder",
        render: row(<AppDataDirectory descriptionMode="tooltip" grouped />),
      },
      {
        id: "transcript-history",
        labelKey: "sidebar.history",
        keywords: "recordings past transcriptions playback saved starred",
        kind: "block",
        render: () => <HistorySettings />,
      },
    ],
  },
  {
    id: "about",
    titleKey: "sidebar.about",
    items: [
      {
        id: "about-block",
        labelKey: "sidebar.about",
        keywords: "version source code logs acknowledgments ggml",
        kind: "block",
        render: () => <AboutSettings />,
      },
    ],
  },
  {
    id: "debug",
    titleKey: "sidebar.debug",
    items: [
      {
        id: "debug-block",
        labelKey: "sidebar.debug",
        keywords: "logs diagnostics paste delay buffer clamshell sounds",
        kind: "block",
        when: (settings) => settings?.debug_mode ?? false,
        render: () => <DebugSettings />,
      },
    ],
  },
];

export interface ResolvedGroup {
  id: string;
  title: string;
  items: (SettingsItem & { label: string })[];
}

/**
 * The catalog with gates applied and labels translated. Groups left empty by
 * their gates drop out rather than rendering as blank sections.
 */
export const useSettingsCatalog = (): ResolvedGroup[] => {
  const { t } = useTranslation();
  const { settings } = useSettings();

  return React.useMemo(
    () =>
      GROUPS.map((group) => ({
        id: group.id,
        title: t(group.titleKey),
        items: group.items
          .filter((item) => !item.when || item.when(settings))
          .map((item) => ({ ...item, label: t(item.labelKey) })),
      })).filter((group) => group.items.length > 0),
    [t, settings],
  );
};

export const matchesQuery = (
  item: { label: string; keywords?: string },
  query: string,
): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return `${item.label} ${item.keywords ?? ""}`.toLowerCase().includes(q);
};
