"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { X } from "lucide-react";

// ---------- Toasts ----------
type Toast = { id: number; text: string; tone: "ok" | "error" };
const ToastCtx = createContext<(text: string, tone?: Toast["tone"]) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: Toast["tone"] = "ok") => {
    const id = Date.now() + Math.random();
    setItems((l) => [...l, { id, text, tone }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none" role="status" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            className={`rounded-xl border px-4 py-2.5 text-sm shadow-xl ${
              t.tone === "ok"
                ? "bg-surface-850 border-emerald-500/40 text-emerald-200"
                : "bg-surface-850 border-rose-500/40 text-rose-200"
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ---------- Modal ----------
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="card w-full max-w-lg rounded-2xl p-6 my-auto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800/60" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------- Acentos por módulo ----------
export type Accent = "amber" | "indigo" | "emerald";
export const accentCls: Record<Accent, { btn: string; chip: string; text: string; bar: string; focus: string; check: string; tab: string }> = {
  amber: {
    btn: "bg-amber-500 hover:bg-amber-400 text-surface-950 focus-visible:ring-amber-300",
    chip: "border-amber-500/50 bg-amber-500/15 text-amber-300",
    text: "text-amber-300",
    bar: "bg-amber-500",
    focus: "focus:border-amber-500 focus-visible:ring-amber-500/30",
    check: "accent-amber-500",
    tab: "border-amber-500/40 bg-amber-500/15 text-amber-300",
  },
  indigo: {
    btn: "bg-indigo-500 hover:bg-indigo-400 text-white focus-visible:ring-indigo-300",
    chip: "border-indigo-500/50 bg-indigo-500/15 text-indigo-300",
    text: "text-indigo-300",
    bar: "bg-indigo-500",
    focus: "focus:border-indigo-500 focus-visible:ring-indigo-500/30",
    check: "accent-indigo-500",
    tab: "border-indigo-500/40 bg-indigo-500/15 text-indigo-300",
  },
  emerald: {
    btn: "bg-emerald-500 hover:bg-emerald-400 text-surface-950 focus-visible:ring-emerald-300",
    chip: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300",
    text: "text-emerald-300",
    bar: "bg-emerald-500",
    focus: "focus:border-emerald-500 focus-visible:ring-emerald-500/30",
    check: "accent-emerald-500",
    tab: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  },
};
const INPUT_BASE = "w-full rounded-xl bg-surface-950 border border-surface-700 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus-visible:ring-2";
export const inputFor = (a: Accent) => `${INPUT_BASE} ${accentCls[a].focus}`;
export const btnFor = (a: Accent) =>
  `inline-flex items-center justify-center gap-2 rounded-xl ${accentCls[a].btn} disabled:opacity-60 px-4 py-2 text-sm font-semibold transition-colors outline-none focus-visible:ring-2`;

// ---------- Estilos e peças comuns ----------
export const inputCls =
  "w-full rounded-xl bg-surface-950 border border-surface-700 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500/30";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-surface-950 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-amber-300";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-surface-700 hover:bg-zinc-800/60 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-zinc-400">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function ProgressBar({ value, tone = "amber" }: { value: number; tone?: Accent }) {
  return (
    <div className="h-2 w-full rounded-full bg-surface-700 overflow-hidden" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${accentCls[tone].bar}`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export function Chips<T extends string>({ options, value, onChange, accent = "amber" }: { options: readonly T[]; value: T; onChange: (v: T) => void; accent?: Accent }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          aria-pressed={value === o}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            value === o ? accentCls[accent].chip : "border-surface-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function NumberCell({ value, onCommit }: { value: number; onCommit: (n: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      step="0.01"
      defaultValue={value}
      key={value}
      onBlur={(e) => {
        const n = Number(e.target.value);
        if (Number.isFinite(n) && n >= 0 && n !== value) onCommit(n);
      }}
      className={`${inputCls} w-28 text-right`}
    />
  );
}
