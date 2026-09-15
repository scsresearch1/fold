import { useCallback, useEffect, useState } from 'react'
import type { ConnectionSettings } from '../types'
import {
  DEFAULT_SETTINGS,
  getProvider,
  hasUsableConnection,
  loadSettings,
  saveSettings,
  settingsForProvider,
} from '../services/settingsStore'
import type { ProviderId } from '../types'

export function useSettings() {
  const [settings, setSettings] = useState<ConnectionSettings>(DEFAULT_SETTINGS)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const stored = loadSettings()
    const envGoogle = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
    const envMs = import.meta.env.VITE_MICROSOFT_CLIENT_ID || ''
    setSettings({
      ...stored,
      googleClientId: stored.googleClientId || (envGoogle.includes('your-client-id') ? '' : envGoogle),
      microsoftClientId:
        stored.microsoftClientId || (envMs.includes('your-client-id') ? '' : envMs),
    })
  }, [])

  const update = useCallback((patch: Partial<ConnectionSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  const selectProvider = useCallback((providerId: ProviderId) => {
    setSettings((prev) => settingsForProvider(prev, providerId))
  }, [])

  const persist = useCallback(
    (next?: ConnectionSettings) => {
      const value = next ?? settings
      saveSettings(value)
      setSettings(value)
      return value
    },
    [settings],
  )

  const provider = getProvider(settings.providerId)
  const ready = hasUsableConnection(settings)

  return {
    settings,
    provider,
    ready,
    open,
    setOpen,
    update,
    selectProvider,
    persist,
  }
}
