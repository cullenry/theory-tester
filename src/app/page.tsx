import Link from "next/link";
import { questions } from "@/lib/questions";

const modes = [
  { number: "01", title: "Practice mode", description: "Work through questions at your own pace, with instant answers and clear explanations.", href: "/practice", action: "Start practising" },
  { number: "02", title: "Mock test", description: "Take a focused 40-question test, then review every answer when you finish.", href: "/mock-test", action: "Take a mock test" },
  { number: "03", title: "Question library", description: "Browse the full question bank, search by phrase and filter by category.", href: "/questions", action: "Browse questions" },
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
            <div className="hero-proof"><strong>{questions.length}</strong><span>questions in the library</span><span className="proof-separator" /><span>Made for Ireland</span></div>
          </div>
          <div className="road-illustration" aria-hidden="true">
            <div className="road-sun" /><div className="road-hill road-hill-back" /><div className="road-hill road-hill-front" />
            <div className="roadway"><span /><span /><span /></div>
            <div className="road-sign"><i /><b>TEST<br />READY</b></div>
            <div className="road-caption">Every journey<br />starts with knowing.</div>
          </div>
        </div>
        <div className="hero-bottom-line"><span>LEARN</span><i /><span>PRACTISE</span><i /><span>DRIVE WITH CONFIDENCE</span></div>
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
