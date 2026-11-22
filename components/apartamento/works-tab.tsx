"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { WORK_STATUSES, type Work, type WorkStatus } from "@/lib/apartment-types";
import { formatBRL } from "@/lib/format";
import { btnGhost, inputCls, NumberCell } from "./ui";

type Api = {
  rows: Work[];
  add: (v: Partial<Work>) => Promise<Work | null>;
  patch: (id: string, v: Partial<Work>) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

const STATUS_TONE: Record<WorkStatus, string> = {
  Planejado: "text-zinc-300",
  Orçando: "text-sky-300",
  "Em Andamento": "text-amber-300",
  Concluído: "text-emerald-300",
};

export function WorksTab({ works }: { works: Api }) {
  const [service, setService] = useState("");
  const [provider, setProvider] = useState("");
  const [estimated, setEstimated] = useState("");

  const totalEst = works.rows.reduce((s, w) => s + w.estimated, 0);
  const totalPaid = works.rows.reduce((s, w) => s + w.paid, 0);

  async function addWork(e: React.FormEvent) {
    e.preventDefault();
    if (!service.trim()) return;
    await works.add({ service: service.trim(), provider: provider.trim() || null, estimated: Number(estimated) || 0 });
    setService("");
    setProvider("");
    setEstimated("");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={addWork} className="card rounded-2xl p-4 grid gap-3 sm:grid-cols-[1.2fr_1fr_9rem_auto]">
        <input className={inputCls} placeholder="Serviço (gesso, piso, marcenaria...)" value={service} onChange={(e) => setService(e.target.value)} aria-label="Serviço" />
        <input className={inputCls} placeholder="Fornecedor" value={provider} onChange={(e) => setProvider(e.target.value)} aria-label="Fornecedor" />
        <input className={inputCls} type="number" min={0} step="0.01" placeholder="Orçado (R$)" value={estimated} onChange={(e) => setEstimated(e.target.value)} aria-label="Valor orçado" />
        <button type="submit" className={btnGhost}>
          <Plus className="w-4 h-4" /> Adicionar serviço
        </button>
      </form>

      <div className="card rounded-2xl overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="text-left text-xs text-zinc-500 border-b border-surface-700">
              <th className="px-4 py-3 font-medium">Serviço</th>
              <th className="px-2 py-3 font-medium">Fornecedor</th>
              <th className="px-2 py-3 font-medium">Status</th>
              <th className="px-2 py-3 font-medium text-right">Orçado</th>
              <th className="px-2 py-3 font-medium text-right">Pago</th>
              <th className="px-2 py-3 font-medium text-right">Diferença</th>
              <th className="px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {works.rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                  Nenhum serviço ainda. Adicione gesso, piso, marcenaria, elétrica ou pintura acima.
                </td>
              </tr>
            )}
            {works.rows.map((w) => {
              const diff = w.estimated - w.paid;
              return (
                <tr key={w.id} className="border-b border-surface-700/60 last:border-0">
                  <td className="px-4 py-2.5 text-zinc-100">{w.service}</td>
                  <td className="px-2 py-2.5 text-zinc-400">{w.provider ?? "—"}</td>
                  <td className="px-2 py-2.5">
                    <select
                      value={w.status}
                      onChange={(e) => works.patch(w.id, { status: e.target.value as WorkStatus })}
                      className={`${inputCls} w-36 ${STATUS_TONE[w.status]}`}
                      aria-label={`Status de ${w.service}`}
                    >
                      {WORK_STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <NumberCell value={w.estimated} onCommit={(n) => works.patch(w.id, { estimated: n })} />
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <NumberCell value={w.paid} onCommit={(n) => works.patch(w.id, { paid: n })} />
                  </td>
                  <td className={`px-2 py-2.5 text-right ${diff < 0 ? "text-rose-400" : "text-zinc-400"}`}>
                    {diff < 0 ? `+${formatBRL(-diff)} acima` : `${formatBRL(diff)} a pagar`}
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <button onClick={() => works.remove(w.id)} className="text-zinc-500 hover:text-rose-400 p-1" aria-label={`Excluir ${w.service}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {works.rows.length > 0 && (
            <tfoot>
              <tr className="text-zinc-200 font-semibold border-t border-surface-700">
                <td className="px-4 py-3" colSpan={3}>
                  Total
                </td>
                <td className="px-2 py-3 text-right">{formatBRL(totalEst)}</td>
                <td className="px-2 py-3 text-right text-amber-300">{formatBRL(totalPaid)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
