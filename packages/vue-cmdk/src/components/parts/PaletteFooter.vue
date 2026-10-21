<script setup lang="ts">
import { computed } from 'vue'

import { useCommandPaletteContext } from '../../context'
import { chordCaps as capsOf, modCap, parseChord } from '../../core/keys'
import { fillLabel, resultsLabel } from '../../core/labels'
import Kbd from './Kbd.vue'

const props = defineProps<{ chord?: string | false; verb: string }>()

const palette = useCommandPaletteContext()
const { list, labels, selected, currentPage } = palette

const count = computed(() => {
  const shown = list.value.rows.length
  return list.value.matched > shown && list.value.needle !== ''
    ? fillLabel(labels.value.capped, { shown, matched: list.value.matched })
    : resultsLabel(labels.value, shown)
})

const chordCaps = computed(() =>
  props.chord === undefined || props.chord === false ? null : capsOf(parseChord(props.chord)),
)
</script>

<template>
  <div data-cmdk-footer>
    <span data-cmdk-hint><Kbd :caps="['↑', '↓']" />{{ labels.move }}</span>
    <span data-cmdk-hint><Kbd :caps="['↵']" />{{ verb }}</span>
    <span v-if="selected?.command.alternateLabel" data-cmdk-hint>
      <Kbd :caps="[modCap(), '↵']" />{{ selected.command.alternateLabel }}
    </span>
    <span v-if="currentPage" data-cmdk-hint><Kbd :caps="['⌫']" />{{ labels.back }}</span>
    <span v-if="chordCaps" data-cmdk-hint><Kbd :caps="chordCaps" />{{ labels.toggle }}</span>
    <span data-cmdk-count>{{ count }}</span>
  </div>
</template>
