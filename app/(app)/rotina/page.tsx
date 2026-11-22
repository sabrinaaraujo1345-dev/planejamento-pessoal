import { RoutineClient } from "@/components/rotina/routine-client";
import type { Decision, Habit, HabitCheck, PersonalItem } from "@/lib/apartment-types";
import { addDays, todayInSP } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export default async function RotinaPage() {
  const supabase = await createClient();
  const since = addDays(todayInSP(), -120);
  const [habits, checks, decisions, items] = await Promise.all([
    supabase.from("habits").select("id,name").eq("archived", false).order("created_at"),
    supabase.from("habit_checks").select("habit_id,day").gte("day", since),
    supabase.from("decisions").select("*").order("created_at"),
    supabase.from("personal_items").select("*").order("created_at"),
  ]);
  return (
    <RoutineClient
      habits={(habits.data ?? []) as Habit[]}
      checks={(checks.data ?? []) as HabitCheck[]}
      decisions={(decisions.data ?? []) as Decision[]}
      items={(items.data ?? []) as PersonalItem[]}
    />
  );
}
