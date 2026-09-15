import type { RawEmail, Task } from '../types'
import { rawEmailsToTasks } from './emailToTasks'

const MS_SCOPE = 'https://graph.microsoft.com/Mail.Read offline_access openid profile'
const GRAPH = 'https://graph.microsoft.com/v1.0/me/messages'

let msalPromise: Promise<void> | null = null

function loadMsal(): Promise<void> {
  if (!msalPromise) {
    msalPromise = new Promise((resolve, reject) => {
      const src = 'https://alcdn.msauth.net/browser/2.38.3/js/msal-browser.min.js'
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
      if (existing) {
        existing.addEventListener('load', () => resolve())
        if ((window as unknown as { msal?: unknown }).msal) resolve()
        return
      }
      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Microsoft authentication'))
      document.head.appendChild(script)
    })
  }
  return msalPromise
}

type MsalPublicClient = {
  loginPopup: (req: { scopes: string[] }) => Promise<{ accessToken: string }>
  acquireTokenSilent: (req: {
    scopes: string[]
    account: unknown
  }) => Promise<{ accessToken: string }>
  getAllAccounts: () => unknown[]
}

type MsalNamespace = {
  PublicClientApplication: new (config: {
    auth: { clientId: string; redirectUri: string }
    cache: { cacheLocation: string }
  }) => MsalPublicClient & { initialize?: () => Promise<void> }
}

function getMsal(): MsalNamespace {
  const msal = (window as unknown as { msal?: MsalNamespace }).msal
  if (!msal) throw new Error('Microsoft authentication unavailable')
  return msal
}

let pca: (MsalPublicClient & { initialize?: () => Promise<void> }) | null = null

async function getClient(clientId: string) {
  await loadMsal()
  if (!pca) {
    const msal = getMsal()
    pca = new msal.PublicClientApplication({
      auth: {
        clientId,
        redirectUri: window.location.origin,
      },
      cache: { cacheLocation: 'localStorage' },
    })
    if (pca.initialize) await pca.initialize()
  }
  return pca
}

export async function requestOutlookToken(clientId: string): Promise<string> {
  const client = await getClient(clientId)
  const accounts = client.getAllAccounts()
  try {
    if (accounts[0]) {
      const silent = await client.acquireTokenSilent({
        scopes: MS_SCOPE.split(' '),
        account: accounts[0],
      })
      return silent.accessToken
    }
  } catch {
    // fall through to popup
  }

  const result = await client.loginPopup({ scopes: MS_SCOPE.split(' ') })
  return result.accessToken
}

type GraphMessage = {
  id: string
  subject?: string
  bodyPreview?: string
  isRead?: boolean
  from?: { emailAddress?: { name?: string; address?: string } }
  receivedDateTime?: string
  conversationId?: string
}

/** Unread Outlook mail only; read mail is treated as completed via sync merge. */
export async function fetchOutlookInbox(accessToken: string, maxResults = 30): Promise<Task[]> {
  const filter = encodeURIComponent('isRead eq false')
  const url = `${GRAPH}?$top=${maxResults}&$filter=${filter}&$select=id,subject,bodyPreview,from,receivedDateTime,conversationId,isRead&$orderby=receivedDateTime desc`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Outlook fetch failed (${res.status}): ${body}`)
  }

  const data = (await res.json()) as { value?: GraphMessage[] }
  const emails: RawEmail[] = (data.value ?? []).map((msg) => ({
    id: msg.id,
    subject: msg.subject || '(No subject)',
    snippet: msg.bodyPreview || '',
    from: msg.from?.emailAddress?.name || msg.from?.emailAddress?.address || 'Unknown',
    date: msg.receivedDateTime || new Date().toISOString(),
    threadId: msg.conversationId,
    unread: msg.isRead === false,
    replied: false,
  }))

  return rawEmailsToTasks(emails)
}
