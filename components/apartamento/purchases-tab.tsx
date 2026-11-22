"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PURCHASE_ROOMS, PURCHASE_STATUSES, type Purchase, type PurchaseRoom, type PurchaseStatus } from "@/lib/apartment-types";
import { formatBRL } from "@/lib/format";
import { btnGhost, Chips, inputCls, NumberCell } from "./ui";

type Api = {
  rows: Purchase[];
  add: (v: Partial<Purchase>) => Promise<Purchase | null>;
  patch: (id: string, v: Partial<Purchase>) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

const ROOMS = ["Todos", ...PURCHASE_ROOMS] as const;
const STATUSES = ["Todos", ...PURCHASE_STATUSES] as const;

export function PurchasesTab({ purchases }: { purchases: Api }) {
  const [room, setRoom] = useState<(typeof ROOMS)[number]>("Todos");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("Todos");
  const [newRoom, setNewRoom] = useState<PurchaseRoom>("Sala");
  const [item, setItem] = useState("");
  const [estimated, setEstimated] = useState("");

  const visible = purchases.rows.filter((p) => (room === "Todos" || p.room === room) && (status === "Todos" || p.status === status));
  const totalEst = visible.reduce((s, p) => s + p.estimated, 0);
  const totalPaid = visible.reduce((s, p) => s + p.paid, 0);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!item.trim()) return;
    await purchases.add({ room: newRoom, item: item.trim(), estimated: Number(estimated) || 0 });
    setItem("");
    setEstimated("");
  }

  return (
    <div className="space-y-4">
      <div className="card rounded-2xl p-4 space-y-3">
        <div>
          <p className="text-xs text-zinc-500 mb-2">Cômodo</p>
          <Chips options={ROOMS} value={room} onChange={setRoom} />
        </div>
        <div>
          <p className="text-xs text-zinc-500 mb-2">Status</p>
          <Chips options={STATUSES} value={status} onChange={setStatus} />
        </div>
      </div>

      <form onSubmit={addItem} className="card rounded-2xl p-4 grid gap-3 sm:grid-cols-[10rem_1fr_9rem_auto]">
        <select className={inputCls} value={newRoom} onChange={(e) => setNewRoom(e.target.value as PurchaseRoom)} aria-label="Cômodo do item">
          {PURCHASE_ROOMS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <input className={inputCls} placeholder="Item (sofá, geladeira, cortina...)" value={item} onChange={(e) => setItem(e.target.value)} aria-label="Item" />
        <input className={inputCls} type="number" min={0} step="0.01" placeholder="Estimado (R$)" value={estimated} onChange={(e) => setEstimated(e.target.value)} aria-label="Preço estimado" />
        <button type="submit" className={btnGhost}>
          <Plus className="w-4 h-4" /> Adicionar item
        </button>
      </form>

      <div className="card rounded-2xl overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-xs text-zinc-500 border-b border-surface-700">
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-2 py-3 font-medium">Cômodo</th>
              <th className="px-2 py-3 font-medium">Status</th>
              <th className="px-2 py-3 font-medium text-right">Estimado</th>
              <th className="px-2 py-3 font-medium text-right">Pago</th>
              <th className="px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  Nenhum item neste filtro.
                </td>
              </tr>
            )}
            {visible.map((p) => (
              <tr key={p.id} className="border-b border-surface-700/60 last:border-0">
                <td className="px-4 py-2.5 text-zinc-100">{p.item}</td>
                <td className="px-2 py-2.5 text-zinc-400">{p.room}</td>
                <td className="px-2 py-2.5">
                  <select
                    value={p.status}
                    onChange={(e) => purchases.patch(p.id, { status: e.target.value as PurchaseStatus })}
                    className={`${inputCls} w-36`}
                    aria-label={`Status de ${p.item}`}
                  >
                    {PURCHASE_STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-2.5 text-right">
                  <NumberCell value={p.estimated} onCommit={(n) => purchases.patch(p.id, { estimated: n })} />
                </td>
                <td className="px-2 py-2.5 text-right">
                  <NumberCell value={p.paid} onCommit={(n) => purchases.patch(p.id, { paid: n })} />
                </td>
                <td className="px-2 py-2.5 text-right">
                  <button onClick={() => purchases.remove(p.id)} className="text-zinc-500 hover:text-rose-400 p-1" aria-label={`Excluir ${p.item}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {visible.length > 0 && (
            <tfoot>
              <tr className="text-zinc-200 font-semibold border-t border-surface-700">
                <td className="px-4 py-3" colSpan={3}>
                  Total do filtro
                </td>
                <td className="px-2 py-3 text-right">{formatBRL(totalEst)}</td>
                <td className="px-2 py-3 text-right text-amber-300">{formatBRL(totalPaid)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
