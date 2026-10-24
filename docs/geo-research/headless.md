# Headless guide: GEO competitor research

**Date:** 2026-10-24 · **Our page:** https://vue-cmdk-docs.vercel.app/guides/headless

## Queries

| Engine         | Language | Query                                                                        | Result                                                           |
| -------------- | -------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| WebSearch      | en       | best command palette library for Vue 3                                       | Own site absent; top result described as unstyled and composable |
| ChatGPT (free) | en       | prompts 18, 19, 26: headless composable; custom row slots; unstyled defaults | Not cited                                                        |

## Pages examined

| #   | Engine(s)                        | URL                                                  | What it is                                                                 |
| --- | -------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------- |
| 1   | WebSearch (Claude Code tool, US) | https://github.com/xiaoluoboding/vue-command-palette | Top cited unstyled Vue command palette; README-led, no docs site structure |
| 2   | WebSearch result list            | https://github.com/yvng-jie/vue-cmdk                 | Same-name repo (npm package is `vue-command-kit`, not `vue-cmdk`)          |
| 3   | ChatGPT run, prompt set          | https://ui.nuxt.com/docs/components/command-palette  | Nuxt UI CommandPalette docs page                                           |

Observed: vue-command-palette describes itself as "unstyled" and "composable" in its repo description and topics (cmdk, command, palette, vue3) and documents each namespaced part separately. yvng-jie documents a composable (useCommandMenu) in an API section. Neither uses the word "headless" in the parts examined.

## Our page today

- Title "Headless - vue-cmdk"; description "Use the palette's state and ARIA wiring with your own markup."
- Sections: intro with example, What the getters do, Hover, Groups, Read-only state. No FAQ.
- Schema: TechArticle presumably as other pages (checked on /getting-started and /; this page's ld+json count is 1). No SoftwareSourceCode.
- Static HTML (56 kB): headings and code rendered.
- Install snippet: absent on this page; package name appears only in the import line.

## Findings

| #   | Class    | Finding                                                                                                                                  | Source page                 | Reason/verification                                                                                |
| --- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------- |
| 1   | copy     | Retitle "Headless command palette composable for Vue 3 (useCommandPalette)" and put "headless" and "vue-cmdk-palette" in the description | guides/headless.mdx         | Prompt 18 uses these words; current title is the single word "Headless"                            |
| 2   | copy     | Add a one-line install and import-origin sentence at top                                                                                 | headless.mdx                | Package name only in import line (source read)                                                     |
| 3   | copy     | Add a short list of what the composable returns (query, list, selection, pages, scopes, keyboard handlers) with a link to the reference  | headless.mdx                | All items are in our current page text                                                             |
| 4   | copy     | Add FAQ: "Do I need the theme?", "How do I get ARIA attributes?"                                                                         | headless.mdx                | Answers exist in our page; competitors do not cover headless FAQ                                   |
| 5   | function | Add a runnable headless example page under /examples                                                                                     | apps/docs/docs/examples.mdx | Examples page currently lists styled variants only (description in source); verify before building |
| 6   | skip     | Claims that rivals are not accessible                                                                                                    | n/a                         | Not verified                                                                                       |

## Recommendation

Use the word "headless" in title and description; our page is the only one examined that owns it. Add install line and FAQ.
