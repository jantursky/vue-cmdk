import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'

import CommandPalette from '../../src/components/CommandPalette.vue'
import { useScrollLock } from '../../src/composables/useScrollLock'
import { useVisualViewport } from '../../src/composables/useVisualViewport'
import { action } from '../fixtures'

const wrappers: VueWrapper[] = []
const track = <T extends VueWrapper>(wrapper: T): T => {
  wrappers.push(wrapper)
  return wrapper
}

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  document.body.innerHTML = ''
  document.body.style.overflow = ''
  delete (window as { visualViewport?: unknown }).visualViewport
  vi.restoreAllMocks()
})

const COMMANDS = [action('a', 'Alpha', { group: 'Actions' }), action('b', 'Beta', { group: 'Actions' })]

const pointerMove = (target: Element, pointerType: string) => {
  const event = new Event('pointermove', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  target.dispatchEvent(event)
}

describe('hover selection by pointer type', () => {
  it('ignores touch pointer movement and keeps selecting with a mouse', async () => {
    const wrapper = track(
      mount(CommandPalette, { props: { commands: COMMANDS, recents: false }, attachTo: document.body }),
    )
    const rows = wrapper.findAll('[data-cmdk-item]')
    const selectedText = () => wrapper.find('[data-cmdk-item][data-selected="true"]').text()

    expect(selectedText()).toContain('Alpha')

    pointerMove(rows[1]!.element, 'touch')
    await nextTick()
    expect(selectedText()).toContain('Alpha')

    pointerMove(rows[1]!.element, 'mouse')
    await nextTick()
    expect(selectedText()).toContain('Beta')
  })

  it('still activates a tapped row through click', async () => {
    const perform = vi.fn()
    const wrapper = track(
      mount(CommandPalette, {
        props: { commands: [action('go', 'Go', { perform })], recents: false },
        attachTo: document.body,
      }),
    )
    pointerMove(wrapper.find('[data-cmdk-item]').element, 'touch')
    await wrapper.find('[data-cmdk-item]').trigger('click')
    await nextTick()
    expect(perform).toHaveBeenCalledTimes(1)
  })
})

describe('field attributes', () => {
  it('sets enterkeyhint to go on the search field', () => {
    const wrapper = track(
      mount(CommandPalette, { props: { commands: COMMANDS, recents: false }, attachTo: document.body }),
    )
    expect(wrapper.find('input').attributes('enterkeyhint')).toBe('go')
  })
})

/** A touch event carrying a single touch at `clientY`, cancelable so `defaultPrevented` reports cancellation. */
const touch = (type: 'touchstart' | 'touchmove', target: Element, clientY: number): Event => {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'touches', { value: [{ clientY }] })
  target.dispatchEvent(event)
  return event
}

const scrollableList = (scrollTop: number): HTMLElement => {
  const list = document.createElement('div')
  list.setAttribute('data-cmdk-list', '')
  const row = document.createElement('div')
  list.appendChild(row)
  document.body.appendChild(list)
  Object.defineProperties(list, {
    scrollHeight: { value: 1000 },
    clientHeight: { value: 300 },
  })
  list.scrollTop = scrollTop
  return list
}

const mountLock = (locked = true) => {
  const isLocked = ref(locked)
  const Host = defineComponent({
    setup() {
      useScrollLock(() => isLocked.value)
      return () => h('div')
    },
  })
  track(mount(Host))
  return isLocked
}

describe('touch scroll lock', () => {
  it('cancels a touch drag on the backdrop', () => {
    mountLock()
    const backdrop = document.createElement('div')
    document.body.appendChild(backdrop)
    touch('touchstart', backdrop, 400)
    expect(touch('touchmove', backdrop, 380).defaultPrevented).toBe(true)
  })

  it('lets a list scroll mid-way, in both directions', () => {
    mountLock()
    const list = scrollableList(300)
    touch('touchstart', list, 400)
    // Finger moves up: content scrolls down, which the list can still do.
    expect(touch('touchmove', list, 380).defaultPrevented).toBe(false)
    // Finger moves down: content scrolls up, which the list can also still do.
    expect(touch('touchmove', list, 400).defaultPrevented).toBe(false)
  })

  it('stops a list at its end and cancels the drag', () => {
    mountLock()
    const list = scrollableList(700)
    // 700 + 300 equals scrollHeight, so the list is at its end.
    touch('touchstart', list, 400)
    expect(touch('touchmove', list, 380).defaultPrevented).toBe(true)
  })

  it('cancels a drag that started outside the list even when the list can scroll', () => {
    mountLock()
    const list = scrollableList(300)
    const outside = document.createElement('div')
    document.body.appendChild(outside)
    touch('touchstart', outside, 400)
    expect(touch('touchmove', list, 380).defaultPrevented).toBe(true)
  })

  it('removes the touch listeners when unlocked', async () => {
    const isLocked = mountLock()
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    isLocked.value = false
    await nextTick()
    const removed = removeSpy.mock.calls.map(([type]) => type)
    expect(removed).toEqual(expect.arrayContaining(['touchstart', 'touchmove']))
    expect(document.body.style.overflow).toBe('')
  })
})

describe('visual viewport', () => {
  class FakeViewport extends EventTarget {
    height = 800
  }

  const installViewport = () => {
    const viewport = new FakeViewport()
    Object.defineProperty(window, 'visualViewport', { value: viewport, configurable: true })
    return viewport
  }

  const mountViewport = (active = ref(false)) => {
    const target = ref<HTMLElement | null>(null)
    const Host = defineComponent({
      setup() {
        useVisualViewport(target, () => active.value)
        return () => h('div', [active.value ? h('div', { ref: target }) : null])
      },
    })
    const wrapper = track(mount(Host))
    return { active, target, wrapper }
  }

  it('writes the viewport height while active and follows resizes', async () => {
    const viewport = installViewport()
    const { active, wrapper } = mountViewport()
    active.value = true
    await nextTick()
    const overlay = wrapper.element.firstElementChild as HTMLElement
    expect(overlay.style.getPropertyValue('--cmdk-viewport-height')).toBe('800px')

    viewport.height = 420
    viewport.dispatchEvent(new Event('resize'))
    expect(overlay.style.getPropertyValue('--cmdk-viewport-height')).toBe('420px')
  })

  it('removes its listeners and the variable when closed', async () => {
    const viewport = installViewport()
    const removeSpy = vi.spyOn(viewport, 'removeEventListener')
    const { active, wrapper } = mountViewport()
    active.value = true
    await nextTick()
    active.value = false
    await nextTick()
    expect(removeSpy.mock.calls.map(([type]) => type)).toEqual(expect.arrayContaining(['resize', 'scroll']))
    expect(wrapper.element.firstElementChild).toBeNull()
  })

  it('leaves no listener behind after unmount while active', async () => {
    const viewport = installViewport()
    const addSpy = vi.spyOn(viewport, 'addEventListener')
    const removeSpy = vi.spyOn(viewport, 'removeEventListener')
    const { active, wrapper } = mountViewport()
    active.value = true
    await nextTick()
    wrapper.unmount()
    const added = addSpy.mock.calls.map(([type]) => type)
    const removed = removeSpy.mock.calls.map(([type]) => type)
    expect(added.filter((type) => type === 'resize')).toHaveLength(removed.filter((type) => type === 'resize').length)
    expect(added.filter((type) => type === 'scroll')).toHaveLength(removed.filter((type) => type === 'scroll').length)
  })

  it('does nothing without visualViewport', async () => {
    const { active, wrapper } = mountViewport()
    active.value = true
    await nextTick()
    const overlay = wrapper.element.firstElementChild as HTMLElement
    expect(overlay.style.getPropertyValue('--cmdk-viewport-height')).toBe('')
  })
})
