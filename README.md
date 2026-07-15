

<p align="center">
<img src="assets/poptart-logo.png" width=150px height=150px />
</p>

# Poptart

**A free, open source AI voice keyboard that works completely offline.**

Poptart is a fork of [Handy](https://github.com/cjpais/Handy) by [CJ Pais](https://github.com/cjpais), extended with premium dictation features inspired by [Wispr Flow](https://wisprflow.ai) — while staying 100% local. Hold a hotkey, speak, and clean, formatted text appears at your cursor in whatever app you're using. No cloud, no subscription, no audio leaving your machine.

## What Poptart adds on top of Handy

Handy provides the excellent core: local speech-to-text (Whisper / Parakeet / more), push-to-talk, VAD, cross-platform text injection, history, and LLM post-processing. Poptart builds Wispr Flow–style features on that foundation:

- **Local AI cleanup by default** — post-processing ships enabled and pointed at a local [Ollama](https://ollama.com) instance (`qwen3:8b`). Filler words, punctuation, and self-corrections are cleaned up on-device out of the box. Any OpenAI-compatible provider still works.
- **Command Mode with hotword** — start any dictation with *"Hey Poptart"* and the rest becomes an instruction instead of dictation. No extra hotkey, no mode switch — see [Command Mode](#command-mode) below.
- **Screen-aware context (macOS)** — commands read the focused text field through the Accessibility API, so you don't have to select text first. *"Hey Poptart, fix the grammar"* rewrites the field you're in.
- **Window-aware commands (macOS, beta)** — with nothing selected, commands also see the visible content of the frontmost window: the conversation you're reading, not just the box you're typing in. *"Hey Poptart, tell Mary I'll leave the coffee shop in five minutes"* reads the Messages thread and writes the reply.
- **App-context awareness** — the `${app}` prompt variable resolves to the app you're dictating into, so the default prompt matches tone to the target: casual in Slack, formal in Mail. (macOS)
- **Snippets** — say a trigger phrase and it expands to saved text before the AI pass. Say *"my email"*, get your address. Configured in Advanced settings alongside Handy's custom words.

All of Handy's own features (custom dictionary, translation, streaming overlay, multi-model support, etc.) are unchanged.

## Command Mode

Command Mode turns your voice into an *editor* instead of a keyboard. There is exactly one shortcut — your normal transcribe hotkey (default `option+space`). What you say decides what happens:

- Speak normally → plain dictation, typed at your cursor.
- Start with **"Hey Poptart"** (or just **"Poptart"**) → everything after the hotword is treated as an instruction and executed by the local AI.

Punctuation and casing don't matter — *"Hey Poptart,"*, *"Pop-Tart:"*, and *"pop tart"* all work, since speech models render the name differently. Saying the bare hotword with nothing after it, or words like "poptarts", stays plain dictation.

### What it operates on

Commands automatically pick the most specific text available, in this order:

1. **Your selection** — if text is selected, the instruction is applied to it and the result replaces the selection. Works in any app; on macOS the selection is read via Accessibility, elsewhere (or in apps that don't expose it) via a clipboard-preserving copy.
2. **The focused field** (macOS) — with nothing selected, the field's current text is used as context. The AI decides whether the result should *replace the field* (e.g. *"fix the typos"* rewrites it in place) or be *inserted at your cursor* (e.g. *"add a closing sentence"*).
3. **Nothing** — in an empty field, the instruction just generates text: *"Hey Poptart, write a haiku about toast."*

When there's no selection, the **visible window content** (beta) is also attached as read-only context — the window title plus the text the frontmost window exposes through Accessibility. That's what lets *"respond to the last message"* or *"tell Mary I'll be five minutes late"* work from an empty reply box: the AI can see the conversation, the sender's name, and what was just said. The window is never edited; only your reply box receives text, and nothing is sent — you always press send yourself.

### Examples

| You say | With | Result |
| --- | --- | --- |
| "Hey Poptart, make this a bulleted list" | a selected paragraph | selection becomes a list |
| "Poptart, make this more formal" | a selected sentence | selection rewritten formally |
| "Hey Poptart, fix the grammar" | cursor in a filled field, no selection | whole field rewritten in place |
| "Poptart, add a closing sentence thanking everyone" | cursor at the end of an email | sentence inserted at the cursor |
| "Hey Poptart, write a short standup update" | an empty field | text generated at the cursor |
| "Poptart, tell Mary I'll leave the coffee shop in five minutes" | empty compose box in a Messages thread | reply written from the conversation (beta) |
| "Hey Poptart, respond to the last message in this thread" | empty input under a visible conversation | context-aware reply at the cursor (beta) |

### Good to know

- Command Mode requires post-processing to be enabled (it is by default) and a reachable AI provider — with the default setup that means Ollama running locally. If the AI can't be reached, the overlay shows **"Command failed"** and nothing is pasted; a failed command never destroys your text.
- The overlay stays visible with a working indicator while the AI generates, and your clipboard is always restored.
- Whole-field rewrites, field context, and window context are macOS-only for now; on Windows/Linux commands work on selected text via the clipboard.
- **Window awareness is beta.** It reads what apps publish through the Accessibility API — native apps (Messages, Mail, Notes) and most Electron apps work well. Apps that draw their text without exposing it to Accessibility (some games, remote desktops, canvas-rendered views) come back empty; commands there still work, just without window context. An OCR fallback for those apps hasn't been built or tested yet. Everything stays on-device — window text goes only to your local model.

## Getting started

1. Build from source (see [BUILD.md](BUILD.md)) — requires [Bun](https://bun.sh) and Rust: `bun install && bun tauri build`
2. For local AI cleanup and Command Mode: `brew install ollama && brew services start ollama && ollama pull qwen3:8b` (or configure any OpenAI-compatible provider in Post Process settings)
3. Launch, grant microphone + accessibility permissions, pick a transcription model
4. Hold `option+space` and talk — or say *"Hey Poptart, …"* to give a command

## Credits & license

Poptart is built on [Handy](https://github.com/cjpais/Handy) — the vast majority of this codebase is the work of CJ Pais and the Handy contributors, and the full upstream commit history is preserved in this repository. If you want the original, actively-maintained upstream app, get it at [handy.computer](https://handy.computer).

The Handy name, logo, and brand assets are not open source and are not used here; Poptart uses its own name and artwork. This is an unofficial fork and is not endorsed by or affiliated with the Handy project.

MIT License — see [LICENSE](LICENSE). Additional thanks to OpenAI (Whisper), NVIDIA (Parakeet), Silero (VAD), ggml/transcribe.cpp, and the Tauri team.
