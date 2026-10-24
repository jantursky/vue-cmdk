# Changelog

All notable changes to `vue-cmdk` are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.2] - 2026-10-24

### Fixed

- The package README states the measured bundle size, about 11 kB minified and gzipped, instead of about 10 kB. The library code is unchanged.

## [1.2.1] - 2026-10-24

### Changed

- The package keywords include `headless`. The library code and the bundle are unchanged.

## [1.2.0] - 2026-10-23

### Added

- Shift+Delete removes the selected row from the Recent group. Apple keyboards have no Delete key, so Shift+Backspace does the same there. The selection stays in place, the footer shows the key while a recent row is selected, and the live region announces the removal.
- `forgetRecent(id)` and `clearRecents()` on `useCommandPalette` and on the template refs of `<CommandPalette>` and `<CommandPaletteDialog>`, plus `forget(id)` and `clear()` on `useRecents`. They save through the configured storage, and the dialog's methods also work while it's closed, so a settings page can offer "Clear history".
- A `no-results` event (`onNoResults` in the composable) with the query and the scope, fired once for a query that matched nothing and stayed unchanged for 500 ms, or right away if the palette closes first.
- Labels `forget` and `forgotten`, and `isRecent(row)` on the composable.

### Fixed

- Search parses the query once per keystroke instead of once per command, which halves the time to filter a long list.

## [1.1.0] - 2026-10-23

### Added

- Search ignores accents: `resume` finds `Résumé`, and `café` finds `Cafe`. The highlight marks the label as written. Labels stored in decomposed form, such as macOS file names, match too.
- A query with several words matches when every word appears in the label, keywords or hint, in any order, so `file new` finds `New file`. The query typed as one run still ranks first, and every matched word is highlighted.
- The build prints the size of an app that imports only `CommandPaletteDialog`, next to the size of the whole entry.

### Changed

- The size budget for the main entry is now 14 kB minified and gzipped, up from 12 kB, to leave room for the next features.
- `matchQuery` marks every query word it finds, and `rankMatch` ranks multi-word queries. Single-word results are unchanged.

### Fixed

- Highlights after a letter whose lower case is longer, such as `İ`, no longer mark the wrong characters.

## [1.0.1] - 2026-10-22

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

[1.2.2]: https://www.npmjs.com/package/vue-cmdk-palette/v/1.2.2
[1.2.1]: https://www.npmjs.com/package/vue-cmdk-palette/v/1.2.1
[1.2.0]: https://www.npmjs.com/package/vue-cmdk-palette/v/1.2.0
[1.1.0]: https://www.npmjs.com/package/vue-cmdk-palette/v/1.1.0
[1.0.1]: https://www.npmjs.com/package/vue-cmdk-palette/v/1.0.1
[1.0.0]: https://www.npmjs.com/package/vue-cmdk-palette/v/1.0.0
