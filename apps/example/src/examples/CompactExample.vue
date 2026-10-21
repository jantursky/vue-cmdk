<script setup lang="ts">
import { ref } from 'vue'
import { CommandPalette, type Command } from 'vue-cmdk-palette'

const last = ref('nothing yet')

const run = (label: string) => () => {
  last.value = label
}

const commands: Command[] = [
  { kind: 'action', id: 'bold', label: 'Bold', group: 'Format', shortcut: 'mod+b', perform: run('Bold') },
  { kind: 'action', id: 'italic', label: 'Italic', group: 'Format', shortcut: 'mod+i', perform: run('Italic') },
  { kind: 'action', id: 'code', label: 'Inline code', group: 'Format', shortcut: 'mod+e', perform: run('Inline code') },
  { kind: 'action', id: 'h1', label: 'Heading 1', group: 'Blocks', keywords: ['title'], perform: run('Heading 1') },
  { kind: 'action', id: 'h2', label: 'Heading 2', group: 'Blocks', perform: run('Heading 2') },
  { kind: 'action', id: 'quote', label: 'Quote', group: 'Blocks', perform: run('Quote') },
  { kind: 'action', id: 'list', label: 'Bulleted list', group: 'Blocks', perform: run('Bulleted list') },
]
</script>

<template>
  <div class="compact">
    <CommandPalette
      :commands="commands"
      :recents="false"
      :quick-select="false"
      :autofocus="false"
      :labels="{ placeholder: 'Insert or format…' }"
    />
  </div>
  <p class="note">Last command: {{ last }}</p>
</template>

<style scoped>
/* Density lives in a few variables plus three rules on the data-cmdk-* hooks. */
.compact {
  --cmdk-radius: 8px;
  --cmdk-row-radius: 5px;
  max-width: 320px;
  height: 260px;
  display: flex;
  flex-direction: column;
}

.compact :deep([data-cmdk-root]) {
  flex: 1;
  min-height: 0;
  font-size: 13px;
}

.compact :deep([data-cmdk-item]) {
  min-height: 28px;
  padding: 3px 8px;
}

.compact :deep([data-cmdk-footer]) {
  display: none;
}
</style>
