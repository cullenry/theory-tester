import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = {
  title: "Set a new password",
  description: "Choose a new TheoryPrep account password.",
};

export default function ResetPasswordPage() {
  return (
    <main className="auth-main">
      <div className="auth-shell">
        <div className="auth-side">
          <p className="eyebrow">Almost there</p>
          <h2>One fresh start.</h2>
          <p>Choose a new password for your TheoryPrep account, then head straight back into your practice.</p>
          <div className="auth-side-line"><span>NEW PASSWORD</span><i /><span>SAVE</span><i /><span>PRACTISE</span></div>
        </div>
        <ResetPasswordForm />
      </div>
    </main>
  );
}
