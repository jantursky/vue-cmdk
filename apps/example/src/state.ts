import { reactive, watch } from 'vue'

export type ThemeChoice = 'system' | 'light' | 'dark'

/** Everything the demo commands change, so the effect of each pick is visible on the page. */
export const app = reactive({
  route: '/',
  language: 'English',
  theme: 'system',
  wireframe: false,
  rulers: false,
  log: [] as string[],
})

export const logAction = (message: string): void => {
  app.log = [`${new Date().toLocaleTimeString()}  ${message}`, ...app.log].slice(0, 6)
}

watch(
  () => app.theme,
  (theme) => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
  },
  { immediate: true },
)
