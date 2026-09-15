import type { ConnectionSettings, ProviderId } from '../types'
import { PROVIDER_PRESETS, getProvider } from '../services/settingsStore'

type SettingsPanelProps = {
  open: boolean
  settings: ConnectionSettings
  onClose: () => void
  onChange: (patch: Partial<ConnectionSettings>) => void
  onSelectProvider: (id: ProviderId) => void
  onSave: () => void
}

export function SettingsPanel({
  open,
  settings,
  onClose,
  onChange,
  onSelectProvider,
  onSave,
}: SettingsPanelProps) {
  if (!open) return null

  const provider = getProvider(settings.providerId)
  const isOauth = provider.authMode === 'oauth'
  const isImap = provider.authMode === 'imap'

  return (
    <div className="settings-overlay" role="presentation" onClick={onClose}>
      <div
        className="settings-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="settings-head">
          <div>
            <p className="settings-eyebrow">Connection</p>
            <h2 id="settings-title">Email settings</h2>
          </div>
          <button type="button" className="btn btn-ghost sm" onClick={onClose}>
            Close
          </button>
        </header>

        <p className="settings-intro">
          Connect Gmail, Outlook, or any mailbox with IMAP. Fold reads mail only — it never sends
          or deletes messages.
        </p>

        <div className="provider-grid" role="list">
          {PROVIDER_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              role="listitem"
              className={`provider-card ${settings.providerId === preset.id ? 'is-active' : ''}`}
              onClick={() => onSelectProvider(preset.id)}
            >
              <span className="provider-label">{preset.label}</span>
              <span className="provider-desc">{preset.description}</span>
            </button>
          ))}
        </div>

        {provider.hint && <p className="settings-hint">{provider.hint}</p>}

        <div className="settings-fields">
          {isOauth && settings.providerId === 'gmail' && (
            <label className="field">
              <span>Google OAuth Client ID</span>
              <input
                type="text"
                value={settings.googleClientId}
                onChange={(e) => onChange({ googleClientId: e.target.value.trim() })}
                placeholder="xxxx.apps.googleusercontent.com"
                autoComplete="off"
              />
            </label>
          )}

          {isOauth && settings.providerId === 'outlook' && (
            <label className="field">
              <span>Microsoft App (Client) ID</span>
              <input
                type="text"
                value={settings.microsoftClientId}
                onChange={(e) => onChange({ microsoftClientId: e.target.value.trim() })}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                autoComplete="off"
              />
            </label>
          )}

          {isImap && (
            <>
              <label className="field">
                <span>Email address</span>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => onChange({ email: e.target.value.trim() })}
                  placeholder="you@example.com"
                  autoComplete="username"
                />
              </label>

              <label className="field">
                <span>Password / app password</span>
                <input
                  type="password"
                  value={settings.password}
                  onChange={(e) => onChange({ password: e.target.value })}
                  placeholder="App password recommended"
                  autoComplete="current-password"
                />
              </label>

              <div className="field-row">
                <label className="field">
                  <span>IMAP host</span>
                  <input
                    type="text"
                    value={settings.imapHost}
                    onChange={(e) => onChange({ imapHost: e.target.value.trim() })}
                    placeholder="imap.example.com"
                    autoComplete="off"
                  />
                </label>

                <label className="field field-port">
                  <span>Port</span>
                  <input
                    type="number"
                    value={settings.imapPort}
                    onChange={(e) => onChange({ imapPort: Number(e.target.value) || 993 })}
                    min={1}
                    max={65535}
                  />
                </label>
              </div>

              <label className="field-check">
                <input
                  type="checkbox"
                  checked={settings.imapSecure}
                  onChange={(e) => onChange({ imapSecure: e.target.checked })}
                />
                <span>Use SSL/TLS (recommended)</span>
              </label>
            </>
          )}
        </div>

        <section className="settings-section">
          <h3>Notifications</h3>
          <p className="settings-section-copy">
            Fold watches unread mail while you stay connected. New unread messages become tasks
            right away; marking read or replying marks the task complete.
          </p>

          <label className="field-check">
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) => onChange({ notificationsEnabled: e.target.checked })}
            />
            <span>Alert me when new unread email tasks arrive</span>
          </label>

          <label className="field-check">
            <input
              type="checkbox"
              checked={settings.browserNotifications}
              onChange={(e) => onChange({ browserNotifications: e.target.checked })}
              disabled={!settings.notificationsEnabled}
            />
            <span>Also show browser / system notifications</span>
          </label>

          <label className="field">
            <span>Check for new unread mail every (seconds)</span>
            <input
              type="number"
              min={8}
              max={600}
              step={1}
              value={settings.pollIntervalSec}
              onChange={(e) =>
                onChange({ pollIntervalSec: Math.max(8, Number(e.target.value) || 10) })
              }
            />
          </label>
        </section>

        <footer className="settings-foot">
          <p className="settings-note">
            IMAP credentials stay in this browser. OAuth tokens are handled by Google/Microsoft.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onSave()
              onClose()
            }}
          >
            Save connection
          </button>
        </footer>
      </div>
    </div>
  )
}
