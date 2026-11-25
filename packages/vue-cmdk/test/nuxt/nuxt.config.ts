import { defineNuxtConfig } from 'nuxt/config'

// `run.mjs` builds this fixture twice, through these variables, to check the options.
export default defineNuxtConfig({
  modules: ['vue-cmdk-palette/nuxt'],
  cmdk: {
    css: process.env.CMDK_CSS !== 'false',
    prefix: process.env.CMDK_PREFIX ?? '',
  },
  runtimeConfig: {
    public: { cmdkPrefix: process.env.CMDK_PREFIX ?? '' },
  },
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },
  telemetry: false,
})
