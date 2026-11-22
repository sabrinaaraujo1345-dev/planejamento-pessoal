import { PlanningClient } from "@/components/planejamento/planning-client";
import type { Goal, Task } from "@/lib/apartment-types";
import { createClient } from "@/lib/supabase/server";

export default async function PlanejamentoPage() {
  const supabase = await createClient();
  const [tasks, goals] = await Promise.all([
    supabase.from("tasks").select("*").order("created_at"),
    supabase.from("goals").select("*").order("created_at"),
  ]);
  return <PlanningClient tasks={(tasks.data ?? []) as Task[]} goals={(goals.data ?? []) as Goal[]} />;
}
