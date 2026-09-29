import Image from "next/image";
import Link from "next/link";
import { questions } from "@/lib/questions";
import { HomeStreakWidget } from "@/components/home-streak-widget";
import { DailyMission } from "@/components/daily-mission";
import { HomeExamCountdown } from "@/components/home-exam-countdown";
import { HomeProofWidget } from "@/components/home-proof-widget";

const modes = [
  { number: "01", title: "Learn & Practice", description: "Build weak spots, reinforce what you know and practise questions at your own pace.", href: "/practice", action: "Start free practice" },
  { number: "02", title: "Mock test", description: "Take a timed 40-question car theory test, then review every answer when you finish.", href: "/mock-test", action: "Take the mock test" },
  { number: "03", title: "Question library", description: "Browse all 805 questions, search by phrase and filter by category.", href: "/questions", action: "Browse 805 questions" },
  { number: "04", title: "Daily challenge", description: "Take ten fresh questions each day and keep your practice streak moving.", href: "/challenge", action: "Take today’s challenge" },
];

export default function Home() {
  return (
    <main>
      <section className="hero-section">
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow hero-eyebrow"><span className="live-dot" /> Free Irish car theory test practice</p>
            <h1>Get ready for your<br /><span>Irish car theory test.</span></h1>
            <p className="hero-description">Practise 805 Irish car theory questions, learn from clear explanations and take timed mock tests — all in your browser. Category B (BW) is the car theory test.</p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/practice">Start free practice <span aria-hidden="true">→</span></Link>
              <Link className="button button-secondary" href="/mock-test">Take a mock test</Link>
            </div>
            <div className="hero-proof"><strong>{questions.length}</strong><span>practice questions</span><span className="proof-separator" /><strong>40</strong><span>questions in a mock</span><span className="proof-separator" /><span>Free to start</span></div><p className="hero-trust">Independent study resource based on official RSA material.</p>
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
        <div className="hero-bottom-line"><span>805 QUESTIONS</span><i /><span>40-QUESTION MOCK</span><i /><span>FREE TO START</span></div>
        <HomeProofWidget />
      </section>

      <div className="home-learning-widgets">
        <HomeStreakWidget />
        <HomeExamCountdown />
        <DailyMission />
      </div>

      <section className="pathway-section" aria-labelledby="pathway-title">
        <div className="pathway-copy">
          <p className="eyebrow">A simple route to test day</p>
          <h2 id="pathway-title">Learn. Practise. Get test-ready.</h2>
          <p>Start with the rules, strengthen weak areas with focused practice, then put yourself under time pressure with a timed mock test.</p>
          <Link className="button button-secondary" href="/practice">Start practising <span aria-hidden="true">→</span></Link>
        </div>
        <div className="pathway-art">
          <Image
            src="/images/theorytester-learn-practise-pass.png"
            alt="Illustration showing learn, practise and pass for Irish driving theory preparation"
            width={745}
            height={480}
            sizes="(max-width: 760px) 100vw, 520px"
          />
        </div>
      </section>

      <section className="modes-section" aria-labelledby="modes-title">
        <div className="section-heading">
          <div><p className="eyebrow">Your next step</p><h2 id="modes-title">Practice your way.</h2></div>
          <p>Whether you have five minutes or a full study session, there’s a good place to begin.</p>
        </div>
        <div className="mode-list">
          {modes.map((mode) => (
            <Link className="mode-row" href={mode.href} key={mode.number}>
              <span className="mode-number">{mode.number}</span>
              <div className="mode-copy"><h3>{mode.title}</h3><p>{mode.description}</p></div>
              <span className="mode-action">{mode.action}<span aria-hidden="true"> ↗</span></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="seo-links-section" aria-labelledby="seo-links-title">
        <div className="section-heading">
          <div><p className="eyebrow">Popular searches</p><h2 id="seo-links-title">Find the right place to start.</h2></div>
          <p>Jump straight to the TheoryPrep guide or practice page that matches what you are looking for.</p>
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
            className="footer-brand-logo"
            src="/images/theoryprep-logo.png"
            alt="TheoryPrep"
            width={102}
            height={61}
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
