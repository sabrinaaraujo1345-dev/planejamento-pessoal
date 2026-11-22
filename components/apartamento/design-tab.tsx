"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Lightbulb, Maximize2, Ruler, Trash2, X, ZoomIn, ZoomOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DESIGN_ROOMS, PROJECT_KINDS, type DesignRoom, type Project, type ProjectKind } from "@/lib/apartment-types";
import { btnGhost, btnPrimary, Chips, Field, inputCls, Modal, useToast } from "./ui";

type Api = {
  rows: Project[];
  add: (v: Partial<Project>) => Promise<Project | null>;
  remove: (id: string) => Promise<void>;
  setRows: React.Dispatch<React.SetStateAction<Project[]>>;
};

const ROOMS = ["Todos", ...DESIGN_ROOMS] as const;
const BUCKET = "apt-images";

const imgOf = (p: Project) => p.signed_url ?? p.image_url ?? null;

// Reduz a imagem (lado maior 1600px, WebP) antes de enviar, para economizar espaço no Storage.
async function compressImage(file: File, maxSide = 1600, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("compress"))), "image/webp", quality),
  );
}

function parsePalette(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((c) => c.trim().replace(/^#?/, "#").toLowerCase())
    .filter((c) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(c));
}

export function DesignTab({ projects }: { projects: Api }) {
  const toast = useToast();
  const [room, setRoom] = useState<(typeof ROOMS)[number]>("Todos");
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<Project | null>(null);

  const visible = projects.rows.filter((p) => room === "Todos" || p.room === room);

  async function copyHex(hex: string) {
    try {
      await navigator.clipboard.writeText(hex);
      toast(`Cor ${hex} copiada`);
    } catch {
      toast("Não foi possível copiar a cor.", "error");
    }
  }

  async function removeProject(p: Project) {
    await projects.remove(p.id);
    if (p.image_path) await createClient().storage.from(BUCKET).remove([p.image_path]);
  }

  return (
    <div className="space-y-4">
      <div className="card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <Chips options={ROOMS} value={room} onChange={setRoom} />
        <button className={btnPrimary} onClick={() => setAdding(true)}>
          <ImagePlus className="w-4 h-4" /> Novo projeto
        </button>
      </div>

      {visible.length === 0 && (
        <div className="card rounded-2xl p-8 text-center text-sm text-zinc-500">
          Nenhum projeto neste ambiente. Adicione um render, uma planta ou uma inspiração.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((p) => {
          const src = imgOf(p);
          return (
            <article key={p.id} className="card rounded-2xl overflow-hidden flex flex-col">
              <button
                onClick={() => src && setOpen(p)}
                className="relative aspect-video bg-surface-950 group outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
                aria-label={`Abrir ${p.title} em tela cheia`}
                disabled={!src}
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-xs text-zinc-600">Sem imagem</span>
                )}
                {src && (
                  <span className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 text-zinc-200 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                    <Maximize2 className="w-4 h-4" />
                  </span>
                )}
              </button>
              <div className="p-4 flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">{p.title}</h4>
                    <p className="text-xs text-zinc-500">
                      {p.room} · {p.kind}
                    </p>
                  </div>
                  <button onClick={() => removeProject(p)} className="text-zinc-500 hover:text-rose-400 p-1" aria-label={`Excluir ${p.title}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {p.dimensions && (
                  <p className="flex items-center gap-2 text-xs text-zinc-400">
                    <Ruler className="w-3.5 h-3.5 text-amber-400 shrink-0" /> {p.dimensions}
                  </p>
                )}
                {p.lighting && (
                  <p className="flex items-center gap-2 text-xs text-zinc-400">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" /> {p.lighting}
                  </p>
                )}
                {p.palette.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {p.palette.map((hex) => (
                      <button
                        key={hex}
                        onClick={() => copyHex(hex)}
                        title={`Copiar ${hex}`}
                        aria-label={`Copiar cor ${hex}`}
                        className="w-7 h-7 rounded-lg border border-white/15 hover:scale-110 transition-transform outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {adding && <ProjectModal onClose={() => setAdding(false)} projects={projects} />}
      {open && <Lightbox project={open} onClose={() => setOpen(null)} onCopy={copyHex} />}
    </div>
  );
}

function ProjectModal({ onClose, projects }: { onClose: () => void; projects: Api }) {
  const toast = useToast();
  const supabase = useMemo(() => createClient(), []);
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [room, setRoom] = useState<DesignRoom>("Sala de Estar");
  const [kind, setKind] = useState<ProjectKind>("Render");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [lighting, setLighting] = useState("");
  const [palette, setPalette] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      let image_path: string | null = null;
      let signed_url: string | null = null;
      const file = fileRef.current?.files?.[0];
      if (file) {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) throw new Error("auth");
        const blob = await compressImage(file);
        image_path = `${auth.user.id}/${crypto.randomUUID()}.webp`;
        const up = await supabase.storage.from(BUCKET).upload(image_path, blob, { contentType: "image/webp" });
        if (up.error) throw up.error;
        const signed = await supabase.storage.from(BUCKET).createSignedUrl(image_path, 3600);
        signed_url = signed.data?.signedUrl ?? null;
      }
      const created = await projects.add({
        room,
        kind,
        title: title.trim(),
        image_path,
        image_url: !file && url.trim() ? url.trim() : null,
        dimensions: dimensions.trim() || null,
        lighting: lighting.trim() || null,
        palette: parsePalette(palette),
      });
      if (created) {
        if (signed_url) projects.setRows((r) => r.map((x) => (x.id === created.id ? { ...x, signed_url } : x)));
        toast("Projeto adicionado");
        onClose();
      } else if (image_path) {
        await supabase.storage.from(BUCKET).remove([image_path]);
      }
    } catch {
      toast("Não foi possível enviar a imagem.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Novo projeto" onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ambiente">
            <select className={inputCls} value={room} onChange={(e) => setRoom(e.target.value as DesignRoom)}>
              {DESIGN_ROOMS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Tipo de arquivo">
            <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value as ProjectKind)}>
              {PROJECT_KINDS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Título">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>
        <Field label="Imagem do computador (reduzida automaticamente)">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className={`${inputCls} file:mr-3 file:rounded-lg file:border-0 file:bg-surface-700 file:px-3 file:py-1 file:text-zinc-200`} />
        </Field>
        <Field label="Ou URL da imagem">
          <input className={inputCls} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." type="url" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dimensões / medidas">
            <input className={inputCls} value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="3,20 m x 2,80 m" />
          </Field>
          <Field label="Iluminação LED">
            <input className={inputCls} value={lighting} onChange={(e) => setLighting(e.target.value)} placeholder="Fita LED 3000K no nicho" />
          </Field>
        </div>
        <Field label="Paleta (códigos Hex separados por vírgula)">
          <input className={inputCls} value={palette} onChange={(e) => setPalette(e.target.value)} placeholder="#D6C7B0, #2F3E46, #A4161A" />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={btnGhost}>
            Cancelar
          </button>
          <button type="submit" disabled={saving} className={btnPrimary}>
            {saving ? "Salvando..." : "Salvar projeto"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Lightbox({ project, onClose, onCopy }: { project: Project; onClose: () => void; onCopy: (hex: string) => void }) {
  const [zoom, setZoom] = useState(1);
  const src = imgOf(project);
  const clamp = (z: number) => Math.min(4, Math.max(1, Math.round(z * 100) / 100));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setZoom((z) => clamp(z + 0.5));
      if (e.key === "-") setZoom((z) => clamp(z - 0.5));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={project.title}
        className="card w-full max-w-6xl rounded-2xl overflow-hidden flex flex-col lg:flex-row max-h-[90vh]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex-1 min-h-[40vh] overflow-auto bg-black" onWheel={(e) => e.ctrlKey && setZoom((z) => clamp(z - e.deltaY / 200))}>
          {src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={project.title}
              style={{ width: `${zoom * 100}%`, maxWidth: "none" }}
              className="block mx-auto cursor-zoom-in"
              onClick={() => setZoom((z) => (z >= 4 ? 1 : clamp(z + 1)))}
            />
          )}
        </div>
        <aside className="lg:w-72 p-5 space-y-4 overflow-y-auto border-t lg:border-t-0 lg:border-l border-surface-700">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-white">{project.title}</h3>
              <p className="text-xs text-zinc-500">
                {project.room} · {project.kind}
              </p>
            </div>
            <button onClick={onClose} className="text-zinc-400 hover:text-white p-1" aria-label="Fechar">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className={btnGhost} onClick={() => setZoom((z) => clamp(z - 0.5))} aria-label="Diminuir zoom">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-zinc-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button className={btnGhost} onClick={() => setZoom((z) => clamp(z + 0.5))} aria-label="Aumentar zoom">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button className={btnGhost} onClick={() => setZoom(1)}>
              Ajustar
            </button>
          </div>
          {project.dimensions && <p className="text-sm text-zinc-300">Medidas: {project.dimensions}</p>}
          {project.lighting && <p className="text-sm text-zinc-300">Iluminação: {project.lighting}</p>}
          {project.palette.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500">Clique na cor para copiar o Hex</p>
              <div className="flex flex-wrap gap-2">
                {project.palette.map((hex) => (
                  <button
                    key={hex}
                    onClick={() => onCopy(hex)}
                    className="flex items-center gap-2 rounded-lg border border-surface-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800/60"
                  >
                    <span className="w-4 h-4 rounded border border-white/15" style={{ backgroundColor: hex }} />
                    {hex}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
