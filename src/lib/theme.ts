import { useCallback, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

/** Light/dark theme shared by every page: index.html-style inline script sets
    data-theme before first paint, this hook keeps it and localStorage in sync. */
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
    try {
      localStorage.setItem('v4air-theme', theme)
    } catch {
      /* storage unavailable */
    }
  }, [theme])

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
    [],
  )

  return [theme, toggleTheme] as const
}
