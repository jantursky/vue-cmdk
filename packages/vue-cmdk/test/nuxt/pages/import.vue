<script setup lang="ts">
import { resolveComponent } from 'vue'

useRegisterCommands([{ id: 'import', kind: 'action', label: 'Import data', perform: () => {} }])

const palette = resolveComponent(`${useRuntimeConfig().public.cmdkPrefix}CommandPalette`)
</script>

<template>
  <component :is="palette" :commands="[]" :recents="false" />
</template>
