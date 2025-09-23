import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type Theme = 'dark' | 'light' | 'system'

const updateTheme = (theme: Theme) => {
  const root = window.document.body

  root.classList.remove('light', 'dark')

  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

    root.classList.add(systemTheme)
    return
  }

  root.classList.add(theme)
}

export type ThemeState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme: Theme) => {
        updateTheme(theme)
        set({ theme })
      },
    }),
    {
      name: 'motia-theme-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

const { theme } = useThemeStore.getState()

if (theme) {
  updateTheme(theme)
}
