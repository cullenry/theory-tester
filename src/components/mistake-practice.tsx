"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnswerOption, ExplanationCard, ProgressBar, QuestionCard } from "@/components/question-ui";
import { questions, type Question } from "@/lib/questions";
import { getMistakeQuestionIds, recordQuestionAttempt } from "@/lib/progress";

const SESSION_LENGTH = 20;

export function MistakePractice() {
  const [mistakes, setMistakes] = useState<Question[] | null>(null);
  const [session, setSession] = useState<Question[] | null>(null);
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    getMistakeQuestionIds().then((ids) => {
      setMistakes(ids.map((id) => questions.find((question) => question.id === id)).filter((question): question is Question => Boolean(question)));
    });
  }, []);

  const start = () => {
    if (!mistakes?.length) return;
    const shuffled = [...mistakes];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    setSession(shuffled.slice(0, SESSION_LENGTH));
    setPosition(0);
    setSelected(null);
    setCorrectCount(0);
  };

  if (mistakes === null) return <main className="app-main"><div className="page-shell progress-shell"><div className="progress-loading">Loading your saved mistakes…</div></div></main>;

  if (!mistakes.length) return <main className="app-main"><div className="page-shell progress-shell"><section className="empty-state progress-login-state"><p className="eyebrow">Personalised practice</p><h1>Nothing to revisit yet.</h1><p>Answer some practice or mock-test questions first. When you miss a question, it will appear here.</p><div className="progress-cta-row"><Link className="button button-primary" href="/practice">Start practising <span aria-hidden="true">→</span></Link><Link className="button button-secondary" href="/progress">My progress</Link></div></section></div></main>;

  if (session === null) return <main className="app-main"><div className="page-shell progress-shell"><section className="practice-setup question-card mistake-setup-card"><p className="eyebrow">Personalised practice</p><h1>Practise your mistakes.</h1><p className="mistakes-setup-copy">We found {mistakes.length} question{mistakes.length === 1 ? "" : "s"} you have previously answered incorrectly. We’ll build a focused session from them.</p><div className="mistake-count-strip"><span>{Math.min(SESSION_LENGTH, mistakes.length)}</span><small>questions in your next session</small></div><div className="progress-cta-row"><button className="button button-primary" type="button" onClick={start}>Start mistake practice <span aria-hidden="true">→</span></button><Link className="button button-secondary" href="/progress">Back to progress</Link></div></section></div></main>;

  const current = session[position];
  const answered = selected !== null;

  if (!current) return <main className="app-main"><div className="page-shell progress-shell"><section className="completion-panel"><span className="completion-mark" aria-hidden="true">✓</span><p className="eyebrow">Mistake practice complete</p><h2>{correctCount} / {session.length}</h2><p>Nice work. Keep revisiting missed questions until they become easy.</p><div className="progress-cta-row"><button className="button button-primary" type="button" onClick={start}>Practise again <span aria-hidden="true">↻</span></button><Link className="button button-secondary" href="/progress">See my progress</Link></div></section></div></main>;

  return <main className="app-main"><div className="page-shell practice-shell">
    <div className="page-heading"><div><p className="eyebrow">Personalised practice</p><h1>Your mistakes.</h1></div><Link className="button button-secondary" href="/progress">My progress</Link></div>
    <div className="practice-meta"><ProgressBar current={position + 1} total={session.length} label="Mistake practice progress" /><div className="score-display"><span>Score</span><strong>{correctCount}</strong><span className="score-divider">/</span><span>{position + (answered ? 1 : 0)}</span></div></div>
    <QuestionCard question={current} eyebrow={(current.taxonomy.category ?? "General") + " · Question " + (position + 1)}>{current.answers.map((answer, index) => <AnswerOption key={current.id + "-" + index} answer={answer} index={index} selected={selected === answer} disabled={answered} correct={answered && answer === current.correctAnswer} incorrect={answered && selected === answer && answer !== current.correctAnswer} onSelect={() => { if (answered) return; setSelected(answer); if (answer === current.correctAnswer) setCorrectCount((score) => score + 1); void recordQuestionAttempt(current, answer, answer === current.correctAnswer, "smart"); }} />)}</QuestionCard>
    {answered && <div className="feedback-block"><p className={"feedback-line " + (selected === current.correctAnswer ? "feedback-good" : "feedback-bad")} role="status"><strong>{selected === current.correctAnswer ? "Correct." : "Not quite."}</strong> {selected === current.correctAnswer ? "You got this one right this time." : "Keep this one on your radar."}</p><ExplanationCard explanation={current.explanation} /><button className="button button-primary continue-button" type="button" onClick={() => { setPosition((step) => step + 1); setSelected(null); }}>{position + 1 === session.length ? "Finish session" : "Next question"} <span aria-hidden="true">→</span></button></div>}
  </div></main>;
}
