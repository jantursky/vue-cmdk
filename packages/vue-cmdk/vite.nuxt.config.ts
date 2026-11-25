import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { defineConfig, minify, type Plugin } from 'vite'
import dts from 'vite-plugin-dts'

/**
 * The Nuxt entry: the module and its runtime plugin, as ES-only files. Built in a
 * second pass after `vite.config.ts`, which empties dist/ first. Both files together
 * (the module and the plugin a Nuxt app loads) must stay under 1 kB, minified and gzipped.
 */
const NUXT_BUDGET = 1024
const NUXT_FILES = ['nuxt/module.js', 'nuxt/runtime/plugin.js'] as const

const root = (path: string): string => resolve(import.meta.dirname, path)

const nuxtBudget = (): Plugin => ({
  name: 'vue-cmdk:nuxt-budget',
  apply: 'build',
  async closeBundle() {
    let total = 0
    for (const file of NUXT_FILES) {
      const code = readFileSync(root(`dist/${file}`), 'utf8')
      const { code: minified } = await minify(file, code, { module: true })
      total += gzipSync(minified).length
    }
    const report = `${(total / 1024).toFixed(2)} kB min+gzip (budget ${(NUXT_BUDGET / 1024).toFixed(2)} kB)`
    if (total > NUXT_BUDGET) throw new Error(`dist/nuxt is ${report}`)
    console.log(`\nvue-cmdk: dist/nuxt (module + runtime plugin) ${report}`)
  },
})

export default defineConfig({
  plugins: [
    // dist/nuxt/module.d.ts and dist/nuxt/runtime/plugin.d.ts, one file per source file: the main pass rolls up only the main entry.
    dts({ tsconfigPath: './tsconfig.build.json', include: ['src/nuxt'], entryRoot: 'src', bundleTypes: false }),
    nuxtBudget(),
  ],
  build: {
    lib: {
      entry: { 'nuxt/module': root('src/nuxt/module.ts'), 'nuxt/runtime/plugin': root('src/nuxt/runtime/plugin.ts') },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: {
      // Nuxt installs the module and transpiles the plugin from its path, and the plugin
      // imports the main entry at runtime instead of bundling a copy of it.
      external: ['vue', 'vue-cmdk-palette', 'nuxt/app', '@nuxt/kit', '#app', /^node:/],
      output: { exports: 'named' },
    },
    sourcemap: true,
    minify: true,
    target: 'es2020',
    emptyOutDir: false,
  },
})
