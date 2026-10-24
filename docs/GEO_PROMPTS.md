# GEO prompt set

Fixed questions asked of AI answer engines to see whether vue-cmdk (npm `vue-cmdk-palette`) is mentioned or cited.
Never name the library in a prompt. Ask in a fresh chat, unpersonalized where possible, and re-run the same set
monthly. Do not reword prompts between runs; append new ones at the end.

Brand regex: `/vue[- ]?cmdk(-palette)?/i`. Own hosts: `vue-cmdk-docs.vercel.app`, `vue-cmdk.vercel.app`,
`npmjs.com/package/vue-cmdk-palette`, `github.com/jantursky/vue-cmdk`.

Record per run: **M** = brand mentioned, **C** = own URL cited (write the path),
**#** = position among recommendations, **–** = absent; otherwise why it did not run.

## Prompts

| #   | Type         | Prompt                                                                   |
| --- | ------------ | ------------------------------------------------------------------------ |
| 1   | head         | best command palette library for Vue 3                                   |
| 2   | head         | Vue 3 command palette component                                          |
| 3   | head         | cmdk for Vue                                                             |
| 4   | head         | Vue command menu like Spotlight or Raycast                               |
| 5   | head         | Vue 3 ctrl+k search modal library                                        |
| 6   | alternatives | Vue alternative to the React cmdk library                                |
| 7   | alternatives | alternatives to vue-command-palette                                      |
| 8   | alternatives | is there a Vue port of cmdk                                              |
| 9   | alternatives | lightweight alternative to Nuxt UI CommandPalette                        |
| 10  | task         | how to add a ctrl+k command palette to a Vue 3 app                       |
| 11  | task         | how to build a command palette with nested pages in Vue 3                |
| 12  | task         | Vue command palette with async search and loading state                  |
| 13  | task         | how to open a Vue command palette from code instead of a shortcut        |
| 14  | task         | Vue command palette with fuzzy search and custom ranking                 |
| 15  | task         | how to scope a command palette search to categories in Vue               |
| 16  | task         | Vue command palette that remembers recently used commands                |
| 17  | task         | how to style a Vue command palette with CSS variables                    |
| 18  | headless     | headless command palette composable for Vue 3                            |
| 19  | headless     | Vue command palette with custom row slots                                |
| 20  | a11y         | accessible command palette for Vue with screen reader support            |
| 21  | a11y         | WAI-ARIA combobox command palette Vue example                            |
| 22  | a11y         | command palette keyboard shortcuts and focus trap in Vue                 |
| 23  | positioning  | small command palette library for Vue with no dependencies               |
| 24  | positioning  | tree-shakeable Vue 3 command palette with TypeScript types               |
| 25  | positioning  | Vue command palette that works with Nuxt                                 |
| 26  | positioning  | command palette library for Vue with unstyled or themeable defaults      |
| 27  | docs         | Vue command palette library with good documentation and live examples    |
| 28  | docs         | npm package for a command palette in Vue 3                               |
| 29  | integration  | add a command palette to a Vue Router app with route navigation commands |
| 30  | integration  | Vue command palette with dark mode support                               |

## Run notes

Per run: date, engines, account and plan per engine, anything that blocked a prompt.

**M\*** = the bare name `vue-cmdk` appeared but pointed to an unrelated repo (`yvng-jie/vue-cmdk`), not this library. Strict own-hit test: `vue-cmdk-palette|vue-cmdk-docs|jantursky`.

**2026-10-24, ChatGPT.** Free plan, temporary chat, web search on, unpersonalized. Fresh chat per prompt, ~28 s wait. Text check only: ChatGPT source chips are not anchors, so only inline links (`utm_source=chatgpt.com`) were checked. Prompts 1 and 2 were checked with the loose name regex only, which is stricter-safe (no hit means no strict hit). Prompts 4 and 5 were run twice because a browser batch timed out. No prompt was blocked or rate-limited. Result: 0 of 30 mention or cite this library. The name collision with `yvng-jie/vue-cmdk` surfaced in 4 prompts (3, 6, 23, 26).

**2026-10-24, Perplexity.** Free plan, signed in, prompt passed via `?q=` URL, ~22 s wait, links read from the answer page. Searches are saved in the account history (no temporary mode). Result: 0 of 30 cite this library. `M*` on prompts 3, 4, 5, 8, 9, 11, 18, 24, 26 means an unrelated `vue-cmdk`-named package appeared (for example `@yangfree/vue-cmdk`).

**2026-10-24, Copilot.** Signed in to a personal Microsoft account (not a work account), copilot.com/chat, free. Fresh chat per prompt, ~28 s wait, text check only (Copilot shows no source links in text). `M*` = a bare `vue-cmdk` entry recommended in the list, but its own text names another package (`vue-command-kit`, `npm install vue-cmdk`, or v0.4.0) rather than `vue-cmdk-palette` (ours, v1.2.0). Per prompt 3, 5, 7: Copilot often ranked the other project #1 and labelled it "recommended". Result: 0 of 30 cite this library. Note: Copilot repeated the install name `vue-cmdk` (prompt 7), which matches the docs install bug in `getting-started` (see `docs/geo-research/getting-started.md`).

False positive, prompt 15: the regex matched "limits" in ordinary text, checked by hand, counted as absent.

## Runs

| Date       | Engine                        | 1   | 2   | 3   | 4   | 5   | 6   | 7   | 8   | 9   | 10  | 11  | 12  | 13  | 14  | 15  | 16  | 17  | 18  | 19  | 20  | 21  | 22  | 23  | 24  | 25  | 26  | 27  | 28  | 29  | 30  |
| ---------- | ----------------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-10-24 | ChatGPT (free, temp chat)     | –   | –   | M*  | –   | –   | M*  | –   | –   | –   | –   | –   | –   | –   | –   | –   | –   | –   | –   | –   | –   | –   | –   | M*  | –   | –   | M*  | –   | –   | –   | –   |
| 2026-10-24 | Perplexity (free, logged in)  | –   | –   | M*  | M*  | M*  | –   | –   | M*  | M*  | –   | M*  | –   | –   | –   | –   | –   | –   | M*  | –   | –   | –   | –   | –   | M*  | –   | M*  | –   | –   | –   | –   |
| 2026-10-24 | Copilot (personal MS account) | M*  | –   | M*  | –   | M*  | M*  | M*  | M*  | –   | –   | –   | –   | –   | –   | –   | –   | –   | –   | –   | –   | –   | –   | M*  | –   | –   | M*  | –   | M*  | –   | –   |
