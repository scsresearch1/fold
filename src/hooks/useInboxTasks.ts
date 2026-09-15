import { useCallback, useEffect, useRef, useState } from 'react'
import type { ConnectionSettings, Task } from '../types'
import { DEMO_TASKS } from '../services/demoEmails'
import { mergeMailboxTasks } from '../services/emailToTasks'
import { fetchInboxTasks, requestAccessToken } from '../services/gmail'
import { fetchImapInbox } from '../services/imapApi'
import { fetchOutlookInbox, requestOutlookToken } from '../services/outlook'
import { getProvider, hasUsableConnection } from '../services/settingsStore'
import { translateEmailToAction } from '../services/actionItems'

const DEMO_ARRIVALS = [
  {
    subject: 'Re: Contract redlines',
    snippet: 'Can you review section 4 overnight and send comments before standup?',
    from: 'Sam Okoye',
  },
  {
    subject: 'Shipping label ready',
    snippet: 'Please confirm the warehouse pickup window for tomorrow morning.',
    from: 'Ops Desk',
  },
  {
    subject: 'Customer escalation',
    snippet: 'Reply to the Acme thread with an ETA so support can close the ticket.',
    from: 'Nora Patel',
  },
]

function resolveGoogleClientId(settings: ConnectionSettings) {
  return settings.googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
}

function resolveMicrosoftClientId(settings: ConnectionSettings) {
  return settings.microsoftClientId || import.meta.env.VITE_MICROSOFT_CLIENT_ID || ''
}

async function fetchFromProvider(settings: ConnectionSettings, token?: string | null) {
  const provider = getProvider(settings.providerId)

  if (provider.authMode === 'imap') {
    return { tasks: await fetchImapInbox(settings), token: null as string | null }
  }

  if (settings.providerId === 'gmail') {
    const clientId = resolveGoogleClientId(settings)
    const accessToken = token || (await requestAccessToken(clientId))
    return { tasks: await fetchInboxTasks(accessToken), token: accessToken }
  }

  if (settings.providerId === 'outlook') {
    const clientId = resolveMicrosoftClientId(settings)
    const accessToken = token || (await requestOutlookToken(clientId))
    return { tasks: await fetchOutlookInbox(accessToken), token: accessToken }
  }

  throw new Error('Unsupported email provider')
}

function makeDemoArrival(index: number): Task {
  const sample = DEMO_ARRIVALS[index % DEMO_ARRIVALS.length]
  const id = `demo-live-${Date.now()}-${index}`
  const action = translateEmailToAction({
    subject: sample.subject,
    snippet: sample.snippet,
    from: sample.from,
  })

  return {
    id,
    title: action.title,
    summary: action.summary,
    verb: action.verb,
    originalSubject: action.originalSubject,
    from: sample.from,
    date: new Date().toISOString(),
    completed: false,
  }
}

type UseInboxTasksOptions = {
  settings: ConnectionSettings
  onNewTasks?: (tasks: Task[]) => void
}

export function useInboxTasks({ settings, onNewTasks }: UseInboxTasksOptions) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [usingDemo, setUsingDemo] = useState(false)
  const [activeLabel, setActiveLabel] = useState('Demo')
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null)

  const seenIdsRef = useRef<Set<string>>(new Set())
  const baselineReadyRef = useRef(false)
  const demoArrivalRef = useRef(0)
  const onNewTasksRef = useRef(onNewTasks)
  onNewTasksRef.current = onNewTasks

  const announceNew = useCallback((incoming: Task[]) => {
    const openIncoming = incoming.filter((task) => !task.completed)

    if (!baselineReadyRef.current) {
      for (const task of openIncoming) seenIdsRef.current.add(task.id)
      baselineReadyRef.current = true
      return
    }

    const fresh = openIncoming.filter((task) => !seenIdsRef.current.has(task.id))
    for (const task of fresh) seenIdsRef.current.add(task.id)
    if (fresh.length > 0) {
      onNewTasksRef.current?.(fresh)
    }
  }, [])

  const applyMailboxSync = useCallback(
    (incoming: Task[], options?: { replace?: boolean }) => {
      setTasks((prev) => (options?.replace ? incoming : mergeMailboxTasks(prev, incoming)))
      announceNew(incoming.filter((task) => !task.completed))
      setLastCheckedAt(new Date().toISOString())
    },
    [announceNew],
  )

  const loadDemo = useCallback(() => {
    seenIdsRef.current = new Set()
    baselineReadyRef.current = false
    demoArrivalRef.current = 0
    setUsingDemo(true)
    setConnected(true)
    setError(null)
    setActiveLabel('Demo inbox')
    applyMailboxSync(DEMO_TASKS, { replace: true })
  }, [applyMailboxSync])

  const connect = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      if (!hasUsableConnection(settings)) {
        throw new Error('Open Settings and connect an email account first.')
      }

      seenIdsRef.current = new Set()
      baselineReadyRef.current = false

      const provider = getProvider(settings.providerId)
      const result = await fetchFromProvider(settings)
      setToken(result.token)
      setUsingDemo(false)
      setConnected(true)
      setActiveLabel(
        settings.email ? `${provider.label} · ${settings.email}` : provider.label,
      )
      applyMailboxSync(result.tasks, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect to email')
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }, [applyMailboxSync, settings])

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      if (usingDemo) {
        if (!options?.silent) {
          const arrival = makeDemoArrival(demoArrivalRef.current++)
          setTasks((prev) => {
            const next = mergeMailboxTasks(prev, [arrival])
            announceNew([arrival])
            return next
          })
          setLastCheckedAt(new Date().toISOString())
        } else if (demoArrivalRef.current < DEMO_ARRIVALS.length) {
          const arrival = makeDemoArrival(demoArrivalRef.current++)
          setTasks((prev) => {
            const next = mergeMailboxTasks(prev, [arrival])
            announceNew([arrival])
            return next
          })
          setLastCheckedAt(new Date().toISOString())
        } else {
          setLastCheckedAt(new Date().toISOString())
        }
        return
      }

      if (!options?.silent) setLoading(true)
      setError(null)
      try {
        const result = await fetchFromProvider(settings, token)
        setToken(result.token)
        applyMailboxSync(result.tasks)
      } catch (err) {
        if (!options?.silent) {
          setError(err instanceof Error ? err.message : 'Refresh failed')
        }
      } finally {
        if (!options?.silent) setLoading(false)
      }
    },
    [announceNew, applyMailboxSync, settings, token, usingDemo],
  )

  // Fast watch for new unread mail while connected
  useEffect(() => {
    if (!connected) return

    const seconds = Math.max(8, settings.pollIntervalSec || 10)
    const id = window.setInterval(() => {
      void refresh({ silent: true })
    }, seconds * 1000)

    return () => window.clearInterval(id)
  }, [connected, refresh, settings.pollIntervalSec])

  // Check immediately when the tab becomes visible / focused
  useEffect(() => {
    if (!connected) return

    const kick = () => {
      if (document.visibilityState === 'visible') {
        void refresh({ silent: true })
      }
    }

    document.addEventListener('visibilitychange', kick)
    window.addEventListener('focus', kick)
    return () => {
      document.removeEventListener('visibilitychange', kick)
      window.removeEventListener('focus', kick)
    }
  }, [connected, refresh])

  const toggleTask = useCallback((id: string) => {
    // Local mark complete ≈ "I've handled / read this"
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)),
    )
  }, [])

  const clearCompleted = useCallback(() => {
    setTasks((prev) => prev.filter((task) => !task.completed))
  }, [])

  const disconnect = useCallback(() => {
    setConnected(false)
    setUsingDemo(false)
    setToken(null)
    setError(null)
    setTasks([])
    setLastCheckedAt(null)
    seenIdsRef.current = new Set()
    baselineReadyRef.current = false
    demoArrivalRef.current = 0
  }, [])

  return {
    tasks,
    connected,
    loading,
    error,
    usingDemo,
    activeLabel,
    lastCheckedAt,
    ready: hasUsableConnection(settings),
    connect,
    loadDemo,
    refresh: () => refresh({ silent: false }),
    toggleTask,
    clearCompleted,
    disconnect,
  }
}
