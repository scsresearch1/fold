import cors from 'cors'
import express from 'express'
import { fetchInboxMessages } from './fetchInbox.mjs'

const PORT = Number(process.env.IMAP_PORT || 8787)
const app = express()

app.use(cors({ origin: true }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, runtime: 'local' })
})

app.post('/api/inbox', async (req, res) => {
  try {
    const messages = await fetchInboxMessages(req.body || {})
    res.json({ messages })
  } catch (err) {
    const status = err?.statusCode || 502
    res.status(status).json({
      error: err instanceof Error ? err.message : 'IMAP connection failed',
    })
  }
})

app.listen(PORT, () => {
  console.log(`Fold IMAP bridge listening on http://localhost:${PORT}`)
})
