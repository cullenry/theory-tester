import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = {
  title: "Create account",
};

export default function SignupPage() {
  return (
    <main className="auth-main">
      <div className="auth-shell">
        <div className="auth-side">
          <p className="eyebrow">Your TheoryPrep account</p>
          <h2>Make practice stick.</h2>
          <p>Create your account now, then build on it as we add saved progress, mock-test history and more.</p>
          <div className="auth-side-line"><span>LEARN</span><i /><span>PRACTISE</span><i /><span>PASS</span></div>
        </div>
        <Suspense fallback={null}>
          <AuthForm mode="signup" />
        </Suspense>
      </div>
    </main>
  );
}
