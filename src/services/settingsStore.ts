import type { ConnectionSettings, ProviderId, ProviderPreset } from '../types'

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'gmail',
    label: 'Gmail',
    description: 'Google Workspace or personal Gmail via secure sign-in',
    authMode: 'oauth',
    hint: 'Uses Google OAuth with read-only Gmail access.',
  },
  {
    id: 'outlook',
    label: 'Outlook',
    description: 'Outlook.com, Hotmail, or Microsoft 365',
    authMode: 'oauth',
    hint: 'Uses Microsoft sign-in with read-only mail access.',
  },
  {
    id: 'yahoo',
    label: 'Yahoo Mail',
    description: 'Connect with your Yahoo address and an app password',
    authMode: 'imap',
    imapHost: 'imap.mail.yahoo.com',
    imapPort: 993,
    imapSecure: true,
    hint: 'Create a Yahoo app password, then paste it below.',
  },
  {
    id: 'icloud',
    label: 'iCloud Mail',
    description: 'Apple iCloud email via IMAP',
    authMode: 'imap',
    imapHost: 'imap.mail.me.com',
    imapPort: 993,
    imapSecure: true,
    hint: 'Use an Apple app-specific password from appleid.apple.com.',
  },
  {
    id: 'zoho',
    label: 'Zoho Mail',
    description: 'Zoho personal or organization mail',
    authMode: 'imap',
    imapHost: 'imap.zoho.com',
    imapPort: 993,
    imapSecure: true,
  },
  {
    id: 'custom',
    label: 'Any other email',
    description: 'Custom IMAP host for work, school, or ISP mail',
    authMode: 'imap',
    imapHost: '',
    imapPort: 993,
    imapSecure: true,
    hint: 'Ask your IT team for IMAP host and port if you are unsure.',
  },
]

export function getProvider(id: ProviderId): ProviderPreset {
  return PROVIDER_PRESETS.find((p) => p.id === id) ?? PROVIDER_PRESETS[0]
}

export const DEFAULT_SETTINGS: ConnectionSettings = {
  providerId: 'gmail',
  email: '',
  password: '',
  imapHost: '',
  imapPort: 993,
  imapSecure: true,
  googleClientId: '',
  microsoftClientId: '',
  notificationsEnabled: true,
  browserNotifications: true,
  pollIntervalSec: 60,
}

const SETTINGS_KEY = 'fold-connection-settings'

export function loadSettings(): ConnectionSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<ConnectionSettings>) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: ConnectionSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function settingsForProvider(
  current: ConnectionSettings,
  providerId: ProviderId,
): ConnectionSettings {
  const preset = getProvider(providerId)
  return {
    ...current,
    providerId,
    imapHost: preset.imapHost ?? (providerId === 'custom' ? current.imapHost : ''),
    imapPort: preset.imapPort ?? 993,
    imapSecure: preset.imapSecure ?? true,
  }
}

export function hasUsableConnection(settings: ConnectionSettings): boolean {
  const provider = getProvider(settings.providerId)
  if (provider.authMode === 'oauth') {
    if (settings.providerId === 'gmail') {
      const id = settings.googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
      return Boolean(id && !id.includes('your-client-id'))
    }
    if (settings.providerId === 'outlook') {
      const id = settings.microsoftClientId || import.meta.env.VITE_MICROSOFT_CLIENT_ID || ''
      return Boolean(id && !id.includes('your-client-id'))
    }
  }
  return Boolean(settings.email && settings.password && settings.imapHost && settings.imapPort)
}
