import Link from "next/link";

export const metadata = {
  title: "Support TheoryPrep",
  description: "Ways to support TheoryPrep and help it reach more learner drivers.",
};

export default function SupportPage() {
  return (
    <main className="app-main">
      <div className="page-shell legal-shell support-shell">
        <p className="eyebrow">Help the project grow</p>
        <h1>Support TheoryPrep</h1>
        <p className="legal-intro">Built to make Irish driving theory practice easier to use. A little support helps keep the project improving.</p>

        <section className="support-grid">
          <a className="support-card" href="https://github.com/cullenry/theory-tester" target="_blank" rel="noreferrer">
            <span className="support-icon" aria-hidden="true">★</span>
            <div><h2>Support the project</h2><p>Star the project on GitHub and help it get discovered.</p></div>
            <span aria-hidden="true">↗</span>
          </a>
          <div className="support-card">
            <span className="support-icon" aria-hidden="true">↗</span>
            <div><h2>Share TheoryPrep</h2><p>Tell a friend who is preparing for their theory test. Sharing is one of the simplest ways to help.</p></div>
          </div>
          <Link className="support-card" href="/questions">
            <span className="support-icon" aria-hidden="true">⚑</span>
            <div><h2>Help improve a question</h2><p>See something wrong? Report it and help keep the library useful.</p></div>
            <span aria-hidden="true">→</span>
          </Link>
        </section>

        <div className="support-actions">
          <Link className="button button-primary" href="/practice">Keep practising <span aria-hidden="true">→</span></Link>
          <Link className="button button-secondary" href="/">Back home</Link>
        </div>
      </div>
    </main>
  );
}
