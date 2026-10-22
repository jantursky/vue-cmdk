<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { CommandPaletteDialog, formatChord, type Command } from 'vue-cmdk-palette'

import { commands, groupOrder, scopes } from './commands'
import CustomItemDemo from './demos/CustomItemDemo.vue'
import HeadlessDemo from './demos/HeadlessDemo.vue'
import InlineDemo from './demos/InlineDemo.vue'
import ExamplesSection from './examples/ExamplesSection.vue'
import { app, logAction, type ThemeChoice } from './state'

const version = __VUE_CMDK_VERSION__
const open = ref(false)
const chord = formatChord('mod+k')

// Hash routes, so link commands visibly "navigate" without a router dependency.
const syncRoute = (): void => {
  app.route = window.location.hash.replace(/^#/, '') || '/'
}
onMounted(() => {
  syncRoute()
  window.addEventListener('hashchange', syncRoute)
})
onBeforeUnmount(() => window.removeEventListener('hashchange', syncRoute))

const navigate = (href: string): void => {
  window.location.hash = href.replace(/^#/, '')
  logAction(`Navigated to ${href}`)
}

const onError = (error: unknown, command: Command): void => {
  logAction(`${command.label} failed: ${error instanceof Error ? error.message : String(error)}`)
}

const INSTALL = 'bun add vue-cmdk-palette'
const copied = ref(false)
const copyInstall = async (): Promise<void> => {
  await navigator.clipboard.writeText(INSTALL)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

const FACTS: [string, string][] = [
  ['~10 kB', 'minified and gzipped'],
  ['0', 'runtime dependencies'],
  ['WAI-ARIA', 'combobox and listbox'],
  ['Vue ^3.5', 'peer dependency'],
]

const themes: { value: ThemeChoice; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const KEYS: [string, string][] = [
  [chord, 'open or close the palette'],
  ['/', 'open it from anywhere outside a field'],
  ['↑ ↓', 'move, wrapping at both ends'],
  ['↵', 'run or open the selected command'],
  [formatChord('mod+enter'), 'open a page in a new tab'],
  [`${formatChord('mod+1')}…9`, 'pick one of the first nine rows'],
  ['⇥  ⇧⇥', 'switch scope chips'],
  ['>', 'type first to list only Run commands'],
  ['⌫', 'go back from a nested list'],
  ['Esc', 'clear, then go back, then close'],
]
</script>

<template>
  <div class="page" :class="{ wireframe: app.wireframe }">
    <div v-if="app.rulers" class="ruler" aria-hidden="true" />

    <nav class="topbar" aria-label="Site">
      <a class="brand" href="#">
        <img class="mark" src="/favicon.svg" alt="" width="20" height="20" />
        vue-cmdk
        <span class="version">v{{ version }}</span>
      </a>
      <div class="topbar-links">
        <a href="#examples-title">Examples</a>
        <a href="https://vue-cmdk-docs.vercel.app">Docs</a>
        <a href="https://github.com/jantursky/vue-cmdk">GitHub</a>
        <a href="https://www.npmjs.com/package/vue-cmdk-palette">npm</a>
      </div>
      <div class="segmented" role="radiogroup" aria-label="Theme">
        <button
          v-for="theme in themes"
          :key="theme.value"
          type="button"
          role="radio"
          :aria-checked="app.theme === theme.value"
          @click="app.theme = theme.value"
        >
          {{ theme.label }}
        </button>
      </div>
    </nav>

    <header class="hero">
      <p class="eyebrow">A command palette for Vue 3</p>
      <h1>Every action, one <span class="accent">keystroke</span> away.</h1>
      <p class="lead">
        Accessible, keyboard-first and about 10 kB. A headless composable, a ready-made dialog, and an optional theme.
      </p>
      <div class="hero-actions">
        <button type="button" class="button button-solid" @click="open = true">
          Search commands
          <kbd>{{ chord }}</kbd>
        </button>
        <a class="button" href="https://vue-cmdk-docs.vercel.app">Read the docs</a>
      </div>
      <div class="install">
        <code><span aria-hidden="true">$ </span>{{ INSTALL }}</code>
        <button type="button" @click="copyInstall">{{ copied ? 'Copied' : 'Copy' }}</button>
      </div>
    </header>

    <InlineDemo />

    <ul class="facts" aria-label="At a glance">
      <li v-for="[value, what] in FACTS" :key="value">
        <strong>{{ value }}</strong>
        <span>{{ what }}</span>
      </li>
    </ul>

    <main class="bento">
      <section class="card card-dark">
        <h2>Try it</h2>
        <dl class="keys">
          <template v-for="[keys, what] in KEYS" :key="keys">
            <dt>
              <kbd>{{ keys }}</kbd>
            </dt>
            <dd>{{ what }}</dd>
          </template>
        </dl>
        <p class="note">
          Try typing <code>clip</code>, <code>changelog</code>, <code>>wire</code> or <code>debug</code>.
        </p>
      </section>

      <section class="card">
        <h2>App state</h2>
        <dl class="state">
          <dt>Route</dt>
          <dd>{{ app.route }}</dd>
          <dt>Language</dt>
          <dd>{{ app.language }}</dd>
          <dt>Theme</dt>
          <dd>{{ app.theme }}</dd>
          <dt>Wireframe</dt>
          <dd>{{ app.wireframe ? 'on' : 'off' }}</dd>
          <dt>Rulers</dt>
          <dd>{{ app.rulers ? 'on' : 'off' }}</dd>
        </dl>
        <h3>Activity</h3>
        <ol v-if="app.log.length" class="log">
          <li v-for="entry in app.log" :key="entry">{{ entry }}</li>
        </ol>
        <p v-else class="note">Nothing yet. Open the palette and pick something.</p>
      </section>

      <CustomItemDemo />
      <HeadlessDemo />
    </main>

    <ExamplesSection />

    <footer class="footer">
      <span>vue-cmdk · MIT licensed</span>
      <nav aria-label="Footer">
        <a href="https://vue-cmdk-docs.vercel.app">Docs</a>
        <a href="https://github.com/jantursky/vue-cmdk">GitHub</a>
        <a href="https://www.npmjs.com/package/vue-cmdk-palette">npm</a>
      </nav>
    </footer>

    <CommandPaletteDialog
      v-model:open="open"
      :commands="commands"
      :scopes="scopes"
      :group-order="groupOrder"
      :navigate="navigate"
      :recents="{ key: 'vue-cmdk-demo:recents' }"
      show-detail
      open-on-slash
      @select="(command, mode) => logAction(`${mode === 'alternate' ? 'Alt-' : ''}picked ${command.label}`)"
      @error="onError"
    />
  </div>
</template>
