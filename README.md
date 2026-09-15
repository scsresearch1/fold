# Fold

A single-page React app that turns any inbox into a checkbox action list.

## Quick start

```bash
npm install
npm run dev
```

This starts:
- the Vite app at http://localhost:5173
- a local IMAP bridge at http://localhost:8787 (needed for Yahoo, iCloud, Zoho, and custom mail)

Open **Settings** (gear button) to connect an account, or use **Try demo inbox**.

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
3. Add `http://localhost:5173` to authorized JavaScript origins
4. Paste the Client ID in Settings

### Outlook
1. Register an app in Microsoft Entra / Azure portal
2. Add a Single-page application redirect URI: `http://localhost:5173`
3. Allow Microsoft Graph permission `Mail.Read`
4. Paste the Application (client) ID in Settings

### IMAP (Yahoo, iCloud, custom, etc.)
Use an **app password** when the provider requires it. The local IMAP bridge reads inbox messages only and returns them to the SPA.

## What it does

- Settings for Gmail, Outlook, or any IMAP mailbox
- Translates each email into a plain-language action item
- Checkbox task list with progress and local completion memory

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Web app + IMAP bridge |
| `npm run build` | Production frontend build |
| `npm run preview` | Preview production build |
| `npm run start:imap` | IMAP bridge only |

## Stack

React 19 · TypeScript · Vite · Gmail API · Microsoft Graph · IMAP (imapflow)
