import { nextTick, watch, type Ref } from 'vue'

const TABBABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(',')

const tabbables = (root: HTMLElement): HTMLElement[] =>
  [...root.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    (element) => element.tabIndex >= 0 && element.closest('[inert]') === null,
  )

export interface UseFocusTrapReturn {
  /** Bind to the container's keydown. Ignores events already handled. */
  readonly onKeydown: (event: KeyboardEvent) => void
}

/**
 * Keeps Tab inside `container` while `active`, and returns focus on deactivation
 * to whatever had it before, if that element is still in the document.
 *
 * Not a general-purpose trap: content inside iframes or shadow roots is not
 * walked. The palette contains neither.
 */
export const useFocusTrap = (
  container: Readonly<Ref<HTMLElement | null>>,
  active: () => boolean,
  enabled: () => boolean = () => true,
): UseFocusTrapReturn => {
  let previous: HTMLElement | null = null

  watch(
    active,
    (isActive, wasActive) => {
      if (typeof document === 'undefined') return
      if (isActive && !wasActive) {
        previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
        return
      }
      if (!isActive && wasActive) {
        const target = previous
        previous = null
        // After the DOM update, so the closing dialog no longer holds focus.
        void nextTick(() => {
          if (target?.isConnected) target.focus()
        })
      }
    },
    { immediate: true, flush: 'sync' },
  )

  const onKeydown = (event: KeyboardEvent): void => {
    // The field consumes Tab for scope cycling and prevents it; leave that alone.
    if (event.key !== 'Tab' || event.defaultPrevented || !enabled()) return
    const root = container.value
    if (root === null) return
    const items = tabbables(root)
    const first = items[0]
    const last = items.at(-1)
    if (first === undefined || last === undefined) {
      event.preventDefault()
      return
    }
    const current = document.activeElement
    if (event.shiftKey && (current === first || !root.contains(current))) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && (current === last || !root.contains(current))) {
      event.preventDefault()
      first.focus()
    }
  }

  return { onKeydown }
}
