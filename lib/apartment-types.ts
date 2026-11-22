export type Stage = { id: string; title: string; note: string | null; done: boolean; position: number };
export type Work = { id: string; service: string; provider: string | null; status: WorkStatus; estimated: number; paid: number };
export type Purchase = { id: string; room: PurchaseRoom; item: string; status: PurchaseStatus; estimated: number; paid: number };
export type Project = {
  id: string;
  room: DesignRoom;
  kind: ProjectKind;
  title: string;
  image_path: string | null;
  image_url: string | null;
  dimensions: string | null;
  lighting: string | null;
  palette: string[];
  signed_url?: string | null;
};
export type RoomSpec = { id: string; room: string; notes: string };
export type AptLink = { id: string; area?: string; category: string | null; title: string; url: string; note: string | null };

export const WORK_STATUSES = ["Planejado", "Orçando", "Em Andamento", "Concluído"] as const;
export type WorkStatus = (typeof WORK_STATUSES)[number];
export const PURCHASE_ROOMS = ["Cozinha", "Sala", "Quarto", "Banheiro", "Home Office", "Lavanderia"] as const;
export type PurchaseRoom = (typeof PURCHASE_ROOMS)[number];
export const PURCHASE_STATUSES = ["Pesquisando", "Comprado", "Entregue"] as const;
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];
export const DESIGN_ROOMS = ["Sala de Estar", "Home Office", "Cozinha", "Quarto", "Banheiro"] as const;
export type DesignRoom = (typeof DESIGN_ROOMS)[number];
export const PROJECT_KINDS = ["Projeto 3D", "Render", "Planta Baixa", "Inspiração"] as const;
export type ProjectKind = (typeof PROJECT_KINDS)[number];
export const LINK_CATEGORIES = ["Pinterest", "Modelos 3D / SketchUp", "Iluminação", "Móveis", "Revestimentos"] as const;

export const DEFAULT_STAGES = [
  "Financiamento: contrato e liberação",
  "Vistoria de entrega das chaves",
  "Escritura e registro em cartório (ITBI)",
  "Titularidade das contas (água, luz, gás, condomínio)",
  "Liberação de ART/RRT para a obra",
];

// ---------- Planejamento, estudos e finanças ----------
export const TASK_CATEGORIES = ["Pessoal", "Apartamento", "Finanças", "Estudos", "Trabalho"] as const;
export const PRIORITIES = ["Alta", "Média", "Baixa"] as const;
export type Task = {
  id: string;
  title: string;
  category: (typeof TASK_CATEGORIES)[number];
  priority: (typeof PRIORITIES)[number];
  horizon: "diario" | "semanal" | "semestral" | "anual";
  due_date: string | null;
  done: boolean;
};
export type Goal = { id: string; title: string; milestone: string | null; scope: "semestral" | "anual"; progress: number };
export type StudyTopic = {
  id: string;
  subject: string;
  goal: string | null;
  step_reading: boolean;
  step_summary: boolean;
  step_exercise: boolean;
  step_review: boolean;
};
export type PaymentMethod = "receita" | "cartao" | "debito" | "custo_fixo";
export const FIN_CATEGORIES = ["Moradia", "Investimentos", "Educação", "Assinaturas", "Cuidado Pessoal", "Outros"] as const;
export type Tx = {
  id: string;
  description: string;
  amount: number;
  payment_method: PaymentMethod;
  category: (typeof FIN_CATEGORIES)[number] | null;
  occurred_on: string;
};
export type Piggy = { id: string; name: string; target: number; current: number };

// ---------- Rotina ----------
export type Habit = { id: string; name: string };
export type HabitCheck = { habit_id: string; day: string };
export type Decision = { id: string; question: string; impact_10_minutes: string | null; impact_10_months: string | null; impact_10_years: string | null };
export type PersonalItem = { id: string; kind: "gratidao" | "desejo" | "amo_fazer"; body: string };
