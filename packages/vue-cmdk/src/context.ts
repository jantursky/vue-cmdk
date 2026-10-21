import { inject, type InjectionKey } from 'vue'

import type { UseCommandPaletteReturn } from './composables/useCommandPalette'

/** Lets custom parts rendered in slots reach the palette's state and actions. */
export const COMMAND_PALETTE_KEY: InjectionKey<UseCommandPaletteReturn> = Symbol('vue-cmdk')

export const useCommandPaletteContext = (): UseCommandPaletteReturn => {
  const palette = inject(COMMAND_PALETTE_KEY, null)
  if (palette === null) throw new Error('useCommandPaletteContext() must be used inside <CommandPalette>.')
  return palette
}
