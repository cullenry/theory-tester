"use client";

import { useEffect, useRef, useState } from "react";

const REPORT_REASONS = [
  "Question appears incorrect",
  "Answer appears incorrect",
  "Image problem",
  "Explanation problem",
  "Other",
] as const;

type ReportQuestionButtonProps = {
  questionId: number;
  questionText: string;
};

export function ReportQuestionButton({ questionId, questionText }: ReportQuestionButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number]>(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [reasonMenuOpen, setReasonMenuOpen] = useState(false);
  const reasonMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!reasonMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!reasonMenuRef.current?.contains(event.target as Node)) {
        setReasonMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setReasonMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [reasonMenuOpen]);

  function openReport() {
    setReason(REPORT_REASONS[0]);
    setDetails("");
    setReasonMenuOpen(false);
    setOpen(true);
  }

  function submitReport() {
    const body = [
      "Question report",
      "",
      "Question ID: " + questionId,
      "Reason: " + reason,
      "",
      "Question:",
      questionText,
      "",
      "Details:",
      details.trim() || "(No additional details provided)",
    ].join("\n");

    const url =
      "https://github.com/cullenry/theory-tester/issues/new?title=" +
      encodeURIComponent("[Question " + questionId + "] " + reason) +
      "&body=" +
      encodeURIComponent(body);

    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
    setReasonMenuOpen(false);
  }

  return (
    <>
      <button
        className="question-report-button"
        type="button"
        onClick={openReport}
        aria-haspopup="dialog"
        aria-label="Report an issue with this question"
        title="Report an issue"
      >
        <span aria-hidden="true">⚑</span>
      </button>

      {open && (
        <div
          className="report-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
              setReasonMenuOpen(false);
            }
          }}
        >
          <div
            className="report-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={"report-title-" + questionId}
          >
            <div className="report-dialog-header">
              <div>
                <p className="eyebrow">Question {questionId}</p>
                <h2 id={"report-title-" + questionId}>Found something wrong?</h2>
              </div>
              <button
                className="report-close"
                type="button"
                aria-label="Close report dialog"
                onClick={() => {
                  setOpen(false);
                  setReasonMenuOpen(false);
                }}
              >
                ×
              </button>
            </div>

            <div className="report-field">
              <span>What is the issue?</span>
              <div className="report-select-wrap" ref={reasonMenuRef}>
                <button
                  className={"report-select-trigger" + (reasonMenuOpen ? " is-open" : "")}
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={reasonMenuOpen}
                  onClick={() => setReasonMenuOpen((value) => !value)}
                >
                  <span>{reason}</span>
                  <span className="report-select-chevron" aria-hidden="true">⌄</span>
                </button>

                {reasonMenuOpen && (
                  <div className="report-select-menu" role="listbox" aria-label="Issue type">
                    {REPORT_REASONS.map((item) => (
                      <button
                        key={item}
                        className={"report-select-option" + (item === reason ? " is-selected" : "")}
                        type="button"
                        role="option"
                        aria-selected={item === reason}
                        onClick={() => {
                          setReason(item);
                          setReasonMenuOpen(false);
                        }}
                      >
                        <span>{item}</span>
                        {item === reason && (
                          <span className="report-select-check" aria-hidden="true">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <label className="report-field">
              <span>Anything else we should know?</span>
              <textarea
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="Optional details"
                rows={4}
              />
            </label>

            <p className="report-note">
              This opens a pre-filled GitHub issue so the problem can be reviewed and fixed.
            </p>

            <div className="report-actions">
              <button className="button button-secondary" type="button" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="button button-primary" type="button" onClick={submitReport}>
                Continue to report <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
