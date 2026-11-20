# Marketplace Demo

A minimalist local marketplace built with Next.js, React, TypeScript, Tailwind CSS, Supabase, and Stripe Connect. It supports live listings, secure user accounts, saved items, real-time chat and notifications, seller onboarding, Checkout, marketplace fees, and sold orders.

## Technology

- Next.js 16.4 with App Router and Cache Components
- React 19 and TypeScript
- Tailwind CSS 4
- Supabase Database and Storage
- Stripe Connect and Stripe Checkout in sandbox mode
- Base UI/Shadcn-style primitives
- IBM Plex Sans through `next/font`
- Lucide icons

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

Add your Supabase project URL and publishable key to `.env`, then open [http://localhost:3000](http://localhost:3000).

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
| `GET/PATCH` | `/api/notifications` | Read and update in-app notifications |
| `GET/POST` | `/api/stripe/connect` | Sync or start seller onboarding |
| `GET/POST` | `/api/stripe/checkout` | Check eligibility or create Checkout |
| `POST` | `/api/stripe/webhook` | Verify and fulfill Stripe events |
| `GET` | `/api/orders/status` | Read Checkout confirmation status |
| `POST` | `/api/upload` | Upload a validated listing image |

## Documentation

- [SETUP.md](./SETUP.md) — installation, Supabase, and deployment
- [FEATURES.md](./FEATURES.md) — user-facing and technical features
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) — architecture and contribution workflow

## Production status

The project includes Supabase Authentication, participant-scoped RLS, and sandbox Stripe payments. Before a real-money launch, complete Stripe production verification and compliance, add rate limiting, moderation, automated browser tests, account recovery UI, refunds/disputes, tax handling, and production monitoring. See [SETUP.md](./SETUP.md).
