import Link from "next/link";
import { ArrowRight, Home, PiggyBank, Plus } from "lucide-react";
import { PrioritiesPanel } from "@/components/dashboard/priorities-panel";
import { ProgressBar } from "@/components/apartamento/ui";
import type { Goal, Piggy, Stage, Task, Tx, Work, Purchase, Habit, HabitCheck } from "@/lib/apartment-types";
import { todayInSP, weekDays, weekStart } from "@/lib/dates";
import { formatBRL, pct } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = todayInSP();
  const ym = today.slice(0, 7);
  const days = weekDays(weekStart(today));

  const [txs, piggies, goals, settings, stages, works, purchases, habits, checks, tasks] = await Promise.all([
    supabase.from("transactions").select("*").gte("occurred_on", `${ym}-01`).lte("occurred_on", `${ym}-31`),
    supabase.from("piggy_banks").select("*").order("created_at"),
    supabase.from("goals").select("progress"),
    supabase.from("apt_settings").select("budget_cap").maybeSingle(),
    supabase.from("apt_stages").select("*").order("position"),
    supabase.from("apt_works").select("*").order("created_at"),
    supabase.from("apt_purchases").select("paid"),
    supabase.from("habits").select("id").eq("archived", false),
    supabase.from("habit_checks").select("habit_id,day").gte("day", days[0]).lte("day", days[6]),
    supabase.from("tasks").select("*").eq("horizon", "diario").order("created_at"),
  ]);

  const tx = (txs.data ?? []) as Tx[];
  const income = tx.filter((t) => t.payment_method === "receita").reduce((s, t) => s + t.amount, 0);
  const out = tx.filter((t) => t.payment_method !== "receita");
  const invested = out.filter((t) => t.category === "Investimentos").reduce((s, t) => s + t.amount, 0);
  const expenses = out.filter((t) => t.category !== "Investimentos").reduce((s, t) => s + t.amount, 0);
  const balance = income - expenses - invested;

  const goalRows = (goals.data ?? []) as Pick<Goal, "progress">[];
  const goalAvg = goalRows.length ? Math.round(goalRows.reduce((s, g) => s + g.progress, 0) / goalRows.length) : 0;

  const stageRows = (stages.data ?? []) as Stage[];
  const workRows = (works.data ?? []) as Work[];
  const purchaseRows = (purchases.data ?? []) as Pick<Purchase, "paid">[];
  const cap = Number(settings.data?.budget_cap ?? 0);
  const aptSpent = workRows.reduce((s, w) => s + w.paid, 0) + purchaseRows.reduce((s, p) => s + p.paid, 0);
  const aptDone = stageRows.filter((s) => s.done).length + workRows.filter((w) => w.status === "Concluído").length;
  const aptProgress = pct(aptDone, stageRows.length + workRows.length);

  const habitCount = ((habits.data ?? []) as Pick<Habit, "id">[]).length;
  const weekChecks = ((checks.data ?? []) as HabitCheck[]).length;
  const consistency = pct(weekChecks, habitCount * 7);

  const piggyRows = (piggies.data ?? []) as Piggy[];

  const kpis = [
    { label: "Saldo do mês", value: formatBRL(balance), hint: `${formatBRL(invested)} investidos`, tone: balance < 0 ? "text-rose-400" : "text-emerald-300" },
    { label: "Progresso das metas", value: `${goalAvg}%`, hint: `${goalRows.length} ${goalRows.length === 1 ? "meta" : "metas"}`, tone: "text-indigo-300" },
    { label: "Orçamento do apê", value: formatBRL(aptSpent), hint: cap > 0 ? `de ${formatBRL(cap)} (${pct(aptSpent, cap)}%)` : "defina o teto em Meu Apartamento", tone: "text-amber-300" },
    { label: "Hábitos da semana", value: `${consistency}%`, hint: habitCount ? `${weekChecks} de ${habitCount * 7} marcações` : "nenhum hábito ainda", tone: "text-indigo-300" },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <section className="card rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-indigo-500/10 to-transparent">
        <div>
          <h2 className="text-lg font-semibold text-white">Seu resumo de hoje</h2>
          <p className="text-sm text-zinc-400 mt-1">Rotina, finanças e a obra do apartamento em um só lugar.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/apartamento" className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-sm font-semibold text-surface-950 transition-colors">
            <Home className="w-4 h-4" /> Meu Apartamento · {aptProgress}%
          </Link>
          <Link href="/financas?aba=lancamentos" className="inline-flex items-center gap-2 rounded-xl border border-surface-700 hover:bg-zinc-800/60 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors">
            <Plus className="w-4 h-4" /> Novo lançamento
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores">
        {kpis.map((k) => (
          <div key={k.label} className="card rounded-2xl p-5">
            <p className="text-xs text-zinc-500">{k.label}</p>
            <p className={`mt-1 text-xl font-semibold ${k.tone}`}>{k.value}</p>
            <p className="mt-1 text-xs text-zinc-500">{k.hint}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <PrioritiesPanel tasks={(tasks.data ?? []) as Task[]} />

        <section className="card rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Obras & etapas do apê</h2>
            <Link href="/apartamento" className="text-xs text-amber-300 hover:underline inline-flex items-center gap-1">
              Abrir <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <ProgressBar value={aptProgress} />
          {stageRows.length + workRows.length === 0 ? (
            <p className="text-sm text-zinc-500">Cadastre etapas e serviços em Meu Apartamento.</p>
          ) : (
            <ul className="space-y-2">
              {stageRows.slice(0, 3).map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-sm">
                  <span className={`w-2 h-2 rounded-full ${s.done ? "bg-emerald-400" : "bg-zinc-600"}`} />
                  <span className={s.done ? "text-zinc-500 line-through" : "text-zinc-200"}>{s.title}</span>
                </li>
              ))}
              {workRows.slice(0, 3).map((w) => (
                <li key={w.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-zinc-200 truncate">{w.service}</span>
                  <span className="text-xs text-zinc-400 whitespace-nowrap">{w.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Meus cofrinhos</h2>
            <Link href="/financas" className="text-xs text-emerald-300 hover:underline inline-flex items-center gap-1">
              Abrir <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {piggyRows.length === 0 ? (
            <p className="text-sm text-zinc-500">Crie um cofrinho em Finanças.</p>
          ) : (
            <ul className="space-y-3">
              {piggyRows.slice(0, 4).map((p) => (
                <li key={p.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-zinc-200">
                      <PiggyBank className="w-4 h-4 text-emerald-400" /> {p.name}
                    </span>
                    <span className="text-xs text-zinc-400">{pct(p.current, p.target)}%</span>
                  </div>
                  <ProgressBar value={pct(p.current, p.target)} tone="emerald" />
                  <p className="text-xs text-zinc-500">
                    {formatBRL(p.current)} de {formatBRL(p.target)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
