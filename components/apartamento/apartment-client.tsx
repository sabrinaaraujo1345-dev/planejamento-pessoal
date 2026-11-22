"use client";

import { useMemo, useState } from "react";
import { FileCheck2, Hammer, Palette, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AptLink, Project, Purchase, RoomSpec, Stage, Work } from "@/lib/apartment-types";
import { formatBRL, pct } from "@/lib/format";
import { useTable } from "@/lib/use-table";
import { DesignTab } from "./design-tab";
import { ReferenceLinks, SpecsNotebook } from "./design-notes";
import { PurchasesTab } from "./purchases-tab";
import { StagesTab } from "./stages-tab";
import { inputCls, ProgressBar, ToastProvider, useToast } from "./ui";
import { WorksTab } from "./works-tab";

type Props = {
  budgetCap: number;
  stages: Stage[];
  works: Work[];
  purchases: Purchase[];
  projects: Project[];
  specs: RoomSpec[];
  links: AptLink[];
};

const TABS = [
  { id: "etapas", label: "Etapas & Documentação", icon: FileCheck2 },
  { id: "obras", label: "Obras & Reformas", icon: Hammer },
  { id: "compras", label: "Compras & Enxoval", icon: ShoppingBag },
  { id: "design", label: "Design de Interiores", icon: Palette },
] as const;

export function ApartmentClient(props: Props) {
  return (
    <ToastProvider>
      <Inner {...props} />
    </ToastProvider>
  );
}

function Inner({ budgetCap, stages, works, purchases, projects, specs, links }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("etapas");
  const [cap, setCap] = useState(budgetCap);

  const stageApi = useTable<Stage>("apt_stages", stages);
  const workApi = useTable<Work>("apt_works", works);
  const purchaseApi = useTable<Purchase>("apt_purchases", purchases);
  const projectApi = useTable<Project>("apt_projects", projects);
  const linkApi = useTable<AptLink>("links", links);

  const spent = workApi.rows.reduce((s, w) => s + w.paid, 0) + purchaseApi.rows.reduce((s, p) => s + p.paid, 0);
  const balance = cap - spent;
  const doneItems = stageApi.rows.filter((s) => s.done).length + workApi.rows.filter((w) => w.status === "Concluído").length;
  const totalItems = stageApi.rows.length + workApi.rows.length;
  const progress = pct(doneItems, totalItems);

  async function saveCap(value: number) {
    if (value === cap) return;
    const { error } = await supabase.from("apt_settings").upsert({ budget_cap: value }, { onConflict: "user_id" });
    if (error) return toast("Não foi possível salvar o teto orçamentário.", "error");
    setCap(value);
    toast("Teto orçamentário atualizado");
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <section className="card rounded-2xl p-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-label="Painel financeiro do imóvel">
        <div>
          <label htmlFor="cap" className="text-xs text-zinc-500">
            Teto orçamentário
          </label>
          <input
            id="cap"
            type="number"
            min={0}
            step="0.01"
            defaultValue={cap}
            key={cap}
            onBlur={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n) && n >= 0) saveCap(n);
            }}
            className={`${inputCls} mt-1 text-lg font-semibold`}
          />
        </div>
        <div>
          <p className="text-xs text-zinc-500">Total já gasto</p>
          <p className="mt-1 text-lg font-semibold text-amber-300">{formatBRL(spent)}</p>
          <p className="text-xs text-zinc-500">obras + compras pagas</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Saldo disponível</p>
          <p className={`mt-1 text-lg font-semibold ${balance < 0 ? "text-rose-400" : "text-emerald-300"}`}>{formatBRL(balance)}</p>
          <p className="text-xs text-zinc-500">{balance < 0 ? "acima do teto" : `${pct(spent, cap)}% do teto usado`}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Progresso geral</p>
          <p className="mt-1 text-lg font-semibold text-white">{progress}%</p>
          <div className="mt-2">
            <ProgressBar value={progress} />
          </div>
          <p className="mt-1 text-xs text-zinc-500">etapas e obras concluídas</p>
        </div>
      </section>

      <div role="tablist" aria-label="Seções do apartamento" className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
              tab === id
                ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                : "border-surface-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === "etapas" && <StagesTab stages={stageApi} />}
        {tab === "obras" && <WorksTab works={workApi} />}
        {tab === "compras" && <PurchasesTab purchases={purchaseApi} />}
        {tab === "design" && (
          <div className="space-y-5">
            <DesignTab projects={projectApi} />
            <ReferenceLinks links={linkApi as never} />
            <SpecsNotebook initial={specs} />
          </div>
        )}
      </div>
    </div>
  );
}
