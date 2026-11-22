"use client";

import { useState } from "react";
import { Plus, Target, Trash2 } from "lucide-react";
import { PRIORITIES, TASK_CATEGORIES, type Goal, type Task } from "@/lib/apartment-types";
import { useTable } from "@/lib/use-table";
import { accentCls, btnFor, Chips, inputFor, ProgressBar, ToastProvider } from "@/components/apartamento/ui";

const input = inputFor("indigo");
const HORIZONS = [
  { id: "diario", label: "Planejamento Diário" },
  { id: "semanal", label: "Visão Semanal" },
  { id: "semestral", label: "Horizonte Semestral" },
  { id: "anual", label: "Visão Anual" },
] as const;
const PRIORITY_FILTERS = ["Todas", ...PRIORITIES] as const;
const SCOPES = ["Todas", "Semestral", "Anual"] as const;
const PRIORITY_TONE: Record<string, string> = {
  Alta: "text-rose-300 border-rose-500/40",
  Média: "text-amber-300 border-amber-500/40",
  Baixa: "text-sky-300 border-sky-500/40",
};
const RANK: Record<string, number> = { Alta: 0, Média: 1, Baixa: 2 };

export function PlanningClient({ tasks, goals }: { tasks: Task[]; goals: Goal[] }) {
  return (
    <ToastProvider>
      <Inner tasks={tasks} goals={goals} />
    </ToastProvider>
  );
}

function Inner({ tasks, goals }: { tasks: Task[]; goals: Goal[] }) {
  const taskApi = useTable<Task>("tasks", tasks);
  const goalApi = useTable<Goal>("goals", goals);
  const [horizon, setHorizon] = useState<Task["horizon"]>("diario");
  const [priority, setPriority] = useState<(typeof PRIORITY_FILTERS)[number]>("Todas");
  const [scope, setScope] = useState<(typeof SCOPES)[number]>("Todas");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Task["category"]>("Pessoal");
  const [newPriority, setNewPriority] = useState<Task["priority"]>("Média");
  const [due, setDue] = useState("");

  const [goalTitle, setGoalTitle] = useState("");
  const [milestone, setMilestone] = useState("");
  const [goalScope, setGoalScope] = useState<Goal["scope"]>("semestral");

  const visibleTasks = taskApi.rows
    .filter((t) => t.horizon === horizon && (priority === "Todas" || t.priority === priority))
    .sort((a, b) => Number(a.done) - Number(b.done) || RANK[a.priority] - RANK[b.priority]);
  const horizonTasks = taskApi.rows.filter((t) => t.horizon === horizon);
  const doneCount = horizonTasks.filter((t) => t.done).length;
  const visibleGoals = goalApi.rows.filter((g) => scope === "Todas" || g.scope === scope.toLowerCase());

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await taskApi.add({ title: title.trim(), category, priority: newPriority, horizon, due_date: due || null });
    setTitle("");
    setDue("");
  }

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    await goalApi.add({ title: goalTitle.trim(), milestone: milestone.trim() || null, scope: goalScope, progress: 0 });
    setGoalTitle("");
    setMilestone("");
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div role="tablist" aria-label="Horizontes de planejamento" className="flex gap-2 overflow-x-auto pb-1">
        {HORIZONS.map((h) => (
          <button
            key={h.id}
            role="tab"
            aria-selected={horizon === h.id}
            onClick={() => setHorizon(h.id)}
            className={`whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
              horizon === h.id ? accentCls.indigo.tab : "border-surface-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
            }`}
          >
            {h.label}
          </button>
        ))}
      </div>

      <section className="card rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Tarefas</h2>
          <span className="text-xs text-zinc-400">
            {doneCount} de {horizonTasks.length} concluídas
          </span>
        </div>
        <Chips options={PRIORITY_FILTERS} value={priority} onChange={setPriority} accent="indigo" />

        <form onSubmit={addTask} className="grid gap-3 sm:grid-cols-[1fr_9rem_7rem_9.5rem_auto]">
          <input className={input} placeholder="Nova tarefa" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Nova tarefa" />
          <select className={input} value={category} onChange={(e) => setCategory(e.target.value as Task["category"])} aria-label="Categoria">
            {TASK_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select className={input} value={newPriority} onChange={(e) => setNewPriority(e.target.value as Task["priority"])} aria-label="Prioridade">
            {PRIORITIES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <input className={input} type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Data (opcional)" />
          <button type="submit" className={btnFor("indigo")}>
            <Plus className="w-4 h-4" /> Adicionar tarefa
          </button>
        </form>

        {visibleTasks.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhuma tarefa neste horizonte. Adicione a primeira acima.</p>
        ) : (
          <ul className="space-y-2">
            {visibleTasks.map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-xl border border-surface-700 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={(e) => taskApi.patch(t.id, { done: e.target.checked })}
                  className={`w-4 h-4 ${accentCls.indigo.check}`}
                  aria-label={`Concluir: ${t.title}`}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${t.done ? "line-through text-zinc-500" : "text-zinc-100"}`}>{t.title}</p>
                  <p className="text-xs text-zinc-500">
                    {t.category}
                    {t.due_date ? ` · ${new Date(t.due_date + "T00:00:00").toLocaleDateString("pt-BR")}` : ""}
                  </p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-xs ${PRIORITY_TONE[t.priority]}`}>{t.priority}</span>
                <button onClick={() => taskApi.remove(t.id)} className="text-zinc-500 hover:text-rose-400 p-1" aria-label={`Excluir ${t.title}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Objetivos, metas e marcos</h2>
          <Chips options={SCOPES} value={scope} onChange={setScope} accent="indigo" />
        </div>

        <form onSubmit={addGoal} className="grid gap-3 sm:grid-cols-[1fr_1fr_8rem_auto]">
          <input className={input} placeholder="Meta" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} aria-label="Meta" />
          <input className={input} placeholder="Marco (o que marca a conclusão)" value={milestone} onChange={(e) => setMilestone(e.target.value)} aria-label="Marco" />
          <select className={input} value={goalScope} onChange={(e) => setGoalScope(e.target.value as Goal["scope"])} aria-label="Prazo">
            <option value="semestral">Semestral</option>
            <option value="anual">Anual</option>
          </select>
          <button type="submit" className={btnFor("indigo")}>
            <Target className="w-4 h-4" /> Adicionar meta
          </button>
        </form>

        {visibleGoals.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhuma meta cadastrada nesse prazo.</p>
        ) : (
          <ul className="space-y-3">
            {visibleGoals.map((g) => (
              <GoalRow key={g.id} goal={g} onCommit={(v) => goalApi.patch(g.id, { progress: v })} onRemove={() => goalApi.remove(g.id)} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function GoalRow({ goal, onCommit, onRemove }: { goal: Goal; onCommit: (v: number) => void; onRemove: () => void }) {
  const [value, setValue] = useState(goal.progress);
  const commit = () => value !== goal.progress && onCommit(value);
  return (
    <li className="rounded-xl border border-surface-700 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-100">{goal.title}</p>
          <p className="text-xs text-zinc-500">
            {goal.scope === "anual" ? "Anual" : "Semestral"}
            {goal.milestone ? ` · Marco: ${goal.milestone}` : ""}
          </p>
        </div>
        <button onClick={onRemove} className="text-zinc-500 hover:text-rose-400 p-1" aria-label={`Excluir ${goal.title}`}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          onPointerUp={commit}
          onKeyUp={commit}
          onBlur={commit}
          className="flex-1 accent-emerald-500"
          aria-label={`Progresso de ${goal.title}`}
        />
        <span className={`w-12 text-right text-sm font-semibold ${value === 100 ? "text-emerald-300" : "text-zinc-200"}`}>{value}%</span>
      </div>
      <ProgressBar value={value} tone="emerald" />
    </li>
  );
}
