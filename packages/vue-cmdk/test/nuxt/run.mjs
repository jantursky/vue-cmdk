// Builds the Nuxt fixture with the built `vue-cmdk-palette/nuxt` module, serves it and checks the
// server-rendered pages. Run through `bun run test:nuxt` after `bun run build`.
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, symlinkSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(here, '../..')
const nuxi = join(packageRoot, 'node_modules/.bin/nuxi')
const port = 3123
const base = `http://127.0.0.1:${port}`
const failures = []

// An app installs the package from npm; here the built package is linked in as the same name,
// so the module, its auto-imports and the runtime plugin resolve exactly as they would for a user.
const modules = join(here, 'node_modules')
if (!existsSync(join(modules, 'vue-cmdk-palette'))) {
  mkdirSync(modules, { recursive: true })
  symlinkSync(packageRoot, join(modules, 'vue-cmdk-palette'), 'dir')
}

const check = (condition, message) => {
  console.log(`${condition ? 'ok  ' : 'FAIL'} ${message}`)
  if (!condition) failures.push(message)
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const build = (env) => {
  const result = spawnSync(nuxi, ['build'], {
    cwd: here,
    env: { ...process.env, ...env },
    stdio: 'inherit',
  })
  if (result.status !== 0) throw new Error(`nuxi build failed with ${JSON.stringify(env)}`)
}

const serve = async () => {
  const child = spawn(process.execPath, [join(here, '.output/server/index.mjs')], {
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' },
    stdio: 'ignore',
  })
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      await fetch(base)
      return child
    } catch {
      await sleep(200)
    }
  }
  child.kill()
  throw new Error('the Nuxt server did not start')
}

const get = async (path) => {
  const response = await fetch(`${base}${path}`)
  return { status: response.status, html: await response.text() }
}

/** All CSS the build wrote for the client, as one string. */
const builtCss = () => {
  const dir = join(here, '.output/public/_nuxt')
  return readdirSync(dir)
    .filter((file) => file.endsWith('.css'))
    .map((file) => readFileSync(join(dir, file), 'utf8'))
    .join('\n')
}

const withServer = async (run) => {
  const child = await serve()
  try {
    await run()
  } finally {
    child.kill()
  }
}

// 1. Default options: the stylesheet is added, and each page registers its own commands.
build({})
await withServer(async () => {
  const [exported, imported] = await Promise.all([get('/export'), get('/import')])
  check(exported.status === 200 && imported.status === 200, 'both pages render with status 200')
  check(exported.html.includes('Export table'), 'the export page lists its registered command')
  check(imported.html.includes('Import data'), 'the import page lists its registered command')
  check(!exported.html.includes('Import data'), 'concurrent requests: export response has no import command')
  check(!imported.html.includes('Export table'), 'concurrent requests: import response has no export command')
  check(!exported.html.includes('data-cmdk-overlay'), 'the closed dialog renders no overlay on the server')
  check(builtCss().includes('data-cmdk-overlay'), 'the theme stylesheet is in the build (css option on)')
})

// 2. Prefix `Cmdk` and `css: false`: prefixed components resolve, and the theme is left out.
build({ CMDK_PREFIX: 'Cmdk', CMDK_CSS: 'false' })
await withServer(async () => {
  const exported = await get('/export')
  check(exported.status === 200, 'prefixed build renders /export with status 200')
  check(exported.html.includes('data-cmdk-root'), 'the prefixed component <CmdkCommandPalette> renders')
  check(exported.html.includes('Export table'), 'the prefixed palette lists the registered command')
  check(!builtCss().includes('data-cmdk-overlay'), 'css: false leaves the theme stylesheet out of the build')
})

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed`)
  process.exit(1)
}
console.log('\nNuxt fixture checks pass')
