# Docs home: GEO competitor research

**Date:** 2026-10-24 · **Our page:** https://vue-cmdk-docs.vercel.app/

## Queries

| Engine         | Language | Query                                       | Result                                                                                                                                                                                                                   |
| -------------- | -------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| WebSearch      | en       | best command palette library for Vue 3      | Own site absent. Lists vue-command-palette (about 554 stars per a third-party index, last push March 2024), a Web Component based Vue wrapper, and a stale cmdk-style npm package. No head-to-head comparison page found |
| ChatGPT (free) | en       | 30 generic prompts, see docs/GEO_PROMPTS.md | 0 of 30 cite us; name collision in 4                                                                                                                                                                                     |

## Pages examined

| #   | Engine(s)                        | URL                                                  | What it is                                                                 |
| --- | -------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------- |
| 1   | WebSearch (Claude Code tool, US) | https://github.com/xiaoluoboding/vue-command-palette | Top cited unstyled Vue command palette; README-led, no docs site structure |
| 2   | WebSearch result list            | https://github.com/yvng-jie/vue-cmdk                 | Same-name repo (npm package is `vue-command-kit`, not `vue-cmdk`)          |
| 3   | ChatGPT run, prompt set          | https://ui.nuxt.com/docs/components/command-palette  | Nuxt UI CommandPalette docs page                                           |

## Our page today

- Title: "Introduction - vue-cmdk". Description: a small command palette for Vue 3 that works well from the keyboard and with screen readers. Canonical set, OG tags set.
- Sections (index.mdx): intro, minimal example, screenshot, two usage routes, a 7-item feature bullet list, 4 cards. No FAQ, no comparison table, no install snippet on the page (install lives on /getting-started).
- Schema in static HTML: JSON-LD graph with WebSite (name "vue-cmdk") and WebPage. No SoftwareSourceCode, no FAQPage, no sameAs, no codeRepository.
- Static HTML (curl, 64 kB): h1, title, description, JSON-LD present. The feature list is in HTML. The package name `vue-cmdk-palette` is never stated in prose on this page.
- Options/props: not on this page.

## Findings

| #   | Class    | Finding                                                                                                                                                                                                                | Source page              | Reason/verification                                                                                                                      |
| --- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | copy     | Home never says the npm name `vue-cmdk-palette`; add one install line and the name in the first paragraph                                                                                                              | apps/docs/docs/index.mdx | Verified by reading source and curl: only the word "vue-cmdk" appears                                                                    |
| 2   | copy     | Title and H1 are "Introduction"; engines match on "Vue command palette". Use a title such as "vue-cmdk-palette: command palette for Vue 3" and a description with "headless composable", "WAI-ARIA", "no dependencies" | index.mdx frontmatter    | Our own npm description already uses these terms; competitors' repo descriptions are one short tagline (unstyled/composable)             |
| 3   | copy     | Add a short "How it compares" section (vs vue-command-palette, Nuxt UI) limited to facts we can verify                                                                                                                 | index.mdx                | Neither competitor page examined has a comparison table, so it is an open slot; each cell must cite the competitor's own docs, else skip |
| 4   | copy     | Add a FAQ of 4 to 5 questions matching prompts (Nuxt support, bundle size, accessibility, headless)                                                                                                                    | index.mdx                | No competitor page examined has a FAQ; bundle claim (about 10 kB gzip, 14 kB build gate) is verified in repo README                      |
| 5   | function | Emit SoftwareSourceCode JSON-LD (name vue-cmdk-palette, codeRepository, sameAs npm, programmingLanguage) on the home page                                                                                              | Blume config/head        | Currently only WebSite/WebPage (curl). Whether engines use it is unverified; low cost                                                    |
| 6   | skip     | Claims about competitor star counts or maintenance                                                                                                                                                                     | n/a                      | Third-party index numbers only; not primary-verified                                                                                     |

## Recommendation

Fix the name on the home page first (finding 1, 2), then add FAQ plus a verified comparison block. JSON-LD is optional polish.
