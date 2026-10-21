<script setup lang="ts">
import { useCommandPalette, type Command } from 'vue-cmdk-palette'

import { logAction } from '../state'

const fruits: Command[] = ['Apple', 'Banana', 'Cherry', 'Grape', 'Mango', 'Orange', 'Peach'].map((name) => ({
  kind: 'action',
  id: name.toLowerCase(),
  label: name,
  keepOpen: true,
  perform: () => logAction(`Headless: picked ${name}`),
}))

// No markup comes with the composable. The prop getters carry the ARIA wiring.
const palette = useCommandPalette({ commands: fruits, recents: false, quickSelect: false })
</script>

<template>
  <section class="demo">
    <header>
      <h2>Headless</h2>
      <p><code>useCommandPalette()</code> with your own markup: filtering, keyboard and ARIA, no components.</p>
    </header>
    <div class="headless" @keydown="palette.onContainerKeydown">
      <input
        v-model="palette.query.value"
        v-bind="palette.fieldAttrs.value"
        class="headless-input"
        placeholder="Pick a fruit…"
        @keydown="palette.onFieldKeydown"
      />
      <ul v-bind="palette.listAttrs.value" class="headless-list">
        <li
          v-for="row in palette.list.value.rows"
          :key="row.command.id"
          v-bind="palette.rowAttrs(row)"
          @pointermove="palette.hover(row)"
          @click="palette.activate(row)"
        >
          {{ row.command.label }}
        </li>
      </ul>
    </div>
  </section>
</template>
