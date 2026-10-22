import { copyFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import vue from '@vitejs/plugin-vue'
import { build, defineConfig, minify, type Plugin, type Rolldown } from 'vite'
import dts from 'vite-plugin-dts'

/** Budget per built entry in dist/, minified and gzipped, excluding the stylesheet. */
const SIZE_BUDGETS: Readonly<Record<string, number>> = {
  'index.js': 14 * 1024,
}

const root = (path: string): string => resolve(import.meta.dirname, path)

const kB = (bytes: number): string => `${(bytes / 1024).toFixed(2)} kB`

const shippedSize = async (name: string, code: string): Promise<number> =>
  gzipSync((await minify(name, code, { module: true })).code).length

const TYPICAL_ENTRY = 'virtual:vue-cmdk-typical-import'

/**
 * What an app that only uses the dialog ships: a bundle of `dist/index.js`
 * through a one-line import, Vue external, so unused exports are shaken out.
 */
const typicalImportSize = async (): Promise<number> => {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    plugins: [
      {
        name: 'vue-cmdk:typical-import',
        resolveId: (id) => (id === TYPICAL_ENTRY ? id : undefined),
        load: (id) =>
          id === TYPICAL_ENTRY
            ? `export { CommandPaletteDialog } from ${JSON.stringify(root('dist/index.js'))}`
            : undefined,
      },
    ],
    build: {
      write: false,
      minify: false,
      rollupOptions: { input: TYPICAL_ENTRY, external: ['vue'], preserveEntrySignatures: 'strict' },
    },
  })
  const outputs = (Array.isArray(result) ? result : [result]) as Rolldown.RolldownOutput[]
  const code = outputs
    .flatMap((output) => output.output)
    .map((chunk) => (chunk.type === 'chunk' ? chunk.code : ''))
    .join('\n')
  return shippedSize('typical.js', code)
}

/**
 * The components ship no CSS, so the opt-in theme is copied as-is to
 * dist/style.css. Then each ES entry is minified and gzipped the way a consumer's
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
    for (const [file, budget] of Object.entries(SIZE_BUDGETS)) {
      const size = await shippedSize(file, readFileSync(root(`dist/${file}`), 'utf8'))
      const report = `${kB(size)} min+gzip (budget ${kB(budget)})`
      if (size > budget) throw new Error(`dist/${file} is ${report}`)
      console.log(`\nvue-cmdk: dist/${file} ${report}`)
    }
    // Reported, never enforced: the number a consumer pays, to watch for drift.
    console.log(`vue-cmdk: CommandPaletteDialog alone ${kB(await typicalImportSize())} min+gzip`)
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
