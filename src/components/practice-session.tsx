"use client";

import { useEffect, useRef, useState } from "react";
import { AnswerOption, ExplanationCard, ProgressBar, QuestionCard, ScoreDisplay } from "@/components/question-ui";
import { getRandomQuestionsFromPool, questions, type Question } from "@/lib/questions";
import { taxonomyCategories } from "@/lib/question-taxonomy";

const SESSION_LENGTH = 20;

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
  const [activePool, setActivePool] = useState<Question[]>([]);
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
  const selectedPool = selectedCategories.length === 0
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

  const beginSession = (pool: Question[]) => {
    const nextSession = getRandomQuestionsFromPool(pool, SESSION_LENGTH);
    setActivePool(pool);
    setSession(nextSession);
    setPosition(0);
    setSelected(null);
    setCorrectCount(0);
  };

  const returnToSetup = () => {
    setSession(null);
    setActivePool([]);
    setPosition(0);
    setSelected(null);
    setCorrectCount(0);
  };

  return (
    <main className="app-main">
      <div className="page-shell practice-shell">
        {session === null ? (
          <>
            <div className="page-heading"><div><p className="eyebrow">Choose your focus</p><h1>Practice</h1></div></div>
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
              <div className="practice-start-row"><p>{Math.min(SESSION_LENGTH, selectedPool.length)} questions in this session</p><button className="button button-primary" type="button" disabled={selectedPool.length === 0} onClick={() => beginSession(selectedPool)}>Start practice <span aria-hidden="true">→</span></button></div>
            </section>
          </>
        ) : finished || !current ? (
          <section className="completion-panel"><span className="completion-mark" aria-hidden="true">✓</span><p className="eyebrow">Session complete</p><h2>Good work. Keep it rolling.</h2><p>You answered {session.length} questions and got {correctCount} correct.</p><div className="practice-completion-actions"><button className="button button-primary" type="button" onClick={() => beginSession(activePool)}>Practise another set <span aria-hidden="true">→</span></button><button className="button button-secondary" type="button" onClick={returnToSetup}>Choose another topic</button></div></section>
        ) : (
          <>
            <div className="page-heading"><div><p className="eyebrow">{selectedCategories.length === 0 ? "All questions" : `${selectedCategories.length} categor${selectedCategories.length === 1 ? "y" : "ies"}${selectedSubcategories.length ? ` · ${selectedSubcategories.length} subcategor${selectedSubcategories.length === 1 ? "y" : "ies"}` : ""}`}</p><h1>Practice session</h1></div><div className="practice-heading-actions"><button className="button button-quiet" type="button" onClick={() => beginSession(activePool)}>↻ <span>Restart</span></button><button className="button button-secondary" type="button" onClick={returnToSetup}>Change topic</button></div></div>
            <div className="practice-meta"><ProgressBar current={position + 1} total={session.length} label="Session progress" /><ScoreDisplay correct={correctCount} attempted={position + (answered ? 1 : 0)} /></div>
            <QuestionCard question={current} eyebrow={`${current.taxonomy.category ? `${current.taxonomy.category} · ` : ""}Question ${position + 1}`}>
              {current.answers.map((answer, index) => (
                <AnswerOption key={`${current.id}-${index}`} answer={answer} index={index} selected={selected === answer} disabled={answered} correct={answered && answer === current.correctAnswer} incorrect={answered && selected === answer && answer !== current.correctAnswer} onSelect={() => { setSelected(answer); if (answer === current.correctAnswer) setCorrectCount((score) => score + 1); }} />
              ))}
            </QuestionCard>
            {answered && <div className="feedback-block"><p className={`feedback-line ${selected === current.correctAnswer ? "feedback-good" : "feedback-bad"}`} role="status"><strong>{selected === current.correctAnswer ? "Correct." : "Not quite."}</strong> {selected === current.correctAnswer ? "That’s the right answer." : "The correct answer is highlighted above."}</p><ExplanationCard explanation={current.explanation} /><button className="button button-primary continue-button" type="button" onClick={() => { setPosition((step) => step + 1); setSelected(null); }}>{position + 1 === session.length ? "Finish session" : "Next question"}<span aria-hidden="true">→</span></button></div>}
          </>
        )}
      </div>
    </main>
  );
}