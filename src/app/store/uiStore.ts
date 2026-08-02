import { create } from 'zustand'

type ThemeMode = 'dark' | 'light'

interface UiState {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: 'dark',
  setTheme: (theme) => {
    document.documentElement.dataset.theme = theme
    set({ theme })
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    set({ theme: next })
  },
}))
