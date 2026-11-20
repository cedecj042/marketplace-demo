# Marketplace Demo

A minimalist local marketplace built with Next.js, React, TypeScript, Tailwind CSS, and Supabase. It supports browsing live listings, secure user accounts, image uploads, item details, and real-time buyer/seller chat.

## Technology

- Next.js 16.4 with App Router and Cache Components
- React 19 and TypeScript
- Tailwind CSS 4
- Supabase Database and Storage
- Base UI/Shadcn-style primitives
- IBM Plex Sans through `next/font`
- Lucide icons

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add your Supabase project URL and publishable key to `.env.local`, then open [http://localhost:3000](http://localhost:3000).

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

See [SETUP.md](./SETUP.md) for database, storage, and deployment instructions.

## Commands

```bash
npm run dev        # Local development
npm run lint       # ESLint
npm run typecheck  # TypeScript validation
npm run build      # Production build
npm run check      # Full verification suite
npm start          # Run the production build
```

## Architecture

```text
src/
├── app/
│   ├── api/                  # REST-style route handlers
│   ├── category/[slug]/      # Filtered marketplace pages
│   ├── create/               # Listing creation flow
│   └── item/[id]/            # Live listing details
├── components/
│   ├── layout/               # Header and sidebar
│   ├── marketplace/          # Feature components
│   └── ui/                   # Reusable primitives
└── lib/                      # Supabase, API types, and utilities
```

## API summary

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/listings` | Search, filter, and paginate listings |
| `POST` | `/api/listings` | Create a listing |
| `GET` | `/api/listings/[id]` | Retrieve a listing |
| `GET/POST` | `/api/conversations` | Open and list account conversations |
| `GET/POST` | `/api/messages?conversationId=` | Read and send chat messages |
| `POST` | `/api/upload` | Upload a validated listing image |

## Documentation

- [SETUP.md](./SETUP.md) — installation, Supabase, and deployment
- [FEATURES.md](./FEATURES.md) — user-facing and technical features
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) — architecture and contribution workflow

## Production status

The project includes Supabase Authentication and participant-scoped chat RLS. Before a real launch, add rate limiting, moderation, automated browser tests, account recovery UI, and production monitoring. See [SETUP.md](./SETUP.md).
