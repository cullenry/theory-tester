"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { questions } from "@/lib/questions";
import { taxonomyCategories } from "@/lib/question-taxonomy";
import { getProgressData } from "@/lib/progress";

type BrowserPickerOption = {
  value: string;
  label: string;
  count?: number;
};

type PersonalFilter = "all" | "new" | "review" | "starred";

function BrowserTopicPicker({
  label,
  value,
  options,
  disabled = false,
  open,
  onOpen,
  onChange,
}: {
  label: string;
  value: string;
  options: BrowserPickerOption[];
  disabled?: boolean;
  open: boolean;
  onOpen: () => void;
  onChange: (value: string) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) onOpen();
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

  return (
    <div className="topic-picker browser-topic-picker" ref={wrapperRef}>
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
          <strong>{selectedOption?.label ?? options[0]?.label}</strong>
          {selectedOption?.count !== undefined && <small>{selectedOption.count} questions</small>}
        </span>
        <span className={`topic-picker-chevron ${open ? "topic-picker-chevron-open" : ""}`} aria-hidden="true" />
      </button>

      {open && !disabled && (
        <div className="topic-picker-menu" role="listbox" aria-label={label}>
          <div className="topic-picker-menu-heading">Choose {label.toLowerCase()}</div>
          <div className="topic-picker-options">
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <button
                  key={option.value}
                  className={`topic-picker-option ${selected ? "topic-picker-option-selected" : ""}`}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(option.value);
                    onOpen();
                  }}
                >
                  <span className="topic-picker-checkbox" aria-hidden="true">{selected ? "✓" : ""}</span>
                  <span className="topic-picker-option-copy">
                    <strong>{option.label}</strong>
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

export function QuestionBrowser() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [subcategory, setSubcategory] = useState("all");
  const [openPicker, setOpenPicker] = useState<"category" | "subcategory" | null>(null);
  const [personalFilter, setPersonalFilter] = useState<PersonalFilter>("all");
  const [progress, setProgress] = useState<Awaited<ReturnType<typeof getProgressData>> | null>(null);

  useEffect(() => {
    getProgressData(2000).then(setProgress);
  }, []);

  const selectedCategory = taxonomyCategories.find((item) => item.name === category);
  const term = search.trim().toLocaleLowerCase();

  const latestByQuestion = useMemo(() => {
    const latest = new Map<number, Awaited<ReturnType<typeof getProgressData>>["attempts"][number]>();

    for (const attempt of [...(progress?.attempts ?? [])].reverse()) {
      if (!latest.has(attempt.question_id) && attempt.selected_answer !== null) {
        latest.set(attempt.question_id, attempt);
      }
    }

    return latest;
  }, [progress?.attempts]);

  const attemptedIds = useMemo(() => new Set(latestByQuestion.keys()), [latestByQuestion]);
  const reviewIds = useMemo(
    () => new Set([...latestByQuestion.entries()].filter(([, attempt]) => !attempt.is_correct).map(([id]) => id)),
    [latestByQuestion],
  );
  const starredIds = useMemo(() => new Set(progress?.starredQuestionIds ?? []), [progress?.starredQuestionIds]);

  const filtered = questions.filter((question) => {
    const matchesTopic =
      (category === "all" || question.taxonomy.category === category) &&
      (subcategory === "all" || question.taxonomy.subcategory === subcategory);
    const matchesSearch = !term || question.question.toLocaleLowerCase().includes(term);

    let matchesPersonal = true;
    if (personalFilter === "new") matchesPersonal = !attemptedIds.has(question.id);
    if (personalFilter === "review") matchesPersonal = reviewIds.has(question.id);
    if (personalFilter === "starred") matchesPersonal = starredIds.has(question.id);

    return matchesTopic && matchesSearch && matchesPersonal;
  });

  return (
    <>
      {!progress ? null : progress.user ? (
        <section className="browser-personal-panel" aria-label="Personalised question bank">
          <div className="browser-personal-copy">
            <p className="eyebrow">Your question bank</p>
            <strong>Practice around what you know.</strong>
            <span>{attemptedIds.size} covered · {reviewIds.size} need another look · {starredIds.size} starred</span>
          </div>
          <div className="browser-personal-actions" role="group" aria-label="Personal question filters">
            {([
              ["all", "All"],
              ["new", `New ${Math.max(0, questions.length - attemptedIds.size)}`],
              ["review", `Review ${reviewIds.size}`],
              ["starred", `Starred ${starredIds.size}`],
            ] as const).map(([value, label]) => (
              <button
                className={personalFilter === value ? "browser-personal-filter browser-personal-filter-active" : "browser-personal-filter"}
                type="button"
                key={value}
                onClick={() => setPersonalFilter(value)}
              >
                {label}
              </button>
            ))}
            <Link className="browser-smart-link" href="/practice/learn">Learn all 805 →</Link>
          </div>
        </section>
      ) : (
        <section className="browser-signin-panel">
          <div>
            <p className="eyebrow">Make it personal</p>
            <strong>Sign in to track what you’ve covered.</strong>
            <span>Then the question bank can show new questions, mistakes and saved questions just for you.</span>
          </div>
          <Link className="button button-secondary" href="/login?next=/questions">Sign in</Link>
        </section>
      )}

      <div className="browser-controls">
        <label className="search-label">Search questions<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try “right of way”" /></label>
        <BrowserTopicPicker
          label="Category"
          value={category}
          open={openPicker === "category"}
          onOpen={() => setOpenPicker((current) => current === "category" ? null : "category")}
          onChange={(value) => { setCategory(value); setSubcategory("all"); }}
          options={[
            { value: "all", label: "All categories", count: questions.length },
            ...taxonomyCategories.map((item) => ({ value: item.name, label: item.name, count: item.count })),
          ]}
        />
        <BrowserTopicPicker
          label="Subcategory"
          value={subcategory}
          disabled={!selectedCategory}
          open={openPicker === "subcategory"}
          onOpen={() => setOpenPicker((current) => current === "subcategory" ? null : "subcategory")}
          onChange={setSubcategory}
          options={[
            { value: "all", label: "All subcategories", count: selectedCategory?.count },
            ...(selectedCategory?.subcategories.map((item) => ({ value: item.name, label: item.name, count: item.count })) ?? []),
          ]}
        />
      </div>
      <p className="result-count" aria-live="polite">Showing {filtered.length} of {questions.length} questions</p>
      {filtered.length ? (
        <div className="question-list">
          {filtered.map((question) => {
            const attempt = latestByQuestion.get(question.id);
            const status = starredIds.has(question.id)
              ? "★ Starred"
              : attempt
                ? attempt.is_correct ? "✓ Latest answer correct" : "↻ Review this one"
                : "New to you";

            return (
              <Link className="question-list-row" href={`/questions/${question.id}`} key={question.id}>
                <span className="question-list-id">#{question.id}</span>
                <span className="question-list-copy">
                  <strong>{question.question}</strong>
                  <small>{question.taxonomy.category ? `${question.taxonomy.category} · ${question.taxonomy.subcategory}` : "Uncategorized"} · {question.answers.length} answer options</small>
                </span>
                <span className="question-list-personal-status">{status}</span>
                <span className="row-arrow" aria-hidden="true">↗</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No questions found</h2>
          <p>Try another filter, search term or topic.</p>
          {personalFilter !== "all" && (
            <button className="button button-secondary" type="button" onClick={() => setPersonalFilter("all")}>Show all questions</button>
          )}
        </div>
      )}
    </>
  );
}
