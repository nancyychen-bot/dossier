# Dossier

A private, AI-powered personal CRM for the people you meet. Capture contacts by voice or text, search your network with natural language, and draft follow-up emails — all backed by a Notion database you own.

---

## What it does

- **Voice capture** — tap the mic, say a name and context, and Dossier parses it into a structured contact record
- **Meeting log** — record encounters with date, location, and notes (voice or typed)
- **AI search** — find people with queries like "the architect I met in Tokyo" instead of exact keywords
- **Email drafts** — generate contextual follow-up emails based on each contact's profile and meeting history
- **Inline editing** — update fields directly in the detail view; bulk-edit roles, companies, cities, and tags from the list view
- **Photo uploads** — attach portraits via file upload, stored in Vercel Blob
- **CSV export** — download your full roster for backup or use elsewhere
- **Password-protected** — single-user auth with a password you set

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styles | Tailwind CSS + CSS custom properties |
| Database | Notion API |
| AI | Anthropic Claude (voice parsing, search, email drafts) |
| Storage | Vercel Blob (photo uploads) |
| Deploy | Vercel |

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/nancyychen-bot/dossier.git
cd dossier
npm install
```

### 2. Create a Notion database

1. Go to [notion.so](https://notion.so) and create a new **full-page database** (table view).
2. Add these properties with the exact names and types:

| Property | Type | Notes |
|---|---|---|
| `Name` | Title | (default) |
| `Role` | Rich text | |
| `Company` | Rich text | |
| `Email` | Email | |
| `Phone` | Phone | |
| `LinkedIn` | URL | |
| `Twitter` | URL | |
| `Instagram` | URL | |
| `Website` | Rich text | |
| `Photo` | URL | |
| `Met Where` | Rich text | Where you first met |
| `Location` | Select | City (e.g. "New York", "London") |
| `Status` | Select | Options: `friend`, `acquaintance`, `influential` |
| `Captured` | Date | Date you met them |
| `Notes` | Rich text | |
| `Meetings` | Rich text | Stores meeting log as JSON — leave empty |
| `Followups` | Rich text | Stores follow-ups as JSON — leave empty |

### 3. Create a Notion integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **New integration**, give it a name (e.g. "Dossier"), and save
3. Copy the **Internal Integration Secret** — this is your `NOTION_TOKEN`
4. Go back to your database page, click **...** → **Connections** → add your integration

### 4. Get the database ID

Open your database in Notion. The URL looks like:

```
https://notion.so/your-workspace/abc123def456?v=...
                                  ^^^^^^^^^^^^^^
```

The 32-character hex string before `?v=` is your `NOTION_DATABASE_ID`. You can use it with or without dashes.

### 5. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

```env
DOSSIER_PASSWORD=pick_a_password
DOSSIER_SECRET=any_random_string_for_session_signing
NOTION_TOKEN=ntn_your_notion_token
NOTION_DATABASE_ID=your_32_char_database_id
ANTHROPIC_API_KEY=sk-ant-your_key
BLOB_READ_WRITE_TOKEN=vercel_blob_your_token
```

**Where to get each key:**
- `DOSSIER_PASSWORD` / `DOSSIER_SECRET` — pick any values you want
- `NOTION_TOKEN` — from step 3 above
- `NOTION_DATABASE_ID` — from step 4 above
- `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com)
- `BLOB_READ_WRITE_TOKEN` — from your Vercel project dashboard under Storage → Blob (needed for photo uploads; optional for local dev)

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the password you set.

---

## Deploy to Vercel

1. Push your fork to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add the environment variables from `.env.local` in the Vercel dashboard under **Settings → Environment Variables**
4. Deploy

The included `vercel.json` sets up a cron job that pings the app every 5 hours to keep it warm.

---

## Project structure

```
app/
  layout.tsx              Root layout, Google Fonts
  page.tsx                Entry point
  globals.css             Design tokens, CSS utilities
  api/
    auth/                 Session-based password auth
    people/               CRUD endpoints → Notion API
    search/               Claude-powered semantic search
    draft-email/          Claude-powered follow-up email drafts
    voice-parse/          Voice transcript → structured person fields
    voice-meeting-parse/  Voice transcript → meeting entry
    upload-photo/         Photo upload → Vercel Blob
    ping/                 Health check (Vercel Cron)

lib/
  types.ts                TypeScript types (Person, Meeting, Tag)
  notion.ts               Notion API client (read/write/delete)
  auth.ts                 Session token management (HMAC-SHA256)
  store.tsx               React Context store + CRUD mutations
  person.ts               Person formatting helpers
  utils.ts                Date helpers, ID generators, city normalization
  seed.ts                 12 demo seed entries
  rateLimit.ts            In-memory rate limiter for auth
  hooks/
    useSpeechRecognition.ts  Web Speech API wrapper

components/
  DossierApp.tsx          App shell / router
  Header.tsx              Sticky navigation
  Footer.tsx              Editorial colophon
  ListView.tsx            Catalog index (filter, search, bulk edit)
  DetailView.tsx          Person detail (profile, meetings, follow-ups)
  CaptureView.tsx         Quick capture form
  EnrichView.tsx          Incomplete entries task list
  DraftEmailModal.tsx     Email generation modal
  VoiceSearchModal.tsx    Voice-powered search modal
  VoiceCaptureModal.tsx   Voice capture modal
  LoginView.tsx           Password login
  Portrait.tsx            Photo / initials avatar
  + UI primitives (FrameTag, FilterChip, NavLink, etc.)
```

---

## Design tokens

| Token | Value | Role |
|---|---|---|
| `--bg` | `#FAFAF7` | Warm off-white paper |
| `--ink` | `#111111` | Primary text, borders |
| `--muted` | `#6B6B66` | Secondary text, labels |
| `--rule` | `#D4D4CE` | Hairline dividers |
| `--accent` | `#C8533C` | Coral-red — incomplete status |
| `--paper` | `#F2F1EA` | Portrait placeholder |

---

*A private dossier for forgetful people.*
