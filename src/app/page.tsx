import Image from "next/image";
import Link from "next/link";
import { questions } from "@/lib/questions";
import { HomeStreakWidget } from "@/components/home-streak-widget";

const modes = [
  { number: "01", title: "Practice mode", description: "Work through questions at your own pace, with instant answers and clear explanations.", href: "/practice", action: "Start practising" },
  { number: "02", title: "Mock test", description: "Take a focused 40-question test, then review every answer when you finish.", href: "/mock-test", action: "Take a mock test" },
  { number: "03", title: "Question library", description: "Browse the full question bank, search by phrase and filter by category.", href: "/questions", action: "Browse questions" },
  { number: "04", title: "Daily challenge", description: "Take ten fresh questions each day and keep your practice streak moving.", href: "/challenge", action: "Take today’s challenge" },
];

export default function Home() {
  return (
    <main>
      <section className="hero-section">
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow hero-eyebrow"><span className="live-dot" /> Irish driver theory practice</p>
            <h1>Know the road.<br /><span>Own the test.</span></h1>
            <p className="hero-description">Build real confidence with Irish driving theory questions, useful explanations and practice that fits your day.</p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/practice">Start Practising <span aria-hidden="true">→</span></Link>
              <Link className="button button-secondary" href="/mock-test">Take a Mock Test</Link>
            </div>
            <div className="hero-proof"><strong>{questions.length}</strong><span>questions in the library</span><span className="proof-separator" /><span>Based on official RSA material</span></div>
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
        <div className="hero-bottom-line"><span>LEARN</span><i /><span>PRACTISE</span><i /><span>DRIVE WITH CONFIDENCE</span></div>
      </section>

      <HomeStreakWidget />

      <section className="pathway-section" aria-labelledby="pathway-title">
        <div className="pathway-copy">
          <p className="eyebrow">A simple route to test day</p>
          <h2 id="pathway-title">Learn. Practise. Pass.</h2>
          <p>Start by getting familiar with the rules, build confidence with focused practice, then put yourself under time pressure with a mock test.</p>
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
      <footer className="site-footer"><Link className="brand" href="/"><span className="brand-mark" aria-hidden="true">T</span><span>Theory<span className="brand-accent">Tester</span></span></Link><span>Practice with purpose. Drive with confidence.</span><Link href="/questions">Explore the question library <span aria-hidden="true">→</span></Link></footer>
    </main>
  );
}
