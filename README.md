# Dossier

A private editorial catalog of the people in your life. Capture fast, enrich later.

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app runs fully on **localStorage** out of the box — no database required to get started. Your 12 seed entries load automatically.

---

## Supabase setup (optional — for cloud persistence + auth)

1. Create a project at [supabase.com](https://supabase.com)
2. In the SQL Editor, run the contents of `supabase/schema.sql`
3. Enable **Email (Magic Link)** under Authentication → Providers
4. Create `.env.local` with your keys:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The schema uses Row Level Security (RLS) so it's multi-user ready from day one.

---

## Deploy to Vercel

```bash
npx vercel
```

Add environment variables in the Vercel dashboard under Project → Settings → Environment Variables (if using Supabase).

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styles | Tailwind CSS + CSS custom properties |
| Fonts | Inter Tight, Instrument Serif, EB Garamond, Fraunces, JetBrains Mono |
| State | React Context + localStorage |
| Database | Supabase (schema ready, wiring optional) |
| Deploy | Vercel |

---

## Project structure

```
app/
  layout.tsx          Root layout, Google Fonts
  page.tsx            Entry point
  globals.css         Design tokens, CSS utilities

lib/
  types.ts            TypeScript types
  seed.ts             12 seed people
  store.tsx           React Context store + mutations
  utils.ts            Date helpers, ID generators

components/
  DossierApp.tsx      App shell / router
  Header.tsx          Sticky nav
  Footer.tsx          Editorial colophon
  ListView.tsx        Catalog index (filter + search)
  DetailView.tsx      Person entry (catalog + meetings + follow-ups)
  CaptureView.tsx     Quick capture form
  EnrichView.tsx      Incomplete entries task list
  Squiggle.tsx        Hand-drawn SVG wave
  FrameTag.tsx        [FRIEND] / [INCOMPLETE] badge
  FilterChip.tsx      ● all 12  ○ incomplete 03
  NavLink.tsx         Instrument Serif nav link
  TextLink.tsx        Plain-text arrow link
  UnderlinedInput.tsx Bottom-border-only input
  KV.tsx              Key/value catalog row
  Portrait.tsx        Photo placeholder + initials

supabase/
  schema.sql          Postgres migration
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

## Seed entries

Aïda Muluneh · Jonas Bergström · Priya Ramanathan · Teddy Okonkwo · Mei-Lin Chau · Rafael Ortiz · Sana Al-Mansouri · Cale Watanabe · Ingrid Haugen · Hamid Karimi · Beatrix Hollander · Yuki Tanaka

---

*A private dossier for forgetful people. Designed by Nancy Chen.*
