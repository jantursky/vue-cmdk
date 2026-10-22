# Changelog

All notable changes to `vue-cmdk` are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- The default theme now meets the WCAG AA contrast ratio of 4.5:1. The faint text (the result count, the `esc` key, the detail verb) is darker in both modes, and the light accent is a darker teal, `#0a7369`, so white text on it and the active scope chip stay readable.

## [1.0.0] - 2026-10-21

The first version.

### Added

- `<CommandPaletteDialog>`: a modal palette with a global hotkey (`mod+k` by default), optional `/` to open, a focus trap, focus restore and a scroll lock. Shortcuts with ⌥/Alt match the physical key, so they also work on a Mac.
- `<CommandPalette>`: the same palette rendered inline.
- `useCommandPalette()`: the headless state machine, with attribute getters for the WAI-ARIA combobox and listbox pattern.
- Three kinds of command: `action`, `link` (with a new-tab alternate action) and `page` (nested lists, loaded from an array or a sync or async function).
- Substring search over labels, keywords and hints, ranked label prefix, label infix, keyword, then hint. Typographic quotes and dashes match their keyboard forms. A custom `filter` can replace the matcher.
- Scope chips, with Tab and Shift+Tab to cycle and optional typed prefixes such as `>`.
- Recents ranked by frequency and recency, stored in `localStorage` (versioned and namespaced) or through a custom adapter.
- A detail panel, quick-select with ⌘/Ctrl+1-9, layered Escape, and a live region that announces the result count.
- Slots for rows, group headings, the empty and loading states, the detail panel, the footer, the breadcrumb and the field prefix.
- Replaceable labels for every built-in string.
- An optional theme at `vue-cmdk-palette/style.css`, built on `--cmdk-*` variables, with light and dark modes and reduced-motion support.

[Unreleased]: https://github.com/jantursky/vue-cmdk/compare/v1.0.0...HEAD
[1.0.0]: https://www.npmjs.com/package/vue-cmdk-palette/v/1.0.0
