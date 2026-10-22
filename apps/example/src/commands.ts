import type { Command, Scope } from 'vue-cmdk-palette'

import {
  IconBook,
  IconBug,
  IconChart,
  IconCopy,
  IconGear,
  IconGlobe,
  IconGrid,
  IconHome,
  IconLink,
  IconLock,
  IconMoon,
  IconRuler,
} from './icons'
import { app, logAction, type ThemeChoice } from './state'

export const scopes: Scope[] = [
  { id: 'pages', label: 'Pages' },
  { id: 'actions', label: 'Actions' },
  { id: 'run', label: 'Run', prefix: '>' },
  { id: 'settings', label: 'Settings' },
]

export const groupOrder = ['Run', 'Actions', 'Pages', 'Settings']

const LANGUAGES = [
  ['Deutsch', '🇩🇪'],
  ['English', '🇬🇧'],
  ['Español', '🇪🇸'],
  ['Français', '🇫🇷'],
  ['Italiano', '🇮🇹'],
  ['Nederlands', '🇳🇱'],
  ['Polski', '🇵🇱'],
  ['Português', '🇵🇹'],
  ['Čeština', '🇨🇿'],
  ['日本語', '🇯🇵'],
] as const

/** Stands in for an API call, so the loading state is visible. */
const loadLanguages = (): Promise<Command[]> =>
  new Promise((resolve) =>
    setTimeout(
      () =>
        resolve(
          LANGUAGES.map(([name, flag]) => ({
            kind: 'action',
            id: `language:${name}`,
            label: name,
            icon: flag,
            group: 'Languages',
            disabled: name === app.language ? 'Current language' : false,
            perform: () => {
              app.language = name
              logAction(`Language set to ${name}`)
            },
          })),
        ),
      650,
    ),
  )

const themeCommand = (theme: ThemeChoice, label: string): Command => ({
  kind: 'action',
  id: `theme:${theme}`,
  label,
  group: 'Theme',
  perform: () => {
    app.theme = theme
    logAction(`Theme: ${label}`)
  },
})

const page = (
  id: string,
  label: string,
  href: string,
  icon: object,
  hint: string,
  keywords: string[] = [],
): Command => ({
  kind: 'link',
  id: `page:${id}`,
  label,
  href,
  icon,
  hint,
  keywords,
  group: 'Pages',
  scope: 'pages',
  alternateLabel: 'Open in new tab',
})

export const commands: Command[] = [
  page('home', 'Home', '#/', IconHome, 'The landing page of this demo.', ['start', 'index']),
  page('docs', 'Documentation', '#/docs', IconBook, 'How to install and use the library.', ['guide', 'readme', 'api']),
  page('reports', 'Reports', '#/reports', IconChart, 'Monthly numbers, charts and exports.', ['analytics', 'stats']),
  page('changelog', 'What’s new', '#/changelog', IconBook, 'Release notes for every version.', [
    'changelog',
    'releases',
  ]),
  page('resume', 'Résumé templates', '#/resume', IconBook, 'Accents are optional: type “resume” to find it.', ['cv']),
  {
    kind: 'link',
    id: 'page:billing',
    label: 'Billing',
    href: '#/billing',
    icon: IconLock,
    group: 'Pages',
    scope: 'pages',
    hint: 'Plans and invoices. Needs the owner role.',
    disabled: 'Owner only',
  },

  {
    kind: 'action',
    id: 'action:copy-url',
    label: 'Copy current URL',
    icon: IconCopy,
    group: 'Actions',
    scope: 'actions',
    hint: 'Puts the address of this page on the clipboard.',
    keywords: ['clipboard', 'link', 'share'],
    shortcut: 'mod+shift+c',
    perform: async () => {
      await navigator.clipboard.writeText(window.location.href)
      logAction('Copied the URL')
    },
  },
  {
    kind: 'link',
    id: 'action:repo',
    label: 'Open the source on npm',
    icon: IconLink,
    group: 'Actions',
    scope: 'actions',
    href: 'https://www.npmjs.com/package/vue-cmdk-palette',
    hint: 'The package page, in this tab or a new one.',
    keywords: ['package', 'registry'],
    alternateLabel: 'Open in new tab',
  },
  {
    kind: 'page',
    id: 'action:language',
    label: 'Switch language…',
    icon: IconGlobe,
    group: 'Actions',
    scope: 'actions',
    hint: 'Loads the language list, then sets the one you pick.',
    keywords: ['locale', 'translate', 'i18n'],
    placeholder: 'Search languages…',
    children: loadLanguages,
  },

  {
    kind: 'action',
    id: 'run:wireframe',
    label: 'Toggle wireframe',
    icon: IconGrid,
    group: 'Run',
    scope: 'run',
    hint: 'Outlines every box on the page. Runs now, nothing opens.',
    keywords: ['outline', 'boxes', 'debug'],
    shortcut: ['⌥', 'W'],
    verb: 'run',
    perform: () => {
      app.wireframe = !app.wireframe
      logAction(`Wireframe ${app.wireframe ? 'on' : 'off'}`)
    },
  },
  {
    kind: 'action',
    id: 'run:rulers',
    label: 'Toggle rulers',
    icon: IconRuler,
    group: 'Run',
    scope: 'run',
    hint: 'Shows a pixel ruler along the top of the page.',
    keywords: ['measure', 'pixels'],
    perform: () => {
      app.rulers = !app.rulers
      logAction(`Rulers ${app.rulers ? 'on' : 'off'}`)
    },
  },
  {
    kind: 'action',
    id: 'run:debug',
    label: 'Toggle debug overlay',
    icon: IconBug,
    group: 'Run',
    scope: 'run',
    hint: 'Hidden from the list; type “debug” to find it.',
    hidden: true,
    badge: 'DEV',
    perform: () => logAction('Debug overlay toggled'),
  },

  {
    kind: 'page',
    id: 'settings:theme',
    label: 'Theme…',
    icon: IconMoon,
    group: 'Settings',
    scope: 'settings',
    hint: 'Light, dark, or follow the system.',
    keywords: ['dark mode', 'appearance', 'color'],
    children: [
      themeCommand('system', 'Follow the system'),
      themeCommand('light', 'Light'),
      themeCommand('dark', 'Dark'),
    ],
  },
  {
    kind: 'action',
    id: 'settings:reset',
    label: 'Reset demo state',
    icon: IconGear,
    group: 'Settings',
    scope: 'settings',
    hint: 'Turns every toggle off and clears the activity log.',
    keywords: ['clear', 'defaults'],
    badge: 'NEW',
    perform: () => {
      Object.assign(app, {
        wireframe: false,
        rulers: false,
        language: 'English',
        theme: 'system',
        log: [],
      })
    },
  },
]
