import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MistakePractice } from "@/components/mistake-practice";

export const dynamic = "force-dynamic";
export const metadata = { title: "Practice your mistakes" };

export default async function MistakesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/mistakes");
  }

  return <MistakePractice />;
}
