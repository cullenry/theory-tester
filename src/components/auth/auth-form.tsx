"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const isSignup = mode === "signup";
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (isSignup && password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + "/auth/callback",
        },
      });

      if (error) {
        setErrorMessage(error.message);
      } else if (data.session) {
        window.location.href = "/";
        return;
      } else {
        setSuccessMessage("Account created. Check your email to confirm your address.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        window.location.href = "/";
        return;
      }
    }

    setIsLoading(false);
  }

  return (
    <div className="auth-card">
      <div className="auth-card-top">
        <span className="auth-mark" aria-hidden="true">T</span>
        <div>
          <p className="eyebrow">TheoryTester account</p>
          <h1>{isSignup ? "Create your account." : "Welcome back."}</h1>
        </div>
      </div>

      <p className="auth-intro">
        {isSignup
          ? "Create an account and keep your TheoryTester practice in one place."
          : "Sign in to carry on with your TheoryTester practice."}
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span>Email address</span>
          <input
            className="auth-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="auth-field">
          <span>Password</span>
          <input
            className="auth-input"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={isSignup ? "At least 6 characters" : "Your password"}
            minLength={isSignup ? 6 : undefined}
            required
          />
        </label>

        {isSignup && (
          <label className="auth-field">
            <span>Confirm password</span>
            <input
              className="auth-input"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Enter your password again"
              minLength={6}
              required
            />
          </label>
        )}

        {errorMessage && <p className="auth-message auth-error" role="alert">{errorMessage}</p>}
        {successMessage && <p className="auth-message auth-success" role="status">{successMessage}</p>}

        <button className="button button-primary auth-submit" type="submit" disabled={isLoading}>
          {isLoading ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
        </button>
      </form>

      <div className="auth-switch">
        <span>{isSignup ? "Already have an account?" : "Don't have an account?"}</span>
        <Link href={isSignup ? "/login" : "/signup"}>
          {isSignup ? "Sign in" : "Create one"}
        </Link>
      </div>
    </div>
  );
}
