import { useState, useEffect, useCallback, createContext, useContext } from 'react'

type ThemeMode = 'light' | 'dark'

interface ThemeContextValue {
  mode: ThemeMode
  toggle: () => void
  isDark: boolean
}

export const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  toggle: () => { },
  isDark: false,
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function useThemeProvider(): ThemeContextValue {
  const [mode, setMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('oio_theme') as ThemeMode) ?? 'dark'
  })

  // Initialize theme classes and inject background element
  useEffect(() => {
    const saved = localStorage.getItem('oio_theme') || 'dark'
    document.body.classList.add(`theme-${saved}`)

    // Inject background element if not exists
    if (!document.getElementById('app-bg')) {
      const bg = document.createElement('div')
      bg.id = 'app-bg'
      document.body.insertBefore(bg, document.body.firstChild)
    }

    // Handle prefers-reduced-motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      const s = document.createElement('style')
      s.textContent = '#app-bg { transition: none !important; }'
      document.head.appendChild(s)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('oio_theme', mode)
    document.documentElement.setAttribute('data-theme', mode)

    // Sync classes to body for background transition
    if (mode === 'light') {
      document.body.classList.add('theme-light')
      document.body.classList.remove('theme-dark')
    } else {
      document.body.classList.add('theme-dark')
      document.body.classList.remove('theme-light')
    }
  }, [mode])

  const toggle = useCallback(() => {
    setMode(prev => prev === 'light' ? 'dark' : 'light')
  }, [])

  return { mode, toggle, isDark: mode === 'dark' }
}
