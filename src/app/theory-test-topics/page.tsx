import type { Metadata } from "next";
import Link from "next/link";
import { seoTopicPages } from "@/lib/seo-topics";
import { questions } from "@/lib/questions";

export const metadata: Metadata = {
  title: "Irish Theory Test Topics",
  description: "Browse Irish driving theory test topics on TheoryPrep, including road positioning, hazards, vehicle safety, road law and more.",
  alternates: { canonical: "/theory-test-topics" },
};

export default function TheoryTestTopicsPage() {
  return (
    <main className="app-main">
      <div className="page-shell seo-landing-shell">
        <header className="seo-landing-hero">
          <p className="eyebrow">Topic practice</p>
          <h1>Irish Theory Test Topics</h1>
          <p className="seo-landing-lead">
            Focus your revision on a specific area of the Irish driving theory test, then return to mixed practice when you are ready.
          </p>
          <div className="seo-landing-actions">
            <Link className="button button-primary" href="/practice">Start practice <span aria-hidden="true">→</span></Link>
            <Link className="button button-secondary" href="/mock-test">Take a mock test</Link>
          </div>
          <div className="seo-landing-stats" aria-label="TheoryPrep highlights">
            <div><strong>{questions.length}</strong><span>questions in the library</span></div>
            <div><strong>10</strong><span>focused topic areas</span></div>
            <div><strong>Free</strong><span>practice to get started</span></div>
          </div>
        </header>

        <section className="seo-content-section" aria-labelledby="topic-list-title">
          <div className="section-heading seo-section-heading">
            <div><p className="eyebrow">Choose a topic</p><h2 id="topic-list-title">Practise what you need most.</h2></div>
            <p>Each topic page includes focused questions from the TheoryPrep library plus links into practice.</p>
          </div>
          <div className="seo-link-grid">
            {seoTopicPages.map((topic) => (
              <Link className="seo-link-card" href={`/theory-test-topics/${topic.slug}`} key={topic.slug}>
                <div>
                  <strong>{topic.title.replace(" Questions", "")}</strong>
                  <p>{topic.description}</p>
                </div>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="seo-content-section" aria-labelledby="next-step-title">
          <div className="section-heading seo-section-heading">
            <div><p className="eyebrow">After focused practice</p><h2 id="next-step-title">Test your wider knowledge.</h2></div>
            <p>Switch from topic practice to a full mock when you want to practise without choosing the subject first.</p>
          </div>
          <div className="seo-landing-actions">
            <Link className="button button-primary" href="/irish-theory-test-mock-test">Take a mock test <span aria-hidden="true">→</span></Link>
            <Link className="button button-secondary" href="/theory-test-questions">Browse questions</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
