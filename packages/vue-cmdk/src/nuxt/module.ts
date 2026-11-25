import { addComponent, addImports, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'

export interface ModuleOptions {
  /** Add `vue-cmdk-palette/style.css` to the app's CSS. Default `true`. */
  css: boolean
  /** Install one command registry per app instance, so `useRegisterCommands` works everywhere. Default `true`. */
  registry: boolean
  /** Prefix for the component names, such as `Cmdk` for `<CmdkCommandPaletteDialog>`. Default none. */
  prefix: string
}

const COMPONENTS = ['CommandPalette', 'CommandPaletteDialog', 'CommandHighlight'] as const

const COMPOSABLES = [
  'useCommandPalette',
  'useCommandPaletteContext',
  'useCommandShortcuts',
  'useFocusTrap',
  'useHotkey',
  'usePins',
  'useRecents',
  'useRegisterCommands',
  'useScrollLock',
] as const

const SOURCES_COMPOSABLES = ['useCommandSources'] as const

/**
 * Nuxt module for `vue-cmdk-palette`: components, composables, styles and the command
 * registry, set up from `nuxt.config`. Only public exports are referenced, so the module
 * stays a thin layer over the package.
 */
export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'vue-cmdk-palette',
    configKey: 'cmdk',
    compatibility: { nuxt: '>=3.13.0' },
  },
  defaults: {
    css: true,
    registry: true,
    prefix: '',
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    for (const name of COMPONENTS) {
      addComponent({ name: `${options.prefix}${name}`, export: name, filePath: 'vue-cmdk-palette', global: true })
    }

    addImports([
      ...COMPOSABLES.map((name) => ({ name, from: 'vue-cmdk-palette' })),
      ...SOURCES_COMPOSABLES.map((name) => ({ name, from: 'vue-cmdk-palette/sources' })),
    ])

    if (options.css) nuxt.options.css.push('vue-cmdk-palette/style.css')

    if (options.registry) addPlugin(resolver.resolve('./runtime/plugin'))
  },
})
