import { create } from 'zustand'

interface LiveAnnouncerState {
  message: string
  announce: (message: string) => void
}

export const useLiveAnnouncer = create<LiveAnnouncerState>((set) => ({
  message: '',
  announce: (message) => {
    // Clear first so identical messages are still announced.
    set({ message: '' })
    queueMicrotask(() => set({ message }))
  },
}))

export function LiveAnnouncer() {
  const message = useLiveAnnouncer((state) => state.message)
  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  )
}
