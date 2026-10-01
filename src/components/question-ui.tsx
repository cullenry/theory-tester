import type { ReactNode } from "react";
import type { Question } from "@/lib/questions";
import { QuestionStarButton } from "@/components/question-star-button";
import { ReadingModeToggle } from "@/components/reading-mode-toggle";
import { ReportQuestionButton } from "@/components/report-question-button";

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
    <section className="question-card" aria-labelledby={"question-title-" + question.id} data-question-id={question.id}>
      <div className="question-card-heading">
        <p className="eyebrow">{eyebrow}</p>
        <div className="question-card-tools">
          <ReadingModeToggle />
          <QuestionStarButton questionId={question.id} />
          <ReportQuestionButton questionId={question.id} questionText={question.question} />
        </div>
      </div>
      <h2 className="question-title" id={"question-title-" + question.id}>{question.question}</h2>
      <QuestionImage question={question} />
      <div className="answer-list" role="group" aria-labelledby={"question-title-" + question.id}>{children}</div>
    </section>
  );
}

export function ExplanationCard({ explanation }: { explanation: string | null }) {
  if (!explanation) return null;
  return (
    <aside className="explanation-card" aria-label="Explanation">
      <div className="explanation-heading">
        <span className="explanation-icon" aria-hidden="true">i</span>
        <div><p className="eyebrow">Explanation</p><h2>Why this is the answer</h2></div>
      </div>
      <div className="explanation-copy">{explanation}</div>
    </aside>
  );
}

export function ProgressBar({ current, total, label }: { current: number; total: number; label: string }) {
  const percent = total > 0 ? Math.min(100, (current / total) * 100) : 0;
  return (
    <div className="progress-wrap" aria-label={`${label}: ${current} of ${total}`}>
      <div className="progress-heading"><span id={label.replace(/\s+/g, "-").toLowerCase() + "-label"}>{label}</span><span>{current} of {total}</span></div>
      <div className="progress-track" role="progressbar" aria-labelledby={label.replace(/\s+/g, "-").toLowerCase() + "-label"} aria-valuemin={0} aria-valuemax={total} aria-valuenow={current} aria-valuetext={current + " of " + total}>
        <span className="progress-value" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function ScoreDisplay({ correct, attempted }: { correct: number; attempted: number }) {
  return <p className="score-display"><strong>{correct}</strong><span>correct</span><span className="score-divider" aria-hidden="true">/</span><span>{attempted} answered</span></p>;
}