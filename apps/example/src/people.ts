import type { CommandSource } from 'vue-cmdk-palette/sources'

import { logAction } from './state'

const PEOPLE = [
  ['Alice Johnson', 'Design'],
  ['Alan Turner', 'Engineering'],
  ['Alina Novak', 'Support'],
  ['Bob Jenkins', 'Engineering'],
  ['Carla Jones', 'Sales'],
  ['John Doe', 'Engineering'],
  ['Jonathan Smith', 'Design'],
  ['Joan Rivers', 'Finance'],
  ['Maria Garcia', 'Support'],
  ['Mohammed Ali', 'Sales'],
  ['Priya Patel', 'Engineering'],
  ['Tomáš Novák', 'Design'],
] as const

/** Stands in for an API: random latency, honors the abort signal like `fetch` does. */
const searchPeople: CommandSource['search'] = (query, { signal }) =>
  new Promise((resolve, reject) => {
    const abort = (): void => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    const timer = setTimeout(
      () => {
        signal.removeEventListener('abort', abort)
        // Loose on purpose, like a server: every letter has to occur in order.
        const needle = query.toLowerCase().replace(/\s+/g, '')
        resolve(
          PEOPLE.filter(([name]) => {
            let at = 0
            for (const ch of name.toLowerCase().replace(/\s+/g, '')) if (ch === needle[at]) at++
            return at === needle.length
          }).map(([name, team]) => ({
            kind: 'action' as const,
            id: `person:${name}`,
            label: name,
            hint: team,
            perform: () => logAction(`Opened ${name}`),
          })),
        )
      },
      300 + Math.random() * 700,
    )
    signal.addEventListener('abort', abort, { once: true })
  })

export const sources: CommandSource[] = [{ id: 'people', group: 'People', search: searchPeople, limit: 6 }]
