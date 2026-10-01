"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage(
        "If an account uses that email address, a password reset link is on its way. Check your inbox and spam folder.",
      );
      setEmail("");
    }

    setIsLoading(false);
  }

  return (
    <div className="auth-card">
      <div className="auth-card-top">
        <span className="auth-mark" aria-hidden="true">T</span>
        <div>
          <p className="eyebrow">Password recovery</p>
          <h1>Reset your password.</h1>
        </div>
      </div>

      <p className="auth-intro">
        Enter your account email and we’ll send you a secure password reset link.
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span>Email address</span>
          <input
            className="auth-input"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        {errorMessage && (
          <p className="auth-message auth-error" role="alert">{errorMessage}</p>
        )}
        {successMessage && (
          <p className="auth-message auth-success" role="status">{successMessage}</p>
        )}

        <button className="button button-primary auth-submit" type="submit" disabled={isLoading}>
          {isLoading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <div className="auth-switch">
        <span>Remember your password?</span>
        <Link href="/login">Back to sign in</Link>
      </div>
    </div>
  );
}
