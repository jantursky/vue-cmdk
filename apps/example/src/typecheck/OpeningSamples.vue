<script setup lang="ts">
/*
  The code samples from the docs' "Opening the palette" guide, assembled so
  `bun run typecheck` catches it when the API drifts away from them.
*/
import { ref, useTemplateRef } from 'vue'
import { CommandPaletteDialog, matchesChord, parseChord, useHotkey, type Command } from '@jantursky/vue-cmdk'

const commands: Command[] = []
const open = ref(false)

const chords = ['mod+k', 'mod+shift+p', 'f1'].map((chord) => parseChord(chord))

useHotkey((event) => {
  if (chords.some((chord) => matchesChord(chord, event))) {
    event.preventDefault()
    open.value = !open.value
  }
})

const palette = useTemplateRef<InstanceType<typeof CommandPaletteDialog>>('palette')
</script>

<template>
  <CommandPaletteDialog v-model:open="open" :commands="commands" :hotkey="false" chord="mod+k" />
  <CommandPaletteDialog v-model:open="open" :commands="commands" hotkey="mod+shift+p" />
  <CommandPaletteDialog v-model:open="open" :commands="commands" open-on-slash />
  <button type="button" @click="palette?.show()">Search…</button>
  <CommandPaletteDialog ref="palette" :commands="commands" />
</template>
