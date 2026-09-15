import cors from 'cors'
import express from 'express'
import { ImapFlow } from 'imapflow'

const PORT = Number(process.env.IMAP_PORT || 8787)
const app = express()

app.use(cors({ origin: true }))
app.use(express.json({ limit: '1mb' }))

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

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/inbox', async (req, res) => {
  const {
    host,
    port = 993,
    secure = true,
    user,
    password,
    maxResults = 20,
  } = req.body || {}

  if (!host || !user || !password) {
    res.status(400).json({ error: 'IMAP host, email, and password are required.' })
    return
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
    res.json({ messages })
  } catch (err) {
    try {
      await client.logout()
    } catch {
      // ignore logout errors after failure
    }
    const message = err instanceof Error ? err.message : 'IMAP connection failed'
    res.status(502).json({ error: message })
  }
})

app.listen(PORT, () => {
  console.log(`Fold IMAP bridge listening on http://localhost:${PORT}`)
})
