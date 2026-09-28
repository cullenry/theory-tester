"use client";

import { useEffect, useState } from "react";
import { getStarredQuestionIds, toggleQuestionBookmark } from "@/lib/progress";

export function QuestionStarButton({ questionId }: { questionId: number }) {
  const [starred, setStarred] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getStarredQuestionIds().then((ids) => {
      if (active) {
        setStarred(ids.includes(questionId));
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [questionId]);

  async function handleToggle() {
    if (loading) return;
    setLoading(true);
    const result = await toggleQuestionBookmark(questionId);

    if (!result.signedIn) {
      window.location.href = "/login";
      return;
    }

    if (result.available) {
      setStarred(result.starred);
    }

    setLoading(false);
  }

  return (
    <button
      className={"question-star-button" + (starred ? " question-star-button-active" : "")}
      type="button"
      onClick={handleToggle}
      disabled={loading}
      aria-label={starred ? "Remove question from starred questions" : "Star this question"}
      aria-pressed={starred}
      title={starred ? "Unstar question" : "Star question"}
    >
      <span aria-hidden="true">{starred ? "★" : "☆"}</span>
      <span className="question-star-label">{starred ? "Starred" : "Star"}</span>
    </button>
  );
}
