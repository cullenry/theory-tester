import { AuthForm } from "@/components/auth/auth-form";

export const metadata = {
  title: "Create account",
};

type SignupPageProps = {
  searchParams?: Promise<{ next?: string | string[] }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const next = Array.isArray(params?.next) ? params.next[0] : params?.next;

  return (
    <main className="auth-main">
      <div className="auth-shell">
        <div className="auth-side">
          <p className="eyebrow">Your TheoryTester account</p>
          <h2>Make practice stick.</h2>
          <p>Create your account now, then build on it as we add saved progress, mock-test history and more.</p>
          <div className="auth-side-line"><span>LEARN</span><i /><span>PRACTISE</span><i /><span>PASS</span></div>
        </div>
        <AuthForm mode="signup" redirectTo={next} />
      </div>
    </main>
  );
}
