# Getting started: GEO competitor research

**Date:** 2026-10-24 · **Our page:** https://vue-cmdk-docs.vercel.app/getting-started

## Queries

| Engine         | Language | Query                                                                | Result                        |
| -------------- | -------- | -------------------------------------------------------------------- | ----------------------------- |
| WebSearch      | en       | best command palette library for Vue 3                               | Own site absent (see home.md) |
| ChatGPT (free) | en       | prompts 10, 28: how to add ctrl+k palette; npm package for a palette | Not cited                     |

## Pages examined

| #   | Engine(s)                        | URL                                                  | What it is                                                                 |
| --- | -------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------- |
| 1   | WebSearch (Claude Code tool, US) | https://github.com/xiaoluoboding/vue-command-palette | Top cited unstyled Vue command palette; README-led, no docs site structure |
| 2   | WebSearch result list            | https://github.com/yvng-jie/vue-cmdk                 | Same-name repo (npm package is `vue-command-kit`, not `vue-cmdk`)          |
| 3   | ChatGPT run, prompt set          | https://ui.nuxt.com/docs/components/command-palette  | Nuxt UI CommandPalette docs page                                           |

Observed: vue-command-palette README puts Features, then Install (two package managers), then Usage. Nuxt UI page has no install section at all and opens with usage. yvng-jie README has Installation after Demo, before Quick Start.

## Our page today

- Title "Getting started - vue-cmdk"; description "Install vue-cmdk, import the optional theme, and render a palette."
- Sections: Install (tabbed npm/pnpm/..., browser support table), Import the theme, Render a palette, Inline instead of a dialog, Next steps. No FAQ.
- Schema: TechArticle in JSON-LD. No HowTo, no SoftwareSourceCode.
- Static HTML (68 kB): all headings, code and install tabs are server-rendered.
- **Bug:** the install block (getting-started.mdx line 10-11) installs `vue-cmdk`, but the package is `vue-cmdk-palette` (every import on the page uses that name). Rendered HTML shows "npm install vue-cmdk" and "pnpm add vue-cmdk". On npm, `vue-cmdk` is a different, unrelated package (v0.0.1, repo wobsoriano/vue-cmdk, checked via registry.npmjs.org/vue-cmdk).

## Findings

| #   | Class    | Finding                                                                                                 | Source page                              | Reason/verification                                                                          |
| --- | -------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | copy     | Fix install block to `vue-cmdk-palette` (user-visible bug: readers install the wrong package)           | apps/docs/docs/getting-started.mdx:10-11 | curl on live page and npm registry check both confirm                                        |
| 2   | copy     | Title and description: use "Install vue-cmdk-palette" and mention Vue 3.5, theme import, dialog         | getting-started.mdx frontmatter          | Package name absent from current title/description                                           |
| 3   | copy     | Add a "Nuxt / SSR" note if verified (repo has an SSR test, test/ssr.test.ts); prompt 25 asks about Nuxt | getting-started.mdx                      | SSR test exists in repo README; Nuxt-specific claim must be tested before writing, else skip |
| 4   | copy     | Add 3-question FAQ (peer Vue version, which package name, styled or not)                                | getting-started.mdx                      | Peer Vue ^3.5 is in our own page; competitors' pages lack FAQ                                |
| 5   | function | HowTo or SoftwareSourceCode JSON-LD                                                                     | Blume head                               | Currently TechArticle only (curl); benefit unverified                                        |
| 6   | skip     | Copying the two-manager install layout of competitors                                                   | n/a                                      | Ours already tabbed; no gain                                                                 |

## Recommendation

Ship finding 1 immediately; it is a bug, not an optimization, and also feeds the name collision. Then align title/description with the real package name.
