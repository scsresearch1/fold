import type { ConnectionSettings, RawEmail } from '../types'
import { rawEmailsToTasks } from './emailToTasks'
import type { Task } from '../types'

export async function fetchImapInbox(settings: ConnectionSettings, maxResults = 20): Promise<Task[]> {
  const res = await fetch('/api/inbox', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host: settings.imapHost,
      port: settings.imapPort,
      secure: settings.imapSecure,
      user: settings.email,
      password: settings.password,
      maxResults,
    }),
  })

  const data = (await res.json()) as { error?: string; messages?: RawEmail[] }
  if (!res.ok) {
    throw new Error(data.error || `IMAP fetch failed (${res.status})`)
  }

  return rawEmailsToTasks(data.messages ?? [])
}
