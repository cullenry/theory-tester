# TheoryPrep

**Live site:** https://theoryprep.irish

TheoryPrep is a modern Irish driving theory test study app built around the full question bank, short practice sessions, mock exams, progress tracking and an adaptive learning course.

The aim is to make studying feel less like working through a long list of questions and more like following a simple plan: learn the material, practise it, review mistakes and build confidence before test day.

## What’s included

### Learn

Learn turns the question bank into a structured course of short lessons.

- 11 chapters covering the full 805-question bank
- Short lessons with instant explanations
- Missed questions can come back for another attempt
- Adaptive ordering based on previous answers
- Smart Review for signed-in users
- Course progress and a clear Continue Your Journey flow

### Practice

Practice is built for quick sessions when you just want to get questions done.

- Quick 5, Quick 10 and Full 20 sessions
- Filter by category and subcategory
- Star questions to save them for later
- Review mistakes and retry missed questions
- Progress and answer history for signed-in users
- Mobile-friendly question flow

### Mock tests

The mock test area provides timed exam-style sessions.

- Full 40-question mock
- 20-question blitz
- 10-question blitz
- Countdown timer
- Results with correct, incorrect and unanswered totals
- Full answer review after finishing
- Retake and mistake-review options

### Your progress

Signed-in users can keep their study history in one place.

- Questions answered
- Accuracy
- Practice history
- Streaks
- Daily activity
- Course progress
- Saved questions
- Topic-level progress and review

## Mobile app experience

TheoryPrep is designed to work as a Progressive Web App on supported mobile browsers.

The mobile experience includes:

- Add-to-Home-Screen install flow
- iPhone/iPad-specific install guidance
- App icon and Home Screen metadata
- App-style bottom navigation
- Launch splash screen when opened as an installed app
- Service-worker caching
- Offline practice
- Offline answer queueing with per-account isolation
- Daily goals
- Streak protection
- Smart revision
- Web Push notification support

### Offline practice

After opening Offline Practice once while connected, the app can cache the route and required resources for a quick session without a connection.

When a signed-in user answers questions offline, their attempts are stored locally and queued for sync. Once the device is back online, TheoryPrep attempts to send those answers back to Supabase.

## Accounts and data

Supabase is used for authentication and persistent user data. Signed-in users can delete their account from Settings; account deletion is performed server-side and the database's foreign-key relationships remove the associated user-owned records.

User-specific features include:

- practice history
- mock test results
- course progress
- starred questions
- daily goals
- reminder settings
- push notification subscriptions

Row Level Security is enabled for user-owned data so account data is scoped to the signed-in user.

## Security

The app keeps server-only Supabase credentials out of browser code, verifies mock-test submissions on the server, uses Row Level Security for user-owned data, validates account display names and protects sensitive server routes against oversized or malformed input. A CI secret scan is also configured with Gitleaks.

Mock test completion is verified on the server rather than trusting the score calculated in the browser.

The server:

1. checks the requested test format
2. validates the question IDs
3. validates submitted answers against the real question data
4. calculates the result again
5. records the verified completion

The global mock-test counter is also protected so the browser cannot directly increment it.

Server-only Supabase credentials must never be exposed to the browser or committed to the repository.

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase for authentication and data
- Vercel for hosting and scheduled jobs
- Web Push for notifications
- Service Worker APIs for the mobile app experience

## Project structure

    theory-tester/
    ├── public/
    │   ├── icons/                  # PWA and Home Screen icons
    │   ├── images/                 # Site artwork and illustrations
    │   └── sw.js                   # Service worker
    ├── scripts/
    │   └── scrape-theory-tester.mjs
    ├── src/
    │   ├── app/                    # Next.js routes and API routes
    │   ├── components/             # UI and feature components
    │   ├── lib/                    # Questions, learning, progress and Supabase helpers
    │   └── types/                  # Shared TypeScript declarations
    ├── supabase/
    │   └── migrations/             # Database migrations
    ├── .github/
    │   └── workflows/              # CI and secret scanning
    ├── package.json
    └── README.md

## Getting started

Clone the repository and install the dependencies:

    git clone https://github.com/cullenry/theory-tester.git
    cd theory-tester
    npm install

Start the development server:

    npm run dev

Then open http://localhost:3000.

For a production build:

    npm run build
    npm run start

Run the linter and type checker with:

    npm run lint
    npm run typecheck

## Environment variables

Create a local .env.local file for development.

Public browser variables:

    NEXT_PUBLIC_SUPABASE_URL=
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
    NEXT_PUBLIC_VAPID_PUBLIC_KEY=

Server-only variables:

    SUPABASE_SECRET_KEY=
    VAPID_PUBLIC_KEY=
    VAPID_PRIVATE_KEY=
    VAPID_SUBJECT=mailto:hello@theoryprep.irish
    CRON_SECRET=

Never commit .env.local or server-side secrets.

An example file is included as .env.example.

## Supabase setup

Database changes are stored as SQL migrations in supabase/migrations/.

For the mobile app features, make sure 006_mobile_app_features.sql has been applied to the Supabase project.

If you are using the Supabase CLI and the project is already linked, the migrations can be pushed with:

    supabase db push

## Web Push setup

Generate a VAPID key pair once:

    npx web-push generate-vapid-keys --json

Add the resulting public and private keys to the appropriate Vercel environment variables.

The private VAPID key, Supabase secret key and cron secret must stay server-side.

The daily reminder endpoint is /api/cron/daily-reminders.

It is protected by CRON_SECRET and only sends reminders to users who have opted in and have not already practised that day.

## Question data

The project currently contains 805 theory test questions in src/data/questions.json. The dataset records its source URL and the time it was scraped; the current dataset was scraped on 28 September 2026.

The question data is separate from the repository's original source-code licence. Before redistributing or commercially using question text, answers, explanations or other third-party content, verify that you have the necessary permission or licence from the relevant rights holder.

The repository also includes a scraper used to refresh the question data:

    npm run scrape

The scraper writes the resulting data back to the project's question JSON file.

## Development notes

A few parts of the app are intentionally server-backed:

- user progress and account data are stored in Supabase
- mock test results are verified server-side
- push subscriptions are stored server-side
- daily reminders run through the Vercel cron endpoint

The mobile/offline experience is an enhancement to the web app, so the core question bank and practice flows remain usable without installing anything.

## Licence

TheoryPrep's original source code, design, branding and original assets are proprietary and all rights are reserved. They may not be copied, modified, redistributed or used commercially without written permission.

See the [LICENSE](LICENSE) file for the full terms.

Third-party dependencies and external content may have separate licences or rights.

## Quality checks

Every push and pull request runs linting, TypeScript type checking, a production build and a full-history secret scan in GitHub Actions. Vercel Git deployments remain intentionally disabled so production releases can be chosen manually. After the hardened application is deployed, apply the final streak-reconciliation migration before removing the compatibility grant in Supabase.

## Status

The main study, practice and mock-test experience is in place, along with account-based progress, adaptive learning, offline mobile practice and the infrastructure needed for push reminders.

Development is currently focused on refining the learning experience, improving mobile usability and expanding the app around the existing question bank.

---

Built as an independent study resource for the Irish driving theory test.