import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import { STORAGE_THEME } from '@/lib/constants'

const ThemeContext = createContext(null)

function getStoredTheme() {
  if (typeof window === 'undefined') return 'light'
  return localStorage.getItem(STORAGE_THEME) === 'dark' ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme)

  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(STORAGE_THEME, theme)
  }, [theme])

  const setTheme = useCallback((t) => {
    setThemeState(t === 'dark' ? 'dark' : 'light')
  }, [])

  const toggle = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(
    () => ({ theme, setTheme, toggle }),
    [theme, setTheme, toggle],
  )

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
