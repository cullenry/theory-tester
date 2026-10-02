import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <main className="auth-main">
      <div className="auth-shell">
        <div className="auth-side">
          <p className="eyebrow">Keep your progress close</p>
          <h2>Ready when you are.</h2>
          <p>Sign in and get straight back to practicing the Irish driving theory questions you need.</p>
          <div className="auth-side-line"><span>LEARN</span><i /><span>PRACTICE</span><i /><span>DRIVE WITH CONFIDENCE</span></div>
        </div>
        <Suspense fallback={null}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </main>
  );
}
