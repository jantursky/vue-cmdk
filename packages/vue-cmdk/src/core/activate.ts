import type { ActivationMode } from './types'

/**
 * Opens a link command: a new tab for the alternate mode, otherwise through the
 * router hook, falling back to a full page load.
 */
export const followLink = (href: string, mode: ActivationMode, navigate?: (href: string) => void): void => {
  if (mode === 'alternate') {
    window.open(href, '_blank', 'noopener,noreferrer')
    return
  }
  if (navigate !== undefined) navigate(href)
  else window.location.href = href
}
