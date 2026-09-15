import { useCallback, useState } from 'react'
import { Landing } from './components/Landing'
import { NotificationCenter } from './components/NotificationCenter'
import { NotificationToasts } from './components/NotificationToasts'
import { SettingsPanel } from './components/SettingsPanel'
import { TaskList } from './components/TaskList'
import { Workspace } from './components/Workspace'
import { useInboxTasks } from './hooks/useInboxTasks'
import { useNotifications } from './hooks/useNotifications'
import { useSettings } from './hooks/useSettings'
import { ensureNotificationPermission } from './services/notifications'
import type { Task } from './types'
import './App.css'

export default function App() {
  const {
    settings,
    provider,
    ready,
    open: settingsOpen,
    setOpen: setSettingsOpen,
    update,
    selectProvider,
    persist,
  } = useSettings()

  const {
    items: notifications,
    toasts,
    unreadCount,
    panelOpen,
    setPanelOpen,
    notifyNewTasks,
    markAllRead,
    markRead,
    clearAll,
    dismissToast,
  } = useNotifications({
    enabled: settings.notificationsEnabled,
    browserEnabled: settings.browserNotifications,
  })

  const handleNewTasks = useCallback(
    (fresh: Task[]) => {
      void notifyNewTasks(fresh)
    },
    [notifyNewTasks],
  )

  const {
    tasks,
    connected,
    loading,
    error,
    usingDemo,
    activeLabel,
    lastCheckedAt,
    connect,
    loadDemo,
    refresh,
    toggleTask,
    clearCompleted,
    disconnect,
  } = useInboxTasks({ settings, onNewTasks: handleNewTasks })

  const [savedFlash, setSavedFlash] = useState(false)
  const doneCount = tasks.filter((t) => t.completed).length

  const handleSaveSettings = async () => {
    persist()
    if (settings.notificationsEnabled && settings.browserNotifications) {
      await ensureNotificationPermission()
    }
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1800)
  }

  return (
    <div className="app-shell">
      <div className="bg-orb orb-a" aria-hidden="true" />
      <div className="bg-orb orb-b" aria-hidden="true" />
      <div className="bg-grain" aria-hidden="true" />

      <div className="top-actions">
        {connected && (
          <NotificationCenter
            open={panelOpen}
            items={notifications}
            unreadCount={unreadCount}
            onToggle={() => setPanelOpen((v) => !v)}
            onClose={() => setPanelOpen(false)}
            onMarkAllRead={markAllRead}
            onMarkRead={markRead}
            onClear={clearAll}
          />
        )}

        <button
          type="button"
          className="settings-trigger"
          onClick={() => setSettingsOpen(true)}
          aria-label="Open email settings"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
              stroke="currentColor"
              strokeWidth="1.7"
            />
            <path
              d="M19.4 13.5a7.6 7.6 0 0 0 .1-1.5 7.6 7.6 0 0 0-.1-1.5l2-1.6-2-3.4-2.4 1a7.2 7.2 0 0 0-2.6-1.5L14 2h-4l-.4 2.5a7.2 7.2 0 0 0-2.6 1.5l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0-.1 1.5c0 .5 0 1 .1 1.5l-2 1.6 2 3.4 2.4-1a7.2 7.2 0 0 0 2.6 1.5L10 22h4l.4-2.5a7.2 7.2 0 0 0 2.6-1.5l2.4 1 2-3.4-2-1.6Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
          Settings
        </button>
      </div>

      {savedFlash && <p className="save-toast">Connection saved</p>}

      <NotificationToasts toasts={toasts} onDismiss={dismissToast} />

      <main className="app-main">
        {!connected ? (
          <Landing
            loading={loading}
            error={error}
            ready={ready}
            providerLabel={provider.label}
            onConnect={connect}
            onDemo={loadDemo}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        ) : (
          <Workspace
            usingDemo={usingDemo}
            activeLabel={activeLabel}
            loading={loading}
            doneCount={doneCount}
            totalCount={tasks.length}
            lastCheckedAt={lastCheckedAt}
            notificationsOn={settings.notificationsEnabled}
            onRefresh={refresh}
            onClearCompleted={clearCompleted}
            onSignOut={disconnect}
            onOpenSettings={() => setSettingsOpen(true)}
          >
            {error && <p className="error-banner workspace-error" role="alert">{error}</p>}
            <TaskList tasks={tasks} onToggle={toggleTask} />
          </Workspace>
        )}
      </main>

      <SettingsPanel
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onChange={update}
        onSelectProvider={selectProvider}
        onSave={() => {
          void handleSaveSettings()
        }}
      />
    </div>
  )
}
