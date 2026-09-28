import type { ReactNode } from "react";
import type { Question } from "@/lib/questions";

type AnswerOptionProps = {
  answer: string;
  index: number;
  selected: boolean;
  correct: boolean;
  incorrect: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

export function AnswerOption({ answer, index, selected, correct, incorrect, disabled = false, onSelect }: AnswerOptionProps) {
  const stateClass = correct ? " answer-correct" : incorrect ? " answer-incorrect" : selected ? " answer-selected" : "";
  const status = correct ? "Correct answer" : incorrect ? "Your answer" : "";
  return (
    <button className={`answer-option${stateClass}`} type="button" disabled={disabled} aria-pressed={selected} onClick={onSelect}>
      <span className="answer-letter" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
      <span className="answer-text">{answer}</span>
      {status && <span className="answer-status">{status}</span>}
    </button>
  );
}

export function QuestionImage({ question }: { question: Question }) {
  if (!question.image) return null;
  return (
    <figure className="question-image-wrap">
      {/* Keep scraped source URLs intact and render without Next image optimization. */}
      <img className="question-image" src={question.image} alt="Illustration for this driving theory question" />
    </figure>
  );
}

export function QuestionCard({ question, eyebrow, children }: { question: Question; eyebrow: string; children: ReactNode }) {
  return (
    <section className="question-card" aria-labelledby="question-title" data-question-id={question.id}>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="question-title" id="question-title">{question.question}</h1>
      <QuestionImage question={question} />
      <div className="answer-list">{children}</div>
    </section>
  );
}

export function ExplanationCard({ explanation }: { explanation: string | null }) {
  if (!explanation) return null;
  return (
    <aside className="explanation-card" aria-label="Explanation">
      <span className="explanation-icon" aria-hidden="true">i</span>
      <div><h2>Why this is the answer</h2><p>{explanation}</p></div>
    </aside>
  );
}

export function ProgressBar({ current, total, label }: { current: number; total: number; label: string }) {
  const percent = total > 0 ? Math.min(100, (current / total) * 100) : 0;
  return (
    <div className="progress-wrap" aria-label={`${label}: ${current} of ${total}`}>
      <div className="progress-heading"><span>{label}</span><span>{current} of {total}</span></div>
      <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={current}>
        <span className="progress-value" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function ScoreDisplay({ correct, attempted }: { correct: number; attempted: number }) {
  return <p className="score-display"><strong>{correct}</strong><span>correct</span><span className="score-divider" aria-hidden="true">/</span><span>{attempted} answered</span></p>;
}