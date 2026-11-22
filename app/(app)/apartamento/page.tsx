import { ApartmentClient } from "@/components/apartamento/apartment-client";
import type { AptLink, Project, Purchase, RoomSpec, Stage, Work } from "@/lib/apartment-types";
import { createClient } from "@/lib/supabase/server";

export default async function ApartamentoPage() {
  const supabase = await createClient();

  const [settings, stages, works, purchases, projects, specs, links] = await Promise.all([
    supabase.from("apt_settings").select("budget_cap").maybeSingle(),
    supabase.from("apt_stages").select("*").order("position").order("created_at"),
    supabase.from("apt_works").select("*").order("created_at"),
    supabase.from("apt_purchases").select("*").order("created_at"),
    supabase.from("apt_projects").select("*").order("created_at"),
    supabase.from("apt_room_specs").select("*"),
    supabase.from("links").select("*").eq("area", "apartamento").order("created_at"),
  ]);

  // URLs assinadas (1 h) para as imagens do bucket privado.
  const projectRows = (projects.data ?? []) as Project[];
  const paths = projectRows.map((p) => p.image_path).filter((p): p is string => !!p);
  const signed = paths.length ? await supabase.storage.from("apt-images").createSignedUrls(paths, 3600) : null;
  const urlByPath = new Map((signed?.data ?? []).map((s) => [s.path, s.signedUrl]));
  const projectsWithUrls = projectRows.map((p) => ({ ...p, signed_url: p.image_path ? (urlByPath.get(p.image_path) ?? null) : null }));

  return (
    <ApartmentClient
      budgetCap={Number(settings.data?.budget_cap ?? 0)}
      stages={(stages.data ?? []) as Stage[]}
      works={(works.data ?? []) as Work[]}
      purchases={(purchases.data ?? []) as Purchase[]}
      projects={projectsWithUrls}
      specs={(specs.data ?? []) as RoomSpec[]}
      links={(links.data ?? []) as AptLink[]}
    />
  );
}
