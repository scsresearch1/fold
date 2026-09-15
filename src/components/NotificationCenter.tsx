import type { AppNotification } from '../types'

type NotificationCenterProps = {
  open: boolean
  items: AppNotification[]
  unreadCount: number
  onToggle: () => void
  onMarkAllRead: () => void
  onMarkRead: (id: string) => void
  onClear: () => void
  onClose: () => void
}

export function NotificationCenter({
  open,
  items,
  unreadCount,
  onToggle,
  onMarkAllRead,
  onMarkRead,
  onClear,
  onClose,
}: NotificationCenterProps) {
  return (
    <div className="notif-root">
      <button
        type="button"
        className="notif-bell"
        onClick={onToggle}
        aria-label={unreadCount ? `${unreadCount} unread notifications` : 'Notifications'}
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-panel" role="dialog" aria-label="Notifications">
          <header className="notif-panel-head">
            <div>
              <p className="settings-eyebrow">Live</p>
              <h3>New email tasks</h3>
            </div>
            <button type="button" className="btn btn-ghost sm" onClick={onClose}>
              Close
            </button>
          </header>

          <div className="notif-panel-actions">
            <button type="button" className="text-link" onClick={onMarkAllRead} disabled={!unreadCount}>
              Mark all read
            </button>
            <button type="button" className="text-link" onClick={onClear} disabled={items.length === 0}>
              Clear
            </button>
          </div>

          {items.length === 0 ? (
            <p className="notif-empty">No new task alerts yet. Fold watches your inbox while you stay connected.</p>
          ) : (
            <ul className="notif-list">
              {items.map((item) => (
                <li key={item.id} className={`notif-item ${item.read ? 'is-read' : ''}`}>
                  <button type="button" onClick={() => onMarkRead(item.id)}>
                    <span className="notif-item-meta">
                      <span className={`verb-chip verb-${item.verb.toLowerCase().replace(/\s+/g, '-')}`}>
                        {item.verb}
                      </span>
                      <span>{item.from}</span>
                    </span>
                    <strong>{item.body}</strong>
                    <span className="notif-item-time">
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
