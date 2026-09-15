import { useCallback, useState } from 'react'
import type { AppNotification, Task } from '../types'
import {
  ensureNotificationPermission,
  pushBrowserNotifications,
  tasksToNotifications,
} from '../services/notifications'

const MAX_ITEMS = 40

export function useNotifications(options: {
  enabled: boolean
  browserEnabled: boolean
}) {
  const [items, setItems] = useState<AppNotification[]>([])
  const [toasts, setToasts] = useState<AppNotification[]>([])
  const [panelOpen, setPanelOpen] = useState(false)

  const unreadCount = items.filter((n) => !n.read).length

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const notifyNewTasks = useCallback(
    async (tasks: Task[]) => {
      if (!options.enabled || tasks.length === 0) return

      if (options.browserEnabled) {
        await ensureNotificationPermission()
      }

      const created = tasksToNotifications(tasks)
      setItems((prev) => [...created, ...prev].slice(0, MAX_ITEMS))
      setToasts((prev) => [...created, ...prev].slice(0, 4))

      pushBrowserNotifications(created, options.browserEnabled)

      for (const item of created) {
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== item.id))
        }, 6500)
      }
    },
    [options.browserEnabled, options.enabled],
  )

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const markRead = useCallback((id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const clearAll = useCallback(() => {
    setItems([])
    setToasts([])
  }, [])

  return {
    items,
    toasts,
    unreadCount,
    panelOpen,
    setPanelOpen,
    notifyNewTasks,
    markAllRead,
    markRead,
    clearAll,
    dismissToast,
  }
}
