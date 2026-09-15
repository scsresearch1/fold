import type { AppNotification } from '../types'

type NotificationToastsProps = {
  toasts: AppNotification[]
  onDismiss: (id: string) => void
}

export function NotificationToasts({ toasts, onDismiss }: NotificationToastsProps) {
  if (toasts.length === 0) return null

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <article key={toast.id} className="task-toast">
          <div className="task-toast-copy">
            <p className="task-toast-label">{toast.title}</p>
            <p className="task-toast-body">{toast.body}</p>
            <p className="task-toast-from">{toast.from}</p>
          </div>
          <button
            type="button"
            className="toast-dismiss"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </article>
      ))}
    </div>
  )
}
