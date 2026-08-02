import { useEffect, useState } from 'react'
import { seedIfEmpty } from '@/database/seed'
import { loadAiMode } from '@/services/aiAssistService'
import {
  getPrimaryUser,
  getProfileForUser,
} from '@/services/profileService'
import type { Profile, User } from '@/types/domain'

interface BootstrapState {
  ready: boolean
  user: User | null
  profile: Profile | null
  error: string | null
  refresh: () => Promise<void>
}

export function useBootstrap(): BootstrapState {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    const primary = (await getPrimaryUser()) ?? null
    setUser(primary)
    if (primary) {
      setProfile((await getProfileForUser(primary.id)) ?? null)
    } else {
      setProfile(null)
    }
  }

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        await seedIfEmpty()
        if (cancelled) return
        await refresh()
        const primary = await getPrimaryUser()
        if (primary) await loadAiMode(primary.id)
      } catch (e) {
        if (!cancelled) {
          const message =
            e instanceof Error
              ? e.message
              : typeof e === 'string'
                ? e
                : 'Failed to start AAHAAR'
          console.error('[AAHAAR] bootstrap failed', e)
          setError(message)
        }
      } finally {
        if (!cancelled) setReady(true)
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap once
  }, [])

  return { ready, user, profile, error, refresh }
}
