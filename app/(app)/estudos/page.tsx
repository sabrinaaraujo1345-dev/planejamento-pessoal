import { StudiesClient } from "@/components/estudos/studies-client";
import type { AptLink, StudyTopic } from "@/lib/apartment-types";
import { createClient } from "@/lib/supabase/server";

export default async function EstudosPage() {
  const supabase = await createClient();
  const [topics, links] = await Promise.all([
    supabase.from("study_topics").select("*").order("created_at"),
    supabase.from("links").select("*").eq("area", "estudos").order("created_at"),
  ]);
  return <StudiesClient topics={(topics.data ?? []) as StudyTopic[]} links={(links.data ?? []) as AptLink[]} />;
}
