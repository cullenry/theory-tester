"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnswerOption, ExplanationCard, ProgressBar, QuestionCard } from "@/components/question-ui";
import { getDailyChallengeDate, getDailyChallengeQuestions } from "@/lib/daily-challenge";
import { recordQuestionAttempt } from "@/lib/progress";

export function DailyChallenge() {
  const challengeDate = getDailyChallengeDate();
  const challenge = useMemo(() => getDailyChallengeQuestions(), []);
  const [position, setPosition] = useState(0);
  const [responses, setResponses] = useState<(string | null)[]>(() => Array.from({ length: 10 }, () => null));
  const [submitted, setSubmitted] = useState(false);
  const current = challenge[position];
  const selected = responses[position];
  const answered = selected !== null;
  const correctCount = challenge.reduce((total, question, index) => total + (responses[index] === question.correctAnswer ? 1 : 0), 0);

  if (!current || submitted) return <main className="app-main"><div className="page-shell results-shell"><section className="completion-panel"><span className="completion-mark" aria-hidden="true">✓</span><p className="eyebrow">Daily Challenge complete</p><h2>{correctCount} / 10</h2><p>You finished today’s challenge. Come back tomorrow for a new set of ten.</p><div className="practice-completion-actions">{correctCount < challenge.length && <Link className="button button-primary" href="/mistakes">Review mistakes <span aria-hidden="true">→</span></Link>}<Link className="button button-secondary" href="/practice">Keep practising <span aria-hidden="true">→</span></Link><Link className="button button-secondary" href="/progress">See my progress</Link></div></section></div></main>;

  return <main className="app-main"><div className="page-shell practice-shell">
    <div className="page-heading"><div><p className="eyebrow">Daily Challenge · {challengeDate}</p><h1>10 for today.</h1></div><Link className="button button-secondary" href="/progress">My progress</Link></div>
    <div className="practice-meta"><ProgressBar current={position + 1} total={challenge.length} label="Challenge progress" /><div className="score-display"><span>Score</span><strong>{correctCount}</strong><span className="score-divider">/</span><span>{challenge.length}</span></div></div>
    <QuestionCard question={current} eyebrow={"Daily Challenge · Question " + (position + 1)}>{current.answers.map((answer, index) => <AnswerOption key={current.id + "-" + index} answer={answer} index={index} selected={selected === answer} disabled={answered} correct={answered && answer === current.correctAnswer} incorrect={answered && selected === answer && answer !== current.correctAnswer} onSelect={() => { if (answered) return; setResponses((items) => items.map((item, responseIndex) => responseIndex === position ? answer : item)); void recordQuestionAttempt(current, answer, answer === current.correctAnswer, "daily"); }} />)}</QuestionCard>
    {answered && <div className="feedback-block"><p className={"feedback-line " + (selected === current.correctAnswer ? "feedback-good" : "feedback-bad")} role="status"><strong>{selected === current.correctAnswer ? "Correct." : "Not quite."}</strong> {selected === current.correctAnswer ? "That’s right." : "The correct answer is highlighted above."}</p><ExplanationCard explanation={current.explanation} /><button className="button button-primary continue-button" type="button" onClick={() => { if (position === challenge.length - 1) setSubmitted(true); else setPosition((step) => step + 1); }}>{position === challenge.length - 1 ? "Finish challenge" : "Next question"} <span aria-hidden="true">→</span></button></div>}
  </div></main>;
}
