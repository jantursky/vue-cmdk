# GEO competitor research: summary

**Note:** ChatGPT (free) and Perplexity (free) runs are in `docs/GEO_PROMPTS.md`: 0 of 30 prompts cite this library on either engine. Copilot (personal account) is also done: 0 of 30. Ranks are unchanged by the runs, since no engine cited us. Several unrelated projects share the bare name: `wobsoriano/vue-cmdk` (npm `vue-cmdk`), `yvng-jie/vue-cmdk`, `@yangfree/vue-cmdk`. Date: 2026-10-24.

Pages: [home](home.md) · [getting-started](getting-started.md) · [headless](headless.md) · [name-collision](name-collision.md)

**Implemented (working tree, not committed):** ranks 1, 2, 4, 5, 7 (keyword part), 8. Build passes: `bun run build:docs`.
**Rank 3 done on GitHub (approved):** homepage now the docs site, nine topics added. **Pending:** the npm description and keyword changes take effect only with a release.
**Deferred, effort M or unverified:** 6 (FAQ and comparison section), 9 (JSON-LD SoftwareSourceCode: effect on engines unverified, so skip), 10, 11.
**Not in the table:** sitemap lastmod and IndexNow from the baseline; they need a Blume config and deploy change.

| Rank | Page             | Finding                                                                                                 | Class    | Effort | Why now                                                         |
| ---- | ---------------- | ------------------------------------------------------------------------------------------------------- | -------- | ------ | --------------------------------------------------------------- |
| 1    | /getting-started | Install block says `vue-cmdk`, real package is `vue-cmdk-palette`; `vue-cmdk` on npm is another project | copy     | S      | User-visible bug, wrong package installed, feeds name collision |
| 2    | /                | Say `vue-cmdk-palette` in title, first paragraph and an install line                                    | copy     | S      | Most-cited entry page, name absent from prose                   |
| 3    | GitHub repo      | Add topics, align homepage with npm                                                                     | function | S      | Topics are null; competitors have 4-7                           |
| 4    | README files     | Lead with npm name and one disambiguation line                                                          | copy     | S      | First thing engines read on the repo                            |
| 5    | /guides/headless | Retitle with "headless composable", add install line                                                    | copy     | S      | Prompt 18 wording; no examined rival owns "headless"            |
| 6    | /                | FAQ plus verified comparison section                                                                    | copy     | M      | No examined rival has either                                    |
| 7    | npm package.json | Add "headless" and name to keywords; unify descriptions                                                 | copy     | S      | Needs a release                                                 |
| 8    | /getting-started | Title/description with package name, short FAQ                                                          | copy     | S      | Follows rank 1                                                  |
| 9    | site-wide        | JSON-LD SoftwareSourceCode with sameAs/codeRepository                                                   | function | M      | Effect on engines unverified                                    |
| 10   | /examples        | Runnable headless example                                                                               | function | M      | Prompts 19, 26                                                  |
| 11   | /getting-started | Nuxt/SSR note                                                                                           | copy     | M      | Only after testing under Nuxt                                   |
