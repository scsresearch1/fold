import { useCallback, useEffect, useRef, useState } from 'react'
import type { ConnectionSettings, Task } from '../types'
import { DEMO_TASKS } from '../services/demoEmails'
import { fetchInboxTasks, requestAccessToken } from '../services/gmail'
import { fetchImapInbox } from '../services/imapApi'
import { fetchOutlookInbox, requestOutlookToken } from '../services/outlook'
import { getProvider, hasUsableConnection } from '../services/settingsStore'
import { translateEmailToAction } from '../services/actionItems'

const STORAGE_KEY = 'fold-task-completions'

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

function loadCompletions(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Record<string, boolean>
  } catch {
    return {}
  }
}

function saveCompletions(map: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

function withSavedState(tasks: Omit<Task, 'completed'>[]): Task[] {
  const saved = loadCompletions()
  return tasks.map((task) => ({
    ...task,
    completed: Boolean(saved[task.id]),
  }))
}

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
    if (!baselineReadyRef.current) {
      for (const task of incoming) seenIdsRef.current.add(task.id)
      baselineReadyRef.current = true
      return
    }

    const fresh = incoming.filter((task) => !seenIdsRef.current.has(task.id))
    for (const task of fresh) seenIdsRef.current.add(task.id)
    if (fresh.length > 0) {
      onNewTasksRef.current?.(fresh)
    }
  }, [])

  const applyTasks = useCallback(
    (next: Omit<Task, 'completed'>[], options?: { merge?: boolean }) => {
      const hydrated = withSavedState(next)
      setTasks((prev) => {
        if (!options?.merge) return hydrated
        const byId = new Map(prev.map((t) => [t.id, t]))
        for (const task of hydrated) {
          const existing = byId.get(task.id)
          byId.set(task.id, existing ? { ...task, completed: existing.completed } : task)
        }
        return Array.from(byId.values()).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )
      })
      announceNew(hydrated)
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
    applyTasks(DEMO_TASKS)
  }, [applyTasks])

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
      applyTasks(result.tasks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect to email')
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }, [applyTasks, settings])

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      if (usingDemo) {
        if (!options?.silent) {
          // Manual refresh on demo: inject a simulated new email task
          const arrival = makeDemoArrival(demoArrivalRef.current++)
          setTasks((prev) => {
            const next = [arrival, ...prev]
            announceNew([arrival])
            return next
          })
          setLastCheckedAt(new Date().toISOString())
        } else {
          // Silent poll on demo occasionally adds a new task so notifications are visible
          if (demoArrivalRef.current < DEMO_ARRIVALS.length) {
            const arrival = makeDemoArrival(demoArrivalRef.current++)
            setTasks((prev) => {
              const next = [arrival, ...prev]
              announceNew([arrival])
              return next
            })
            setLastCheckedAt(new Date().toISOString())
          } else {
            setLastCheckedAt(new Date().toISOString())
          }
        }
        return
      }

      if (!options?.silent) setLoading(true)
      setError(null)
      try {
        const result = await fetchFromProvider(settings, token)
        setToken(result.token)
        applyTasks(result.tasks)
      } catch (err) {
        if (!options?.silent) {
          setError(err instanceof Error ? err.message : 'Refresh failed')
        }
      } finally {
        if (!options?.silent) setLoading(false)
      }
    },
    [announceNew, applyTasks, settings, token, usingDemo],
  )

  useEffect(() => {
    if (!connected || !settings.notificationsEnabled) return

    const seconds = Math.max(20, settings.pollIntervalSec || 60)
    const id = window.setInterval(() => {
      void refresh({ silent: true })
    }, seconds * 1000)

    return () => window.clearInterval(id)
  }, [connected, refresh, settings.notificationsEnabled, settings.pollIntervalSec])

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) => {
      const next = prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      )
      const map = Object.fromEntries(next.map((t) => [t.id, t.completed]))
      saveCompletions(map)
      return next
    })
  }, [])

  const clearCompleted = useCallback(() => {
    setTasks((prev) => {
      const next = prev.filter((task) => !task.completed)
      const map = Object.fromEntries(next.map((t) => [t.id, t.completed]))
      saveCompletions(map)
      return next
    })
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
