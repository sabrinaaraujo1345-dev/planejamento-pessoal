"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Scale, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Decision, Habit, HabitCheck, PersonalItem } from "@/lib/apartment-types";
import { addDays, todayInSP, weekDays, weekStart } from "@/lib/dates";
import { pct } from "@/lib/format";
import { useTable } from "@/lib/use-table";
import { accentCls, btnFor, btnGhost, Field, inputFor, ProgressBar, useToast } from "@/components/apartamento/ui";

const input = inputFor("indigo");
const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const LISTS = [
  { kind: "gratidao", title: "Diário de gratidão", placeholder: "Pelo que você é grata hoje?" },
  { kind: "desejo", title: "Lista de desejos e sonhos", placeholder: "Um desejo ou sonho" },
  { kind: "amo_fazer", title: "Coisas que amo fazer", placeholder: "Algo que você ama fazer" },
] as const;

type Props = { habits: Habit[]; checks: HabitCheck[]; decisions: Decision[]; items: PersonalItem[] };

export function RoutineClient(props: Props) {
  return (
    <div className="space-y-6 max-w-5xl">
      <HabitTracker habits={props.habits} checks={props.checks} />
      <Method101010 decisions={props.decisions} />
      <PersonalSpace items={props.items} />
    </div>
  );
}

function HabitTracker({ habits, checks }: { habits: Habit[]; checks: HabitCheck[] }) {
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();
  const habitApi = useTable<Habit>("habits", habits);
  const [done, setDone] = useState(() => new Set(checks.map((c) => `${c.habit_id}|${c.day}`)));
  const [start, setStart] = useState(() => weekStart(todayInSP()));
  const [name, setName] = useState("");
  const today = todayInSP();
  const days = weekDays(start);

  const checkedInWeek = habitApi.rows.reduce((n, h) => n + days.filter((d) => done.has(`${h.id}|${d}`)).length, 0);
  const consistency = pct(checkedInWeek, habitApi.rows.length * 7);

  async function toggle(habitId: string, day: string) {
    const key = `${habitId}|${day}`;
    const was = done.has(key);
    setDone((s) => {
      const n = new Set(s);
      if (was) n.delete(key);
      else n.add(key);
      return n;
    });
    const { error } = was
      ? await supabase.from("habit_checks").delete().eq("habit_id", habitId).eq("day", day)
      : await supabase.from("habit_checks").insert({ habit_id: habitId, day });
    if (error) {
      toast("Não foi possível salvar o hábito.", "error");
      setDone((s) => {
        const n = new Set(s);
        if (was) n.add(key);
        else n.delete(key);
        return n;
      });
    }
  }

  async function addHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await habitApi.add({ name: name.trim() });
    setName("");
  }

  return (
    <section className="card rounded-2xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-white">Hábitos da semana</h2>
        <div className="flex items-center gap-2">
          <button className={btnGhost} onClick={() => setStart((s) => addDays(s, -7))} aria-label="Semana anterior">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-zinc-300 min-w-36 text-center">
            {new Date(`${days[0]}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} –{" "}
            {new Date(`${days[6]}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          </span>
          <button className={btnGhost} onClick={() => setStart((s) => addDays(s, 7))} aria-label="Próxima semana">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-zinc-300">Consistência da semana</span>
          <span className={`font-semibold ${accentCls.indigo.text}`}>{consistency}%</span>
        </div>
        <ProgressBar value={consistency} tone="indigo" />
      </div>

      <form onSubmit={addHabit} className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input className={input} placeholder="Novo hábito (ler, treinar, beber água...)" value={name} onChange={(e) => setName(e.target.value)} aria-label="Novo hábito" />
        <button type="submit" className={btnFor("indigo")}>
          <Plus className="w-4 h-4" /> Adicionar hábito
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[620px]">
          <thead>
            <tr className="text-xs text-zinc-500 border-b border-surface-700">
              <th className="px-2 py-3 text-left font-medium">Hábito</th>
              {days.map((d, i) => (
                <th key={d} className={`px-1 py-3 font-medium text-center ${d === today ? "text-indigo-300" : ""}`}>
                  {DAY_LABELS[i]}
                  <span className="block text-[11px] font-normal">{d.slice(8)}</span>
                </th>
              ))}
              <th className="px-2 py-3 font-medium text-center">Semana</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {habitApi.rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-2 py-8 text-center text-zinc-500">
                  Nenhum hábito ainda. Adicione o primeiro acima.
                </td>
              </tr>
            )}
            {habitApi.rows.map((h) => {
              const count = days.filter((d) => done.has(`${h.id}|${d}`)).length;
              return (
                <tr key={h.id} className="border-b border-surface-700/60 last:border-0">
                  <td className="px-2 py-2.5 text-zinc-100">{h.name}</td>
                  {days.map((d) => {
                    const on = done.has(`${h.id}|${d}`);
                    return (
                      <td key={d} className="px-1 py-2.5 text-center">
                        <button
                          onClick={() => toggle(h.id, d)}
                          aria-pressed={on}
                          aria-label={`${h.name} em ${d.split("-").reverse().join("/")}`}
                          className={`w-8 h-8 rounded-lg border text-xs font-semibold transition-colors ${
                            on ? "border-indigo-500/60 bg-indigo-500/25 text-indigo-200" : "border-surface-700 text-transparent hover:bg-zinc-800/60"
                          }`}
                        >
                          ✓
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-2 py-2.5 text-center text-xs text-zinc-300">{count}/7</td>
                  <td className="px-2 py-2.5 text-right">
                    <button onClick={() => habitApi.remove(h.id)} className="text-zinc-500 hover:text-rose-400 p-1" aria-label={`Excluir ${h.name}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Method101010({ decisions }: { decisions: Decision[] }) {
  const api = useTable<Decision>("decisions", decisions);
  const [q, setQ] = useState("");
  const [m10, setM10] = useState("");
  const [mo10, setMo10] = useState("");
  const [y10, setY10] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    await api.add({ question: q.trim(), impact_10_minutes: m10.trim() || null, impact_10_months: mo10.trim() || null, impact_10_years: y10.trim() || null });
    setQ("");
    setM10("");
    setMo10("");
    setY10("");
  }

  return (
    <section className="card rounded-2xl p-5 space-y-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
        <Scale className="w-4 h-4 text-indigo-400" /> Método 10-10-10
      </h2>
      <form onSubmit={save} className="space-y-3">
        <Field label="Decisão que você precisa tomar">
          <input className={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ex.: Fechar o orçamento do marceneiro agora?" />
        </Field>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Em 10 minutos">
            <textarea className={`${input} resize-y`} rows={3} value={m10} onChange={(e) => setM10(e.target.value)} />
          </Field>
          <Field label="Em 10 meses">
            <textarea className={`${input} resize-y`} rows={3} value={mo10} onChange={(e) => setMo10(e.target.value)} />
          </Field>
          <Field label="Em 10 anos">
            <textarea className={`${input} resize-y`} rows={3} value={y10} onChange={(e) => setY10(e.target.value)} />
          </Field>
        </div>
        <div className="flex justify-end">
          <button type="submit" className={btnFor("indigo")}>
            Registrar decisão
          </button>
        </div>
      </form>

      {api.rows.length > 0 && (
        <ul className="space-y-3">
          {[...api.rows].reverse().map((d) => (
            <li key={d.id} className="rounded-xl border border-surface-700 p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-zinc-100">{d.question}</p>
                <button onClick={() => api.remove(d.id)} className="text-zinc-500 hover:text-rose-400 p-1" aria-label={`Excluir ${d.question}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid gap-2 md:grid-cols-3 text-xs text-zinc-400">
                <p>
                  <span className="text-zinc-500">10 minutos:</span> {d.impact_10_minutes ?? "—"}
                </p>
                <p>
                  <span className="text-zinc-500">10 meses:</span> {d.impact_10_months ?? "—"}
                </p>
                <p>
                  <span className="text-zinc-500">10 anos:</span> {d.impact_10_years ?? "—"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PersonalSpace({ items }: { items: PersonalItem[] }) {
  const api = useTable<PersonalItem>("personal_items", items);
  const [text, setText] = useState<Record<string, string>>({});

  async function add(kind: PersonalItem["kind"], e: React.FormEvent) {
    e.preventDefault();
    const body = (text[kind] ?? "").trim();
    if (!body) return;
    await api.add({ kind, body });
    setText((t) => ({ ...t, [kind]: "" }));
  }

  return (
    <section className="grid gap-5 lg:grid-cols-3" aria-label="Espaço pessoal">
      {LISTS.map((l) => {
        const rows = api.rows.filter((i) => i.kind === l.kind);
        return (
          <div key={l.kind} className="card rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white">{l.title}</h2>
            <form onSubmit={(e) => add(l.kind, e)} className="flex gap-2">
              <input
                className={input}
                placeholder={l.placeholder}
                value={text[l.kind] ?? ""}
                onChange={(e) => setText((t) => ({ ...t, [l.kind]: e.target.value }))}
                aria-label={l.title}
              />
              <button type="submit" className={btnFor("indigo")} aria-label={`Adicionar em ${l.title}`}>
                <Plus className="w-4 h-4" />
              </button>
            </form>
            {rows.length === 0 ? (
              <p className="text-xs text-zinc-500">Nada por aqui ainda.</p>
            ) : (
              <ul className="space-y-2">
                {rows.map((i) => (
                  <li key={i.id} className="flex items-start gap-2 rounded-xl border border-surface-700 px-3 py-2">
                    <p className="flex-1 text-sm text-zinc-200">{i.body}</p>
                    <button onClick={() => api.remove(i.id)} className="text-zinc-500 hover:text-rose-400 p-0.5" aria-label={`Excluir: ${i.body}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}
