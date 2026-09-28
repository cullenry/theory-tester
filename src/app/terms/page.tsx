import Link from "next/link";

export const metadata = {
  title: "Terms",
  description: "Plain-language terms for using TheoryPrep.",
};

export default function TermsPage() {
  return (
    <main className="app-main">
      <div className="page-shell legal-shell">
        <p className="eyebrow">TheoryPrep</p>
        <h1>Terms</h1>
        <p className="legal-intro">Simple rules for using TheoryPrep. This page is informational and is not legal advice.</p>

        <section className="legal-card">
          <h2>Use of the service</h2>
          <p>TheoryPrep is a study and practice tool. Use it lawfully and do not attempt to disrupt, abuse or reverse-engineer the service.</p>
        </section>

        <section className="legal-card">
          <h2>Practice content</h2>
          <p>The service is provided for preparation and learning. Question wording, answers and explanations may change as the underlying source material changes. Check the official Driver Theory Test and RSA resources for authoritative information.</p>
        </section>

        <section className="legal-card">
          <h2>No guarantee</h2>
          <p>Practice results, readiness scores and other app metrics are learning aids. They are not guarantees or predictions of a real test result.</p>
        </section>

        <section className="legal-card">
          <h2>Independent service</h2>
          <p>TheoryPrep is not affiliated with or endorsed by the RSA or the official Driver Theory Test service.</p>
        </section>

        <section className="legal-card">
          <h2>Changes</h2>
          <p>Features, content and these terms may be updated as TheoryPrep develops.</p>
        </section>

        <Link className="text-action" href="/">← Back to TheoryPrep</Link>
      </div>
    </main>
  );
}
