import Link from "next/link";

export const metadata = {
  title: "Privacy",
  description: "Plain-language privacy information for TheoryPrep.",
};

export default function PrivacyPage() {
  return (
    <main className="app-main">
      <div className="page-shell legal-shell">
        <p className="eyebrow">TheoryPrep</p>
        <h1>Privacy</h1>
        <p className="legal-intro">A plain-language overview of what the site stores and why. This page is informational and is not legal advice.</p>

        <section className="legal-card">
          <h2>What we store</h2>
          <p>If you create an account, TheoryPrep stores your account details and the practice data needed for features such as question history, mock-test results and starred questions.</p>
          <p>Your browser may also store preferences such as dark mode, easier reading mode, your exam date and your local readiness history.</p>
        </section>

        <section className="legal-card">
          <h2>How it is used</h2>
          <p>Your saved data is used to provide your progress dashboard, streaks, adaptive learning, starred questions and preparation features. It is not used to change the question or explanation content.</p>
        </section>

        <section className="legal-card">
          <h2>Service providers</h2>
          <p>The site is hosted by Vercel. Account and saved practice data are handled through Supabase.</p>
        </section>

        <section className="legal-card">
          <h2>Your choices</h2>
          <p>You can use the public question library without creating an account. Account features require sign-in. Browser-stored preferences can be removed through your browser settings.</p>
        </section>

        <section className="legal-card">
          <h2>Independent resource</h2>
          <p>TheoryPrep is an independent study resource and is not the official RSA or Driver Theory Test service.</p>
        </section>

        <Link className="text-action" href="/">← Back to TheoryPrep</Link>
      </div>
    </main>
  );
}
