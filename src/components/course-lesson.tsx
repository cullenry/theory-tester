"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnswerOption, ExplanationCard, ProgressBar, QuestionCard } from "@/components/question-ui";
import { getProgressData, recordQuestionAttempt } from "@/lib/progress";
import {
  getCourseChapters,
  getCourseLessonQuestions,
  getAdaptiveReviewQuestions,
  type CourseChapter,
  type CourseLesson,
} from "@/lib/course";
import { type Question } from "@/lib/questions";

type Phase = "questions" | "adaptive" | "review" | "complete";

export function CourseLesson({ chapterIndex, lessonIndex }: { chapterIndex: number; lessonIndex: number }) {
  const chapters = useMemo(() => getCourseChapters(), []);
  const chapter = chapters[chapterIndex] as CourseChapter | undefined;
  const lesson = chapter?.lessons[lessonIndex] as CourseLesson | undefined;

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [questionsForLesson, setQuestionsForLesson] = useState<Question[]>([]);
  const [adaptiveReviewQuestions, setAdaptiveReviewQuestions] = useState<Question[]>([]);
  const [phase, setPhase] = useState<Phase>("questions");
  const [position, setPosition] = useState(0);
  const [reviewIds, setReviewIds] = useState<number[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [missed, setMissed] = useState(0);
  const questionAnchorRef = useRef<HTMLDivElement>(null);

  const scrollQuestionToTop = () => {
    if (typeof window === "undefined" || window.innerWidth > 760 || !window.matchMedia("(pointer: coarse)").matches) return;

    window.requestAnimationFrame(() => {
      questionAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  useEffect(() => {
    if (!chapter || !lesson) {
      setLoading(false);
      return;
    }

    let active = true;

    getProgressData(2000).then((data) => {
      if (!active) return;
      setUserId(data.user?.id ?? null);
      const lessonQuestions = getCourseLessonQuestions(chapterIndex, lessonIndex, data.attempts);
      setQuestionsForLesson(lessonQuestions);
      setAdaptiveReviewQuestions(
        data.user
          ? getAdaptiveReviewQuestions(data.attempts, lessonQuestions.map((question) => question.id), 2)
          : [],
      );
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [chapter, lesson, chapterIndex, lessonIndex]);

  const current =
    phase === "questions"
      ? questionsForLesson[position] ?? null
      : phase === "adaptive"
        ? adaptiveReviewQuestions[position] ?? null
        : phase === "review"
          ? questionsForLesson.find((question) => question.id === reviewIds[position]) ?? null
          : null;

  useEffect(() => {
    if (phase !== "complete" || !userId) return;

    try {
      const now = new Date();
      const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-");
      localStorage.setItem("theorytester-learn-completed-" + userId, today);
    } catch {
      // Daily mission progress is optional if local storage is unavailable.
    }
  }, [phase, userId]);

  const totalSteps =
    questionsForLesson.length +
    adaptiveReviewQuestions.length +
    reviewIds.length;
  const currentStep =
    phase === "adaptive"
      ? questionsForLesson.length + position + 1
      : phase === "review"
        ? questionsForLesson.length + adaptiveReviewQuestions.length + position + 1
        : position + 1;

  function answerQuestion(answer: string) {
    if (!current || selected !== null) return;

    const isCorrect = answer === current.correctAnswer;
    setSelected(answer);

    if (phase === "questions") {
      if (isCorrect) setCorrect((value) => value + 1);
      else {
        setMissed((value) => value + 1);
        setReviewIds((ids) => ids.includes(current.id) ? ids : [...ids, current.id]);
      }
    }

    void recordQuestionAttempt(current, answer, isCorrect, "smart");
    scrollQuestionToTop();
  }

  function next() {
    setSelected(null);

    if (phase === "questions") {
      if (position + 1 < questionsForLesson.length) {
        setPosition((value) => value + 1);
        return;
      }

      if (adaptiveReviewQuestions.length) {
        setPhase("adaptive");
        setPosition(0);
        return;
      }

      if (reviewIds.length) {
        setPhase("review");
        setPosition(0);
        return;
      }

      setPhase("complete");
      setPosition(0);
      return;
    }

    if (phase === "adaptive") {
      if (position + 1 < adaptiveReviewQuestions.length) {
        setPosition((value) => value + 1);
        return;
      }

      if (reviewIds.length) {
        setPhase("review");
        setPosition(0);
        return;
      }

      setPhase("complete");
      setPosition(0);
      return;
    }

    if (phase === "review") {
      if (position + 1 < reviewIds.length) {
        setPosition((value) => value + 1);
        return;
      }

      setPhase("complete");
      setPosition(0);
    }
  }

  function restart() {
    if (!lesson) return;

    setLoading(true);
    setPhase("questions");
    setPosition(0);
    setReviewIds([]);
    setSelected(null);
    setCorrect(0);
    setMissed(0);

    getProgressData(2000).then((data) => {
      setUserId(data.user?.id ?? null);
      const lessonQuestions = getCourseLessonQuestions(chapterIndex, lessonIndex, data.attempts);
      setQuestionsForLesson(lessonQuestions);
      setAdaptiveReviewQuestions(
        data.user
          ? getAdaptiveReviewQuestions(data.attempts, lessonQuestions.map((question) => question.id), 2)
          : [],
      );
      setLoading(false);
    });
  }

  if (loading) {
    return (
      <main className="app-main">
        <div className="page-shell course-shell">
          <div className="course-loading">Loading your lesson…</div>
        </div>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="app-main">
        <div className="page-shell course-shell">
          <section className="course-signin-lesson-gate">
            <p className="eyebrow">Your first lesson</p>
            <h1>Sign in to start learning.</h1>
            <p>Your Learn course uses your answers to adapt future lessons, reinforce tricky questions and keep your place across devices.</p>
            <div className="course-signin-lesson-points">
              <span>Personalised question order</span>
              <span>Progress saved to your account</span>
              <span>Smart review after each lesson</span>
            </div>
            <div className="course-complete-actions">
              <Link className="button button-primary" href="/login?next=/practice/learn">Sign in to continue <span aria-hidden="true">→</span></Link>
              <Link className="button button-secondary" href="/practice/learn">Back to Learn</Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!chapter || !lesson || !questionsForLesson.length) {
    return (
      <main className="app-main">
        <div className="page-shell course-shell">
          <section className="empty-state course-error">
            <p className="eyebrow">Learn</p>
            <h1>That lesson isn’t available.</h1>
            <p>Head back to the course map and choose another chapter.</p>
            <Link className="button button-primary" href="/practice/learn">Back to course</Link>
          </section>
        </div>
      </main>
    );
  }

  if (phase === "complete") {
    return (
      <main className="app-main">
        <div className="page-shell course-shell">
          <section className="course-complete-card">
            <p className="eyebrow">Lesson complete</p>
            <h1>{missed ? "Nice. The tricky ones came back around." : "Clean run. Keep moving."}</h1>
            <p>
              You worked through {questionsForLesson.length} questions in <strong>{chapter.name}</strong>
              {adaptiveReviewQuestions.length
                ? `, then completed ${adaptiveReviewQuestions.length} smart review question${adaptiveReviewQuestions.length === 1 ? "" : "s"}`
                : ""}
              {missed ? `, plus a retry of ${reviewIds.length} you missed` : ""}.
            </p>
            <div className="results-summary results-summary-four">
              <div><strong>{questionsForLesson.length}</strong><span>Lesson questions</span></div>
              <div><strong>{correct}/{questionsForLesson.length}</strong><span>First-pass score</span></div>
              <div><strong>{adaptiveReviewQuestions.length}</strong><span>Smart review</span></div>
              <div><strong>{reviewIds.length}</strong><span>Missed &amp; retried</span></div>
            </div>
            <div className="course-complete-actions">
              <Link className="button button-primary" href="/practice/learn">Continue the course <span aria-hidden="true">→</span></Link>
              {reviewIds.length > 0 && <Link className="button button-secondary" href="/mistakes">Review my mistakes</Link>}
              <button className="button button-secondary" type="button" onClick={restart}>Repeat this lesson <span aria-hidden="true">↻</span></button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const isReview = phase === "review";

  return (
    <main className="app-main">
      <div className="page-shell practice-shell course-lesson-shell">
        <div className="page-heading course-lesson-heading">
          <div>
            <p className="eyebrow">{chapter.name}</p>
            <h1>Lesson {lessonIndex + 1}</h1>
            <p className="course-lesson-subtitle">{isReview ? "Second chance round" : `${lesson.questionIds.length} questions · short and focused`}</p>
          </div>
          <Link className="button button-secondary" href="/practice/learn">Exit lesson</Link>
        </div>

        <ProgressBar
          current={currentStep}
          total={Math.max(1, totalSteps)}
          label={
            isReview
              ? "Retry progress"
              : phase === "adaptive"
                ? "Adaptive review progress"
                : "Lesson progress"
          }
        />

        <div className="course-lesson-badge">
          <span>{isReview ? "↻ Retry round" : phase === "adaptive" ? "✦ Smart Review" : userId ? "● Adaptive Learn" : "● Learn"}</span>
          <small>
            {isReview
              ? "Missed questions return before you finish."
              : phase === "adaptive"
                ? "A couple of earlier questions were selected from your practice history."
                : userId
                  ? "Your answer history helps shape the lesson and its review questions."
                  : "Sign in to let your answer history personalise the lesson."}
          </small>
        </div>

        {current && (
          <div ref={questionAnchorRef} className="mobile-question-anchor"><QuestionCard question={current} eyebrow={`${chapter.name} · Question ${currentStep}`}>
            {current.answers.map((answer, index) => (
              <AnswerOption
                key={current.id + "-" + index}
                answer={answer}
                index={index}
                selected={selected === answer}
                disabled={selected !== null}
                correct={selected !== null && answer === current.correctAnswer}
                incorrect={selected === answer && answer !== current.correctAnswer}
                onSelect={() => answerQuestion(answer)}
              />
            ))}
          </QuestionCard></div>
        )}

        {current && selected !== null && (
          <div className="feedback-block">
            <p className={`feedback-line ${selected === current.correctAnswer ? "feedback-good" : "feedback-bad"}`} role="status">
              <strong>{selected === current.correctAnswer ? "Correct." : "Not quite."}</strong>{" "}
              {isReview
                ? selected === current.correctAnswer
                  ? "That answer is getting stronger."
                  : "Keep the explanation in mind and we’ll circle back again later."
                : selected === current.correctAnswer
                  ? "Good recall. Keep moving."
                  : "No stress — read the explanation, then you’ll get another look before you leave."}
            </p>
            <ExplanationCard explanation={current.explanation} />
            <button className="button button-primary continue-button" type="button" onClick={next}>
              {phase === "questions" && position + 1 === questionsForLesson.length
                ? adaptiveReviewQuestions.length
                  ? "Start Smart Review"
                  : reviewIds.length
                    ? "Start retry round"
                    : "Finish lesson"
                : phase === "adaptive" && position + 1 === adaptiveReviewQuestions.length
                  ? reviewIds.length ? "Start retry round" : "Finish lesson"
                  : phase === "review" && position + 1 === reviewIds.length
                    ? "Finish lesson"
                    : "Next question"}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
