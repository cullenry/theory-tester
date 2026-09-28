"use client";

import { useState } from "react";
import { AnswerOption, ExplanationCard, ProgressBar, QuestionCard, ScoreDisplay } from "@/components/question-ui";
import { getRandomQuestionsFromPool, questions, type Question } from "@/lib/questions";
import { getQuestionsByCategory, getQuestionsBySubcategory, taxonomyCategories } from "@/lib/question-taxonomy";

const SESSION_LENGTH = 20;

export function PracticeSession() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [session, setSession] = useState<Question[] | null>(null);
  const [activePool, setActivePool] = useState<Question[]>([]);
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const selectedCategorySummary = taxonomyCategories.find((item) => item.name === selectedCategory);
  const selectedPool = selectedCategory === "all"
    ? questions
    : selectedSubcategory === "all"
      ? getQuestionsByCategory(selectedCategory)
      : getQuestionsBySubcategory(selectedCategory, selectedSubcategory);
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
                <label>Category<select value={selectedCategory} onChange={(event) => { setSelectedCategory(event.target.value); setSelectedSubcategory("all"); }}><option value="all">All questions ({questions.length})</option>{taxonomyCategories.map((item) => <option key={item.name} value={item.name}>{item.name} ({item.count})</option>)}</select></label>
                <label>Subcategory<select value={selectedSubcategory} disabled={!selectedCategorySummary} onChange={(event) => setSelectedSubcategory(event.target.value)}><option value="all">All subcategories{selectedCategorySummary ? ` (${selectedCategorySummary.count})` : ""}</option>{selectedCategorySummary?.subcategories.map((item) => <option key={item.name} value={item.name}>{item.name} ({item.count})</option>)}</select></label>
              </div>
              <div className="practice-start-row"><p>{Math.min(SESSION_LENGTH, selectedPool.length)} questions in this session</p><button className="button button-primary" type="button" disabled={selectedPool.length === 0} onClick={() => beginSession(selectedPool)}>Start practice <span aria-hidden="true">→</span></button></div>
            </section>
          </>
        ) : finished || !current ? (
          <section className="completion-panel"><span className="completion-mark" aria-hidden="true">✓</span><p className="eyebrow">Session complete</p><h2>Good work. Keep it rolling.</h2><p>You answered {session.length} questions and got {correctCount} correct.</p><div className="practice-completion-actions"><button className="button button-primary" type="button" onClick={() => beginSession(activePool)}>Practise another set <span aria-hidden="true">→</span></button><button className="button button-secondary" type="button" onClick={returnToSetup}>Choose another topic</button></div></section>
        ) : (
          <>
            <div className="page-heading"><div><p className="eyebrow">{selectedCategory === "all" ? "All questions" : selectedCategorySummary?.name}{selectedSubcategory !== "all" ? ` · ${selectedSubcategory}` : ""}</p><h1>Practice session</h1></div><div className="practice-heading-actions"><button className="button button-quiet" type="button" onClick={() => beginSession(activePool)}>↻ <span>Restart</span></button><button className="button button-secondary" type="button" onClick={returnToSetup}>Change topic</button></div></div>
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