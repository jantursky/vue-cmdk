import { computed, toValue, watch, type MaybeRefOrGetter } from 'vue'

import { isDev } from '../core/dev'
import { chordId, isBindableKey, isEditableTarget, matchesChord, parseChord, type Chord } from '../core/keys'
import type { Command } from '../core/types'
import { useHotkey } from './useHotkey'

export interface UseCommandShortcutsOptions {
  /** Called with the command whose chord was pressed. */
  readonly run: (command: Command) => void
  /** Bind only while true. Default true. */
  readonly enabled?: MaybeRefOrGetter<boolean | undefined>
}

interface Binding {
  readonly chord: Chord
  readonly command: Command
}

const warnDuplicateChords = (bindings: readonly Binding[]): void => {
  const first = new Map<string, Command>()
  for (const { chord, command } of bindings) {
    const key = chordId(chord)
    const earlier = first.get(key)
    if (earlier === undefined) first.set(key, command)
    else
      console.warn(
        `[vue-cmdk] Commands "${earlier.id}" and "${command.id}" share the shortcut "${String(command.shortcut)}". "${earlier.id}" runs.`,
      )
  }
}

/**
 * Runs a command when its chord-string `shortcut` is pressed anywhere on the page.
 * Array shortcuts are display-only. Disabled commands are skipped, and a chord without
 * Ctrl or Meta is ignored while focus is in an editable field.
 */
export const useCommandShortcuts = (
  commands: MaybeRefOrGetter<readonly Command[]>,
  options: UseCommandShortcutsOptions,
): void => {
  const bindings = computed<readonly Binding[]>(() =>
    toValue(commands).flatMap((command) => {
      if (typeof command.shortcut !== 'string') return []
      if (command.disabled !== undefined && command.disabled !== false) return []
      const chord = parseChord(command.shortcut)
      return isBindableKey(chord) ? [{ chord, command }] : []
    }),
  )

  if (isDev()) watch(bindings, warnDuplicateChords, { immediate: true })

  useHotkey((event) => {
    if (toValue(options.enabled) === false || event.defaultPrevented || event.isComposing) return
    const match = bindings.value.find(({ chord }) => matchesChord(chord, event))
    if (match === undefined) return
    if (!match.chord.ctrl && !match.chord.meta && isEditableTarget(event.target)) return
    event.preventDefault()
    options.run(match.command)
  })
}
