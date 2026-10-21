import { h, type FunctionalComponent } from 'vue'

/** Tiny stroke icons, so the demo needs no icon package. */
const icon = (...paths: string[]): FunctionalComponent => {
  const component: FunctionalComponent = () =>
    h(
      'svg',
      {
        viewBox: '0 0 24 24',
        width: 15,
        height: 15,
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': 1.9,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'aria-hidden': 'true',
      },
      paths.map((d) => h('path', { d })),
    )
  return component
}

export const IconHome = icon('M3 10.5 12 3l9 7.5', 'M5 9.5V21h14V9.5')
export const IconBook = icon('M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z', 'M20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z')
export const IconChart = icon('M4 20V10', 'M10 20V4', 'M16 20v-7', 'M22 20H2')
export const IconLink = icon(
  'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1',
  'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
)
export const IconCopy = icon('M8 8h12v12H8z', 'M4 16V4h12')
export const IconMoon = icon('M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z')
export const IconGlobe = icon(
  'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  'M3 12h18',
  'M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z',
)
export const IconGrid = icon('M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z')
export const IconRuler = icon('M3 17 17 3l4 4L7 21z', 'm7 13 2 2', 'm10 10 2 2', 'm13 7 2 2')
export const IconBug = icon(
  'M8 8h8v9a4 4 0 0 1-8 0z',
  'M9 4l1.5 2',
  'M15 4l-1.5 2',
  'M4 12h4',
  'M16 12h4',
  'M5 18l3-2',
  'M19 18l-3-2',
)
export const IconGear = icon(
  'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  'M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z',
)
export const IconLock = icon('M6 11h12v10H6z', 'M8 11V7a4 4 0 0 1 8 0v4')
