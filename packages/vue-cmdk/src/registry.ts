import {
  computed,
  inject,
  onScopeDispose,
  provide,
  shallowRef,
  toValue,
  type App,
  type ComputedRef,
  type InjectionKey,
  type MaybeRefOrGetter,
} from 'vue'

import { isDev } from './core/dev'
import type { Command } from './core/types'

export interface CommandRegistry {
  /** Every registered command, in registration order. */
  readonly commands: ComputedRef<readonly Command[]>
  /** Adds a source of commands and returns the function that removes it again. */
  readonly register: (source: MaybeRefOrGetter<readonly Command[]>) => () => void
  /** Makes the registry reachable from every component of the app. */
  readonly install: (app: App) => void
}

export const COMMAND_REGISTRY_KEY: InjectionKey<CommandRegistry> = Symbol('vue-cmdk-registry')

/**
 * A list of commands contributed by mounted components. One registry per app or
 * subtree, never a module singleton, so server requests and apps on one page stay apart.
 */
export const createCommandRegistry = (): CommandRegistry => {
  const sources = shallowRef<readonly MaybeRefOrGetter<readonly Command[]>[]>([])
  const commands = computed(() => sources.value.flatMap((source) => toValue(source)))

  const register = (source: MaybeRefOrGetter<readonly Command[]>): (() => void) => {
    sources.value = [...sources.value, source]
    return () => {
      sources.value = sources.value.filter((entry) => entry !== source)
    }
  }

  const registry: CommandRegistry = {
    commands,
    register,
    install: (app) => app.provide(COMMAND_REGISTRY_KEY, registry),
  }
  return registry
}

/** Provides a registry to the calling component's subtree. Creates one when none is given. */
export const provideCommandRegistry = (registry: CommandRegistry = createCommandRegistry()): CommandRegistry => {
  provide(COMMAND_REGISTRY_KEY, registry)
  return registry
}

/**
 * Lists commands in the palette until the calling component (or effect scope) is
 * disposed. Without a registry in reach it does nothing.
 */
export const useRegisterCommands = (commands: MaybeRefOrGetter<readonly Command[]>): void => {
  const registry = inject(COMMAND_REGISTRY_KEY, null)
  if (registry === null) {
    if (isDev())
      console.warn(
        '[vue-cmdk] useRegisterCommands() found no command registry. Install one with app.use(createCommandRegistry()) or provideCommandRegistry().',
      )
    return
  }
  onScopeDispose(registry.register(commands))
}
