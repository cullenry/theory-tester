"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnswerOption, ProgressBar, QuestionCard } from "@/components/question-ui";
import { getRandomQuestions, type Question } from "@/lib/questions";
import { recordMockTest, recordQuestionAttempt } from "@/lib/progress";
import { ShareResultButton } from "@/components/share-result-button";

const TEST_FORMATS = [
  { id: "full", title: "Full Mock Exam", questionCount: 40, durationMinutes: 45, description: "Full timed exam experience" },
  { id: "blitz-20", title: "20 Question Blitz", questionCount: 20, durationMinutes: 20, description: "A shorter timed challenge" },
  { id: "blitz-10", title: "10 Question Blitz", questionCount: 10, durationMinutes: 10, description: "Quick timed practice" },
] as const;

type MockTestFormat = (typeof TEST_FORMATS)[number];

type MockTestSessionProps = {
  initialQuestions: Question[];
  initialDurationSeconds?: number;
  debugTimerEnabled?: boolean;
};

type TestFormatCardProps = {
  format: MockTestFormat;
  onStart: (format: MockTestFormat) => void;
  featured?: boolean;
};

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function TestFormatCard({ format, onStart, featured = false }: TestFormatCardProps) {
  return (
    <article className={`mock-format-card${featured ? " mock-format-featured" : ""}`}>
      <h3>{format.title}</h3>
      <p className="mock-format-stats">{format.questionCount} questions <span aria-hidden="true">·</span> {format.durationMinutes} minutes</p>
      <p className="mock-format-description">{format.description}</p>
      <p className="mock-format-details">{format.id === "full" ? "For Category A & B preparation: 40 questions, 45 minutes. Review every answer when you finish." : "Timed quick practice using random questions from the full library."}</p>
      <button className="button button-primary" type="button" onClick={() => onStart(format)}>Start {format.title}<span aria-hidden="true">→</span></button>
    </article>
  );
}

export function MockTestSession({ initialQuestions, initialDurationSeconds = 45 * 60, debugTimerEnabled = false }: MockTestSessionProps) {
  const [test, setTest] = useState(initialQuestions);
  const [activeFormat, setActiveFormat] = useState<MockTestFormat>(TEST_FORMATS[0]);
  const [position, setPosition] = useState(0);
  const [responses, setResponses] = useState<(string | null)[]>(() => Array.from({ length: initialQuestions.length }, () => null));
  const [hasStarted, setHasStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(initialDurationSeconds);
  const deadlineRef = useRef<number | null>(null);
  const submissionRef = useRef(false);
  const recordedResultRef = useRef(false);
  const durationSecondsRef = useRef(initialDurationSeconds);
  const current = test[position];
  const correctCount = test.reduce((total, question, index) => total + (responses[index] !== null && responses[index] === question.correctAnswer ? 1 : 0), 0);
  const answeredCount = responses.filter((response) => response !== null).length;
  const incorrectCount = answeredCount - correctCount;
  const unansweredCount = test.length - answeredCount;
  const percentage = test.length ? Math.round((correctCount / test.length) * 100) : 0;

  useEffect(() => {
    if (!hasStarted || submitted) return;
    if (deadlineRef.current === null) deadlineRef.current = Date.now() + durationSecondsRef.current * 1000;

    const intervalId = window.setInterval(() => {
      const deadline = deadlineRef.current;
      if (deadline === null) return;
      const secondsRemaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeRemaining((currentTime) => currentTime === secondsRemaining ? currentTime : secondsRemaining);

      if (secondsRemaining === 0 && !submissionRef.current) {
        submissionRef.current = true;
        setTimeExpired(true);
        setSubmitted(true);
      }
    }, 200);

    return () => window.clearInterval(intervalId);
  }, [hasStarted, submitted]);

  const startTest = (format: MockTestFormat, nextTest = getRandomQuestions(format.questionCount)) => {
    const durationSeconds = debugTimerEnabled ? initialDurationSeconds : format.durationMinutes * 60;
    submissionRef.current = false;
    recordedResultRef.current = false;
    deadlineRef.current = null;
    durationSecondsRef.current = durationSeconds;
    setActiveFormat(format);
    setTest(nextTest);
    setPosition(0);
    setResponses(Array.from({ length: nextTest.length }, () => null));
    setTimeRemaining(durationSeconds);
    setTimeExpired(false);
    setSubmitted(false);
    setHasStarted(true);
  };

  const submitTest = () => {
    if (submissionRef.current) return;
    submissionRef.current = true;
    const deadline = deadlineRef.current;
    const expired = deadline !== null && Date.now() >= deadline;
    setTimeExpired(expired);
    if (expired) {
      setTimeRemaining(0);
    } else if (deadline !== null) {
      setTimeRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }
    setSubmitted(true);
  };

  const retakeTest = () => {
    startTest(activeFormat);
  };

  useEffect(() => {
    if (!submitted || recordedResultRef.current) return;
    recordedResultRef.current = true;

    void recordMockTest({
      formatId: activeFormat.id,
      questionCount: test.length,
      correctCount,
      answeredCount,
      percentage,
      timeExpired,
      questionIds: test.map((question) => question.id),
      responses,
    });

    void Promise.all(
      test.map((question, index) =>
        recordQuestionAttempt(
          question,
          responses[index],
          responses[index] !== null && responses[index] === question.correctAnswer,
          "mock",
        ),
      ),
    );
  }, [submitted, activeFormat, test, responses, correctCount, answeredCount, percentage, timeExpired]);

  if (!hasStarted) {
    return (
      <main className="app-main"><div className="page-shell practice-shell">
        <div className="page-heading"><div><p className="eyebrow">Timed exam</p><h1>Mock test</h1></div></div>
        <section className="mock-format-section" aria-labelledby="mock-config-title">
          <div className="mock-format-heading-row">
            <div className="mock-format-heading"><p className="eyebrow">Test format</p><h2 id="mock-config-title">Choose a test format</h2></div>
            <div className="mock-format-heading-art">
              <Image
                src="/images/theorytester-test-ready.png"
                alt="Illustration of an Irish road with a Test Ready sign"
                width={745}
                height={460}
                sizes="260px"
              />
            </div>
          </div>
          <div className="mock-format-grid">
            <TestFormatCard format={TEST_FORMATS[0]} featured onStart={(format) => startTest(format, initialQuestions)} />
            <h3 className="mock-quick-heading">Quick tests</h3>
            {TEST_FORMATS.slice(1).map((format) => <TestFormatCard format={format} key={format.id} onStart={startTest} />)}
          </div>
          {debugTimerEnabled && <p className="debug-timer-note">Development timer override: 5 seconds</p>}
        </section>
      </div></main>
    );
  }

  if (submitted) {
    return (
      <main className="app-main"><div className="page-shell results-shell">
        <div className="page-heading"><div><p className="eyebrow">{timeExpired ? "Time limit reached" : "Mock test complete"}</p><h1>{activeFormat.title} Complete</h1></div><span className="result-grade">{percentage}%</span></div>
        <div className="result-scoreline"><strong>{correctCount} / {test.length}</strong><span>{percentage}% correct</span></div>
        <div className="results-summary results-summary-four"><div><strong>{correctCount}</strong><span>Correct</span></div><div><strong>{incorrectCount}</strong><span>Incorrect</span></div><div><strong>{unansweredCount}</strong><span>Unanswered</span></div><div><strong>{percentage}%</strong><span>Percentage</span></div></div>
        <div className="results-actions"><button className="button button-primary" type="button" onClick={retakeTest}>Retake {activeFormat.title} <span aria-hidden="true">↻</span></button><ShareResultButton title="My TheoryPrep result" text={`I got ${correctCount}/${test.length} on TheoryPrep 🚗 Can you beat me?`} url={`${typeof window !== "undefined" ? window.location.origin : "https://theoryprep.irish"}/mock-test`} />{incorrectCount > 0 && <Link className="button button-secondary" href="/mistakes">Practise my mistakes <span aria-hidden="true">→</span></Link>}<Link className="button button-secondary" href="/">Back to Home</Link></div>
        <section className="review-section"><p className="eyebrow">Answer review</p><h2>Every question, at a glance</h2><ol className="review-list">{test.map((question, index) => {
          const response = responses[index];
          const unanswered = response === null;
          const isCorrect = !unanswered && response === question.correctAnswer;
          const status = unanswered ? "Unanswered" : isCorrect ? "Correct" : "Incorrect";
          const statusClass = unanswered ? "status-unanswered" : isCorrect ? "status-correct" : "status-incorrect";
          const mark = unanswered ? "–" : isCorrect ? "✓" : "×";
          return <li className="review-item" key={question.id}><div className="review-status"><span className={`status-mark ${statusClass}`} aria-hidden="true">{mark}</span><span>{status} · Question {index + 1}</span></div><h3>{question.question}</h3><p>Your answer: <strong>{response ?? "No answer"}</strong></p><p>Correct answer: <strong>{question.correctAnswer ?? "Not provided"}</strong></p></li>;
        })}</ol></section>
      </div></main>
    );
  }

  if (!current) return null;

  const timerState = timeRemaining <= 60 ? "timer-critical" : timeRemaining <= 300 ? "timer-warning" : "";

  return (
    <main className="app-main"><div className="page-shell practice-shell">
      <div className="mock-exam-header"><div className="page-heading"><div><h1>Mock test</h1></div></div><div className={`exam-timer ${timerState}`} role="timer" aria-label={`${formatTime(timeRemaining)} remaining`}><span>Time remaining</span><strong>{formatTime(timeRemaining)}</strong></div></div>
      <div className="mock-progress"><ProgressBar current={position + 1} total={test.length} label="Test progress" /></div>
      <QuestionCard question={current} eyebrow={`Question ${position + 1} of ${test.length}`}>
        {current.answers.map((answer, index) => <AnswerOption key={`${current.id}-${index}`} answer={answer} index={index} selected={responses[position] === answer} correct={false} incorrect={false} onSelect={() => setResponses((currentResponses) => currentResponses.map((item, responseIndex) => responseIndex === position ? answer : item))} />)}
      </QuestionCard>
      <div className="exam-navigation"><button className="button button-secondary" type="button" disabled={position === 0} onClick={() => setPosition((step) => Math.max(0, step - 1))}>← Previous</button><span>Question {position + 1} of {test.length}</span><button className="button button-secondary" type="button" disabled={position === test.length - 1} onClick={() => setPosition((step) => Math.min(test.length - 1, step + 1))}>Next →</button></div>
      <div className="exam-submit-row"><span>{responses[position] ? "Answer selected" : "This question is unanswered"}</span><button className="button button-primary" type="button" onClick={submitTest}>Submit Test</button></div>
    </div></main>
  );
}
