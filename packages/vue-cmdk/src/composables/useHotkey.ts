import { onBeforeUnmount, onMounted } from 'vue'

export interface UseHotkeyOptions {
  /** Listen in the capture phase, ahead of handlers inside the page. Default true. */
  readonly capture?: boolean
  readonly target?: () => EventTarget | null | undefined
}

/**
 * A document-level keydown listener tied to the component's lifetime. The
 * handler is read on every event, so the listener is never re-bound.
 */
export const useHotkey = (handler: (event: KeyboardEvent) => void, options: UseHotkeyOptions = {}): void => {
  const capture = options.capture ?? true
  const listener = (event: Event): void => handler(event as KeyboardEvent)
  let bound: EventTarget | null = null

  onMounted(() => {
    bound = options.target?.() ?? (typeof document === 'undefined' ? null : document)
    bound?.addEventListener('keydown', listener, { capture })
  })

  onBeforeUnmount(() => {
    bound?.removeEventListener('keydown', listener, { capture })
    bound = null
  })
}
