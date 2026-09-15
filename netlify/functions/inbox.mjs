import { fetchInboxMessages } from '../../server/fetchInbox.mjs'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
    body: JSON.stringify(body),
  }
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' }
  }

  if (event.httpMethod === 'GET') {
    return json(200, { ok: true, runtime: 'netlify' })
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  try {
    const payload = JSON.parse(event.body || '{}')
    const messages = await fetchInboxMessages(payload)
    return json(200, { messages })
  } catch (err) {
    const status = err?.statusCode || 502
    return json(status, {
      error: err instanceof Error ? err.message : 'IMAP connection failed',
    })
  }
}
