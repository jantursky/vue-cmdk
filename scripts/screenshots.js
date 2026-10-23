// Builds the demo, serves the build and saves the README screenshots to .github/assets/.
// Run it with `bun run screenshots` whenever the demo's look changes.

/* global document, window -- used inside callbacks that run in the page */

import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from 'playwright'
import sharp from 'sharp'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = join(root, 'apps/example/dist')
const out = join(root, '.github/assets')

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
}

/** Each view starts from a freshly loaded page in the chosen theme. */
const VIEWS = [
  {
    // The hero and the inline palette, as a visitor first sees the page.
    name: 'overview',
  },
  {
    // The dialog with a query typed, so the matches and the detail panel show.
    name: 'palette',
    prepare: async (page) => {
      await page.getByRole('button', { name: /Search commands/ }).click()
      await page.getByRole('dialog').waitFor()
      await page.keyboard.type('to')
    },
  },
  {
    // The same component restyled with theme variables, just below the sticky top bar.
    name: 'themed',
    prepare: async (page) => {
      await page.locator('#example-theme').evaluate((card) => {
        const bar = document.querySelector('.topbar')?.getBoundingClientRect().height ?? 0
        window.scrollTo(0, card.getBoundingClientRect().top + window.scrollY - bar - 24)
      })
    },
  },
]

const build = () => {
  const result = spawnSync('bun', ['run', 'build'], { cwd: root, stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

// The build is static with a single page, so a tiny file server is enough.
const serve = () =>
  new Promise((resolve) => {
    const server = createServer((request, response) => {
      const path = normalize(decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname))
      let file = join(dist, path)
      if (!file.startsWith(dist) || !statSync(file, { throwIfNoEntry: false })?.isFile()) {
        file = join(dist, 'index.html')
      }
      response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
      response.end(readFileSync(file))
    })
    server.listen(0, '127.0.0.1', () => {
      resolve(server)
    })
  })

const capture = async (browser, url, view, theme) => {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
    colorScheme: theme,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.getByRole('radiogroup', { name: 'Theme' }).getByRole('radio', { name: theme, exact: false }).click()
  await page.evaluate(() => document.fonts.ready)
  await view.prepare?.(page)
  await page.waitForLoadState('networkidle')
  // Let the list re-render and any remaining transition finish.
  await page.waitForTimeout(300)
  const png = await page.screenshot({ animations: 'disabled' })
  await context.close()

  const file = join(out, `${view.name}-${theme}.png`)
  await sharp(png).png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 }).toFile(file)
  console.log(`${file.slice(root.length)}  ${Math.round(statSync(file).size / 1024)} kB`)
}

build()
mkdirSync(out, { recursive: true })
const server = await serve()
const url = `http://127.0.0.1:${server.address().port}/`
const browser = await chromium.launch()
try {
  for (const view of VIEWS) {
    for (const theme of ['light', 'dark']) await capture(browser, url, view, theme)
  }
} finally {
  await browser.close()
  server.close()
}
