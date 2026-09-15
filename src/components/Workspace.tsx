import type { ReactNode } from 'react'
import { APP_NAME } from '../config'

type WorkspaceProps = {
  activeLabel: string
  loading: boolean
  doneCount: number
  totalCount: number
  lastCheckedAt: string | null
  notificationsOn: boolean
  onRefresh: () => void
  onClearCompleted: () => void
  onSignOut: () => void
  children: ReactNode
}

export function Workspace({
  activeLabel,
  loading,
  doneCount,
  totalCount,
  lastCheckedAt,
  notificationsOn,
  onRefresh,
  onClearCompleted,
  onSignOut,
  children,
}: WorkspaceProps) {
  const progress = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100)
  const checkedLabel = lastCheckedAt
    ? `Checked ${new Date(lastCheckedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Waiting for first check'

  return (
    <section className="workspace">
      <header className="workspace-top">
        <div className="workspace-brand">
          <span className="brand-mark compact">{APP_NAME}</span>
          <span className="connection-pill">{activeLabel}</span>
        </div>

        <div className="workspace-actions">
          <button className="btn btn-ghost sm" onClick={onRefresh} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            className="btn btn-ghost sm"
            onClick={onClearCompleted}
            disabled={doneCount === 0}
          >
            Clear done
          </button>
          <button className="btn btn-ghost sm" onClick={onSignOut}>
            Back
          </button>
        </div>
      </header>

      <div className="progress-block">
        <div className="progress-copy">
          <h2>Unread action items</h2>
          <p>
            {doneCount} of {totalCount} complete
          </p>
        </div>
        <div className="progress-track" aria-hidden="true">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="watch-line">
          {notificationsOn
            ? `Watching unread mail · new tasks appear instantly on check · ${checkedLabel}`
            : `Syncing unread mail · ${checkedLabel}`}
        </p>
      </div>

      {children}
    </section>
  )
}
