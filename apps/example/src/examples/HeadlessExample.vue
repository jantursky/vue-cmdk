<script setup lang="ts">
import { ref } from 'vue'
import { useCommandPalette, type Command } from 'vue-cmdk-palette'

const last = ref('nothing yet')
const run = (label: string) => () => {
  last.value = label
}

const commands: Command[] = [
  { kind: 'action', id: 'new-file', label: 'New file', perform: run('New file') },
  { kind: 'action', id: 'save', label: 'Save', shortcut: 'mod+s', perform: run('Save') },
  { kind: 'action', id: 'close', label: 'Close tab', perform: run('Close tab') },
]

// The composable owns the query, the ranking and the ARIA ids. This markup is yours.
const palette = useCommandPalette({ commands, recents: false })
</script>

<template>
  <div class="headless" @keydown="palette.onContainerKeydown">
    <input
      v-model="palette.query.value"
      class="field"
      placeholder="Type a command"
      v-bind="palette.fieldAttrs.value"
      @keydown="palette.onFieldKeydown"
    />
    <ul class="list" v-bind="palette.listAttrs.value">
      <li
        v-for="row in palette.list.value.rows"
        :key="row.command.id"
        class="row"
        v-bind="palette.rowAttrs(row)"
        @pointermove="palette.hover(row)"
        @click="palette.activate(row)"
      >
        {{ row.command.label }}
      </li>
    </ul>
    <p class="note">Last command: {{ last }}</p>
  </div>
</template>

<style scoped>
.headless {
  display: grid;
  gap: 0.5rem;
  max-width: 24rem;
}

.field {
  padding: 0.5rem 0.75rem;
  font: inherit;
}

.list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.row {
  padding: 0.4rem 0.75rem;
  cursor: pointer;
}

.row[aria-selected='true'] {
  background: color-mix(in srgb, currentColor 12%, transparent);
}
</style>
