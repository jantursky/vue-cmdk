# GEO competitor research: summary

**Note:** ChatGPT (free) and Perplexity (free) runs are in `docs/GEO_PROMPTS.md`: 0 of 30 prompts cite this library on either engine. Copilot (personal account) is also done: 0 of 30. Ranks are unchanged by the runs, since no engine cited us. Several unrelated projects share the bare name: `wobsoriano/vue-cmdk` (npm `vue-cmdk`), `yvng-jie/vue-cmdk`, `@yangfree/vue-cmdk`. Date: 2026-10-24.

Pages: [home](home.md) · [getting-started](getting-started.md) · [headless](headless.md) · [name-collision](name-collision.md)

**Done in the repo (committed on `main`, release 1.2.1 on npm):** ranks 1, 2, 4, 5, 7 (keyword part), 8.
**Done after the release (working tree, not committed):** rank 6 FAQ on the docs home, with five answers checked against the repo. Also corrected the bundle size from "about 10 kB" to "about 11 kB" (build: 11.42 kB min+gzip) on the docs home and the package README. The package README change reaches npm only with the next release.
**Done on GitHub (approved):** rank 3, homepage now the docs site, nine topics added.
**Investigated, not changed:** sitemap `lastmod`. Blume's `lastModified: "git"` setting did not produce a `sitemap.xml` in the local build, and the live sitemap comes from a path not visible in `apps/docs/dist`. Needs a look at how the deployed sitemap is generated before any change.
**Done, working tree:** rank 10, a headless example in `apps/example` and on `/examples`. Rank 11, a Nuxt note on `/getting-started`, backed by a server-render check with Nuxt 4.6 and Vue 3.5. Hydration of the open dialog in Nuxt was not checked.
**Done, working tree:** IndexNow. Key file in `apps/docs/public/`, workflow `.github/workflows/indexnow.yml` runs after pushes to `main` that touch the docs, waits for the key file to go live, then submits the sitemap URLs. It works only after the change is pushed and deployed.
**Skipped:** rank 9, JSON-LD SoftwareSourceCode (effect on engines unverified). The comparison half of rank 6 (needs verified competitor claims).

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
