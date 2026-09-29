"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return;

      if (error || !data.user) {
        setInvalidLink(true);
        setErrorMessage("This password reset link is invalid or has expired. Please request a new one.");
      }

      setReady(true);
    });

    return () => {
      mounted = false;
    };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (password.length < 6) {
      setErrorMessage("Your new password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    setSuccessMessage("Password updated. You can continue to TheoryPrep.");
    setPassword("");
    setConfirmPassword("");
    setIsLoading(false);
  }

  return (
    <div className="auth-card">
      <div className="auth-card-top">
        <span className="auth-mark" aria-hidden="true">T</span>
        <div>
          <p className="eyebrow">Password recovery</p>
          <h1>Choose a new password.</h1>
        </div>
      </div>

      <p className="auth-intro">
        Use at least 6 characters, then save your new password.
      </p>

      {!ready ? (
        <p className="auth-loading-message">Checking your reset link…</p>
      ) : invalidLink ? (
        <div className="auth-form">
          <p className="auth-message auth-error" role="alert">{errorMessage}</p>
          <Link className="button button-secondary auth-submit" href="/forgot-password">
            Request a new link
          </Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>New password</span>
            <input
              className="auth-input"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
              disabled={Boolean(successMessage)}
              required
            />
          </label>

          <label className="auth-field">
            <span>Confirm new password</span>
            <input
              className="auth-input"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Enter it again"
              minLength={6}
              disabled={Boolean(successMessage)}
              required
            />
          </label>

          {errorMessage && (
            <p className="auth-message auth-error" role="alert">{errorMessage}</p>
          )}
          {successMessage && (
            <p className="auth-message auth-success" role="status">{successMessage}</p>
          )}

          {!successMessage && (
            <button className="button button-primary auth-submit" type="submit" disabled={isLoading}>
              {isLoading ? "Saving…" : "Save new password"}
            </button>
          )}

          {successMessage && (
            <Link className="button button-primary auth-submit" href="/">
              Continue to TheoryPrep
            </Link>
          )}
        </form>
      )}

      <div className="auth-switch">
        <span>Back to</span>
        <Link href="/login">Sign in</Link>
      </div>
    </div>
  );
}
