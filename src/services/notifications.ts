import type { AppNotification, Task } from '../types'
import { APP_NAME } from '../config'

export async function ensureNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission
  }
  return Notification.requestPermission()
}

export function tasksToNotifications(tasks: Task[]): AppNotification[] {
  return tasks.map((task) => ({
    id: `n-${task.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    taskId: task.id,
    title: `New action · ${task.verb}`,
    body: task.title,
    verb: task.verb,
    from: task.from,
    createdAt: new Date().toISOString(),
    read: false,
  }))
}

export function pushBrowserNotifications(
  items: AppNotification[],
  enabled: boolean,
) {
  if (!enabled || typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  for (const item of items.slice(0, 3)) {
    const note = new Notification(`${APP_NAME}: ${item.title}`, {
      body: `${item.from} — ${item.body}`,
      tag: item.taskId,
    })
    window.setTimeout(() => note.close(), 8000)
  }

  if (items.length > 3) {
    new Notification(`${APP_NAME}: ${items.length} new action items`, {
      body: 'Open Fold to review the latest email tasks.',
      tag: 'fold-batch',
    })
  }
}
