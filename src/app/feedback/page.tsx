import Link from "next/link";

const issueUrl = (type: string) =>
  "https://github.com/cullenry/theory-tester/issues/new?title=" + encodeURIComponent(type);

export const metadata = {
  title: "Feedback",
  description: "Help improve TheoryPrep with feedback, question reports and suggestions.",
};

export default function FeedbackPage() {
  return (
    <main className="app-main">
      <div className="page-shell legal-shell feedback-shell">
        <p className="eyebrow">Help make it better</p>
        <h1>Feedback</h1>
        <p className="legal-intro">Found something that could be better? Pick the option that best matches what you want to tell us.</p>

        <section className="feedback-grid">
          <a className="feedback-card" href={issueUrl("Feedback for TheoryPrep")} target="_blank" rel="noreferrer">
            <span className="feedback-card-icon" aria-hidden="true">↗</span>
            <div><h2>General feedback</h2><p>Tell us what you like, what feels confusing or what could be improved.</p></div>
            <span aria-hidden="true">→</span>
          </a>
          <a className="feedback-card" href={issueUrl("Feature suggestion for TheoryPrep")} target="_blank" rel="noreferrer">
            <span className="feedback-card-icon" aria-hidden="true">＋</span>
            <div><h2>Suggest a feature</h2><p>Have an idea that would make TheoryPrep more useful?</p></div>
            <span aria-hidden="true">→</span>
          </a>
          <Link className="feedback-card" href="/questions">
            <span className="feedback-card-icon" aria-hidden="true">⚑</span>
            <div><h2>Report a question</h2><p>Use the flag on any question to report an incorrect answer, image or explanation.</p></div>
            <span aria-hidden="true">→</span>
          </Link>
        </section>

        <p className="feedback-note">Feedback opens as a pre-filled GitHub issue so it can be tracked and reviewed.</p>
        <Link className="text-action" href="/">← Back to TheoryPrep</Link>
      </div>
    </main>
  );
}
