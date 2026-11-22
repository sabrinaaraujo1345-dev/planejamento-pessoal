"use client";

import Link from "next/link";
import type { Task } from "@/lib/apartment-types";
import { useTable } from "@/lib/use-table";
import { accentCls } from "@/components/apartamento/ui";

const RANK: Record<string, number> = { Alta: 0, Média: 1, Baixa: 2 };
const TONE: Record<string, string> = { Alta: "text-rose-300", Média: "text-amber-300", Baixa: "text-sky-300" };

export function PrioritiesPanel({ tasks }: { tasks: Task[] }) {
  const api = useTable<Task>("tasks", tasks);
  const rows = [...api.rows].sort((a, b) => Number(a.done) - Number(b.done) || RANK[a.priority] - RANK[b.priority]).slice(0, 7);

  return (
    <section className="card rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Prioridades de hoje</h2>
        <Link href="/planejamento" className="text-xs text-indigo-300 hover:underline">
          Ver planejamento
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhuma tarefa para hoje. Adicione em Planejamento & Metas.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((t) => (
            <li key={t.id} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={t.done}
                onChange={(e) => api.patch(t.id, { done: e.target.checked })}
                className={`w-4 h-4 ${accentCls.indigo.check}`}
                aria-label={`Concluir: ${t.title}`}
              />
              <span className={`flex-1 text-sm truncate ${t.done ? "line-through text-zinc-500" : "text-zinc-100"}`}>{t.title}</span>
              <span className={`text-xs ${TONE[t.priority]}`}>{t.priority}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
