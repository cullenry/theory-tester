"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnswerOption, ExplanationCard, ProgressBar, QuestionCard, ScoreDisplay } from "@/components/question-ui";
import { getRandomQuestionsFromPool, questions, type Question } from "@/lib/questions";
import { taxonomyCategories } from "@/lib/question-taxonomy";
import { getStarredQuestionIds, recordQuestionAttempt } from "@/lib/progress";

const SESSION_LENGTHS = [5, 10, 20] as const;
type SessionLength = (typeof SESSION_LENGTHS)[number];

type PickerOption = {
  value: string;
  label: string;
  count?: number;
  detail?: string;
};

function TopicPicker({
  label,
  values,
  placeholder,
  options,
  disabled = false,
  open,
  onOpen,
  onChange,
}: {
  label: string;
  values: string[];
  placeholder: string;
  options: PickerOption[];
  disabled?: boolean;
  open: boolean;
  onOpen: () => void;
  onChange: (value: string) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isAll = values.length === 0;
  const selectedOptions = options.filter((option) => values.includes(option.value));

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        onOpen();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpen();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpen]);

  const triggerTitle = isAll
    ? options[0]?.label ?? placeholder
    : selectedOptions.length === 1
      ? selectedOptions[0].label
      : `${selectedOptions.length} ${label === "Category" ? "categories" : "subcategories"} selected`;

  const triggerCount = isAll
    ? options[0]?.count
    : selectedOptions.reduce((total, option) => total + (option.count ?? 0), 0);

  return (
    <div className="topic-picker" ref={wrapperRef}>
      <span className="topic-picker-label">{label}</span>
      <button
        className={`topic-picker-trigger ${open ? "topic-picker-trigger-open" : ""}`}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={onOpen}
      >
        <span className="topic-picker-trigger-copy">
          <strong>{triggerTitle}</strong>
          {triggerCount !== undefined && <small>{triggerCount} questions</small>}
        </span>
        <span className={`topic-picker-chevron ${open ? "topic-picker-chevron-open" : ""}`} aria-hidden="true" />
      </button>

      {open && !disabled && (
        <div className="topic-picker-menu" role="listbox" aria-label={label} aria-multiselectable="true">
          <div className="topic-picker-menu-heading">
            <span>Choose {label.toLowerCase()}</span>
            <span>{isAll ? "All selected" : `${values.length} selected`}</span>
          </div>
          <div className="topic-picker-options">
            {options.map((option) => {
              const selected = option.value === "all" ? isAll : values.includes(option.value);
              return (
                <button
                  key={option.value}
                  className={`topic-picker-option ${selected ? "topic-picker-option-selected" : ""}`}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => onChange(option.value)}
                >
                  <span className="topic-picker-checkbox" aria-hidden="true">{selected ? "✓" : ""}</span>
                  <span className="topic-picker-option-copy">
                    <strong>{option.label}</strong>
                    {option.detail && <small>{option.detail}</small>}
                    {option.count !== undefined && <small>{option.count} questions</small>}
                  </span>
                </button>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}

export function PracticeSession() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [session, setSession] = useState<Question[] | null>(null);
  const [sessionLength, setSessionLength] = useState<SessionLength>(20);
  const [activePool, setActivePool] = useState<Question[]>([]);
  const [sessionMissedIds, setSessionMissedIds] = useState<number[]>([]);
  const [isReviewSession, setIsReviewSession] = useState(false);
  const [starredMode, setStarredMode] = useState(false);
  const [starredPool, setStarredPool] = useState<Question[]>([]);
  const [loadingSpecialMode, setLoadingSpecialMode] = useState(true);
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [openPicker, setOpenPicker] = useState<"category" | "subcategory" | null>(null);
  const selectedCategorySummaries = taxonomyCategories.filter((item) => selectedCategories.includes(item.name));
  const availableSubcategoryOptions = selectedCategorySummaries.flatMap((category) =>
    category.subcategories.map((item) => ({
      value: `${category.name}\u0000${item.name}`,
      label: item.name,
      detail: category.name,
      count: item.count,
    })),
  );
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    if (category && taxonomyCategories.some((item) => item.name === category)) {
      setSelectedCategories([category]);
    }
    if (params.get("starred") === "1") {
      setStarredMode(true);
      getStarredQuestionIds().then((ids) => {
        const idSet = new Set(ids);
        setStarredPool(questions.filter((question) => idSet.has(question.id)));
        setLoadingSpecialMode(false);
      });
    } else {
      setLoadingSpecialMode(false);
    }
  }, []);

  const selectedPool = starredMode
    ? starredPool
    : selectedCategories.length === 0
      ? questions
      : questions.filter((question) => {
      if (!question.taxonomy.category || !selectedCategories.includes(question.taxonomy.category)) {
        return false;
      }
      if (selectedSubcategories.length === 0) return true;
      const subcategoryKey = `${question.taxonomy.category}\u0000${question.taxonomy.subcategory}`;
      return selectedSubcategories.includes(subcategoryKey);
    });
  const current = session?.[position];
  const finished = session !== null && position >= session.length;
  const answered = selected !== null;

  const beginSession = (pool: Question[], length: number = sessionLength, review = false) => {
    const nextSession = getRandomQuestionsFromPool(pool, length);
    setActivePool(pool);
    setSession(nextSession);
    setPosition(0);
    setSelected(null);
    setCorrectCount(0);
    setSessionMissedIds([]);
    setIsReviewSession(review);
  };

  const returnToSetup = () => {
    setSession(null);
    setActivePool([]);
    setPosition(0);
    setSelected(null);
    setCorrectCount(0);
    setSessionMissedIds([]);
    setIsReviewSession(false);
  };

  return (
    <main className="app-main">
      <div className="page-shell practice-shell">
        {session === null ? (
          <>
            <div className="page-heading"><div><p className="eyebrow">Learn smarter. Practise better.</p><h1>Learn &amp; Practice</h1></div></div>
            <div className="practice-tools-grid">
            <section className="learn-launch-card learn-signin-feature">
              <div className="learn-launch-copy">
                <p className="eyebrow">Personalised learning</p>
                <h2>Make practice personal.</h2>
                <p>Sign in to unlock Learn and use your saved results to focus on weak spots, reinforce what you know and revisit missed questions.</p>
              </div>
              <Link className="button button-primary" href="/login?next=/practice/learn">Sign in to Learn <span aria-hidden="true">→</span></Link>
            </section>
              <section className="flashcard-launch-card">
                <div className="flashcard-launch-icon" aria-hidden="true"><span>↻</span></div>
                <div className="flashcard-launch-copy">
                  <p className="eyebrow">Active recall</p>
                  <h2>Study with flashcards.</h2>
                  <p>Flip through questions, reveal the answer, and mark each card as learned or still worth reviewing.</p>
                </div>
                <Link className="button button-secondary" href="/practice/flashcards">Start flashcards <span aria-hidden="true">→</span></Link>
              </section>
            </div>

            {starredMode ? (
              <section className="learn-launch-card starred-practice-banner">
                <div className="learn-launch-copy">
                  <p className="eyebrow">Saved for later</p>
                  <h2>Practise your starred questions.</h2>
                  <p>{loadingSpecialMode ? "Loading your saved questions…" : `You have ${starredPool.length} starred question${starredPool.length === 1 ? "" : "s"} ready to practise.`}</p>
                  <div className="learn-launch-points"><span>Saved questions only</span><span>Fresh attempt history</span><span>Review every answer</span></div>
                </div>
                <button className="button button-secondary" type="button" onClick={() => { window.history.replaceState({}, "", "/practice"); setStarredMode(false); }}>Back to all practice</button>
              </section>
            ) : null}
            <section className="practice-setup question-card">
              <p className="eyebrow">Question set</p>
              <div className="practice-filters">
                <TopicPicker
                  label="Category"
                  values={selectedCategories}
                  placeholder="All questions"
                  open={openPicker === "category"}
                  onOpen={() => setOpenPicker((current) => current === "category" ? null : "category")}
                  onChange={(value) => {
                    if (value === "all") {
                      setSelectedCategories([]);
                      setSelectedSubcategories([]);
                      return;
                    }
                    setSelectedCategories((current) =>
                      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
                    );
                    setSelectedSubcategories([]);
                  }}
                  options={[
                    { value: "all", label: "All questions", count: questions.length },
                    ...taxonomyCategories.map((item) => ({ value: item.name, label: item.name, count: item.count })),
                  ]}
                />
                <TopicPicker
                  label="Subcategory"
                  values={selectedSubcategories}
                  placeholder="Choose a category first"
                  disabled={selectedCategories.length === 0}
                  open={openPicker === "subcategory"}
                  onOpen={() => setOpenPicker((current) => current === "subcategory" ? null : "subcategory")}
                  onChange={(value) => {
                    if (value === "all") {
                      setSelectedSubcategories([]);
                      return;
                    }
                    setSelectedSubcategories((current) =>
                      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
                    );
                  }}
                  options={[
                    { value: "all", label: "All subcategories", count: selectedCategorySummaries.reduce((total, item) => total + item.count, 0) },
                    ...availableSubcategoryOptions,
                  ]}
                />
              </div>
              <div className="practice-length-row">
                <span>Session length</span>
                <div className="practice-length-options" role="group" aria-label="Session length">
                  {SESSION_LENGTHS.map((length) => <button key={length} className={sessionLength === length ? "practice-length-option practice-length-option-active" : "practice-length-option"} type="button" onClick={() => setSessionLength(length)}>{length === 5 ? "Quick 5" : length === 10 ? "Quick 10" : "Full 20"}<small>{length} questions</small></button>)}
                </div>
              </div>
              <div className="practice-start-row"><p>{Math.min(sessionLength, selectedPool.length)} questions in this session</p><button className="button button-primary" type="button" disabled={selectedPool.length === 0 || loadingSpecialMode} onClick={() => beginSession(selectedPool)}>{starredMode ? "Start starred practice" : "Start practice"} <span aria-hidden="true">→</span></button></div>
            </section>
          </>
        ) : finished || !current ? (
          <section className="completion-panel"><span className="completion-mark" aria-hidden="true">✓</span><p className="eyebrow">{isReviewSession ? "Review complete" : "Session complete"}</p><h2>{isReviewSession ? "Mistakes get easier with another look." : "Good work. Keep it rolling."}</h2><p>You answered {session.length} questions and got {correctCount} correct.</p><div className="results-summary results-summary-four"><div><strong>{correctCount}</strong><span>Correct</span></div><div><strong>{session.length - correctCount}</strong><span>Incorrect</span></div><div><strong>{Math.round((correctCount / Math.max(1, session.length)) * 100)}%</strong><span>Accuracy</span></div><div><strong>{sessionMissedIds.length}</strong><span>To review</span></div></div><div className="practice-completion-actions">{sessionMissedIds.length > 0 && !isReviewSession && <button className="button button-primary" type="button" onClick={() => { const retryPool = sessionMissedIds.map((id) => questions.find((question) => question.id === id)).filter((question): question is Question => Boolean(question)); beginSession(retryPool, retryPool.length, true); }}>Retry {sessionMissedIds.length} mistake{sessionMissedIds.length === 1 ? "" : "s"} <span aria-hidden="true">→</span></button>}{sessionMissedIds.length > 0 && <Link className="button button-secondary" href="/mistakes">Review my mistakes</Link>}<button className="button button-secondary" type="button" onClick={() => beginSession(activePool)}>Practise another set <span aria-hidden="true">↻</span></button><button className="button button-quiet" type="button" onClick={returnToSetup}>Choose another topic</button></div></section>
        ) : (
          <>
            <div className="page-heading"><div><h1>Practice session</h1></div><div className="practice-heading-actions"><button className="button button-quiet" type="button" onClick={() => beginSession(activePool)}>↻ <span>Restart</span></button><button className="button button-secondary" type="button" onClick={returnToSetup}>Change topic</button></div></div>
            <div className="practice-meta"><ProgressBar current={position + 1} total={session.length} label="Session progress" /><ScoreDisplay correct={correctCount} attempted={position + (answered ? 1 : 0)} /></div>
            <QuestionCard question={current} eyebrow={`Question ${position + 1}`}>
              {current.answers.map((answer, index) => (
                <AnswerOption key={`${current.id}-${index}`} answer={answer} index={index} selected={selected === answer} disabled={answered} correct={answered && answer === current.correctAnswer} incorrect={answered && selected === answer && answer !== current.correctAnswer} onSelect={() => { setSelected(answer); if (answer === current.correctAnswer) setCorrectCount((score) => score + 1); else setSessionMissedIds((ids) => ids.includes(current.id) ? ids : [...ids, current.id]); void recordQuestionAttempt(current, answer, answer === current.correctAnswer, "practice"); }} />
              ))}
            </QuestionCard>
            {answered && <div className="feedback-block"><p className={`feedback-line ${selected === current.correctAnswer ? "feedback-good" : "feedback-bad"}`} role="status"><strong>{selected === current.correctAnswer ? "Correct." : "Not quite."}</strong> {selected === current.correctAnswer ? "That’s the right answer." : "The correct answer is highlighted above."}</p><ExplanationCard explanation={current.explanation} /><button className="button button-primary continue-button" type="button" onClick={() => { setPosition((step) => step + 1); setSelected(null); }}>{position + 1 === session.length ? "Finish session" : "Next question"}<span aria-hidden="true">→</span></button></div>}
          </>
        )}
      </div>
    </main>
  );
}