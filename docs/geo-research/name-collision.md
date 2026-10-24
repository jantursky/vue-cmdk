# Name collision with yvng-jie/vue-cmdk

**Date:** 2026-10-24 · **Our page:** https://vue-cmdk-docs.vercel.app/

## Queries

| Engine         | Language | Query                                  | Result                                          |
| -------------- | -------- | -------------------------------------- | ----------------------------------------------- |
| ChatGPT (free) | en       | prompts 3, 6, 23, 26                   | Bare name vue-cmdk pointed to yvng-jie/vue-cmdk |
| WebSearch      | en       | best command palette library for Vue 3 | Neither repo ranks                              |

## Pages examined

| #   | Engine(s) | URL                                         | What it is                                                                                                  |
| --- | --------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1   | ChatGPT   | https://github.com/yvng-jie/vue-cmdk        | Repo named vue-cmdk, npm package named vue-command-kit, 3 stars; topics include cmdk, command-palette, vue3 |
| 2   | registry  | https://registry.npmjs.org/vue-cmdk         | Unrelated npm package `vue-cmdk` 0.0.1 from wobsoriano/vue-cmdk, empty keywords                             |
| 3   | registry  | https://registry.npmjs.org/vue-cmdk-palette | Ours                                                                                                        |

## Our page today (metadata)

- npm: name vue-cmdk-palette 1.2.0; description "Lightweight, accessible command palette for Vue 3: headless composable plus a ready-made dialog component."; keywords vue, vue3, command-palette, cmdk, command-menu, combobox, a11y; homepage vue-cmdk-docs.vercel.app; repo directory packages/vue-cmdk.
- GitHub jantursky/vue-cmdk: description "Accessible command palette (cmd+K) for Vue 3 ... Zero dependencies, about 10 kB gzipped ..."; **topics: none**; homepage URL vue-cmdk.vercel.app (the demo, while npm points to the docs).
- README first heading "vue-cmdk" with no mention of the npm name in the first paragraph; package README says the name only in badges and Install.
- Docs: site name and every title suffix "vue-cmdk"; JSON-LD WebSite name "vue-cmdk"; no sameAs.
- Competitor comparison: vue-command-palette has 4 topics and a one-line "unstyled composable" description; yvng-jie has 7 topics.

## Findings

| #   | Class    | Finding                                                                                                             | Source page                                       | Reason/verification                                                    |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | copy     | Fix install command on /getting-started (installs the unrelated `vue-cmdk`)                                         | getting-started.mdx                               | Verified by curl plus registry                                         |
| 2   | function | Add GitHub topics (vue, vue3, command-palette, cmdk, command-menu, headless, accessibility)                         | GitHub repo settings                              | gh repo view shows topics null                                         |
| 3   | copy     | Align GitHub homepage with npm homepage (docs) or document the split                                                | GitHub repo settings                              | Two different values confirmed                                         |
| 4   | copy     | Lead README and docs intro with "vue-cmdk-palette" (npm) and say "not vue-cmdk on npm" once                         | README.md, packages/vue-cmdk/README.md, index.mdx | Disambiguation wording; both README first paragraphs lack the npm name |
| 5   | copy     | Site title: "vue-cmdk-palette" instead of "vue-cmdk" suffix ("Introduction - vue-cmdk")                             | Blume site config                                 | Observed in live titles                                                |
| 6   | function | JSON-LD SoftwareSourceCode with name vue-cmdk-palette, codeRepository github.com/jantursky/vue-cmdk, sameAs npm URL | Blume head                                        | Only WebSite/WebPage today; engine effect unverified                   |
| 7   | copy     | npm description/keywords: add "headless", "vue-cmdk-palette"; unify with GitHub description (they differ)           | packages/vue-cmdk/package.json                    | Compared texts above                                                   |
| 8   | skip     | Renaming the package                                                                                                | n/a                                               | Out of scope, breaking                                                 |

## Recommendation

Fix the install bug and make "vue-cmdk-palette" the visible name in titles, descriptions, README first line and topics. Structured data is the last step.
