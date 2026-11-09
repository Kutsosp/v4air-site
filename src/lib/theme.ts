import { useCallback, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

/** Light/dark theme shared by every page: index.html-style inline script sets
    data-theme before first paint, this hook keeps it in sync. The choice is saved
    only when the visitor switches, never on a plain visit (cookies policy). */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'dark'
      ? 'dark'
      : 'light',
  )

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [theme])

  const toggleTheme = useCallback(
    () =>
      setTheme((t) => {
        const next = t === 'light' ? 'dark' : 'light'
        try {
          localStorage.setItem('v4air-theme', next)
        } catch {
          /* storage unavailable */
        }
        return next
      }),
    [],
  )

  return [theme, toggleTheme] as const
}
