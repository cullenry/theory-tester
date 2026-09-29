import Link from "next/link";
import { questions } from "@/lib/questions";

type SeoLink = {
  href: string;
  label: string;
  description: string;
};

type SeoSection = {
  title: string;
  body: string;
};

type SeoLandingPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  primaryAction: SeoLink;
  secondaryAction?: SeoLink;
  sections: SeoSection[];
  questionCategory?: string;
  sampleHeading: string;
  sampleDescription: string;
};

const popularLinks: SeoLink[] = [
  { href: "/theory-test-practice", label: "Theory test practice", description: "Build confidence with focused Irish theory practice." },
  { href: "/theory-test-questions", label: "Theory test questions", description: "Browse the full question library and explanations." },
  { href: "/irish-theory-test-mock-test", label: "Mock test", description: "Put your knowledge under timed test conditions." },
  { href: "/irish-road-signs", label: "Irish road signs", description: "Practise signs, signals and road markings." },
  { href: "/irish-driving-theory-test", label: "Irish driving theory test", description: "See how TheoryPrep can fit into your preparation." },
];

export function SeoLandingPage({
  eyebrow, title, intro, primaryAction, secondaryAction, sections, questionCategory, sampleHeading, sampleDescription,
}: SeoLandingPageProps) {
  const samplePool = questionCategory
    ? questions.filter((question) => question.taxonomy.category === questionCategory)
    : questions;
  const sampleQuestions = samplePool.slice(0, 6);

  return (
    <main className="app-main">
      <div className="page-shell seo-landing-shell">
        <header className="seo-landing-hero">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="seo-landing-lead">{intro}</p>
          <div className="seo-landing-actions">
            <Link className="button button-primary" href={primaryAction.href}>{primaryAction.label} <span aria-hidden="true">→</span></Link>
            {secondaryAction && <Link className="button button-secondary" href={secondaryAction.href}>{secondaryAction.label}</Link>}
          </div>
          <div className="seo-landing-stats" aria-label="TheoryPrep highlights">
            <div><strong>{questions.length}</strong><span>questions in the library</span></div>
            <div><strong>40</strong><span>questions in a full mock</span></div>
            <div><strong>Free</strong><span>practice to get started</span></div>
          </div>
        </header>

        <section className="seo-content-section" aria-labelledby="why-theoryprep-title">
          <div className="section-heading seo-section-heading">
            <div><p className="eyebrow">Built for practice</p><h2 id="why-theoryprep-title">A clearer way to prepare.</h2></div>
            <p>TheoryPrep is an independent study resource based on official RSA material, designed to make repeated practice simple.</p>
          </div>
          <div className="seo-feature-grid">
            {sections.map((section) => (
              <article className="seo-feature-card" key={section.title}>
                <h3>{section.title}</h3>
                <p>{section.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="seo-content-section seo-sample-section" aria-labelledby="sample-questions-title">
          <div className="section-heading seo-section-heading">
            <div><p className="eyebrow">From the library</p><h2 id="sample-questions-title">{sampleHeading}</h2></div>
            <p>{sampleDescription}</p>
          </div>
          {sampleQuestions.length > 0 ? (
            <div className="seo-question-list">
              {sampleQuestions.map((question) => (
                <Link className="seo-question-row" href={`/questions/${question.id}`} key={question.id}>
                  <span className="question-list-id">#{question.id}</span>
                  <span className="question-list-copy">
                    <strong>{question.question}</strong>
                    <small>{question.taxonomy.category ? `${question.taxonomy.category}${question.taxonomy.subcategory ? ` · ${question.taxonomy.subcategory}` : ""}` : "Irish driving theory practice"}</small>
                  </span>
                  <span className="row-arrow" aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state"><h2>No sample questions available</h2><p>Browse the full TheoryPrep library instead.</p></div>
          )}
          <div className="seo-section-action"><Link className="button button-secondary" href="/questions">Browse all questions <span aria-hidden="true">→</span></Link></div>
        </section>

        <section className="seo-content-section seo-popular-section" aria-labelledby="popular-pages-title">
          <div className="section-heading seo-section-heading">
            <div><p className="eyebrow">Keep exploring</p><h2 id="popular-pages-title">More ways to practise.</h2></div>
            <p>Jump straight into the part of TheoryPrep you need next.</p>
          </div>
          <div className="seo-link-grid">
            {popularLinks.map((link) => (
              <Link className="seo-link-card" href={link.href} key={link.href}>
                <div><strong>{link.label}</strong><p>{link.description}</p></div><span aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
