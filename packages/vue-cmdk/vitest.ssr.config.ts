import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

// Server rendering, with no DOM. Kept out of the coverage run: the SSR build of each
// component adds render functions whose event handlers never run on a server.
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'node',
    include: ['test/ssr.test.ts'],
  },
})
