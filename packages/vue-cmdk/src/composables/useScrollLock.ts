import { onBeforeUnmount, watch } from 'vue'

/**
 * Stops the page behind a modal from scrolling, restoring the original inline
 * `overflow` exactly, including when the component unmounts while locked.
 */
export const useScrollLock = (locked: () => boolean): void => {
  let saved: string | null = null

  const lock = (): void => {
    if (saved !== null || typeof document === 'undefined') return
    saved = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }

  const unlock = (): void => {
    if (saved === null || typeof document === 'undefined') return
    document.body.style.overflow = saved
    saved = null
  }

  watch(locked, (value) => (value ? lock() : unlock()), { immediate: true })
  onBeforeUnmount(unlock)
}
