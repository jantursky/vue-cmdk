import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
    // Real-browser and server-rendering tests have their own configs: vitest.browser.config.ts, vitest.ssr.config.ts.
    exclude: ['test/browser/**', 'test/ssr.test.ts'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/index.ts', 'src/core/types.ts', 'src/components/types.ts'],
      reporter: ['text-summary', 'text', 'html', 'lcov'],
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 95 },
    },
  },
})
