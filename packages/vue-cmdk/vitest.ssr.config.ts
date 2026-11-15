import { fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

// Server rendering, with no DOM. Kept out of the coverage run: the SSR build of each
// component adds render functions whose event handlers never run on a server.
export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { 'vue-cmdk-palette': fileURLToPath(new URL('./src/index.ts', import.meta.url)) } },
  test: {
    environment: 'node',
    include: ['test/ssr.test.ts'],
  },
})
