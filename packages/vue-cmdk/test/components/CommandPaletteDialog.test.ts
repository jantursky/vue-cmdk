import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref, useTemplateRef } from 'vue'

import CommandPaletteDialog from '../../src/components/CommandPaletteDialog.vue'
import type { CommandPaletteEmits } from '../../src/components/types'
import { useFocusTrap } from '../../src/composables/useFocusTrap'
import { useHotkey } from '../../src/composables/useHotkey'
import { useScrollLock } from '../../src/composables/useScrollLock'
import { isApplePlatform } from '../../src/core/keys'
import type { RecentEntry, RecentsAdapter } from '../../src/core/types'
import { action, page } from '../fixtures'

const wrappers: VueWrapper[] = []
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))
const mod = () => (isApplePlatform() ? { metaKey: true } : { ctrlKey: true })
const press = (init: KeyboardEventInit, target: EventTarget = document) => {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(event)
  return event
}

const COMMANDS = [action('a', 'Alpha'), action('b', 'Beta')]

const render = (props: Record<string, unknown> = {}) => {
  const wrapper = mount(CommandPaletteDialog, {
    props: { commands: COMMANDS, recents: false, ...props },
    attachTo: document.body,
  })
  wrappers.push(wrapper)
  return wrapper
}

const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')
const input = () => document.querySelector<HTMLInputElement>('[data-cmdk-input]')

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  document.body.innerHTML = ''
  document.body.removeAttribute('style')
  vi.restoreAllMocks()
})

describe('open state', () => {
  it('toggles with the global chord and emits update:open', async () => {
    const wrapper = render()
    const event = press({ key: 'k', ...mod() })
    await nextTick()
    expect(event.defaultPrevented).toBe(true)
    expect(dialog()).not.toBeNull()
    expect(wrapper.emitted('update:open')?.[0]).toEqual([true])
    press({ key: 'k', ...mod() }, input()!)
    await nextTick()
    expect(dialog()).toBeNull()
  })

  it('prints its hotkey in the footer unless a chord is given', async () => {
    render({ open: true })
    await nextTick()
    expect(document.querySelector('[data-cmdk-footer]')?.textContent).toContain('open / close')
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
    render({ open: true, hotkey: false })
    await nextTick()
    expect(document.querySelector('[data-cmdk-footer]')?.textContent).not.toContain('open / close')
  })

  it('opens on an Option chord even though macOS types a symbol for it', async () => {
    render({ hotkey: 'alt+k' })
    press({ key: '˚', code: 'KeyK', altKey: true })
    await nextTick()
    expect(dialog()).not.toBeNull()
  })

  it('ignores the chord when hotkey is false', async () => {
    render({ hotkey: false })
    const event = press({ key: 'k', ...mod() })
    await nextTick()
    expect(dialog()).toBeNull()
    expect(event.defaultPrevented).toBe(false)
  })

  it('does not emit update:open when the parent closes it', async () => {
    const wrapper = render({ open: true })
    await nextTick()
    expect(dialog()).not.toBeNull()
    await wrapper.setProps({ open: false })
    expect(dialog()).toBeNull()
    expect(wrapper.emitted('update:open')).toBeUndefined()
  })

  it('opens on slash, but not while typing in a field', async () => {
    render({ openOnSlash: true })
    const textarea = document.body.appendChild(document.createElement('textarea'))
    const typed = press({ key: '/' }, textarea)
    await nextTick()
    expect(typed.defaultPrevented).toBe(false)
    expect(dialog()).toBeNull()
    press({ key: '/' }, document.body)
    await nextTick()
    expect(dialog()).not.toBeNull()
  })

  it('closes on backdrop press unless not dismissible', async () => {
    render({ open: true })
    await nextTick()
    document.querySelector('[data-cmdk-overlay]')!.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    expect(wrappers[0]!.emitted('update:open')?.[0]).toEqual([false])
    expect(dialog()).toBeNull()

    const sticky = render({ open: true, dismissible: false })
    await nextTick()
    document.querySelector('[data-cmdk-overlay]')!.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    expect(sticky.emitted('update:open')).toBeUndefined()
    expect(dialog()).not.toBeNull()
  })

  it('closes after an action runs', async () => {
    const wrapper = render({ open: true })
    await flush()
    press({ key: 'Enter' }, input()!)
    await flush()
    expect(wrapper.emitted('select')?.[0]?.[0]).toMatchObject({ id: 'a' })
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })
})

describe('Escape', () => {
  it('clears, then pops a page, then closes', async () => {
    const wrapper = render({ commands: [page('lang', 'Lang', [action('fr', 'Français')])] })
    press({ key: 'k', ...mod() })
    await flush()
    press({ key: 'Enter' }, input()!)
    await flush()
    const field = input()!
    field.value = 'fr'
    field.dispatchEvent(new Event('input'))
    await nextTick()

    press({ key: 'Escape' }, input()!)
    await nextTick()
    expect(input()!.value).toBe('')
    expect(document.querySelector('[data-cmdk-breadcrumb]')).not.toBeNull()

    press({ key: 'Escape' }, input()!)
    await nextTick()
    expect(document.querySelector('[data-cmdk-breadcrumb]')).toBeNull()

    press({ key: 'Escape' }, input()!)
    await nextTick()
    expect(dialog()).toBeNull()
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })
})

describe('focus and scroll', () => {
  it('focuses the field on open and restores focus on close', async () => {
    render()
    const trigger = document.body.appendChild(document.createElement('button'))
    trigger.focus()
    press({ key: 'k', ...mod() }, trigger)
    await flush()
    expect(document.activeElement).toBe(input())
    press({ key: 'Escape' }, input()!)
    await flush()
    expect(document.activeElement).toBe(trigger)
  })

  it('locks body scrolling while open and restores the original value', async () => {
    document.body.style.overflow = 'scroll'
    render()
    press({ key: 'k', ...mod() })
    await nextTick()
    expect(document.body.style.overflow).toBe('hidden')
    press({ key: 'k', ...mod() })
    await nextTick()
    expect(document.body.style.overflow).toBe('scroll')
  })

  it('marks the panel as a labelled modal dialog', async () => {
    render({ open: true, labels: { dialog: 'Befehle' } })
    await nextTick()
    expect(dialog()?.getAttribute('aria-modal')).toBe('true')
    expect(dialog()?.getAttribute('aria-label')).toBe('Befehle')
  })

  it('cycles scopes with Tab instead of moving focus when scopes exist', async () => {
    const wrapper = render({ open: true, scopes: [{ id: 'x', label: 'X' }] })
    await flush()
    const event = press({ key: 'Tab' }, input()!)
    await nextTick()
    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(input())
    expect(document.querySelector('[data-cmdk-chip][data-active="true"]')?.textContent).toContain('X')
    wrapper.unmount()
  })
})

describe('no-results event', () => {
  it('types the handler arguments', () => {
    expectTypeOf<CommandPaletteEmits['no-results']>().toEqualTypeOf<[query: string, scope: string | null]>()
  })

  it('forwards a settled query that matched nothing, and one pending when closed by the chord', async () => {
    vi.useFakeTimers()
    try {
      const wrapper = render({ open: true })
      await nextTick()
      await wrapper.findComponent({ name: 'CommandPalette' }).find('input').setValue('zebra')
      vi.advanceTimersByTime(500)
      expect(wrapper.emitted('no-results')).toEqual([['zebra', null]])

      await wrapper.findComponent({ name: 'CommandPalette' }).find('input').setValue('quokka')
      press({ key: 'k', ...mod() })
      await nextTick()
      expect(dialog()).toBeNull()
      expect(wrapper.emitted('no-results')?.at(-1)).toEqual(['quokka', null])
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('recents methods', () => {
  interface Exposed {
    forgetRecent: (id: string) => void
    clearRecents: () => void
  }
  const memory = (initial: RecentEntry[]) => {
    let stored = initial
    const saves: RecentEntry[][] = []
    const storage: RecentsAdapter = {
      load: () => stored,
      save: (entries) => {
        stored = [...entries]
        saves.push(stored)
      },
    }
    return { saves, storage }
  }
  const entries = (): RecentEntry[] => [
    { id: 'a', lastUsedAt: Date.now(), hitCount: 2 },
    { id: 'b', lastUsedAt: Date.now(), hitCount: 1 },
  ]
  const recentLabels = () =>
    [...document.querySelectorAll('[data-cmdk-group]')]
      .filter((group) => group.textContent.startsWith('Recent'))
      .flatMap((group) => [...group.querySelectorAll('[data-cmdk-item]')]).length

  it('edits storage while closed, keeping picks saved since mount', () => {
    const { saves, storage } = memory(entries())
    const wrapper = render({ recents: { storage } })
    const exposed = wrapper.vm as unknown as Exposed
    // A pick saved after mount, as an open palette would have done.
    void storage.save([...entries(), { id: 'c', lastUsedAt: Date.now(), hitCount: 1 }])
    exposed.forgetRecent('a')
    expect(saves.at(-1)?.map((e) => e.id)).toEqual(['b', 'c'])
    exposed.forgetRecent('missing')
    expect(saves).toHaveLength(2)
    exposed.clearRecents()
    expect(saves.at(-1)).toEqual([])
  })

  it('delegates to the open palette, which updates the Recent group', async () => {
    const { saves, storage } = memory(entries())
    const wrapper = render({ open: true, recents: { storage } })
    await nextTick()
    expect(recentLabels()).toBe(2)
    const exposed = wrapper.vm as unknown as Exposed
    exposed.forgetRecent('a')
    await nextTick()
    expect(recentLabels()).toBe(1)
    exposed.clearRecents()
    await nextTick()
    expect(recentLabels()).toBe(0)
    expect(saves.at(-1)).toEqual([])
  })

  it('does nothing when recents are disabled', () => {
    const exposed = render().vm as unknown as Exposed
    expect(() => {
      exposed.forgetRecent('a')
      exposed.clearRecents()
    }).not.toThrow()
  })
})

describe('useHotkey', () => {
  it('removes its listener on unmount', () => {
    const handler = vi.fn()
    const Host = defineComponent({
      setup() {
        useHotkey(handler)
        return () => h('div')
      },
    })
    const wrapper = mount(Host, { attachTo: document.body })
    press({ key: 'x' })
    expect(handler).toHaveBeenCalledTimes(1)
    wrapper.unmount()
    press({ key: 'x' })
    expect(handler).toHaveBeenCalledTimes(1)
  })
})

describe('useFocusTrap', () => {
  const Host = defineComponent({
    props: { active: Boolean },
    setup(props) {
      const root = useTemplateRef<HTMLElement>('root')
      const trap = useFocusTrap(root, () => props.active)
      return () =>
        props.active
          ? h('div', { ref: 'root', onKeydown: trap.onKeydown }, [
              h('button', { id: 'first' }, 'first'),
              h('button', { id: 'last' }, 'last'),
            ])
          : h('span')
    },
  })

  it('wraps Tab and Shift+Tab inside the container and restores focus', async () => {
    const outside = document.body.appendChild(document.createElement('button'))
    outside.focus()
    const wrapper = mount(Host, { props: { active: false }, attachTo: document.body })
    await wrapper.setProps({ active: true })
    const first = document.getElementById('first')!
    const last = document.getElementById('last')!

    last.focus()
    expect(press({ key: 'Tab' }, last).defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(first)
    expect(press({ key: 'Tab', shiftKey: true }, first).defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(last)

    await wrapper.setProps({ active: false })
    await flush()
    expect(document.activeElement).toBe(outside)
    wrapper.unmount()
  })
})

describe('useScrollLock', () => {
  it('restores overflow when unmounted while locked', () => {
    document.body.style.overflow = 'auto'
    const locked = ref(true)
    const Host = defineComponent({
      setup() {
        useScrollLock(() => locked.value)
        return () => h('div')
      },
    })
    const wrapper = mount(Host)
    expect(document.body.style.overflow).toBe('hidden')
    wrapper.unmount()
    expect(document.body.style.overflow).toBe('auto')
  })
})
