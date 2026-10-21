<script setup lang="ts">
import { ref } from 'vue'
import { CommandPaletteDialog, type Command } from '@jantursky/vue-cmdk'

const open = ref(false)
const last = ref('nothing yet')

const run = (label: string) => () => {
  last.value = label
}

const commands: Command[] = [
  { kind: 'action', id: 'new-file', label: 'New file', perform: run('New file') },
  { kind: 'action', id: 'save', label: 'Save', shortcut: 'mod+s', perform: run('Save') },
  { kind: 'action', id: 'close', label: 'Close tab', perform: run('Close tab') },
]
</script>

<template>
  <button type="button" class="button" @click="open = true">Open the minimal palette</button>
  <p class="note">Last command: {{ last }}</p>
  <!-- The page already owns ⌘K, so this one opens from the button only. -->
  <CommandPaletteDialog v-model:open="open" :commands="commands" :hotkey="false" :recents="false" />
</template>
