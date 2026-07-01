import type { AppSettings } from '../types'

export function applyTheme(theme: AppSettings['theme']) {
  const root = document.documentElement
  root.style.setProperty('--icams-primary', theme.primaryColor)
  root.style.setProperty('--icams-accent', theme.accentColor)
  root.style.setProperty('--icams-bg', theme.backgroundColor)
}
