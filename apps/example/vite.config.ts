import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const lib = (path: string) => fileURLToPath(new URL(`../../packages/vue-cmdk/${path}`, import.meta.url))
const { version } = JSON.parse(readFileSync(lib('package.json'), 'utf8')) as { version: string }

// The dev server reads the library's source so edits hot-reload across packages.
// Builds resolve `vue-cmdk-palette` through node_modules, i.e. the library's real dist output.
export default defineConfig(({ command }) => ({
  plugins: [vue()],
  define: {
    __VUE_CMDK_VERSION__: JSON.stringify(version),
  },
  resolve: {
    alias:
      command === 'serve'
        ? [
            { find: /^vue-cmdk-palette\/style\.css$/, replacement: lib('src/styles/theme.css') },
            { find: /^vue-cmdk-palette$/, replacement: lib('src/index.ts') },
          ]
        : [],
  },
}))
