# Fold

A single-page React app that turns any inbox into a checkbox action list.

## Deploy on Netlify

1. Push this repo to GitHub (already set up for `scsresearch1/fold`).
2. In [Netlify](https://app.netlify.com/), **Add new site → Import an existing project**.
3. Select the repo. Netlify reads `netlify.toml` automatically:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
4. Deploy.

After deploy, open **Settings** in the app and connect email. For Gmail/Outlook OAuth, add your Netlify URL (e.g. `https://your-site.netlify.app`) to authorized origins / redirect URIs.

IMAP providers (Yahoo, iCloud, Zoho, custom) use the Netlify Function at `/api/inbox` — no separate server required in production.

### Optional: Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

Local full-stack preview (SPA + functions):

```bash
netlify dev
```

## Local development

```bash
npm install
npm run dev
```

This starts:
- the Vite app at http://localhost:5173
- a local IMAP bridge at http://localhost:8787 (needed for Yahoo, iCloud, Zoho, and custom mail)

Open **Settings** (gear button) to connect an email account.

## Connect any email

In **Settings**, pick a provider:

| Provider | How it connects |
|----------|-----------------|
| Gmail | Google OAuth (paste Client ID) |
| Outlook | Microsoft OAuth (paste App/Client ID) |
| Yahoo / iCloud / Zoho | IMAP + app password |
| Any other email | Custom IMAP host, port, email, password |

Click **Save connection**, then **Connect**.

### Gmail
1. Enable Gmail API in Google Cloud Console
2. Create an OAuth Web client ID
3. Add your Netlify URL **and** `http://localhost:5173` to authorized JavaScript origins
4. Paste the Client ID in Settings

### Outlook
1. Register an app in Microsoft Entra / Azure portal
2. Add SPA redirect URIs for your Netlify URL and `http://localhost:5173`
3. Allow Microsoft Graph permission `Mail.Read`
4. Paste the Application (client) ID in Settings

### IMAP (Yahoo, iCloud, custom, etc.)
Use an **app password** when the provider requires it. On Netlify, inbox reads go through a serverless function. Locally, use `npm run dev` (Vite + IMAP bridge).

## What it does

- Settings for Gmail, Outlook, or any IMAP mailbox
- Translates each email into a plain-language action item
- Checkbox task list with progress and local completion memory
- Notifications when new email tasks arrive

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Web app + IMAP bridge |
| `npm run build` | Production frontend build (used by Netlify) |
| `npm run preview` | Preview production build |
| `npm run start:imap` | IMAP bridge only |

## Stack

React 19 · TypeScript · Vite · Netlify (static + Functions) · Gmail API · Microsoft Graph · IMAP (imapflow)
