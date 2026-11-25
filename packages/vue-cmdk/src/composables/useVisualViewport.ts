import { onBeforeUnmount, watch, type Ref } from 'vue'

/**
 * While `active` is true, writes the visual viewport's height to
 * `--cmdk-viewport-height` on the target, so the palette fits above an on-screen
 * keyboard. Listeners are removed when `active` turns false and on unmount. Without
 * `visualViewport` the variable is never set and the theme falls back to `100dvh`.
 */
export const useVisualViewport = (target: Ref<HTMLElement | null>, active: () => boolean): void => {
  let viewport: VisualViewport | null = null

  const sync = (): void => {
    if (viewport !== null) target.value?.style.setProperty('--cmdk-viewport-height', `${viewport.height}px`)
  }

  const detach = (): void => {
    viewport?.removeEventListener('resize', sync)
    viewport?.removeEventListener('scroll', sync)
    viewport = null
  }

  const attach = (): void => {
    viewport = globalThis.visualViewport ?? null
    if (viewport === null) return
    viewport.addEventListener('resize', sync)
    viewport.addEventListener('scroll', sync)
    sync()
  }

  // The overlay is mounted only while open, so the target exists after the flush.
  watch(active, (value) => (value ? attach() : detach()), { flush: 'post', immediate: true })
  onBeforeUnmount(detach)
}
