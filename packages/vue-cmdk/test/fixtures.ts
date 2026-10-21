import type { ActionCommand, Command, LinkCommand, PageCommand } from '../src/core/types'

export const action = (
  id: string,
  label: string,
  extra: Partial<Omit<ActionCommand, 'kind' | 'id' | 'label'>> = {},
): ActionCommand => ({ kind: 'action', id, label, perform: () => {}, ...extra })

export const link = (
  id: string,
  label: string,
  href: string,
  extra: Partial<Omit<LinkCommand, 'kind' | 'id' | 'label' | 'href'>> = {},
): LinkCommand => ({ kind: 'link', id, label, href, ...extra })

export const page = (
  id: string,
  label: string,
  children: PageCommand['children'],
  extra: Partial<Omit<PageCommand, 'kind' | 'id' | 'label' | 'children'>> = {},
): PageCommand => ({ kind: 'page', id, label, children, ...extra })

export const labels = (commands: readonly { command: Command }[]): string[] => commands.map((row) => row.command.label)
