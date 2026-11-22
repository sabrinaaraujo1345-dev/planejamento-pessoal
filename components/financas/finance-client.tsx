"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, PiggyBank, Plus, Trash2 } from "lucide-react";
import { FIN_CATEGORIES, type PaymentMethod, type Piggy, type Tx } from "@/lib/apartment-types";
import { formatBRL, pct } from "@/lib/format";
import { useTable } from "@/lib/use-table";
import { accentCls, btnFor, btnGhost, Chips, Field, inputFor, Modal, ProgressBar, ToastProvider, useToast } from "@/components/apartamento/ui";

const input = inputFor("emerald");
const METHOD_LABEL: Record<PaymentMethod, string> = {
  receita: "Receita",
  cartao: "Cartão de Crédito",
  debito: "Débito",
  custo_fixo: "Custo Fixo",
};
const FILTERS = ["Todos", "Receita", "Cartão de Crédito", "Débito", "Custo Fixo"] as const;
const SUBTABS = [
  { id: "dash", label: "Dashboard & Cofrinhos" },
  { id: "lanc", label: "Cartões, Débitos & Custos Fixos" },
] as const;

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const monthLabel = (ym: string) =>
  new Date(`${ym}-01T00:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
const shiftMonth = (ym: string, delta: number) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export function FinanceClient({ txs, piggies, initialSub }: { txs: Tx[]; piggies: Piggy[]; initialSub?: "dash" | "lanc" }) {
  return (
    <ToastProvider>
      <Inner txs={txs} piggies={piggies} initialSub={initialSub} />
    </ToastProvider>
  );
}

function Inner({ txs, piggies, initialSub }: { txs: Tx[]; piggies: Piggy[]; initialSub?: "dash" | "lanc" }) {
  const txApi = useTable<Tx>("transactions", txs);
  const piggyApi = useTable<Piggy>("piggy_banks", piggies);
  const toast = useToast();
  const [sub, setSub] = useState<(typeof SUBTABS)[number]["id"]>(initialSub ?? "dash");
  const [ym, setYm] = useState(todayStr().slice(0, 7));

  const month = txApi.rows.filter((t) => t.occurred_on.startsWith(ym));
  const income = month.filter((t) => t.payment_method === "receita").reduce((s, t) => s + t.amount, 0);
  const outflow = month.filter((t) => t.payment_method !== "receita");
  const invested = outflow.filter((t) => t.category === "Investimentos").reduce((s, t) => s + t.amount, 0);
  const expenses = outflow.filter((t) => t.category !== "Investimentos").reduce((s, t) => s + t.amount, 0);
  const free = income - expenses - invested;

  const byCategory = FIN_CATEGORIES.map((c) => ({
    name: c,
    total: outflow.filter((t) => (t.category ?? "Outros") === c).reduce((s, t) => s + t.amount, 0),
  })).filter((c) => c.total > 0);
  const outflowTotal = byCategory.reduce((s, c) => s + c.total, 0);

  // ---------- Lançamentos ----------
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Todos");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cartao");
  const [category, setCategory] = useState<(typeof FIN_CATEGORIES)[number]>("Outros");
  const [date, setDate] = useState(todayStr());

  const listed = month
    .filter((t) => filter === "Todos" || METHOD_LABEL[t.payment_method] === filter)
    .sort((a, b) => b.occurred_on.localeCompare(a.occurred_on));

  async function addTx(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!desc.trim() || !(value > 0)) return toast("Informe descrição e um valor maior que zero.", "error");
    await txApi.add({
      description: desc.trim(),
      amount: value,
      payment_method: method,
      category: method === "receita" ? null : category,
      occurred_on: date,
    });
    setDesc("");
    setAmount("");
  }

  // ---------- Cofrinhos ----------
  const [pName, setPName] = useState("");
  const [pTarget, setPTarget] = useState("");
  const [depositing, setDepositing] = useState<Piggy | null>(null);
  const [deposit, setDeposit] = useState("");

  async function addPiggy(e: React.FormEvent) {
    e.preventDefault();
    const target = Number(pTarget);
    if (!pName.trim() || !(target > 0)) return;
    await piggyApi.add({ name: pName.trim(), target, current: 0 });
    setPName("");
    setPTarget("");
  }

  async function saveDeposit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(deposit);
    if (!depositing || !(value > 0)) return;
    await piggyApi.patch(depositing.id, { current: depositing.current + value });
    // Cada aporte vira uma saída da categoria Investimentos.
    await txApi.add({
      description: `Aporte: ${depositing.name}`,
      amount: value,
      payment_method: "debito",
      category: "Investimentos",
      occurred_on: todayStr(),
    });
    toast(`${formatBRL(value)} guardados em ${depositing.name}`);
    setDepositing(null);
    setDeposit("");
  }

  const cards = [
    { label: "Receitas do mês", value: income, tone: "text-emerald-300" },
    { label: "Despesas totais", value: expenses, tone: "text-rose-300" },
    { label: "Saldo livre", value: free, tone: free < 0 ? "text-rose-400" : "text-white" },
    { label: "Investimentos no mês", value: invested, tone: "text-indigo-300" },
  ];

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button className={btnGhost} onClick={() => setYm((m) => shiftMonth(m, -1))} aria-label="Mês anterior">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="min-w-40 text-center text-sm font-medium text-white capitalize">{monthLabel(ym)}</span>
          <button className={btnGhost} onClick={() => setYm((m) => shiftMonth(m, 1))} aria-label="Próximo mês">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo do mês">
        {cards.map((c) => (
          <div key={c.label} className="card rounded-2xl p-5">
            <p className="text-xs text-zinc-500">{c.label}</p>
            <p className={`mt-1 text-xl font-semibold ${c.tone}`}>{formatBRL(c.value)}</p>
          </div>
        ))}
      </section>
      <p className="text-xs text-zinc-500 -mt-2">Saldo livre = receitas − despesas − investimentos do mês. Aportes nos cofrinhos entram como investimento.</p>

      <div role="tablist" aria-label="Seções de finanças" className="flex gap-2 overflow-x-auto pb-1">
        {SUBTABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={sub === t.id}
            onClick={() => setSub(t.id)}
            className={`whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
              sub === t.id ? accentCls.emerald.tab : "border-surface-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sub === "dash" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="card rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white">Gastos por categoria</h2>
            {byCategory.length === 0 ? (
              <p className="text-sm text-zinc-500">Sem saídas neste mês. Lance uma despesa na outra aba.</p>
            ) : (
              byCategory.map((c) => (
                <div key={c.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-300">{c.name}</span>
                    <span className="text-zinc-400">
                      {formatBRL(c.total)} · {pct(c.total, outflowTotal)}%
                    </span>
                  </div>
                  <ProgressBar value={pct(c.total, outflowTotal)} tone="emerald" />
                </div>
              ))
            )}
          </section>

          <section className="card rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white">Cofrinhos</h2>
            <form onSubmit={addPiggy} className="grid gap-3 sm:grid-cols-[1fr_9rem_auto]">
              <input className={input} placeholder="Nome (reserva, viagem...)" value={pName} onChange={(e) => setPName(e.target.value)} aria-label="Nome do cofrinho" />
              <input className={input} type="number" min={0} step="0.01" placeholder="Meta (R$)" value={pTarget} onChange={(e) => setPTarget(e.target.value)} aria-label="Meta do cofrinho" />
              <button type="submit" className={btnGhost}>
                <Plus className="w-4 h-4" /> Criar cofrinho
              </button>
            </form>
            {piggyApi.rows.length === 0 ? (
              <p className="text-sm text-zinc-500">Crie um cofrinho para acompanhar uma meta de investimento.</p>
            ) : (
              <ul className="space-y-3">
                {piggyApi.rows.map((p) => (
                  <li key={p.id} className="rounded-xl border border-surface-700 p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-2 text-sm font-medium text-zinc-100">
                        <PiggyBank className="w-4 h-4 text-emerald-400" /> {p.name}
                      </p>
                      <div className="flex items-center gap-1">
                        <button className={btnFor("emerald")} onClick={() => setDepositing(p)}>
                          + Guardar
                        </button>
                        <button onClick={() => piggyApi.remove(p.id)} className="text-zinc-500 hover:text-rose-400 p-1.5" aria-label={`Excluir ${p.name}`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <ProgressBar value={pct(p.current, p.target)} tone="emerald" />
                    <p className="text-xs text-zinc-400">
                      {formatBRL(p.current)} de {formatBRL(p.target)} · {pct(p.current, p.target)}%
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {sub === "lanc" && (
        <div className="space-y-4">
          <form onSubmit={addTx} className="card rounded-2xl p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_8rem_11rem_10rem_9.5rem_auto]">
            <input className={input} placeholder="Descrição" value={desc} onChange={(e) => setDesc(e.target.value)} aria-label="Descrição" />
            <input className={input} type="number" min={0} step="0.01" placeholder="Valor (R$)" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Valor" />
            <select className={input} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} aria-label="Forma de pagamento">
              {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map((m) => (
                <option key={m} value={m}>
                  {METHOD_LABEL[m]}
                </option>
              ))}
            </select>
            <select
              className={input}
              value={category}
              onChange={(e) => setCategory(e.target.value as (typeof FIN_CATEGORIES)[number])}
              disabled={method === "receita"}
              aria-label="Categoria"
            >
              {FIN_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input className={input} type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Data" />
            <button type="submit" className={btnFor("emerald")}>
              <Plus className="w-4 h-4" /> Lançar
            </button>
          </form>

          <div className="card rounded-2xl p-4">
            <Chips options={FILTERS} value={filter} onChange={setFilter} accent="emerald" />
          </div>

          <div className="card rounded-2xl overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="text-left text-xs text-zinc-500 border-b border-surface-700">
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-2 py-3 font-medium">Descrição</th>
                  <th className="px-2 py-3 font-medium">Forma</th>
                  <th className="px-2 py-3 font-medium">Categoria</th>
                  <th className="px-2 py-3 font-medium text-right">Valor</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {listed.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                      Nenhum lançamento neste mês e filtro.
                    </td>
                  </tr>
                )}
                {listed.map((t) => (
                  <tr key={t.id} className="border-b border-surface-700/60 last:border-0">
                    <td className="px-4 py-2.5 text-zinc-400">{new Date(t.occurred_on + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                    <td className="px-2 py-2.5 text-zinc-100">{t.description}</td>
                    <td className="px-2 py-2.5 text-zinc-400">{METHOD_LABEL[t.payment_method]}</td>
                    <td className="px-2 py-2.5 text-zinc-400">{t.category ?? "—"}</td>
                    <td className={`px-2 py-2.5 text-right font-medium ${t.payment_method === "receita" ? "text-emerald-300" : "text-zinc-100"}`}>
                      {t.payment_method === "receita" ? "+" : "−"} {formatBRL(t.amount)}
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <button onClick={() => txApi.remove(t.id)} className="text-zinc-500 hover:text-rose-400 p-1" aria-label={`Excluir ${t.description}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {depositing && (
        <Modal title={`Guardar em ${depositing.name}`} onClose={() => setDepositing(null)}>
          <form onSubmit={saveDeposit} className="space-y-4">
            <Field label="Valor do aporte (R$)">
              <input className={input} type="number" min={0} step="0.01" value={deposit} onChange={(e) => setDeposit(e.target.value)} autoFocus required />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" className={btnGhost} onClick={() => setDepositing(null)}>
                Cancelar
              </button>
              <button type="submit" className={btnFor("emerald")}>
                Guardar aporte
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
