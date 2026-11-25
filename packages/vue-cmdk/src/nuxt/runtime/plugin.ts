import { defineNuxtPlugin } from 'nuxt/app'
import { createCommandRegistry } from 'vue-cmdk-palette'

// Runs once per app instance, so each server request gets its own registry.
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(createCommandRegistry())
})
