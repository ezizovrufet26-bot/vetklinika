'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'dark'

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'light',
  toggle: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

/**
 * Flash-of-wrong-theme qarşısını almaq üçün bu skript layout-da
 * <head> daxilində inline işə düşür (bax: layout.tsx).
 */
export const THEME_INIT_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('vk-theme');
    var system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    var theme = stored || system;
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  }, [])

  const toggle = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      const root = document.documentElement
      root.classList.add('theme-transition')
      root.classList.toggle('dark', next === 'dark')
      localStorage.setItem('vk-theme', next)
      window.setTimeout(() => root.classList.remove('theme-transition'), 400)
      return next
    })
  }, [])

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}
