import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "Forgot password",
  description: "Request a secure TheoryPrep password reset email.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="auth-main">
      <div className="auth-shell">
        <div className="auth-side">
          <p className="eyebrow">Reset your access</p>
          <h2>Back to practice.</h2>
          <p>Enter the email on your TheoryPrep account and we’ll send you a secure link to choose a new password.</p>
          <div className="auth-side-line"><span>RESET</span><i /><span>SIGN IN</span><i /><span>PRACTISE</span></div>
        </div>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
