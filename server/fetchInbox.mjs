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
 * Fetch recent INBOX messages over IMAP.
 * Shared by the local Express bridge and the Netlify Function.
 */
export async function fetchInboxMessages({
  host,
  port = 993,
  secure = true,
  user,
  password,
  maxResults = 20,
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
      const total = client.mailbox?.exists || 0
      if (total > 0) {
        const start = Math.max(1, total - Number(maxResults) + 1)
        for await (const msg of client.fetch(`${start}:${total}`, {
          uid: true,
          envelope: true,
          source: { start: 0, maxLength: 1500 },
        })) {
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

          messages.push({
            id: String(msg.uid),
            subject,
            from,
            date,
            snippet,
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
