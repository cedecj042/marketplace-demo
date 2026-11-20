# Setup Guide

## Requirements

- Node.js 20 or newer
- npm
- A Supabase project

This repository uses Next.js 16.4.6 and stable Tailwind CSS 4.3.3. Do not downgrade to Tailwind 3 for an operating-system-specific native dependency error; reinstall dependencies on the target platform instead.

## Installation

```bash
npm install
cp .env.example .env
```

Configure `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key

NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_COUNTRY=US
```

`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` are server-only secrets. Never prefix them with `NEXT_PUBLIC_`, expose them to browser code, or commit them.

The application intentionally has no placeholder credentials. Missing configuration should fail clearly instead of silently contacting a fake backend.

## Supabase requirements

The application expects:

- A `listings` table with UUID `id`, listing fields, seller email, image URL, location, and timestamps
- The original `messages` table from the base schema (kept only for migration compatibility)
- A public Storage bucket named `listing-images`
- `SELECT` and `INSERT` RLS policies for the public demo
- Indexes on listing category, creation time, ownership, conversations, and chat messages

Run the project schema in Supabase SQL Editor and confirm the bucket name is exactly `listing-images`.

Then run [`supabase/migrations/20261119_auth_realtime_chat.sql`](./supabase/migrations/20261119_auth_realtime_chat.sql). It adds listing ownership, conversations, participant-scoped chat messages, secure image paths, and the Realtime publication.

Run the remaining migrations in this order:

1. [`supabase/migrations/20261120_user_profiles.sql`](./supabase/migrations/20261120_user_profiles.sql)
2. [`supabase/migrations/20261120_saved_listings.sql`](./supabase/migrations/20261120_saved_listings.sql)
3. [`supabase/migrations/20261120_notifications.sql`](./supabase/migrations/20261120_notifications.sql)
4. [`supabase/migrations/20261120_stripe_connect.sql`](./supabase/migrations/20261120_stripe_connect.sql)

In Supabase Auth URL Configuration, add your local and deployed `/auth/confirm` URLs to the redirect allow list.

### Storage policies

Uploads require an `INSERT` policy on `storage.objects`; public image delivery requires a `SELECT` policy. Restrict both policies to `bucket_id = 'listing-images'`.

### Security warning

The account migration removes anonymous writes and protects conversations by participant. Before a real launch:

1. Configure password policy, recovery, and optional MFA.
2. Add abuse prevention and rate limiting.
3. Add moderation and account reporting.
4. Configure transactional email delivery.
5. Add monitoring and audit retention.

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
2. Add every variable from `.env.example` to Vercel. Use the production URL for `NEXT_PUBLIC_SITE_URL`.
3. Deploy to the production domain.
4. Register the production Connect webhook once:

   ```bash
   npm run stripe:webhook
   ```

5. Copy the printed `whsec_...` value into `STRIPE_WEBHOOK_SECRET` locally and in Vercel, then redeploy.
6. Test seller onboarding, Checkout with Stripe's `4242 4242 4242 4242` test card, order confirmation, and the sold state.
7. Confirm Storage public URLs render through `next/image`.

The webhook registration script rejects localhost and expects the public production HTTPS URL. It creates a Connect webhook for `checkout.session.completed` and `account.updated`. The shared Stripe sandbox can send events for other candidates; the handler ignores sessions and accounts that do not match this application's orders and profiles.

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

Still required for a real launch: rate limits, recovery/MFA UX, moderation, automated browser tests, error monitoring, and notification delivery.
