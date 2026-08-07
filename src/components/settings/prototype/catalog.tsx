// PROTOTYPE — throwaway. Three variants of the settings page, switchable via
// `?variant=` and the floating bottom bar, mounted over the real settings shell
// in dev builds only.
//
// This file is the *content* half of the question: one reorganization of every
// setting, with the Handy/Poptart split dissolved (Snippets sits next to Custom
// Words; post-processing is a normal group, not a conditional section). All
// three variants render this same catalog so the comparison is about layout,
// not about which settings each one happens to show.
//
// Copy lives in these objects rather than JSX literals — the i18n ESLint rule
// bans hardcoded strings in JSX, and a throwaway prototype shouldn't be adding
// keys to 24 locale files.
import React from "react";

import { ShortcutInput } from "../ShortcutInput";
import { PushToTalk } from "../PushToTalk";
import { VoiceActivityDetection } from "../VoiceActivityDetection";
import { MicrophoneSelector } from "../MicrophoneSelector";
import { MuteWhileRecording } from "../MuteWhileRecording";
import { AudioFeedback } from "../AudioFeedback";
import { OutputDeviceSelector } from "../OutputDeviceSelector";
import { VolumeSlider } from "../VolumeSlider";
import { ModelUnloadTimeoutSetting } from "../ModelUnloadTimeout";
import { AccelerationSelector } from "../AccelerationSelector";
import { PostProcessingToggle } from "../PostProcessingToggle";
import { Snippets } from "../Snippets";
import { CustomWords } from "../CustomWords";
import { AppendTrailingSpace } from "../AppendTrailingSpace";
import { PasteMethodSetting } from "../PasteMethod";
import { TypingToolSetting } from "../TypingTool";
import { ClipboardHandlingSetting } from "../ClipboardHandling";
import { AutoSubmit } from "../AutoSubmit";
import { ThemeSelector } from "../ThemeSelector";
import { AppLanguageSelector } from "../AppLanguageSelector";
import { StartHidden } from "../StartHidden";
import { AutostartToggle } from "../AutostartToggle";
import { ShowTrayIcon } from "../ShowTrayIcon";
import { ShowOverlay } from "../ShowOverlay";
import { UpdateChecksToggle } from "../UpdateChecksToggle";
import { ShowWhatsNewOnUpdate } from "../ShowWhatsNewOnUpdate";
import { HistoryLimit } from "../HistoryLimit";
import { RecordingRetentionPeriodSelector } from "../RecordingRetentionPeriod";
import { AppDataDirectory } from "../AppDataDirectory";
import { LazyStreamClose } from "../LazyStreamClose";
import { KeyboardImplementationSelector } from "../debug/KeyboardImplementationSelector";
import { ModelSettingsCard } from "../general/ModelSettingsCard";
import { ModelsSettings } from "../models/ModelsSettings";
import { HistorySettings } from "../history/HistorySettings";
import { PostProcessingSettings } from "../post-processing/PostProcessingSettings";
import { DebugSettings } from "../debug/DebugSettings";
import { AboutBlock } from "./AboutBlock";

export interface CatalogItem {
  id: string;
  /** Shown by variant B's search; also the drawer summary in variant C. */
  label: string;
  /** Extra search terms — old section names, synonyms. */
  keywords?: string;
  /** Essentials in variant C, and the settings most people actually change. */
  essential?: boolean;
  /**
   * "row" sits inside a SettingsGroup card with its siblings; "block" is a
   * whole self-contained section (the model list, history browser, provider
   * config) that brings its own chrome and renders full width.
   */
  kind?: "row" | "block";
  /** Visibility gate, mirroring what the old sections conditioned on. */
  when?: (settings: AppSettingsLike) => boolean;
  render: () => React.ReactNode;
}

export interface CatalogGroup {
  id: string;
  title: string;
  blurb: string;
  items: CatalogItem[];
}

/** Only the flags the gates below read — the store's type is a moving target. */
type AppSettingsLike = {
  post_process_enabled?: boolean;
  debug_mode?: boolean;
} | null;

const row = (node: React.ReactNode) => () => node;

export const CATALOG: CatalogGroup[] = [
  {
    id: "dictation",
    title: "Dictation",
    blurb: "How you start, stop, and cancel a recording.",
    items: [
      {
        id: "shortcut-transcribe",
        label: "Dictate shortcut",
        keywords: "hotkey binding record general",
        essential: true,
        render: row(<ShortcutInput shortcutId="transcribe" grouped />),
      },
      {
        id: "shortcut-post-process",
        label: "Dictate + clean up shortcut",
        keywords: "hotkey binding llm ai post process",
        essential: true,
        render: row(
          <ShortcutInput shortcutId="transcribe_with_post_process" grouped />,
        ),
      },
      {
        id: "push-to-talk",
        label: "Push to talk",
        keywords: "hold release toggle",
        essential: true,
        render: row(<PushToTalk descriptionMode="tooltip" grouped />),
      },
      {
        id: "shortcut-cancel",
        label: "Cancel shortcut",
        keywords: "hotkey escape abort",
        render: row(<ShortcutInput shortcutId="cancel" grouped />),
      },
      {
        id: "vad",
        label: "Voice activity detection",
        keywords: "vad silero silence trim",
        render: row(
          <VoiceActivityDetection descriptionMode="tooltip" grouped />,
        ),
      },
    ],
  },
  {
    id: "audio",
    title: "Audio",
    blurb: "Input device and the sounds Poptart makes.",
    items: [
      {
        id: "microphone",
        label: "Microphone",
        keywords: "input device mic sound",
        essential: true,
        render: row(<MicrophoneSelector descriptionMode="tooltip" grouped />),
      },
      {
        id: "mute-while-recording",
        label: "Mute other audio while recording",
        keywords: "sound duck pause",
        render: row(<MuteWhileRecording descriptionMode="tooltip" grouped />),
      },
      {
        id: "audio-feedback",
        label: "Sound feedback",
        keywords: "chime beep start stop",
        render: row(<AudioFeedback descriptionMode="tooltip" grouped />),
      },
      {
        id: "output-device",
        label: "Output device",
        keywords: "speaker headphones sound",
        render: row(<OutputDeviceSelector descriptionMode="tooltip" grouped />),
      },
      {
        id: "volume",
        label: "Feedback volume",
        keywords: "loudness sound",
        render: row(<VolumeSlider />),
      },
    ],
  },
  {
    id: "model",
    title: "Models",
    blurb: "What transcribes your voice, and in which language.",
    items: [
      {
        id: "model-picker",
        label: "Transcription model",
        keywords: "whisper parakeet download install gguf size accuracy models",
        essential: true,
        kind: "block",
        render: () => <ModelsSettings />,
      },
      {
        id: "model-settings",
        label: "Spoken language",
        keywords: "locale translate english whisper transcription",
        essential: true,
        kind: "block",
        // Self-gating: renders nothing unless the loaded model supports
        // language selection or translation.
        render: () => <ModelSettingsCard />,
      },
      {
        id: "unload-timeout",
        label: "Unload model after",
        keywords: "memory ram idle advanced",
        render: row(
          <ModelUnloadTimeoutSetting descriptionMode="tooltip" grouped />,
        ),
      },
      {
        id: "acceleration",
        label: "Hardware acceleration",
        keywords: "gpu metal vulkan cpu advanced experimental",
        render: row(<AccelerationSelector descriptionMode="tooltip" grouped />),
      },
      {
        id: "lazy-stream-close",
        label: "Lazy stream close",
        keywords: "streaming latency experimental advanced",
        render: row(<LazyStreamClose descriptionMode="tooltip" grouped />),
      },
    ],
  },
  {
    id: "text",
    title: "Text & AI",
    blurb:
      "Everything that rewrites the transcript before it lands — cleanup, replacements, expansions.",
    items: [
      {
        id: "post-processing",
        label: "AI cleanup",
        keywords: "llm ollama post processing polish experimental poptart",
        essential: true,
        render: row(<PostProcessingToggle descriptionMode="tooltip" grouped />),
      },
      {
        id: "snippets",
        label: "Snippets",
        keywords: "expansion shortcut text poptart",
        render: row(<Snippets descriptionMode="tooltip" grouped />),
      },
      {
        id: "custom-words",
        label: "Custom words",
        keywords: "vocabulary spelling names replacement advanced",
        render: row(<CustomWords descriptionMode="tooltip" grouped />),
      },
      {
        id: "trailing-space",
        label: "Append trailing space",
        keywords: "output paste advanced",
        render: row(<AppendTrailingSpace descriptionMode="tooltip" grouped />),
      },
      {
        id: "post-processing-config",
        label: "AI provider and prompts",
        keywords:
          "ollama openai anthropic api key model prompt llm post processing",
        kind: "block",
        // The old sidebar hid this section entirely when cleanup was off.
        when: (settings) => settings?.post_process_enabled ?? false,
        render: () => <PostProcessingSettings />,
      },
    ],
  },
  {
    id: "output",
    title: "Output",
    blurb: "How the finished text gets into the app you're typing in.",
    items: [
      {
        id: "paste-method",
        label: "Paste method",
        keywords: "clipboard keystroke enigo advanced",
        essential: true,
        render: row(<PasteMethodSetting descriptionMode="tooltip" grouped />),
      },
      {
        id: "typing-tool",
        label: "Typing tool",
        keywords: "enigo ydotool advanced",
        render: row(<TypingToolSetting descriptionMode="tooltip" grouped />),
      },
      {
        id: "clipboard",
        label: "Clipboard handling",
        keywords: "restore preserve advanced",
        render: row(
          <ClipboardHandlingSetting descriptionMode="tooltip" grouped />,
        ),
      },
      {
        id: "auto-submit",
        label: "Auto submit",
        keywords: "enter return send advanced",
        render: row(<AutoSubmit descriptionMode="tooltip" grouped />),
      },
    ],
  },
  {
    id: "app",
    title: "App",
    blurb: "Appearance, startup, and updates.",
    items: [
      {
        id: "theme",
        label: "Theme",
        keywords: "dark light appearance about",
        render: row(<ThemeSelector descriptionMode="tooltip" grouped />),
      },
      {
        id: "app-language",
        label: "App language",
        keywords: "interface locale i18n about",
        render: row(<AppLanguageSelector descriptionMode="tooltip" grouped />),
      },
      {
        id: "overlay",
        label: "Recording overlay",
        keywords: "hud indicator advanced",
        render: row(<ShowOverlay descriptionMode="tooltip" grouped />),
      },
      {
        id: "tray-icon",
        label: "Menu bar icon",
        keywords: "tray systray advanced",
        render: row(<ShowTrayIcon descriptionMode="tooltip" grouped />),
      },
      {
        id: "start-hidden",
        label: "Start hidden",
        keywords: "launch background advanced",
        render: row(<StartHidden descriptionMode="tooltip" grouped />),
      },
      {
        id: "autostart",
        label: "Launch at login",
        keywords: "startup boot advanced",
        render: row(<AutostartToggle descriptionMode="tooltip" grouped />),
      },
      {
        id: "update-checks",
        label: "Check for updates",
        keywords: "upgrade version about",
        render: row(<UpdateChecksToggle descriptionMode="tooltip" grouped />),
      },
      {
        id: "whats-new",
        label: "Show what's new after updating",
        keywords: "release notes changelog about",
        render: row(<ShowWhatsNewOnUpdate descriptionMode="tooltip" grouped />),
      },
      {
        id: "keyboard-implementation",
        label: "Keyboard implementation",
        keywords: "rdev shortcuts experimental advanced",
        render: row(
          <KeyboardImplementationSelector descriptionMode="tooltip" grouped />,
        ),
      },
    ],
  },
  {
    id: "data",
    title: "History & data",
    blurb: "What Poptart keeps on disk, and for how long.",
    items: [
      {
        id: "history-limit",
        label: "History limit",
        keywords: "transcripts retention advanced",
        render: row(<HistoryLimit descriptionMode="tooltip" grouped />),
      },
      {
        id: "retention",
        label: "Keep recordings for",
        keywords: "audio wav retention delete advanced",
        render: row(
          <RecordingRetentionPeriodSelector
            descriptionMode="tooltip"
            grouped
          />,
        ),
      },
      {
        id: "data-dir",
        label: "App data folder",
        keywords: "path disk storage advanced",
        render: row(<AppDataDirectory />),
      },
      {
        id: "transcript-history",
        label: "Transcript history",
        keywords: "recordings past transcriptions playback saved starred",
        kind: "block",
        render: () => <HistorySettings />,
      },
    ],
  },
  {
    id: "about",
    title: "About",
    blurb: "Version, source, and the projects Poptart is built on.",
    items: [
      {
        id: "about-block",
        label: "Version and links",
        keywords: "about source code logs acknowledgments ggml version",
        kind: "block",
        render: () => <AboutBlock />,
      },
    ],
  },
  {
    id: "debug",
    title: "Debug",
    blurb: "Diagnostics and knobs that only appear in debug mode.",
    items: [
      {
        id: "debug-block",
        label: "Debug tools",
        keywords:
          "logs diagnostics keyboard paste delay buffer always on microphone clamshell sounds",
        kind: "block",
        when: (settings) => settings?.debug_mode ?? false,
        render: () => <DebugSettings />,
      },
    ],
  },
];

/**
 * The catalog with every `when` gate applied — groups that end up empty drop
 * out entirely, which is what keeps Debug and About-only groups from showing
 * as blank sections.
 */
export const visibleCatalog = (settings: AppSettingsLike): CatalogGroup[] =>
  CATALOG.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.when || item.when(settings)),
  })).filter((group) => group.items.length > 0);

export const matchesQuery = (item: CatalogItem, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return `${item.label} ${item.keywords ?? ""}`.toLowerCase().includes(q);
};
