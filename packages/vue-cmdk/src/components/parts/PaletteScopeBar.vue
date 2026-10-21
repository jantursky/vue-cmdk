<script setup lang="ts">
import { useCommandPaletteContext } from '../../context'
import Kbd from './Kbd.vue'

const palette = useCommandPaletteContext()
const { list, scopes, labels } = palette
</script>

<template>
  <div data-cmdk-scopes role="toolbar" :aria-label="labels.scope">
    <button v-bind="palette.chipAttrs(null)" tabindex="-1" @mousedown.prevent @click="palette.narrow(null)">
      {{ labels.all }}<span data-cmdk-chip-count>{{ list.total }}</span>
    </button>
    <button
      v-for="scope in scopes"
      :key="scope.id"
      v-bind="palette.chipAttrs(scope.id)"
      tabindex="-1"
      @mousedown.prevent
      @click="palette.narrow(scope.id)"
    >
      {{ scope.label }}<span data-cmdk-chip-count>{{ list.counts[scope.id] ?? 0 }}</span>
    </button>
    <span data-cmdk-scopes-hint aria-hidden="true"><Kbd :caps="['⇥']" />{{ labels.scope }}</span>
  </div>
</template>
