"use client";

import Link from "next/link";
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { getRandomQuestionsFromPool, questions, type Question } from "@/lib/questions";
import { taxonomyCategories } from "@/lib/question-taxonomy";

const DECK_SIZES = [10, 20, 40] as const;
type DeckSize = (typeof DECK_SIZES)[number] | "all";
const MASTERED_KEY = "theoryprep-flashcards-mastered";

function FlashcardSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string; detail?: string }>;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="flashcard-select" ref={wrapperRef}>
      <span className="flashcard-select-label">{label}</span>
      <button
        className={open ? "flashcard-select-trigger flashcard-select-trigger-open" : "flashcard-select-trigger"}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="flashcard-select-copy">
          <strong>{selected?.label ?? "Choose an option"}</strong>
          {selected?.detail && <small>{selected.detail}</small>}
        </span>
        <span className={open ? "topic-picker-chevron topic-picker-chevron-open" : "topic-picker-chevron"} aria-hidden="true" />
      </button>

      {open && (
        <div className="flashcard-select-menu" role="listbox" aria-label={label}>
          <div className="flashcard-select-menu-heading">
            <span>Choose {label.toLowerCase()}</span>
            <span>{options.length} options</span>
          </div>
          <div className="flashcard-select-options">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  className={isSelected ? "flashcard-select-option flashcard-select-option-selected" : "flashcard-select-option"}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span className="flashcard-select-check" aria-hidden="true">{isSelected ? "✓" : ""}</span>
                  <span className="flashcard-select-option-copy">
                    <strong>{option.label}</strong>
                    {option.detail && <small>{option.detail}</small>}
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


function Flashcard({ question, flipped, onFlip }: { question: Question; flipped: boolean; onFlip: () => void }) {
  const answer = question.correctAnswer ?? "Answer not available for this question.";

  return (
    <button
      className={flipped ? "flashcard flashcard-flipped" : "flashcard"}
      type="button"
      aria-label={flipped ? "Show the question" : "Reveal the answer"}
      aria-pressed={flipped}
      onClick={onFlip}
    >
      <span className="flashcard-face flashcard-front">
        <span className="flashcard-topline">
          <span>Question</span>
          <span>Tap to reveal</span>
        </span>
        {question.image && (
          <span
            className="flashcard-image"
            style={{
              display: "flex",
              width: "100%",
              height: "min(360px, 42vw)",
              minHeight: "220px",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              padding: "16px",
              borderRadius: "14px",
              background: "var(--green-soft)",
            }}
          >
            <img
              src={question.image}
              alt="Illustration for this theory test flashcard"
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                objectPosition: "center",
              }}
            />
          </span>
        )}
        <span className="flashcard-question">{question.question}</span>
        <span className="flashcard-hint">Think of the answer before you flip.</span>
      </span>

      <span className="flashcard-face flashcard-back">
        <span className="flashcard-topline">
          <span>Answer</span>
          <span>Tap to flip back</span>
        </span>
        <span className="flashcard-answer">{answer}</span>
        {question.explanation && (
          <span className="flashcard-explanation">
            <strong>Why?</strong>
            <span>{question.explanation}</span>
          </span>
        )}
      </span>
    </button>
  );
}

export function FlashcardSession() {
  const [category, setCategory] = useState("all");
  const [deckSize, setDeckSize] = useState<DeckSize>(20);
  const [deck, setDeck] = useState<Question[]>([]);
  const [position, setPosition] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [started, setStarted] = useState(false);
  const [masteredIds, setMasteredIds] = useState<number[]>([]);
  const [sessionMasteredIds, setSessionMasteredIds] = useState<number[]>([]);
  const [sessionCardCount, setSessionCardCount] = useState(0);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(MASTERED_KEY) ?? "[]") as number[];
      setMasteredIds(Array.isArray(stored) ? stored.filter((id) => Number.isInteger(id)) : []);
    } catch {
      setMasteredIds([]);
    }
  }, []);

  const selectedPool = useMemo(
    () => category === "all"
      ? questions
      : questions.filter((question) => question.taxonomy.category === category),
    [category],
  );

  const current = deck[position] ?? null;
  const completed = started && position >= deck.length;
  const currentIsMastered = current ? masteredIds.includes(current.id) : false;

  function startDeck() {
    const count = deckSize === "all" ? selectedPool.length : Math.min(deckSize, selectedPool.length);
    setDeck(getRandomQuestionsFromPool(selectedPool, count));
    setPosition(0);
    setFlipped(false);
    setSessionMasteredIds([]);
    setSessionCardCount(count);
    setStarted(true);
  }

  function persistMastered(nextIds: number[]) {
    const unique = Array.from(new Set(nextIds));
    setMasteredIds(unique);
    try {
      localStorage.setItem(MASTERED_KEY, JSON.stringify(unique));
    } catch {
      // Mastery persistence is a progressive enhancement.
    }
  }

  function rateCard(rating: "learning" | "mastered") {
    if (!current) return;

    if (rating === "mastered") {
      persistMastered([...masteredIds, current.id]);
      setSessionMasteredIds((ids) => ids.includes(current.id) ? ids : [...ids, current.id]);
    } else {
      persistMastered(masteredIds.filter((id) => id !== current.id));
      setSessionMasteredIds((ids) => ids.filter((id) => id !== current.id));
    }

    setFlipped(false);

    if (rating === "learning") {
      setDeck((currentDeck) => [...currentDeck, current]);
    }

    setPosition((index) => index + 1);
  }

  function restart() {
    startDeck();
  }

  function handleKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (!started || completed) return;
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      setFlipped((value) => !value);
    }
  }

  if (!started) {
    return (
      <main className="app-main">
        <div className="page-shell practice-shell">
          <div className="page-heading">
            <div>
              <p className="eyebrow">Active recall</p>
              <h1>Flashcards</h1>
            </div>
          </div>

          <section className="flashcard-intro-card">
            <div>
              <p className="eyebrow">Study, then reveal</p>
              <h2>Remember it before you see it.</h2>
              <p>Use the front of each card to recall the answer, then flip it to check yourself and read the explanation.</p>
            </div>
            <div className="flashcard-intro-stats">
              <div><strong>{questions.length}</strong><span>cards available</span></div>
              <div><strong>{masteredIds.length}</strong><span>mastered on this device</span></div>
            </div>
          </section>

          <section className="flashcard-setup-card" aria-labelledby="flashcard-setup-title">
            <div className="feature-card-heading">
              <div>
                <p className="eyebrow">Build a deck</p>
                <h2 id="flashcard-setup-title">Choose what to study</h2>
              </div>
              <span>{selectedPool.length} cards</span>
            </div>

            <div className="flashcard-filters">
              <FlashcardSelect
                label="Category"
                value={category}
                onChange={setCategory}
                options={[
                  { value: "all", label: "All questions", detail: `${questions.length} cards` },
                  ...taxonomyCategories.map((item) => ({ value: item.name, label: item.name, detail: `${item.count} cards` })),
                ]}
              />
              <FlashcardSelect
                label="Deck size"
                value={String(deckSize)}
                onChange={(value) => setDeckSize(value === "all" ? "all" : Number(value) as DeckSize)}
                options={[
                  ...DECK_SIZES.map((size) => ({ value: String(size), label: `${size} cards` })),
                  { value: "all", label: `All ${selectedPool.length} cards` },
                ]}
              />
            </div>

            <div className="flashcard-setup-footer">
              <p>Cards are shuffled each time you start a deck.</p>
              <button className="button button-primary" type="button" disabled={selectedPool.length === 0} onClick={startDeck}>
                Start flashcards <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>

          <div className="flashcard-back-link">
            <Link className="button button-quiet" href="/practice">← Back to Learn &amp; Practice</Link>
          </div>
        </div>
      </main>
    );
  }

  if (completed) {
    const sessionTotal = sessionCardCount;
    const sessionMastered = sessionMasteredIds.length;

    return (
      <main className="app-main">
        <div className="page-shell practice-shell">
          <section className="flashcard-complete-card">
            <p className="eyebrow">Deck complete</p>
            <h1>Nice work. That deck is done.</h1>
            <p>You studied {sessionTotal} cards and marked {sessionMastered} as mastered.</p>
            <div className="results-summary results-summary-four">
              <div><strong>{sessionTotal}</strong><span>Cards studied</span></div>
              <div><strong>{sessionMastered}</strong><span>Marked mastered</span></div>
              <div><strong>{sessionTotal - sessionMastered}</strong><span>Still learning</span></div>
              <div><strong>{masteredIds.length}</strong><span>Saved mastery</span></div>
            </div>
            <div className="results-actions">
              <button className="button button-primary" type="button" onClick={restart}>Study another deck <span aria-hidden="true">↻</span></button>
              <Link className="button button-secondary" href="/practice">Back to Learn &amp; Practice</Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!current) return null;

  return (
    <main className="app-main">
      <div className="page-shell practice-shell">
        <div className="page-heading flashcard-session-heading">
          <div>
            <p className="eyebrow">{category === "all" ? "All questions" : category}</p>
            <h1>Flashcards</h1>
          </div>
          <div className="flashcard-session-actions">
            <span>{position + 1} of {deck.length}</span>
            <button className="button button-secondary" type="button" onClick={restart}>Restart</button>
            <Link className="button button-quiet" href="/practice">Exit</Link>
          </div>
        </div>

        <div className="flashcard-progress-meta" aria-label={"Flashcard progress: " + (position + 1) + " of " + deck.length}>
          <div className="progress-track">
            <span className="progress-value" style={{ width: (((position + 1) / Math.max(1, deck.length)) * 100) + "%" }} />
          </div>
          <span>{sessionMasteredIds.length} mastered this deck</span>
        </div>

        <div className="flashcard-stage" tabIndex={0} onKeyDown={handleKeyboard}>
          <Flashcard question={current} flipped={flipped} onFlip={() => setFlipped((value) => !value)} />
        </div>

        <div className="flashcard-rate-actions">
          <button className="flashcard-rate flashcard-rate-learning" type="button" onClick={() => rateCard("learning")}>
            <span aria-hidden="true">↻</span>
            <span><strong>Still learning</strong><small>Come back to it later</small></span>
          </button>
          <button className="flashcard-rate flashcard-rate-mastered" type="button" onClick={() => rateCard("mastered")}>
            <span aria-hidden="true">✓</span>
            <span><strong>Got it</strong><small>Mark as mastered</small></span>
          </button>
        </div>

        <div className="flashcard-keyboard-hint">Tap the card to flip · Space or Enter also works</div>
        {currentIsMastered && <p className="flashcard-mastered-note" role="status">Already mastered on this device.</p>}
      </div>
    </main>
  );
}