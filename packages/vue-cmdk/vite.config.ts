import { copyFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import vue from '@vitejs/plugin-vue'
import { defineConfig, minify, type Plugin } from 'vite'
import dts from 'vite-plugin-dts'

/** Budget for dist/index.js minified and gzipped, excluding the stylesheet. */
const SIZE_BUDGET = 12 * 1024

const root = (path: string): string => resolve(import.meta.dirname, path)

/**
 * The components ship no CSS, so the opt-in theme is copied as-is to
 * dist/style.css. Then the ES build is minified and gzipped the way a consumer's
 * bundler would ship it, and the build fails over budget. Library-mode ES output
 * itself stays readable so consumers keep tree-shaking annotations.
 */
const themeAndBudget = (): Plugin => ({
  name: 'vue-cmdk:theme-and-budget',
  apply: 'build',
  async closeBundle() {
    copyFileSync(root('src/styles/theme.css'), root('dist/style.css'))
    // The same declarations, under the extension TypeScript reads as CommonJS for `require`.
    copyFileSync(root('dist/index.d.ts'), root('dist/index.d.cts'))
    const { code } = await minify('index.js', readFileSync(root('dist/index.js'), 'utf8'), { module: true })
    const size = gzipSync(code).length
    const report = `${(size / 1024).toFixed(2)} kB min+gzip (budget ${SIZE_BUDGET / 1024} kB)`
    if (size > SIZE_BUDGET) throw new Error(`dist/index.js is ${report}`)
    console.log(`\nvue-cmdk: dist/index.js ${report}`)
  },
})

export default defineConfig({
  plugins: [
    vue(),
    dts({
      tsconfigPath: './tsconfig.build.json',
      include: ['src'],
      bundleTypes: true,
    }),
    themeAndBudget(),
  ],
  build: {
    lib: {
      entry: root('src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: ['vue'],
      output: { exports: 'named' },
    },
    sourcemap: true,
    minify: true,
    target: 'es2020',
    emptyOutDir: true,
  },
})
