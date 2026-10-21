import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
    // Real-browser tests have their own config: vitest.browser.config.ts.
    exclude: ['test/browser/**'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/index.ts', 'src/core/types.ts', 'src/components/types.ts'],
      reporter: ['text-summary', 'text', 'html'],
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 95 },
    },
  },
})
