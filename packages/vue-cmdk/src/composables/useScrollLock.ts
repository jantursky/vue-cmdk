import { onBeforeUnmount, watch } from 'vue'

/**
 * Stops the page behind a modal from scrolling, restoring the original inline
 * `overflow` exactly, including when the component unmounts while locked.
 *
 * `overflow: hidden` on the body does not stop touch scrolling on iOS Safari, so
 * while locked a touch drag is cancelled unless it moves the palette's list
 * (`[data-cmdk-list]`) that can still scroll in that direction.
 */
export const useScrollLock = (locked: () => boolean): void => {
  let saved: string | null = null
  let list: Element | null = null
  let lastY = 0

  const onTouchStart = (event: TouchEvent): void => {
    list = (event.target as Element).closest('[data-cmdk-list]')
    lastY = event.touches[0]?.clientY ?? 0
  }

  // A finger moving down (dy > 0) scrolls the content up, which needs room above it.
  const onTouchMove = (event: TouchEvent): void => {
    const y = event.touches[0]?.clientY ?? lastY
    const dy = y - lastY
    lastY = y
    const room = dy > 0 ? list?.scrollTop : list && list.scrollHeight - list.clientHeight - list.scrollTop
    if (!room) event.preventDefault()
  }

  const lock = (): void => {
    if (saved !== null || typeof document === 'undefined') return
    saved = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
  }

  const unlock = (): void => {
    if (saved === null || typeof document === 'undefined') return
    document.body.style.overflow = saved
    saved = null
    document.removeEventListener('touchstart', onTouchStart)
    document.removeEventListener('touchmove', onTouchMove)
  }

  watch(locked, (value) => (value ? lock() : unlock()), { immediate: true })
  onBeforeUnmount(unlock)
}
