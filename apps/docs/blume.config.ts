import { readFileSync } from 'node:fs'

import { defineConfig } from 'blume'

const pkg = JSON.parse(readFileSync(new URL('../../packages/vue-cmdk/package.json', import.meta.url), 'utf8')) as {
  version: string
}

export default defineConfig({
  title: 'vue-cmdk',
  description: 'A small, accessible command palette for Vue 3.',
  logo: '/logo.svg',
  github: {
    owner: 'jantursky',
    repo: 'vue-cmdk',
    dir: 'apps/docs',
  },
  navigation: {
    actions: [
      { href: 'https://vue-cmdk.vercel.app', label: 'Demo' },
      { href: 'https://www.npmjs.com/package/@jantursky/vue-cmdk', label: 'npm' },
    ],
  },
  content: {
    root: 'docs',
  },
  theme: {
    accent: 'teal',
    mode: 'system',
  },
  // Read from the library's package.json, so `{{version}}` in a page is always the current one.
  variables: {
    version: pkg.version,
  },
  // The live previews run the demo app's example files, so the docs and the demo never drift apart.
  examples: {
    source: '../example/src/examples/*Example.vue',
    css: 'examples.css',
  },
})
