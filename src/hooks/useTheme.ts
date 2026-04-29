import { useState, useEffect, useCallback, createContext, useContext } from 'react'

export type ColorPreset = 'default' | 'mint' | 'ember' | 'aurora' | 'slate' | 'frosted'
type ThemeMode = 'light' | 'dark'

interface ThemeContextValue {
  mode: ThemeMode
  preset: ColorPreset
  toggle: () => void
  setPreset: (preset: ColorPreset) => void
  isDark: boolean
}

export const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  preset: 'default',
  toggle: () => { },
  setPreset: () => { },
  isDark: false,
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function useThemeProvider(): ThemeContextValue {
  const [mode, setMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('oio_theme') as ThemeMode) ?? 'dark'
  })

  const [preset, setPreset] = useState<ColorPreset>(() => {
    const saved = localStorage.getItem('oio_theme_preset') as ColorPreset
    const valid: ColorPreset[] = ['default', 'mint', 'ember', 'aurora', 'slate']
    return valid.includes(saved) ? saved : 'default'
  })

  // Initialize theme classes and inject background element
  useEffect(() => {
    const savedMode = localStorage.getItem('oio_theme') || 'dark'
    const savedPreset = (localStorage.getItem('oio_theme_preset') as ColorPreset) || 'default'
    
    document.body.classList.add(`theme-${savedMode}`)
    document.documentElement.setAttribute('data-theme', savedMode)
    document.documentElement.setAttribute('data-preset', savedPreset)

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

  useEffect(() => {
    localStorage.setItem('oio_theme_preset', preset)
    document.documentElement.setAttribute('data-preset', preset)
  }, [preset])

  const toggle = useCallback(() => {
    const next = mode === 'light' ? 'dark' : 'light'

    // Trigger the background animation immediately via body classes
    if (next === 'light') {
      document.body.classList.add('theme-light')
      document.body.classList.remove('theme-dark')
    } else {
      document.body.classList.add('theme-dark')
      document.body.classList.remove('theme-light')
    }

    // Delay the component theme switch to sync with the background slide (700ms)
    // 600ms feels more natural as it finishes just before the slide ends.
    setTimeout(() => {
      setMode(next)
    }, 600)
  }, [mode])

  return { mode, preset, toggle, setPreset, isDark: mode === 'dark' }
}
