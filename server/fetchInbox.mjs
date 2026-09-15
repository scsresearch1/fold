import { ImapFlow } from 'imapflow'

function decodeAddress(value) {
  if (!value) return 'Unknown'
  if (typeof value === 'string') return value
  if (Array.isArray(value) && value[0]) {
    const entry = value[0]
    return entry.name || entry.address || 'Unknown'
  }
  if (value.name || value.address) return value.name || value.address
  return 'Unknown'
}

/**
 * Fetch unread INBOX messages over IMAP.
 * Shared by the local Express bridge and the Netlify Function.
 */
export async function fetchInboxMessages({
  host,
  port = 993,
  secure = true,
  user,
  password,
  maxResults = 30,
}) {
  if (!host || !user || !password) {
    const error = new Error('IMAP host, email, and password are required.')
    error.statusCode = 400
    throw error
  }

  const client = new ImapFlow({
    host,
    port: Number(port),
    secure: Boolean(secure),
    auth: { user, pass: password },
    logger: false,
  })

  try {
    await client.connect()
    const lock = await client.getMailboxLock('INBOX')
    const messages = []

    try {
      const unreadUids = await client.search({ seen: false }, { uid: true })
      const selected = unreadUids.slice(-Number(maxResults))

      if (selected.length > 0) {
        for await (const msg of client.fetch(
          selected,
          {
            uid: true,
            flags: true,
            envelope: true,
            source: { start: 0, maxLength: 1500 },
          },
          { uid: true },
        )) {
          const subject = msg.envelope?.subject || '(No subject)'
          const from = decodeAddress(msg.envelope?.from)
          const date = msg.envelope?.date
            ? new Date(msg.envelope.date).toISOString()
            : new Date().toISOString()
          const snippet = (msg.source?.toString('utf8') || '')
            .replace(/\r/g, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/=\?.*?\?=/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 220)
          const flags = msg.flags || new Set()
          const unread = !flags.has('\\Seen')

          messages.push({
            id: String(msg.uid),
            subject,
            from,
            date,
            snippet,
            unread,
            replied: false,
          })
        }
      }
    } finally {
      lock.release()
    }

    await client.logout()
    messages.reverse()
    return messages
  } catch (err) {
    try {
      await client.logout()
    } catch {
      // ignore logout errors after failure
    }
    if (err?.statusCode) throw err
    const error = new Error(err instanceof Error ? err.message : 'IMAP connection failed')
    error.statusCode = 502
    throw error
  }
}
