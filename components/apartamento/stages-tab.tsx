"use client";

import { useState } from "react";
import { ListChecks, Plus, Trash2 } from "lucide-react";
import { DEFAULT_STAGES, type Stage } from "@/lib/apartment-types";
import { pct } from "@/lib/format";
import { btnGhost, btnPrimary, inputCls, ProgressBar } from "./ui";

type Api = {
  rows: Stage[];
  add: (v: Partial<Stage>) => Promise<Stage | null>;
  patch: (id: string, v: Partial<Stage>) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export function StagesTab({ stages }: { stages: Api }) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const done = stages.rows.filter((s) => s.done).length;

  async function addStage(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await stages.add({ title: title.trim(), note: note.trim() || null, position: stages.rows.length });
    setTitle("");
    setNote("");
  }

  async function seedDefaults() {
    for (const [i, t] of DEFAULT_STAGES.entries()) await stages.add({ title: t, position: stages.rows.length + i });
  }

  return (
    <div className="space-y-4">
      <div className="card rounded-2xl p-5">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-zinc-300">Etapas concluídas</span>
          <span className="text-amber-300 font-semibold">
            {done}/{stages.rows.length} · {pct(done, stages.rows.length)}%
          </span>
        </div>
        <ProgressBar value={pct(done, stages.rows.length)} />
      </div>

      {stages.rows.length === 0 && (
        <div className="card rounded-2xl p-6 text-center">
          <ListChecks className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <p className="text-sm text-zinc-300">Nenhuma etapa cadastrada ainda.</p>
          <p className="text-xs text-zinc-500 mt-1">Comece pelas etapas de financiamento, chaves, cartório, contas e ART/RRT.</p>
          <button onClick={seedDefaults} className={`${btnPrimary} mt-4`}>
            Adicionar etapas padrão
          </button>
        </div>
      )}

      <ul className="space-y-2">
        {stages.rows.map((s) => (
          <li key={s.id} className="card rounded-xl px-4 py-3 flex items-start gap-3">
            <input
              type="checkbox"
              checked={s.done}
              onChange={(e) => stages.patch(s.id, { done: e.target.checked })}
              className="mt-1 w-4 h-4 accent-amber-500"
              aria-label={`Concluir: ${s.title}`}
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${s.done ? "line-through text-zinc-500" : "text-zinc-100"}`}>{s.title}</p>
              {s.note && <p className="text-xs text-zinc-500 mt-0.5">{s.note}</p>}
            </div>
            <button onClick={() => stages.remove(s.id)} className="text-zinc-500 hover:text-rose-400 p-1" aria-label={`Excluir ${s.title}`}>
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={addStage} className="card rounded-2xl p-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input className={inputCls} placeholder="Nova etapa" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Nova etapa" />
        <input className={inputCls} placeholder="Observação (opcional)" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Observação" />
        <button type="submit" className={btnGhost}>
          <Plus className="w-4 h-4" /> Adicionar etapa
        </button>
      </form>
    </div>
  );
}
