# TheoryPrep

A mobile-first Irish driving theory test practice platform built with Next.js, TypeScript, Supabase and Vercel.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Mobile app setup

TheoryPrep is a Progressive Web App. On supported mobile browsers, the site can be added to the Home Screen and used as an app. The mobile app layer includes:

- install prompt and iPhone/iPad install guidance
- service-worker caching and a dedicated offline practice mode
- offline answer queueing with per-account isolation
- adaptive Learn and Smart Review
- daily goals and streak-protection reminders
- Web Push subscriptions and a daily reminder job

### Push notifications

Generate a VAPID key pair once and keep the private key secret:

```bash
npx web-push generate-vapid-keys --json
```

Add these values to Vercel:

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `CRON_SECRET`

The public VAPID key is used by the mobile browser when it creates a subscription. The private key stays server-side.

Apply `supabase/migrations/006_mobile_app_features.sql` to the Supabase project before enabling reminders.

### Daily reminders

The Vercel cron calls `/api/cron/daily-reminders` once each day. It only sends to users who opted in and haven't practised that day. It also removes expired push subscriptions.

### Mobile offline mode

Open **Offline Practice** once while connected after installing the app. This gives the browser a chance to cache the route and app resources. Answers made while offline are queued locally and synced to the signed-in account when the connection returns.

## Roadmap

- [x] Practice question engine
- [x] Topic-based question sets
- [x] Mock tests and scoring
- [x] Progress tracking
- [x] Accounts and persistent results
- [x] Adaptive Learn
- [x] Mobile PWA foundation
- [x] Offline practice
- [x] Web Push reminder plumbing
