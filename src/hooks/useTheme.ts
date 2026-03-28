import { useState, useEffect, useCallback, createContext, useContext } from 'react'

type ThemeMode = 'light' | 'dark'

interface ThemeContextValue {
  mode: ThemeMode
  toggle: () => void
  isDark: boolean
}

export const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  toggle: () => {},
  isDark: false,
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function useThemeProvider(): ThemeContextValue {
  const [mode, setMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('oio_theme') as ThemeMode) ?? 'light'
  })

  useEffect(() => {
    localStorage.setItem('oio_theme', mode)
    document.documentElement.setAttribute('data-theme', mode)
  }, [mode])

  const toggle = useCallback(() => {
    setMode(prev => prev === 'light' ? 'dark' : 'light')
  }, [])

  return { mode, toggle, isDark: mode === 'dark' }
}
