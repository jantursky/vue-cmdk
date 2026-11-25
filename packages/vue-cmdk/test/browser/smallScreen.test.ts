import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { nextTick, ref } from 'vue'

import '../../src/styles/theme.css'
import CommandPaletteDialog from '../../src/components/CommandPaletteDialog.vue'
import { action } from '../fixtures'

const wrappers: VueWrapper[] = []
const waitFor = (check: () => boolean) => vi.waitFor(() => expect(check()).toBe(true))

const overlay = () => document.querySelector<HTMLElement>('[data-cmdk-overlay]')!
const root = () => document.querySelector<HTMLElement>('[data-cmdk-dialog] [data-cmdk-root]')!

const size = { width: window.innerWidth, height: window.innerHeight }

afterEach(async () => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  document.body.innerHTML = ''
  await page.viewport(size.width, size.height)
})

const openDialog = async () => {
  const open = ref(true)
  const wrapper = mount(CommandPaletteDialog, {
    props: {
      commands: [action('a', 'Alpha')],
      recents: false,
      open: open.value,
      'onUpdate:open': (value: boolean) => (open.value = value),
    },
    attachTo: document.body,
  })
  wrappers.push(wrapper)
  await waitFor(() => document.querySelector('[data-cmdk-overlay]') !== null)
  return wrapper
}

describe('small screens', () => {
  it('spans the phone width with a gutter at 390 by 844', async () => {
    await page.viewport(390, 844)
    await openDialog()
    await nextTick()

    const style = getComputedStyle(overlay())
    expect(style.paddingLeft).toBe('8px')
    expect(style.paddingRight).toBe('8px')
    // offsetWidth ignores the scale of the entrance animation, which getBoundingClientRect does not.
    expect(root().offsetWidth).toBe(390 - 16)
  })

  it('shrinks the list to the visual viewport height while open', async () => {
    await page.viewport(390, 844)
    await openDialog()
    await waitFor(() => overlay().style.getPropertyValue('--cmdk-viewport-height') !== '')

    const height = window.visualViewport!.height
    expect(overlay().style.getPropertyValue('--cmdk-viewport-height')).toBe(`${height}px`)
    // The cap is the viewport minus the 520 px offset of 120 px, and never above 560 px.
    expect(root().offsetHeight).toBeLessThanOrEqual(Math.min(560, height - 120))
  })

  it('cancels a touch drag on the backdrop while open, in every engine', async () => {
    await page.viewport(390, 844)
    await openDialog()
    const drag = (target: Element, from: number, to: number) => {
      const start = new Event('touchstart', { bubbles: true, cancelable: true })
      Object.defineProperty(start, 'touches', { value: [{ clientY: from }] })
      target.dispatchEvent(start)
      const move = new Event('touchmove', { bubbles: true, cancelable: true })
      Object.defineProperty(move, 'touches', { value: [{ clientY: to }] })
      target.dispatchEvent(move)
      return move.defaultPrevented
    }
    expect(drag(overlay(), 400, 380)).toBe(true)
  })

  it('caps the list above a keyboard-sized viewport', async () => {
    await page.viewport(390, 844)
    await openDialog()
    overlay().style.setProperty('--cmdk-viewport-height', '500px')
    await nextTick()
    expect(getComputedStyle(root()).maxHeight).toBe('380px')
  })
})
