"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { questions } from "@/lib/questions";
import { taxonomyCategories } from "@/lib/question-taxonomy";

type BrowserPickerOption = {
  value: string;
  label: string;
  count?: number;
};

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
  const selectedCategory = taxonomyCategories.find((item) => item.name === category);
  const term = search.trim().toLocaleLowerCase();
  const filtered = questions.filter((question) =>
    (category === "all" || question.taxonomy.category === category)
    && (subcategory === "all" || question.taxonomy.subcategory === subcategory)
    && (!term || question.question.toLocaleLowerCase().includes(term)));

  return <>
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
    {filtered.length ? <div className="question-list">{filtered.map((question) => <Link className="question-list-row" href={`/questions/${question.id}`} key={question.id}><span className="question-list-id">#{question.id}</span><span className="question-list-copy"><strong>{question.question}</strong><small>{question.taxonomy.category ? `${question.taxonomy.category} · ${question.taxonomy.subcategory}` : "Uncategorized"} · {question.answers.length} answer options</small></span><span className="row-arrow" aria-hidden="true">↗</span></Link>)}</div> : <div className="empty-state"><h2>No questions found</h2><p>Try another search or choose a different category.</p></div>}
  </>;
}