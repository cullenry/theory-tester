import { redirect } from "next/navigation";
import { ProgressDashboard } from "@/components/progress-dashboard";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "My progress" };

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <ProgressDashboard />;
}
