# Development Guide

## Principles

1. Keep UI components isolated from database details.
2. Treat route handlers as the frontend/backend contract.
3. Validate untrusted values at API boundaries.
4. Design loading, empty, error, and success states from the start.
5. Follow the documentation bundled with the installed Next.js package.

## Data flow

```text
MarketplaceBrowser ──GET──> /api/listings ──> Supabase listings
CreateListingForm ──POST──> /api/upload ────> Supabase Storage
CreateListingForm ──POST──> /api/listings ──> Supabase listings
ItemDetailClient ───GET───> /api/listings/id
ListingChatLauncher ─POST─> /api/conversations ─> Supabase conversations
RealtimeChat ─────GET/POST> /api/messages ──────> Supabase chat_messages
RealtimeChat ──WebSocket─> Supabase Realtime inserts
```

The browser receives no secret credential. The publishable key is public by design, so authorization is enforced by user-scoped RLS. Chat clients subscribe to `chat_messages` inserts filtered by conversation ID.

## Organization

- `src/app/api`: request parsing, validation, status codes, response shapes
- `src/components/marketplace`: feature state and presentation
- `src/components/ui`: reusable visual primitives
- `src/lib/api.ts`: shared validation and errors
- `src/lib/api-types.ts`: shared records and response types
- `src/lib/supabase.ts`: configured Supabase client

## Adding a feature

1. Decide whether the schema needs a migration.
2. Update shared TypeScript types.
3. Add validation and behavior to the API.
4. Implement pending, error, empty, and success UI.
5. Verify keyboard and mobile behavior.
6. Run `npm run check`.
7. Update the documentation.

## API conventions

- Use standard HTTP semantics.
- Return `201` with a `Location` header after creation.
- Use `400` for invalid queries, `404` for missing records, `413` for oversized files, `415` for unsupported media, and `422` for invalid fields.
- Never return secrets or internal stack traces.
- Reuse `apiError` and `databaseError`.

## Framework conventions

This is Next.js 16, not a historical Next.js 14/15 template. Read `node_modules/next/dist/docs/` before changing framework behavior.

- Await dynamic `params`.
- Wrap client `useSearchParams` consumers in Suspense.
- Use Route Handlers under `src/app/api`.
- Keep live data uncached when immediate consistency matters.
- Use `next/font` and `next/image`.

Tailwind CSS 4 is compiled through the installed Turbopack integration. Design tokens and `glass-panel` live in `src/app/globals.css`.

## Test checklist

- Create: file picker, drag/drop, invalid images, preview, validation, publish, redirect
- Browse: empty/populated data, search, categories, API failure, retry
- Detail: valid/missing/malformed ID, responsive image, back navigation
- Message: valid/invalid values, pending state, confirmation
- Release: `npm run check`, followed by a deployed smoke test

## Roadmap

Immediate priorities are account recovery, richer filters, moderation, and notification delivery. Future options include payments, maps, push notifications, and an admin dashboard.
