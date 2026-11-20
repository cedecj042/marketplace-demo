# Features

## Browse and discovery

- Live listings loaded from the listings API
- Title search from the floating Discover panel
- Category filtering through dynamic routes
- Responsive one-to-five-column grid
- Empty, loading, failure, and retry states
- Optimized remote images with a no-image fallback

## Listing creation

- Drag-and-drop or file-picker image selection
- JPG, PNG, and WebP validation with a 6 MB limit
- Immediate local image preview
- Live title, price, location, condition, and description preview
- Client feedback backed by API validation
- Storage upload followed by database creation
- Success confirmation and redirect to the listing

The schema currently has no `condition` column, so condition remains preview-only.

## Listing details and messaging

- Dynamic UUID listing retrieval
- Responsive media presentation
- Price, description, location, date, and seller information
- Missing-listing and retry interface
- Email/password accounts with cookie-backed sessions
- Account-owned listings and image uploads
- Participant-only conversation history
- Real-time message delivery through Supabase Realtime
- Buyer/seller inbox with pending, error, and empty states

Save/share remain visual controls.

## API behavior

Listings accept `search`, `category`, `minPrice`, `maxPrice`, `limit`, and `offset`. Success responses use `{ data }`; failures use `{ error: { code, message, fields? } }`. Live reads use `private, no-store` so new data does not appear stale.

## Design and accessibility

- IBM Plex Sans self-hosted through `next/font`
- Minimal glass surfaces with graphite, indigo, and cyan accents
- Keyboard focus styling and semantic labels
- Responsive layouts
- Accessible form status and error announcements

## Roadmap

- User profiles, recovery, and optional MFA
- User-owned listings and favorites
- Advanced filters and sorting
- Email and push notifications
- Maps and distance discovery
- Stripe payments
- Moderation and administration tools
