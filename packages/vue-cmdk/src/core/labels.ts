import type { PaletteLabels } from './types'

export const DEFAULT_LABELS: Readonly<PaletteLabels> = {
  placeholder: 'Search commands…',
  empty: 'Nothing matches',
  emptyHint: 'Try a different word, or part of a description.',
  loading: 'Loading…',
  recent: 'Recent',
  all: 'All',
  dialog: 'Command palette',
  list: 'Commands',
  move: 'move',
  open: 'open',
  run: 'run',
  back: 'back',
  toggle: 'open / close',
  scope: 'scope',
  clear: 'Clear the search',
  noSelection: 'Nothing is selected. Keep typing, or press Escape to close.',
  results: '{count} results',
  resultsOne: '{count} result',
  capped: 'first {shown} of {matched}',
}

export const fillLabel = (template: string, values: Readonly<Record<string, number | string>>): string =>
  template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in values ? String(values[name]) : whole))

export const resultsLabel = (labels: PaletteLabels, count: number): string =>
  fillLabel(count === 1 ? labels.resultsOne : labels.results, { count })
