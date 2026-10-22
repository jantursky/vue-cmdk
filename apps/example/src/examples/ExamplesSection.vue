<script setup lang="ts">
import CompactExample from './CompactExample.vue'
import compactSource from './CompactExample.vue?raw'
import ExampleCard from './ExampleCard.vue'
import FullExample from './FullExample.vue'
import fullSource from './FullExample.vue?raw'
import MinimalExample from './MinimalExample.vue'
import minimalSource from './MinimalExample.vue?raw'
import TerminalExample from './TerminalExample.vue'
import terminalSource from './TerminalExample.vue?raw'
import ThemedExample from './ThemedExample.vue'
import themedSource from './ThemedExample.vue?raw'

const setup = `import { createApp } from 'vue'
// Optional: the default theme. Leave it out and nothing is styled.
import 'vue-cmdk-palette/style.css'

import App from './App.vue'

createApp(App).mount('#app')`
</script>

<template>
  <section class="examples" aria-labelledby="examples-title">
    <header class="examples-head">
      <p class="eyebrow">Examples</p>
      <h2 id="examples-title" class="section-title">Five palettes, <span class="accent">one</span> library.</h2>
      <p>
        Each example is one self-contained component. Open <em>View source</em> to read the exact file that runs on this
        page.
      </p>
      <nav class="examples-nav" aria-label="Examples">
        <a href="#example-minimal">Minimal</a>
        <a href="#example-compact">Compact</a>
        <a href="#example-full">Full</a>
        <a href="#example-theme">Theme variables</a>
        <a href="#example-terminal">Custom CSS</a>
      </nav>
    </header>

    <div class="examples-grid">
      <ExampleCard
        id="example-minimal"
        title="Minimal"
        :files="[
          { name: 'MinimalExample.vue', code: minimalSource },
          { name: 'main.ts', code: setup },
        ]"
      >
        <template #description>
          <p>Three commands and the ready-made dialog with its defaults. This is all a palette needs.</p>
        </template>
        <MinimalExample />
      </ExampleCard>

      <ExampleCard id="example-compact" title="Compact" :files="[{ name: 'CompactExample.vue', code: compactSource }]">
        <template #description>
          <p>A dense inline palette for a toolbar or sidebar: tighter rows, no footer, no quick-select digits.</p>
        </template>
        <CompactExample />
      </ExampleCard>

      <ExampleCard id="example-full" title="Full" :files="[{ name: 'FullExample.vue', code: fullSource }]">
        <template #description>
          <p>
            Scopes with <code>&gt;</code> and <code>@</code> prefixes, an async nested page, links, disabled and hidden
            rows, shortcuts, badges, the detail panel, recents, and the <code>select</code> and
            <code>error</code> events.
          </p>
        </template>
        <FullExample />
      </ExampleCard>

      <ExampleCard
        id="example-theme"
        title="Theme variables"
        :files="[{ name: 'ThemedExample.vue', code: themedSource }]"
      >
        <template #description>
          <p>
            Restyled with <code>--cmdk-*</code> variables only. Set them on <code>:root</code> for the whole app, or on
            a wrapper as here.
          </p>
        </template>
        <ThemedExample />
      </ExampleCard>

      <ExampleCard
        id="example-terminal"
        title="Custom CSS"
        :files="[{ name: 'TerminalExample.vue', code: terminalSource }]"
      >
        <template #description>
          <p>
            Variables plus a few rules aimed at the <code>data-cmdk-*</code> hooks and the
            <code>data-selected</code> and <code>data-disabled</code> states.
          </p>
        </template>
        <TerminalExample />
      </ExampleCard>
    </div>
  </section>
</template>
