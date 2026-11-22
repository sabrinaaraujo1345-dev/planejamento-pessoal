"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DESIGN_ROOMS, LINK_CATEGORIES, type AptLink, type RoomSpec } from "@/lib/apartment-types";
import { btnGhost, btnPrimary, Chips, inputCls, useToast } from "./ui";

type LinksApi = {
  rows: AptLink[];
  add: (v: Partial<AptLink> & { area: string }) => Promise<AptLink | null>;
  remove: (id: string) => Promise<void>;
};

const CATS = ["Todas", ...LINK_CATEGORIES] as const;

export function ReferenceLinks({ links }: { links: LinksApi }) {
  const [cat, setCat] = useState<(typeof CATS)[number]>("Todas");
  const [newCat, setNewCat] = useState<string>(LINK_CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");

  const visible = links.rows.filter((l) => cat === "Todas" || l.category === cat);

  async function addLink(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    const href = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    await links.add({ area: "apartamento", category: newCat, title: title.trim(), url: href, note: note.trim() || null });
    setTitle("");
    setUrl("");
    setNote("");
  }

  return (
    <section className="card rounded-2xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-white">Links de referência</h3>
      <Chips options={CATS} value={cat} onChange={setCat} />

      <form onSubmit={addLink} className="grid gap-3 sm:grid-cols-[11rem_1fr_1fr_auto]">
        <select className={inputCls} value={newCat} onChange={(e) => setNewCat(e.target.value)} aria-label="Categoria">
          {LINK_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input className={inputCls} placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Título do link" />
        <input className={inputCls} placeholder="Endereço (URL)" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="URL" />
        <button type="submit" className={btnGhost}>
          <Plus className="w-4 h-4" /> Adicionar link
        </button>
        <input className={`${inputCls} sm:col-span-4`} placeholder="Nota (opcional)" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Nota" />
      </form>

      {visible.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhum link nesta categoria.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((l) => (
            <li key={l.id} className="flex items-center gap-3 rounded-xl border border-surface-700 px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-amber-300 hover:underline truncate">
                  {l.title} <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
                <p className="text-xs text-zinc-500 truncate">
                  {l.category}
                  {l.note ? ` · ${l.note}` : ""}
                </p>
              </div>
              <button onClick={() => links.remove(l.id)} className="text-zinc-500 hover:text-rose-400 p-1" aria-label={`Excluir ${l.title}`}>
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function SpecsNotebook({ initial }: { initial: RoomSpec[] }) {
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();
  const [room, setRoom] = useState<(typeof DESIGN_ROOMS)[number]>(DESIGN_ROOMS[0]);
  const [specs, setSpecs] = useState<Record<string, string>>(() => Object.fromEntries(initial.map((s) => [s.room, s.notes])));
  const [saved, setSaved] = useState<Record<string, string>>(() => Object.fromEntries(initial.map((s) => [s.room, s.notes])));
  const [saving, setSaving] = useState(false);

  const dirty = (specs[room] ?? "") !== (saved[room] ?? "");

  async function save() {
    setSaving(true);
    const notes = specs[room] ?? "";
    const { error } = await supabase.from("apt_room_specs").upsert({ room, notes }, { onConflict: "user_id,room" });
    setSaving(false);
    if (error) return toast("Não foi possível salvar o caderno.", "error");
    setSaved((s) => ({ ...s, [room]: notes }));
    toast(`Caderno de ${room} salvo`);
  }

  return (
    <section className="card rounded-2xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-white">Caderno de especificações por ambiente</h3>
      <Chips options={DESIGN_ROOMS} value={room} onChange={setRoom} />
      <textarea
        value={specs[room] ?? ""}
        onChange={(e) => setSpecs((s) => ({ ...s, [room]: e.target.value }))}
        rows={8}
        placeholder={`Marcenaria, medidas e pontos elétricos de ${room}...`}
        className={`${inputCls} resize-y`}
        aria-label={`Especificações de ${room}`}
      />
      <div className="flex items-center justify-end gap-3">
        {dirty && <span className="text-xs text-amber-300">Alterações não salvas</span>}
        <button onClick={save} disabled={!dirty || saving} className={btnPrimary}>
          <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar caderno"}
        </button>
      </div>
    </section>
  );
}
