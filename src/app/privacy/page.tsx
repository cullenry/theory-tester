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
          <p>If you create an account, TheoryPrep stores your account details and the practice data needed for features such as question history, mock-test results, course progress and starred questions.</p>
          <p>If you enable notifications, TheoryPrep stores the push subscription information required to deliver them and your reminder preferences.</p>
          <p>Your browser may also store local preferences such as dark mode, easier reading mode, your exam date and readiness information.</p>
        </section>

        <section className="legal-card">
          <h2>How it is used</h2>
          <p>Your saved data is used to provide your progress dashboard, streaks, adaptive learning, starred questions and preparation features. It is not used to change the question or explanation content.</p>
        </section>

        <section className="legal-card">
          <h2>Service providers</h2>
          <p>The site is hosted by Vercel. Account and saved practice data are handled through Supabase. TheoryPrep also uses Vercel Analytics to understand how the site is used and to help improve reliability and performance.</p>
        </section>

        <section className="legal-card">
          <h2>Your choices</h2>
          <p>You can use the public question library without creating an account. Account features require sign-in. You can delete your TheoryPrep account from Settings; the server then deletes the account and the associated user-owned records.</p>
          <p>For a copy, correction or deletion request that is not covered by the account controls, contact hello@theoryprep.irish. Browser-stored preferences can be removed through your browser settings.</p>
        </section>

        <section className="legal-card">
          <h2>Question data</h2>
          <p>TheoryPrep is an independent study resource. The question bank is stored as practice data and records its source and refresh date. The repository&apos;s source-code licence does not automatically grant rights to third-party question content.</p>
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
