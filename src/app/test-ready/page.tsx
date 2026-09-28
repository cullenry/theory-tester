import { redirect } from "next/navigation";
import { TestReady } from "@/components/test-ready";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Test Ready" };

export default async function TestReadyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <TestReady />;
}
