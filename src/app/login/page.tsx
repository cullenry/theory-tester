import { AuthForm } from "@/components/auth/auth-form";

export const metadata = {
  title: "Sign in",
};

type LoginPageProps = {
  searchParams?: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = Array.isArray(params?.next) ? params.next[0] : params?.next;

  return (
    <main className="auth-main">
      <div className="auth-shell">
        <div className="auth-side">
          <p className="eyebrow">Keep your progress close</p>
          <h2>Ready when you are.</h2>
          <p>Sign in and get straight back to practising the Irish driving theory questions you need.</p>
          <div className="auth-side-line"><span>LEARN</span><i /><span>PRACTISE</span><i /><span>DRIVE WITH CONFIDENCE</span></div>
        </div>
        <AuthForm mode="login" redirectTo={next} />
      </div>
    </main>
  );
}
