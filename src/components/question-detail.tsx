"use client";

import Link from "next/link";
import { useEffect, useRef, type MouseEvent } from "react";
import { AnswerOption, ExplanationCard, QuestionCard } from "@/components/question-ui";
import type { Question } from "@/lib/questions";
import { QUESTION_TYPES } from "@/lib/question-taxonomy";

type QuestionDetailProps = {
  question: Question;
  index: number;
  previousId: number | null;
  nextId: number | null;
};

const QUESTION_SCROLL_REQUEST_KEY = "theoryprep-question-scroll-request";

function requestQuestionScroll(questionId: number) {
  try {
    sessionStorage.setItem(QUESTION_SCROLL_REQUEST_KEY, JSON.stringify({ questionId, requestedAt: Date.now() }));
  } catch {
    // Native route scrolling remains available if session storage is unavailable.
  }
}

function shouldScrollToQuestion(questionId: number) {
  try {
    const stored = sessionStorage.getItem(QUESTION_SCROLL_REQUEST_KEY);
    if (!stored) return false;
    sessionStorage.removeItem(QUESTION_SCROLL_REQUEST_KEY);

    const request = JSON.parse(stored) as { questionId?: number; requestedAt?: number };
    return request.questionId === questionId && Date.now() - (request.requestedAt ?? 0) < 5000;
  } catch {
    return false;
  }
}

function handleQuestionNavigation(event: MouseEvent<HTMLAnchorElement>, questionId: number) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  requestQuestionScroll(questionId);
}

export function QuestionDetail({ question, index, previousId, nextId }: QuestionDetailProps) {
  const questionAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shouldScrollToQuestion(question.id)) return;

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        questionAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }, [question.id]);

  return (
    <main className="app-main"><div className="page-shell detail-shell"><Link className="back-link" href="/questions">← Back to all questions</Link><div className="mobile-question-anchor" ref={questionAnchorRef}><QuestionCard question={question} eyebrow={`${question.taxonomy.category ? `${question.taxonomy.category} · ${question.taxonomy.subcategory} · ` : ""}Question ${index + 1}`}>
      {question.answers.map((answer, answerIndex) => <AnswerOption key={`${question.id}-${answerIndex}`} answer={answer} index={answerIndex} selected={false} correct={answer === question.correctAnswer} incorrect={false} disabled onSelect={() => undefined} />)}
    </QuestionCard></div><section className="taxonomy-details" aria-label="Question classification"><dl className="taxonomy-facts"><div><dt>Category</dt><dd>{question.taxonomy.category ?? "Uncategorized"}</dd></div>{question.taxonomy.subcategory && <div><dt>Topic</dt><dd>{question.taxonomy.subcategory}</dd></div>}</dl>{question.questionTypes.length > 0 && <div className="question-type-badges" aria-label="Question types">{question.questionTypes.map((type) => { const definition = QUESTION_TYPES.find((item) => item.value === type); return definition ? <span className="question-type-badge" key={type}>{definition.label}</span> : null; })}</div>}</section><ExplanationCard explanation={question.explanation} /><nav className="detail-navigation" aria-label="Question navigation">{previousId !== null ? <Link className="button button-secondary" href={`/questions/${previousId}`} onClick={(event) => handleQuestionNavigation(event, previousId)}>← Previous</Link> : <span />}{nextId !== null ? <Link className="button button-primary" href={`/questions/${nextId}`} onClick={(event) => handleQuestionNavigation(event, nextId)}>Next question →</Link> : <span className="end-of-list">End of question list</span>}</nav></div></main>
  );
}