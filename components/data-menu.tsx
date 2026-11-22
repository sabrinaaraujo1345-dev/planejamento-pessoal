"use client";

import { useRef, useState } from "react";
import { Download, FlaskConical, Trash2, Upload } from "lucide-react";
import { exportWorkbook, importWorkbook } from "@/lib/excel";
import { loadDemoData, wipeAllData } from "@/lib/demo";
import { btnGhost, Modal, useToast } from "@/components/apartamento/ui";

const item =
  "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors disabled:opacity-50";

export function DataMenu() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<null | "wipe" | "demo">(null);
  const [report, setReport] = useState<string[] | null>(null);

  async function run(fn: () => Promise<void>, reload = false) {
    setBusy(true);
    try {
      await fn();
      if (reload) window.location.reload();
    } catch (e) {
      toast((e as { message?: string }).message ?? "Algo deu errado.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await run(async () => {
      const r = await importWorkbook(file);
      const lines = [
        ...Object.entries(r.imported).map(([k, v]) => `${k}: ${v} ${v === 1 ? "linha" : "linhas"}`),
        ...r.errors.map((m) => `Erro — ${m}`),
      ];
      setReport(lines.length ? lines : ["Nenhum bloco reconhecido. Use uma planilha exportada pelo LifeOS."]);
    });
  }

  return (
    <div className="px-3 pb-2 space-y-1 border-t border-surface-700 pt-3">
      <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Dados</p>
      <button className={item} disabled={busy} onClick={() => run(async () => { await exportWorkbook(); toast("Planilha exportada"); })}>
        <Download className="w-4 h-4" /> Exportar Excel
      </button>
      <button className={item} disabled={busy} onClick={() => fileRef.current?.click()}>
        <Upload className="w-4 h-4" /> Importar Excel
      </button>
      <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={onFile} />
      <button className={item} disabled={busy} onClick={() => setConfirm("demo")}>
        <FlaskConical className="w-4 h-4" /> Dados de exemplo
      </button>
      <button className={`${item} hover:!text-rose-300`} disabled={busy} onClick={() => setConfirm("wipe")}>
        <Trash2 className="w-4 h-4" /> Apagar meus dados
      </button>

      {confirm === "demo" && (
        <Modal title="Carregar dados de exemplo" onClose={() => setConfirm(null)}>
          <p className="text-sm text-zinc-300">Isso adiciona tarefas, metas, lançamentos, obras e hábitos de exemplo. Nada do que você já tem é apagado.</p>
          <div className="flex justify-end gap-2 mt-5">
            <button className={btnGhost} onClick={() => setConfirm(null)}>
              Cancelar
            </button>
            <button className={`${btnGhost} !bg-indigo-500 !text-white !border-transparent`} onClick={() => { setConfirm(null); run(loadDemoData, true); }}>
              Carregar exemplos
            </button>
          </div>
        </Modal>
      )}
      {confirm === "wipe" && (
        <Modal title="Apagar todos os dados" onClose={() => setConfirm(null)}>
          <p className="text-sm text-zinc-300">Isso apaga todas as suas tarefas, finanças, estudos, hábitos e dados do apartamento, incluindo as imagens enviadas. Não dá para desfazer. Exporte o Excel antes se quiser guardar uma cópia.</p>
          <div className="flex justify-end gap-2 mt-5">
            <button className={btnGhost} onClick={() => setConfirm(null)}>
              Cancelar
            </button>
            <button className={`${btnGhost} !bg-rose-500 !text-white !border-transparent`} onClick={() => { setConfirm(null); run(wipeAllData, true); }}>
              Apagar tudo
            </button>
          </div>
        </Modal>
      )}
      {report && (
        <Modal title="Importação concluída" onClose={() => { setReport(null); window.location.reload(); }}>
          <ul className="space-y-1 text-sm text-zinc-300">
            {report.map((l) => (
              <li key={l} className={l.startsWith("Erro") ? "text-rose-300" : ""}>{l}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-zinc-500">A importação adiciona linhas aos dados atuais. Ao fechar, a página recarrega.</p>
          <div className="flex justify-end mt-4">
            <button className={btnGhost} onClick={() => { setReport(null); window.location.reload(); }}>
              Fechar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
