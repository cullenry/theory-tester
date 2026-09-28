"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnswerOption, ExplanationCard, ProgressBar, QuestionCard } from "@/components/question-ui";
import { questions, type Question } from "@/lib/questions";
import { getProgressData, recordQuestionAttempt, type QuestionAttempt } from "@/lib/progress";
import { buildLearningPlan, type LearningItem } from "@/lib/learning";

const LEARN_LENGTH = 20;

type Phase = "core" | "retry" | "complete";

function buildPlanFromAttempts(attempts: QuestionAttempt[]) {
  return buildLearningPlan(questions, attempts, LEARN_LENGTH);
}

function kindLabel(item: LearningItem) {
  if (item.kind === "focus") return "Focus on a weak spot";
  if (item.kind === "reinforce") return "Reinforcement";
  return "New question";
}

export function LearnSession() {
  const [loading, setLoading] = useState(true);
  const [userSignedIn, setUserSignedIn] = useState(false);
  const [plan, setPlan] = useState<LearningItem[]>([]);
  const [phase, setPhase] = useState<Phase>("core");
  const [position, setPosition] = useState(0);
  const [retryIds, setRetryIds] = useState<number[]>([]);
  const [retryPosition, setRetryPosition] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [coreCorrectCount, setCoreCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [retryCorrectCount, setRetryCorrectCount] = useState(0);

  useEffect(() => {
    let active = true;

    getProgressData(2000).then((data) => {
      if (!active) return;
      setUserSignedIn(Boolean(data.user));
      setPlan(buildPlanFromAttempts(data.attempts));
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const current: Question | null =
    phase === "core"
      ? plan[position]?.question ?? null
      : phase === "retry"
        ? questions.find((question) => question.id === retryIds[retryPosition]) ?? null
        : null;

  const currentItem = phase === "core" ? plan[position] ?? null : null;
  const totalDisplayed = plan.length + retryIds.length;
  const progressCurrent = phase === "retry" ? plan.length + retryPosition + 1 : position + 1;
  const progressTotal = Math.max(1, totalDisplayed || plan.length);

  function handleAnswer(answer: string) {
    if (!current || selected !== null) return;

    const isCorrect = answer === current.correctAnswer;
    setSelected(answer);

    if (isCorrect) {
      setCorrectCount((count) => count + 1);
      if (phase === "retry") {
        setRetryCorrectCount((count) => count + 1);
      } else {
        setCoreCorrectCount((count) => count + 1);
      }
    } else {
      setWrongCount((count) => count + 1);
      if (phase === "core") {
        setRetryIds((currentIds) => currentIds.includes(current.id) ? currentIds : [...currentIds, current.id]);
      }
    }

    void recordQuestionAttempt(current, answer, isCorrect, "smart");
  }

  function nextStep() {
    setSelected(null);

    if (phase === "core") {
      if (position + 1 < plan.length) {
        setPosition((index) => index + 1);
        return;
      }

      if (retryIds.length > 0) {
        setPhase("retry");
        setRetryPosition(0);
        return;
      }

      setPhase("complete");
      return;
    }

    if (phase === "retry") {
      if (retryPosition + 1 < retryIds.length) {
        setRetryPosition((index) => index + 1);
        return;
      }
      setPhase("complete");
    }
  }

  async function restart() {
    setLoading(true);
    setPhase("core");
    setPosition(0);
    setRetryIds([]);
    setRetryPosition(0);
    setSelected(null);
    setCorrectCount(0);
    setCoreCorrectCount(0);
    setWrongCount(0);
    setRetryCorrectCount(0);

    const data = await getProgressData(2000);
    setUserSignedIn(Boolean(data.user));
    setPlan(buildPlanFromAttempts(data.attempts));
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="app-main">
        <div className="page-shell practice-shell">
          <div className="learn-loading">Building your personalised learning set…</div>
        </div>
      </main>
    );
  }

  if (phase === "complete") {
    return (
      <main className="app-main">
        <div className="page-shell results-shell">
          <div className="learn-complete-card">
            <p className="eyebrow">Learn session complete</p>
            <h1>Good work. Your weak spots got another look.</h1>
            <p>
              You answered {plan.length} core questions, got {correctCount} right and revisited {retryIds.length} question{retryIds.length === 1 ? "" : "s"} you missed.
            </p>
            <div className="results-summary results-summary-four">
              <div><strong>{coreCorrectCount}</strong><span>Core correct</span></div>
              <div><strong>{wrongCount}</strong><span>Core missed</span></div>
              <div><strong>{retryIds.length}</strong><span>Retry round</span></div>
              <div><strong>{retryCorrectCount}</strong><span>Retry correct</span></div>
            </div>
            <div className="results-actions">
              <button className="button button-primary" type="button" onClick={restart}>Start another Learn session <span aria-hidden="true">↻</span></button>
              <Link className="button button-secondary" href="/practice">Back to Practice</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!current) return null;

  const isRetry = phase === "retry";

  return (
    <main className="app-main">
      <div className="page-shell practice-shell">
        <div className="page-heading">
          <div>
            <p className="eyebrow">{isRetry ? "Review round" : "Personalised learning"}</p>
            <h1>Learn</h1>
          </div>
          <div className="learn-heading-actions">
            <button className="button button-quiet" type="button" onClick={restart}>↻ <span>Restart</span></button>
            <Link className="button button-secondary" href="/practice">Exit</Link>
          </div>
        </div>

        {!isRetry && (
          <div className="learn-intro-strip">
            <div>
              <span className="learn-status-dot" aria-hidden="true" />
              <div>
                <strong>{userSignedIn ? "Built from your practice history." : "Personalisation starts when you sign in."}</strong>
                <p>
                  {userSignedIn
                    ? "More weight goes to questions you struggle with, spaced reviews and a few questions you have already answered correctly."
                    : "This session still uses a varied learning mix. Sign in so future Learn sessions can adapt to your own results."}
                </p>
              </div>
            </div>
            {!userSignedIn && <Link className="learn-signin-link" href="/login">Sign in →</Link>}
          </div>
        )}

        <ProgressBar
          current={progressCurrent}
          total={progressTotal}
          label={isRetry ? "Review progress" : "Learning progress"}
        />

        <div className="learn-session-note">
          <span className="learn-kind-badge">{isRetry ? "Retry the ones you missed" : currentItem ? kindLabel(currentItem) : "Learning question"}</span>
          {!isRetry && <span className="learn-session-note-copy">Wrong answers return after the core set.</span>}
        </div>

        <QuestionCard question={current} eyebrow={(current.taxonomy.category ?? "General") + " · Question " + progressCurrent}>
          {current.answers.map((answer, index) => (
            <AnswerOption
              key={current.id + "-" + index}
              answer={answer}
              index={index}
              selected={selected === answer}
              disabled={selected !== null}
              correct={selected !== null && answer === current.correctAnswer}
              incorrect={selected === answer && answer !== current.correctAnswer}
              onSelect={() => handleAnswer(answer)}
            />
          ))}
        </QuestionCard>

        {selected !== null && (
          <div className="feedback-block">
            <p className={"feedback-line " + (selected === current.correctAnswer ? "feedback-good" : "feedback-bad")} role="status">
              <strong>{selected === current.correctAnswer ? "Correct." : "Not quite."}</strong>{" "}
              {isRetry
                ? selected === current.correctAnswer
                  ? "That revisit is sticking."
                  : "Keep the explanation in mind and try to recall it again later."
                : selected === current.correctAnswer
                  ? "We will still revisit other material to strengthen retention."
                  : "We’ll bring this question back in the review round."}
            </p>
            <ExplanationCard explanation={current.explanation} />
            <button className="button button-primary continue-button" type="button" onClick={nextStep}>
              {phase === "core" && position + 1 === plan.length
                ? retryIds.length > 0 ? "Start review round" : "Finish Learn"
                : phase === "retry" && retryPosition + 1 === retryIds.length
                  ? "Finish Learn"
                  : "Next question"}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
