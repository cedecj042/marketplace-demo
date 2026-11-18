# Setup Guide

## Requirements

- Node.js 20 or newer
- npm
- A Supabase project

This repository uses Next.js 16.4.6 and stable Tailwind CSS 4.3.3. Do not downgrade to Tailwind 3 for an operating-system-specific native dependency error; reinstall dependencies on the target platform instead.

## Installation

```bash
npm install
cp .env.example .env.local
```

Configure `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

The application intentionally has no placeholder credentials. Missing configuration should fail clearly instead of silently contacting a fake backend.

## Supabase requirements

The application expects:

- A `listings` table with UUID `id`, listing fields, seller email, image URL, location, and timestamps
- A `messages` table linked to `listings.id`
- A public Storage bucket named `listing-images`
- `SELECT` and `INSERT` RLS policies for the public demo
- Indexes on listing category, creation time, and message listing ID

Run the project schema in Supabase SQL Editor and confirm the bucket name is exactly `listing-images`.

### Storage policies

Uploads require an `INSERT` policy on `storage.objects`; public image delivery requires a `SELECT` policy. Restrict both policies to `bucket_id = 'listing-images'`.

### Security warning

The demo schema allows anonymous listing creation and message access. Before a real launch:

1. Enable Supabase Authentication.
2. Add immutable owner IDs to listings and messages.
3. Restrict message reads to the buyer and seller.
4. Restrict listing changes and storage writes to the owner.
5. Add abuse prevention and rate limiting.

## Development

```bash
npm run dev
```

Dynamic route parameters are promises in the installed Next.js version:

```tsx
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <div>{id}</div>
}
```

## Verification

```bash
npm run check
```

This runs ESLint, TypeScript, and the optimized production build.

## Deployment

1. Create a Vercel project from the repository.
2. Add both Supabase environment variables.
3. Deploy and test listing creation, images, search, categories, and messaging.
4. Confirm Storage public URLs render through `next/image`.

Do not add fake fallback environment values. They make builds appear healthy while leaving runtime operations broken.

## Troubleshooting

### Native CSS dependency is missing

Dependencies installed for one operating system should not be copied to another. Remove `node_modules` and run `npm install` on the target machine.

### Images do not upload

- Use JPG, PNG, or WebP no larger than 6 MB.
- Confirm the `listing-images` bucket exists.
- Confirm its Storage `INSERT` policy is enabled.
- Inspect the `/api/upload` response and server log.

The handler converts the Web `File` to an `ArrayBuffer` for consistent Node and serverless uploads.

## Production readiness

Implemented: TypeScript, ESLint, production build, request validation, parameterized Supabase queries, image validation, responsive UI, loading/error states, and optimized images.

Still required for a real launch: authentication, user-scoped RLS, rate limits, private-message authorization, automated browser tests, error monitoring, and notification delivery.
