import { createClient } from "@/lib/supabase/client";

type Kind = "text" | "num" | "bool" | "date" | "palette";
type Col = { key: string; header: string; kind?: Kind };
type Block = {
  id: string; // marcador na planilha: "## id"
  sheet: string;
  table: string;
  title: string;
  cols: Col[];
  filter?: [string, string];
  fixed?: Record<string, unknown>;
  special?: "checks" | "settings";
};

const t = (key: string, header: string): Col => ({ key, header });
const n = (key: string, header: string): Col => ({ key, header, kind: "num" });
const b = (key: string, header: string): Col => ({ key, header, kind: "bool" });
const d = (key: string, header: string): Col => ({ key, header, kind: "date" });

// Ordem importa na importação: hábitos antes das marcações.
export const BLOCKS: Block[] = [
  { id: "transactions", sheet: "Finanças", table: "transactions", title: "Lançamentos", cols: [t("description", "Descrição"), n("amount", "Valor"), t("payment_method", "Forma (receita, cartao, debito, custo_fixo)"), t("category", "Categoria"), d("occurred_on", "Data")] },
  { id: "piggy_banks", sheet: "Finanças", table: "piggy_banks", title: "Cofrinhos", cols: [t("name", "Nome"), n("target", "Meta"), n("current", "Guardado")] },
  { id: "tasks", sheet: "Tarefas_Metas", table: "tasks", title: "Tarefas", cols: [t("title", "Título"), t("category", "Categoria"), t("priority", "Prioridade"), t("horizon", "Horizonte (diario, semanal, semestral, anual)"), d("due_date", "Data"), b("done", "Concluída")] },
  { id: "goals", sheet: "Tarefas_Metas", table: "goals", title: "Metas", cols: [t("title", "Meta"), t("milestone", "Marco"), t("scope", "Prazo (semestral, anual)"), n("progress", "Progresso (0-100)")] },
  { id: "study_topics", sheet: "Estudos", table: "study_topics", title: "Tópicos de estudo", cols: [t("subject", "Tópico"), t("goal", "Objetivo"), b("step_reading", "Leitura"), b("step_summary", "Resumo"), b("step_exercise", "Exercício"), b("step_review", "Revisão")] },
  { id: "links:estudos", sheet: "Estudos", table: "links", title: "Links de estudo", filter: ["area", "estudos"], fixed: { area: "estudos" }, cols: [t("title", "Título"), t("url", "URL"), t("note", "Nota")] },
  { id: "apt_settings", sheet: "Ap_Obras_Compras", table: "apt_settings", title: "Teto orçamentário", special: "settings", cols: [n("budget_cap", "Teto")] },
  { id: "apt_stages", sheet: "Ap_Obras_Compras", table: "apt_stages", title: "Etapas e documentação", cols: [t("title", "Etapa"), t("note", "Observação"), b("done", "Concluída"), n("position", "Ordem")] },
  { id: "apt_works", sheet: "Ap_Obras_Compras", table: "apt_works", title: "Obras e reformas", cols: [t("service", "Serviço"), t("provider", "Fornecedor"), t("status", "Status"), n("estimated", "Orçado"), n("paid", "Pago")] },
  { id: "apt_purchases", sheet: "Ap_Obras_Compras", table: "apt_purchases", title: "Compras e enxoval", cols: [t("room", "Cômodo"), t("item", "Item"), t("status", "Status"), n("estimated", "Estimado"), n("paid", "Pago")] },
  { id: "apt_projects", sheet: "Ap_Design_Interiores", table: "apt_projects", title: "Projetos (imagens enviadas do computador não vão na planilha)", cols: [t("room", "Ambiente"), t("kind", "Tipo"), t("title", "Título"), t("image_url", "URL da imagem"), t("dimensions", "Dimensões"), t("lighting", "Iluminação"), { key: "palette", header: "Paleta (Hex)", kind: "palette" }] },
  { id: "apt_room_specs", sheet: "Ap_Design_Interiores", table: "apt_room_specs", title: "Caderno de especificações", cols: [t("room", "Ambiente"), t("notes", "Notas")] },
  { id: "links:apartamento", sheet: "Ap_Design_Interiores", table: "links", title: "Links de referência", filter: ["area", "apartamento"], fixed: { area: "apartamento" }, cols: [t("category", "Categoria"), t("title", "Título"), t("url", "URL"), t("note", "Nota")] },
  { id: "habits", sheet: "Habitos_DevPessoal", table: "habits", title: "Hábitos", cols: [t("name", "Hábito")] },
  { id: "habit_checks", sheet: "Habitos_DevPessoal", table: "habit_checks", title: "Marcações de hábitos", special: "checks", cols: [t("habit", "Hábito"), d("day", "Dia")] },
  { id: "decisions", sheet: "Habitos_DevPessoal", table: "decisions", title: "Decisões 10-10-10", cols: [t("question", "Decisão"), t("impact_10_minutes", "10 minutos"), t("impact_10_months", "10 meses"), t("impact_10_years", "10 anos")] },
  { id: "personal_items", sheet: "Habitos_DevPessoal", table: "personal_items", title: "Espaço pessoal", cols: [t("kind", "Lista (gratidao, desejo, amo_fazer)"), t("body", "Texto")] },
];

const SHEETS = ["Finanças", "Tarefas_Metas", "Estudos", "Ap_Obras_Compras", "Ap_Design_Interiores", "Habitos_DevPessoal"];

type Row = Record<string, unknown>;

export async function exportWorkbook() {
  const XLSX = await import("xlsx");
  const supabase = createClient();
  const wb = XLSX.utils.book_new();

  const { data: habitRows } = await supabase.from("habits").select("id,name");
  const habitName = new Map((habitRows ?? []).map((h: Row) => [h.id as string, h.name as string]));

  for (const sheet of SHEETS) {
    const aoa: unknown[][] = [];
    for (const blk of BLOCKS.filter((x) => x.sheet === sheet)) {
      let q = supabase.from(blk.table).select("*");
      if (blk.filter) q = q.eq(blk.filter[0], blk.filter[1]);
      const { data, error } = await q;
      if (error) throw new Error(`${blk.title}: ${error.message}`);
      const rows = ((data ?? []) as Row[]).sort((a, c) => String(a.created_at ?? a.day ?? "").localeCompare(String(c.created_at ?? c.day ?? "")));

      aoa.push([`## ${blk.id} — ${blk.title}`]);
      aoa.push(blk.cols.map((c) => c.header));
      for (const r of rows) {
        aoa.push(
          blk.cols.map((c) => {
            if (c.key === "habit") return habitName.get(r.habit_id as string) ?? "";
            const v = r[c.key];
            if (c.kind === "palette") return ((v as string[]) ?? []).join(", ");
            return v ?? "";
          }),
        );
      }
      aoa.push([]);
    }
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{ wch: 38 }, { wch: 28 }, { wch: 28 }, { wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, sheet);
  }

  const day = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `lifeos-${day}.xlsx`);
}

// ---------- Importação ----------
const TRUE_WORDS = new Set(["true", "sim", "s", "1", "x", "✓", "verdadeiro"]);
const clean = (v: unknown) => (v === undefined || v === null ? "" : String(v).trim());

function coerce(kind: Kind | undefined, v: unknown): unknown {
  const s = clean(v);
  switch (kind) {
    case "num": {
      if (typeof v === "number") return Number.isFinite(v) ? v : 0;
      if (s === "") return 0;
      // "1.234,50" (pt-BR) ou "1234.5"
      const num = s.includes(",") ? Number(s.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "")) : Number(s.replace(/[^\d.-]/g, ""));
      return Number.isFinite(num) ? num : 0;
    }
    case "bool":
      return typeof v === "boolean" ? v : TRUE_WORDS.has(s.toLowerCase());
    case "date": {
      if (s === "") return null;
      if (typeof v === "number") return new Date(Math.round((v - 25569) * 86400 * 1000)).toISOString().slice(0, 10);
      const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      return br ? `${br[3]}-${br[2]}-${br[1]}` : s.slice(0, 10);
    }
    case "palette":
      return s
        .split(/[\s,;]+/)
        .map((c) => c.replace(/^#?/, "#").toLowerCase())
        .filter((c) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(c));
    default:
      return s === "" ? null : s;
  }
}

function parseBlocks(aoa: unknown[][]): { id: string; rows: Row[] }[] {
  const found: { id: string; rows: Row[] }[] = [];
  for (let i = 0; i < aoa.length; i++) {
    const first = clean(aoa[i]?.[0]);
    if (!first.startsWith("## ")) continue;
    const id = first.slice(3).split(/\s+/)[0];
    const headers = (aoa[i + 1] ?? []).map(clean);
    const rows: Row[] = [];
    let j = i + 2;
    for (; j < aoa.length; j++) {
      const line = aoa[j] ?? [];
      if (line.every((c) => clean(c) === "")) break;
      const row: Row = {};
      headers.forEach((h, k) => (row[h] = line[k]));
      rows.push(row);
    }
    found.push({ id, rows });
    i = j;
  }
  return found;
}

export type ImportReport = { imported: Record<string, number>; errors: string[] };

export async function importWorkbook(file: File): Promise<ImportReport> {
  const XLSX = await import("xlsx");
  const supabase = createClient();
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const report: ImportReport = { imported: {}, errors: [] };

  const parsed = new Map<string, Row[]>();
  for (const name of wb.SheetNames) {
    const aoa = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1, defval: "", raw: true });
    for (const blk of parseBlocks(aoa)) parsed.set(blk.id, [...(parsed.get(blk.id) ?? []), ...blk.rows]);
  }

  for (const blk of BLOCKS) {
    const raw = parsed.get(blk.id);
    if (!raw || raw.length === 0) continue;

    try {
      const records: Row[] = [];
      for (const r of raw) {
        const rec: Row = { ...(blk.fixed ?? {}) };
        for (const c of blk.cols) rec[c.key] = coerce(c.kind, r[c.header]);
        records.push(rec);
      }

      if (blk.special === "settings") {
        const { error } = await supabase.from("apt_settings").upsert({ budget_cap: records[0].budget_cap }, { onConflict: "user_id" });
        if (error) throw error;
        report.imported[blk.title] = 1;
        continue;
      }

      if (blk.special === "checks") {
        const { data: hs } = await supabase.from("habits").select("id,name");
        const idByName = new Map((hs ?? []).map((h: Row) => [String(h.name).toLowerCase(), h.id as string]));
        const payload = records
          .map((r) => ({ habit_id: idByName.get(String(r.habit ?? "").toLowerCase()), day: r.day }))
          .filter((r) => r.habit_id && r.day);
        for (let k = 0; k < payload.length; k += 200) {
          const { error } = await supabase.from("habit_checks").upsert(payload.slice(k, k + 200), { onConflict: "habit_id,day", ignoreDuplicates: true });
          if (error) throw error;
        }
        report.imported[blk.title] = payload.length;
        continue;
      }

      if (blk.id === "apt_room_specs") {
        const { error } = await supabase.from("apt_room_specs").upsert(records.map((r) => ({ ...r, notes: r.notes ?? "" })), { onConflict: "user_id,room" });
        if (error) throw error;
        report.imported[blk.title] = records.length;
        continue;
      }

      for (let k = 0; k < records.length; k += 200) {
        const { error } = await supabase.from(blk.table).insert(records.slice(k, k + 200));
        if (error) throw error;
      }
      report.imported[blk.title] = records.length;
    } catch (e) {
      report.errors.push(`${blk.title}: ${(e as { message?: string }).message ?? "erro ao importar"}`);
    }
  }
  return report;
}
