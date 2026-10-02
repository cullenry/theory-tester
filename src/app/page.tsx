import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { questionDatasetScrapedAt, questions } from "@/lib/questions";
import { HomeStreakWidget } from "@/components/home-streak-widget";
import { DailyMission } from "@/components/daily-mission";
import { HomeExamCountdown } from "@/components/home-exam-countdown";
import { HomeProofWidget } from "@/components/home-proof-widget";

export const metadata: Metadata = {
  title: "Irish Driving Theory Test 2026 | Free Practice & Mock Tests",
  description:
    "Practise the Irish driving theory test in 2026 with 805 questions, clear explanations, topic practice and full mock tests. Free to start with TheoryPrep.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Irish Driving Theory Test 2026 | Free Practice & Mock Tests",
    description:
      "Practise 805 Irish driving theory questions, study by topic and take full mock tests with TheoryPrep.",
    url: "https://theoryprep.irish/",
    siteName: "TheoryPrep",
    locale: "en_IE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/opengraph-image"],
    title: "Irish Driving Theory Test 2026 | Free Practice & Mock Tests",
    description:
      "Practise 805 Irish driving theory questions, study by topic and take full mock tests.",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TheoryPrep",
  url: "https://theoryprep.irish",
  logo: "https://theoryprep.irish/images/theoryprep-logo.png",
  description:
    "Independent Irish driving theory test study resource with practice questions, explanations and mock tests.",
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "TheoryPrep",
  url: "https://theoryprep.irish",
  inLanguage: "en-IE",
  description:
    "Irish driving theory test practice, topic study and mock tests.",
};

const primaryModes = [
  {
    number: "01",
    title: "Practise",
    description: "Answer questions at your own pace, see the explanation straight away and build accuracy over time.",
    href: "/practice",
    action: "Start practising",
  },
  {
    number: "02",
    title: "Learn",
    description: "Work through the question bank step by step with short lessons and focused review.",
    href: "/practice/learn",
    action: "Start learning",
  },
  {
    number: "03",
    title: "Mock test",
    description: "Take a timed test when you want to see how ready you are under realistic conditions.",
    href: "/mock-test",
    action: "Take a mock test",
  },
];

const secondaryLinks = [
  { href: "/questions", label: "Question library", description: "Browse all 805 questions" },
  { href: "/theory-test-topics", label: "Topics", description: "Study one area at a time" },
  { href: "/practice/flashcards", label: "Flashcards", description: "Revise with active recall" },
  { href: "/mistakes", label: "My mistakes", description: "Review questions you missed" },
];

export default function Home() {
  return (
    <main className="home-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      <section className="hero-section">
        <div className="hero-inner">
          <div className="hero-copy">
            <h1>
              Get ready for your
              <br />
              <span className="hero-irish-text" data-text="Irish car theory test.">
                Irish car theory test.
              </span>
            </h1>

            <p className="hero-description">
              Practise {questions.length} Irish car theory questions, learn from clear explanations and take a
              timed mock test when you are ready.
            </p>

            <div className="hero-actions">
              <Link className="button button-primary" href="/practice">
                Start practising <span aria-hidden="true">→</span>
              </Link>
              <Link className="button button-secondary" href="/mock-test">
                Take a mock test
              </Link>
            </div>

            <div className="hero-proof" aria-label="TheoryPrep practice highlights">
              <div className="hero-stat">
                <strong>{questions.length}</strong>
                <span>practice questions</span>
              </div>
              <div className="hero-stat">
                <strong>40</strong>
                <span>questions in a mock</span>
              </div>
              <div className="hero-stat">
                <strong>Free</strong>
                <span>core practice</span>
              </div>
            </div>

            <p className="hero-trust">
              Independent study resource based on official RSA material. Not affiliated with or endorsed by the RSA.
            </p>
            <p className="hero-data-freshness">
              Question bank updated{" "}
              <time dateTime={questionDatasetScrapedAt}>
                {new Date(questionDatasetScrapedAt).toLocaleDateString("en-IE", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            </p>
          </div>

          <div className="hero-art">
            <Image
              src="/images/theorytester-good-luck.png"
              alt="Illustration of a car on an Irish country road with Learn, Practise and Pass signs"
              width={748}
              height={480}
              priority
              sizes="(max-width: 760px) 100vw, 560px"
            />
          </div>
        </div>
        <HomeProofWidget />
      </section>

      <section className="home-start-section" aria-labelledby="home-start-title">
        <div className="section-heading home-start-heading">
          <div>
            <h2 id="home-start-title">Choose one way to prepare.</h2>
          </div>
          <p>
            You do not need to learn everything at once. Pick the route that fits where you are right now.
          </p>
        </div>

        <div className="home-primary-modes">
          {primaryModes.map((mode, index) => (
            <Link className={index === 0 ? "home-primary-mode home-primary-mode-featured" : "home-primary-mode"} href={mode.href} key={mode.number}>
              <span className="home-primary-mode-number">{mode.number}</span>
              <div>
                <h3>{mode.title}</h3>
                <p>{mode.description}</p>
              </div>
              <span className="home-primary-mode-action">
                {mode.action} <span aria-hidden="true">↗</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="home-learning-widgets">
        <HomeStreakWidget />
        <HomeExamCountdown />
        <DailyMission />
      </div>

      <section className="seo-content-section seo-home-guide-section" aria-labelledby="seo-home-guide-title">
        <div className="section-heading seo-section-heading">
          <div>
            <h2 id="seo-home-guide-title">Choose what to focus on next.</h2>
          </div>
          <p>
            Browse questions, study one topic at a time, revise with flashcards or revisit anything you missed.
          </p>
        </div>

        <div className="home-resource-grid">
          {secondaryLinks.map((item) => (
            <Link className="home-resource-card" href={item.href} key={item.href}>
              <span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
              <span aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="seo-links-section" aria-labelledby="seo-links-title">
        <div className="section-heading">
          <div>
            <h2 id="seo-links-title">Explore the test topics.</h2>
          </div>
          <p>Focused guides to practice, questions, road signs and the mock test.</p>
        </div>

        <div className="seo-home-links">
          <Link href="/theory-test-practice">Irish theory test practice <span aria-hidden="true">↗</span></Link>
          <Link href="/theory-test-questions">Irish theory test questions <span aria-hidden="true">↗</span></Link>
          <Link href="/irish-theory-test-mock-test">Irish theory test mock test <span aria-hidden="true">↗</span></Link>
          <Link href="/irish-road-signs">Irish road signs practice <span aria-hidden="true">↗</span></Link>
          <Link href="/irish-driving-theory-test">Irish driving theory test guide <span aria-hidden="true">↗</span></Link>
          <Link href="/theory-test-topics">Irish theory test topics <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <footer className="site-footer">
        <Link className="brand footer-brand" href="/" aria-label="TheoryPrep home">
          <Image
            className="footer-brand-logo footer-brand-logo-light"
            src="/images/theoryprep-logo.png"
            alt="TheoryPrep"
            width={102}
            height={61}
          />
          <Image
            className="footer-brand-logo footer-brand-logo-dark"
            src="/images/theoryprep-logo-dark.png"
            alt=""
            width={102}
            height={61}
            aria-hidden="true"
          />
        </Link>
        <span>Practice with purpose. Drive with confidence.</span>
        <nav className="site-footer-links" aria-label="Footer">
          <Link href="/feedback">Feedback</Link>
          <Link href="/support" className="support-link">Support me</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/questions">Questions</Link>
        </nav>
      </footer>
    </main>
  );
}
