<script setup lang="ts">
import { resolveComponent } from 'vue'

// Registered per request: the module's registry is per app instance, so this must not leak into /import.
useRegisterCommands([{ id: 'export', kind: 'action', label: 'Export table', perform: () => {} }])

const palette = resolveComponent(`${useRuntimeConfig().public.cmdkPrefix}CommandPalette`)
</script>

<template>
  <component :is="palette" :commands="[]" :recents="false" />
</template>
