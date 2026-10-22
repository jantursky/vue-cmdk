# Contributing

Thanks for helping. Bug reports, fixes and docs improvements are all welcome. For a new feature, please open an issue first so we can agree on the API before you write it.

## Setup

You need [Bun](https://bun.sh) 1.3 or newer and Node.js 22.19 or newer.

```sh
bun install
bunx playwright install chromium firefox webkit   # once per machine, for the browser tests
bun run dev                                        # the demo app, reading the library's source
```

The [README](README.md#commands) lists every command.

## Before you open a pull request

- `bun run check` passes: format, lint, typecheck and the unit tests with their coverage thresholds.
- `bun run test:browser` passes if you touched components, keyboard handling or styles. It includes an axe-core accessibility check in both themes.
- New behavior has tests. Unit tests live in `packages/vue-cmdk/test`, real-browser tests in `test/browser`.
- If users will notice the change, add a line under `## [Unreleased]` in `packages/vue-cmdk/CHANGELOG.md`, creating that heading if it is missing.
- The library stays dependency-free, and `bun run build` fails above 12 kB minified and gzipped.

## Guidelines

- Keyboard and screen reader support come first. Follow the WAI-ARIA combobox and listbox pattern the components already use.
- Every visible string goes through `labels`, so apps can translate it.
- Styles live in `src/styles/theme.css` and use only `--cmdk-*` variables and `data-cmdk-*` attributes.
- A breaking change needs a new major version. Prefer adding an option over changing a default.
