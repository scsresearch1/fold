import type { GmailHeader, GmailMessage, RawEmail, Task } from '../types'
import { rawEmailsToTasks } from './emailToTasks'

const GIS_SRC = 'https://accounts.google.com/gsi/client'
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me'
const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly'

let gisPromise: Promise<void> | null = null

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (existing) {
      if (window.google?.accounts?.oauth2) {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () =>
        reject(new Error('Failed to load Google Identity Services')),
      )
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(script)
  })
}

export function loadGoogleIdentity(): Promise<void> {
  if (!gisPromise) {
    gisPromise = loadScript(GIS_SRC)
  }
  return gisPromise
}

export function requestAccessToken(clientId: string): Promise<string> {
  return loadGoogleIdentity().then(
    () =>
      new Promise<string>((resolve, reject) => {
        if (!window.google?.accounts?.oauth2) {
          reject(new Error('Google Identity Services unavailable'))
          return
        }

        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: GMAIL_SCOPE,
          callback: (response: google.accounts.oauth2.TokenResponse) => {
            if (response.error || !response.access_token) {
              reject(new Error(response.error_description || response.error || 'Auth failed'))
              return
            }
            resolve(response.access_token)
          },
          error_callback: (error: google.accounts.oauth2.ClientConfigError) => {
            reject(new Error(error.message || 'Auth cancelled'))
          },
        })

        client.requestAccessToken({ prompt: 'consent' })
      }),
  )
}

function headerValue(headers: GmailHeader[] | undefined, name: string): string {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''
}

function decodeFrom(raw: string): string {
  const match = raw.match(/"?([^"<]+)"?\s*<.+>/)
  return (match?.[1] || raw || 'Unknown').trim()
}

async function threadHasSentReply(
  accessToken: string,
  threadId: string,
  cache: Map<string, boolean>,
): Promise<boolean> {
  if (cache.has(threadId)) return cache.get(threadId) as boolean

  const res = await fetch(`${GMAIL_API}/threads/${threadId}?format=minimal`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    cache.set(threadId, false)
    return false
  }

  const data = (await res.json()) as { messages?: { labelIds?: string[] }[] }
  const replied = (data.messages ?? []).some((m) => m.labelIds?.includes('SENT'))
  cache.set(threadId, replied)
  return replied
}

function toRawEmail(message: GmailMessage, replied: boolean): RawEmail {
  const headers = message.payload?.headers
  const subject = headerValue(headers, 'Subject') || '(No subject)'
  const from = decodeFrom(headerValue(headers, 'From'))
  const dateHeader = headerValue(headers, 'Date')
  const date =
    dateHeader ||
    (message.internalDate
      ? new Date(Number(message.internalDate)).toISOString()
      : new Date().toISOString())
  const unread = message.labelIds?.includes('UNREAD') ?? true

  return {
    id: message.id,
    threadId: message.threadId,
    subject,
    snippet: message.snippet || '',
    from,
    date,
    unread,
    replied,
  }
}

/** Only unread inbox mail becomes open tasks; replied threads are marked done. */
export async function fetchInboxTasks(accessToken: string, maxResults = 30): Promise<Task[]> {
  const listRes = await fetch(
    `${GMAIL_API}/messages?maxResults=${maxResults}&labelIds=INBOX&q=${encodeURIComponent('in:inbox is:unread')}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  )

  if (!listRes.ok) {
    const body = await listRes.text()
    throw new Error(`Gmail list failed (${listRes.status}): ${body}`)
  }

  const listData = (await listRes.json()) as { messages?: { id: string; threadId?: string }[] }
  const ids = listData.messages?.map((m) => m.id) ?? []

  if (ids.length === 0) return []

  const threadCache = new Map<string, boolean>()

  const emails = await Promise.all(
    ids.map(async (id) => {
      const res = await fetch(
        `${GMAIL_API}/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      )
      if (!res.ok) throw new Error(`Failed to load message ${id}`)
      const message = (await res.json()) as GmailMessage
      const replied = message.threadId
        ? await threadHasSentReply(accessToken, message.threadId, threadCache)
        : false
      return toRawEmail(message, replied)
    }),
  )

  return rawEmailsToTasks(emails)
}
