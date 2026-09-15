import { APP_NAME } from '../config'

type LandingProps = {
  loading: boolean
  error: string | null
  ready: boolean
  providerLabel: string
  onConnect: () => void
  onDemo: () => void
  onOpenSettings: () => void
}

export function Landing({
  loading,
  error,
  ready,
  providerLabel,
  onConnect,
  onDemo,
  onOpenSettings,
}: LandingProps) {
  return (
    <section className="landing">
      <div className="landing-copy">
        <p className="brand-mark">{APP_NAME}</p>
        <h1 className="hero-line">
          Fold your inbox
          <span>into action.</span>
        </h1>
        <p className="hero-sub">
          Connect any email account, then turn messages into plain-language action items you can
          check off — no digging through subjects and snippets.
        </p>

        <div className="cta-row">
          <button className="btn btn-primary" onClick={onConnect} disabled={loading || !ready}>
            {loading ? 'Connecting…' : ready ? `Connect ${providerLabel}` : 'Set up email first'}
          </button>
          <button className="btn btn-ghost" onClick={onOpenSettings} disabled={loading}>
            Email settings
          </button>
          <button className="btn btn-ghost" onClick={onDemo} disabled={loading}>
            Try demo inbox
          </button>
        </div>

        {!ready && (
          <p className="settings-nudge">
            Open <button type="button" className="text-link" onClick={onOpenSettings}>Settings</button>{' '}
            to connect Gmail, Outlook, Yahoo, iCloud, Zoho, or any IMAP mailbox.
          </p>
        )}

        {error && <p className="error-banner" role="alert">{error}</p>}

        <p className="trust-line">
          Read-only access · Settings stay in this browser · Action items never leave your machine
        </p>
      </div>

      <div className="landing-visual" aria-hidden="true">
        <div className="float-card float-card-a">
          <span className="mini-check" />
          <span>Confirm the Market loft for Friday</span>
        </div>
        <div className="float-card float-card-b">
          <span className="mini-check is-on" />
          <span>Send invoice PDF to Acme Ops</span>
        </div>
        <div className="float-card float-card-c">
          <span className="mini-check" />
          <span>Flag issues in the Q3 budget</span>
        </div>
      </div>
    </section>
  )
}
