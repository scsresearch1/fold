export type ActionVerb =
  | 'Reply'
  | 'Review'
  | 'Confirm'
  | 'Send'
  | 'Schedule'
  | 'Decide'
  | 'Follow up'
  | 'Read'

export type Task = {
  id: string
  title: string
  summary: string
  verb: ActionVerb
  originalSubject: string
  from: string
  date: string
  completed: boolean
  threadId?: string
}

export type GmailHeader = {
  name: string
  value: string
}

export type GmailMessage = {
  id: string
  threadId: string
  snippet: string
  payload?: {
    headers?: GmailHeader[]
  }
  internalDate?: string
}

export type ProviderId =
  | 'gmail'
  | 'outlook'
  | 'yahoo'
  | 'icloud'
  | 'zoho'
  | 'custom'

export type AuthMode = 'oauth' | 'imap'

export type ProviderPreset = {
  id: ProviderId
  label: string
  description: string
  authMode: AuthMode
  imapHost?: string
  imapPort?: number
  imapSecure?: boolean
  hint?: string
}

export type ConnectionSettings = {
  providerId: ProviderId
  email: string
  /** App password or account password for IMAP providers */
  password: string
  imapHost: string
  imapPort: number
  imapSecure: boolean
  googleClientId: string
  microsoftClientId: string
  /** Show in-app alerts when new email tasks arrive */
  notificationsEnabled: boolean
  /** Also push system/browser notifications */
  browserNotifications: boolean
  /** How often to check for new mail while connected (seconds) */
  pollIntervalSec: number
}

export type AppNotification = {
  id: string
  taskId: string
  title: string
  body: string
  verb: ActionVerb
  from: string
  createdAt: string
  read: boolean
}

export type RawEmail = {
  id: string
  subject: string
  snippet: string
  from: string
  date: string
  threadId?: string
}
