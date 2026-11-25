<script setup lang="ts">
import { resolveComponent } from 'vue'

// Closed, so it renders nothing on the server; mounting it proves the module's components resolve.
const dialog = resolveComponent(`${useRuntimeConfig().public.cmdkPrefix}CommandPaletteDialog`)
</script>

<template>
  <div>
    <component :is="dialog" :commands="[]" />
    <NuxtPage />
  </div>
</template>
