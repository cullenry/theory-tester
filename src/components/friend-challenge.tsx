"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnswerOption, ExplanationCard, ProgressBar, QuestionCard } from "@/components/question-ui";
import { recordQuestionAttempt } from "@/lib/progress";
import { ShareResultButton } from "@/components/share-result-button";
import type { FriendChallengePayload } from "@/lib/challenge-share";
import type { Question } from "@/lib/questions";

type FriendChallengeProps = {
  payload: FriendChallengePayload;
  questions: Question[];
  challengeUrl: string;
};

export function FriendChallenge({ payload, questions, challengeUrl }: FriendChallengeProps) {
  const [position, setPosition] = useState(0);
  const [responses, setResponses] = useState<(string | null)[]>(() => Array.from({ length: questions.length }, () => null));
  const [submitted, setSubmitted] = useState(false);

  const current = questions[position];
  const selected = responses[position];
  const answered = selected !== null;
  const correctCount = useMemo(
    () => questions.reduce((total, question, index) => total + (responses[index] === question.correctAnswer ? 1 : 0), 0),
    [questions, responses],
  );

  function selectAnswer(answer: string) {
    if (answered || !current) return;
    setResponses((items) => items.map((item, index) => index === position ? answer : item));
    void recordQuestionAttempt(current, answer, answer === current.correctAnswer, "daily");
  }

  if (!current || submitted) {
    const resultText = correctCount > payload.score
      ? `I beat ${payload.name}'s ${payload.score}/${payload.total} TheoryPrep challenge! I got ${correctCount}/${payload.total}. 🚗`
      : correctCount === payload.score
        ? `I matched ${payload.name}'s ${payload.score}/${payload.total} TheoryPrep challenge with ${correctCount}/${payload.total}! 🚗`
        : `I got ${correctCount}/${payload.total} on ${payload.name}'s TheoryPrep challenge. Can you beat it? 🚗`;

    return (
      <main className="app-main">
        <div className="page-shell results-shell">
          <section className="completion-panel">
            <span className="completion-mark" aria-hidden="true">{correctCount > payload.score ? "✓" : "↗"}</span>
            <p className="eyebrow">Challenge complete</p>
            <h1>{correctCount} / {payload.total}</h1>
            <p><strong>{payload.name}</strong> scored {payload.score}/{payload.total}. You {correctCount > payload.score ? "beat their score" : correctCount === payload.score ? "matched their score" : "didn’t beat their score"}.</p>
            <div className="results-summary results-summary-four">
              <div><strong>{correctCount}</strong><span>Your score</span></div>
              <div><strong>{payload.score}</strong><span>{payload.name}&apos;s score</span></div>
              <div><strong>{correctCount - payload.score > 0 ? "+" : ""}{correctCount - payload.score}</strong><span>Difference</span></div>
              <div><strong>{Math.round((correctCount / payload.total) * 100)}%</strong><span>Accuracy</span></div>
            </div>
            <div className="results-actions">
              <ShareResultButton title="TheoryPrep challenge result" text={resultText} url={challengeUrl} />
              <button className="button button-secondary" type="button" onClick={() => { setResponses(Array.from({ length: questions.length }, () => null)); setPosition(0); setSubmitted(false); }}>Try again <span aria-hidden="true">↻</span></button>
              <Link className="button button-secondary" href="/practice">Keep practising <span aria-hidden="true">→</span></Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="app-main">
      <div className="page-shell practice-shell">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Challenge from {payload.name}</p>
            <h1>Can you beat {payload.name}?</h1>
          </div>
          <span className="test-chip">{payload.score}/{payload.total} to beat</span>
        </div>
        <div className="practice-meta">
          <ProgressBar current={position + 1} total={questions.length} label="Challenge progress" />
          <div className="score-display"><span>Score</span><strong>{correctCount}</strong><span className="score-divider">/</span><span>{questions.length}</span></div>
        </div>
        <QuestionCard question={current} eyebrow={`Challenge · Question ${position + 1} of ${questions.length}`}>
          {current.answers.map((answer, index) => (
            <AnswerOption
              key={`${current.id}-${index}`}
              answer={answer}
              index={index}
              selected={selected === answer}
              disabled={answered}
              correct={answered && answer === current.correctAnswer}
              incorrect={answered && selected === answer && answer !== current.correctAnswer}
              onSelect={() => selectAnswer(answer)}
            />
          ))}
        </QuestionCard>
        {answered && (
          <div className="feedback-block">
            <p className={`feedback-line ${selected === current.correctAnswer ? "feedback-good" : "feedback-bad"}`} role="status">
              <strong>{selected === current.correctAnswer ? "Correct." : "Not quite."}</strong>{" "}
              {selected === current.correctAnswer ? "That’s right." : "The correct answer is highlighted above."}
            </p>
            <ExplanationCard explanation={current.explanation} />
            <button className="button button-primary continue-button" type="button" onClick={() => {
              if (position === questions.length - 1) setSubmitted(true);
              else setPosition((step) => step + 1);
            }}>
              {position === questions.length - 1 ? "Finish challenge" : "Next question"} <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
