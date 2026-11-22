"use client";

import { useState } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import type { AptLink, StudyTopic } from "@/lib/apartment-types";
import { pct } from "@/lib/format";
import { useTable } from "@/lib/use-table";
import { accentCls, btnFor, inputFor, ProgressBar, ToastProvider } from "@/components/apartamento/ui";

const input = inputFor("indigo");
const STEPS = [
  { key: "step_reading", label: "1. Leitura" },
  { key: "step_summary", label: "2. Resumo" },
  { key: "step_exercise", label: "3. Exercício" },
  { key: "step_review", label: "4. Revisão" },
] as const;

const mastery = (t: StudyTopic) => pct(STEPS.filter((s) => t[s.key]).length, STEPS.length);

export function StudiesClient({ topics, links }: { topics: StudyTopic[]; links: AptLink[] }) {
  return (
    <ToastProvider>
      <Inner topics={topics} links={links} />
    </ToastProvider>
  );
}

function Inner({ topics, links }: { topics: StudyTopic[]; links: AptLink[] }) {
  const topicApi = useTable<StudyTopic>("study_topics", topics);
  const linkApi = useTable<AptLink>("links", links);
  const [subject, setSubject] = useState("");
  const [goal, setGoal] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");

  const overall = topicApi.rows.length ? Math.round(topicApi.rows.reduce((s, t) => s + mastery(t), 0) / topicApi.rows.length) : 0;

  async function addTopic(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) return;
    await topicApi.add({ subject: subject.trim(), goal: goal.trim() || null });
    setSubject("");
    setGoal("");
  }

  async function addLink(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    const href = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    await linkApi.add({ area: "estudos", title: title.trim(), url: href, note: note.trim() || null });
    setTitle("");
    setUrl("");
    setNote("");
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <section className="card rounded-2xl p-5">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-zinc-300">Progresso geral dos estudos</span>
          <span className={`font-semibold ${accentCls.indigo.text}`}>{overall}%</span>
        </div>
        <ProgressBar value={overall} tone="indigo" />
        <p className="mt-2 text-xs text-zinc-500">Cada tópico vale 25% por etapa concluída: leitura, resumo, exercício e revisão.</p>
      </section>

      <section className="card rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Ciclo de estudos</h2>
        <form onSubmit={addTopic} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input className={input} placeholder="Matéria ou assunto" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Matéria ou assunto" />
          <input className={input} placeholder="Objetivo (opcional)" value={goal} onChange={(e) => setGoal(e.target.value)} aria-label="Objetivo" />
          <button type="submit" className={btnFor("indigo")}>
            <Plus className="w-4 h-4" /> Adicionar tópico
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left text-xs text-zinc-500 border-b border-surface-700">
                <th className="px-2 py-3 font-medium">Tópico</th>
                {STEPS.map((s) => (
                  <th key={s.key} className="px-2 py-3 font-medium text-center">
                    {s.label}
                  </th>
                ))}
                <th className="px-2 py-3 font-medium w-40">Domínio</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {topicApi.rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-2 py-8 text-center text-zinc-500">
                    Nenhum tópico ainda. Adicione o primeiro acima.
                  </td>
                </tr>
              )}
              {topicApi.rows.map((t) => (
                <tr key={t.id} className="border-b border-surface-700/60 last:border-0">
                  <td className="px-2 py-2.5">
                    <p className="text-zinc-100">{t.subject}</p>
                    {t.goal && <p className="text-xs text-zinc-500">{t.goal}</p>}
                  </td>
                  {STEPS.map((s) => (
                    <td key={s.key} className="px-2 py-2.5 text-center">
                      <button
                        onClick={() => topicApi.patch(t.id, { [s.key]: !t[s.key] } as Partial<StudyTopic>)}
                        aria-pressed={t[s.key]}
                        aria-label={`${s.label} de ${t.subject}`}
                        className={`w-8 h-8 rounded-lg border text-xs font-semibold transition-colors ${
                          t[s.key] ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300" : "border-surface-700 text-zinc-600 hover:bg-zinc-800/60"
                        }`}
                      >
                        {t[s.key] ? "✓" : ""}
                      </button>
                    </td>
                  ))}
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <ProgressBar value={mastery(t)} tone="indigo" />
                      </div>
                      <span className="w-10 text-right text-xs text-zinc-300">{mastery(t)}%</span>
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <button onClick={() => topicApi.remove(t.id)} className="text-zinc-500 hover:text-rose-400 p-1" aria-label={`Excluir ${t.subject}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Repositório de links</h2>
        <form onSubmit={addLink} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input className={input} placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Título do link" />
          <input className={input} placeholder="Endereço (URL)" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="URL" />
          <button type="submit" className={btnFor("indigo")}>
            <Plus className="w-4 h-4" /> Adicionar link
          </button>
          <input className={`${input} sm:col-span-3`} placeholder="Nota (opcional)" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Nota" />
        </form>
        {linkApi.rows.length === 0 ? (
          <p className="text-sm text-zinc-500">Salve artigos, roadmaps e materiais para abrir depois.</p>
        ) : (
          <ul className="space-y-2">
            {linkApi.rows.map((l) => (
              <li key={l.id} className="flex items-center gap-3 rounded-xl border border-surface-700 px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 text-sm ${accentCls.indigo.text} hover:underline truncate`}>
                    {l.title} <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                  {l.note && <p className="text-xs text-zinc-500 truncate">{l.note}</p>}
                </div>
                <button onClick={() => linkApi.remove(l.id)} className="text-zinc-500 hover:text-rose-400 p-1" aria-label={`Excluir ${l.title}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
