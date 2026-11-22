import { createClient } from "@/lib/supabase/client";
import { DEFAULT_STAGES } from "@/lib/apartment-types";
import { addDays, todayInSP, weekStart } from "@/lib/dates";

const TABLES_WITH_ID = [
  "habit_checks", "habits", "decisions", "personal_items", "links", "apt_room_specs", "apt_projects",
  "apt_purchases", "apt_works", "apt_stages", "piggy_banks", "transactions", "study_topics", "goals", "tasks",
];

/** Insere um conjunto pequeno de dados de exemplo (adiciona; não apaga nada). */
export async function loadDemoData() {
  const supabase = createClient();
  const today = todayInSP();
  const ym = today.slice(0, 7);
  const ins = async (table: string, rows: object[]) => {
    const { data, error } = await supabase.from(table).insert(rows).select();
    if (error) throw error;
    return data ?? [];
  };

  await ins("tasks", [
    { title: "Fechar orçamento da marcenaria", category: "Apartamento", priority: "Alta", horizon: "diario" },
    { title: "Pagar fatura do cartão", category: "Finanças", priority: "Alta", horizon: "diario" },
    { title: "Ler um capítulo do livro de estudo", category: "Estudos", priority: "Média", horizon: "diario" },
    { title: "Revisar gastos da semana", category: "Finanças", priority: "Média", horizon: "semanal" },
    { title: "Escolher revestimento do banheiro", category: "Apartamento", priority: "Baixa", horizon: "semestral" },
  ]);
  await ins("goals", [
    { title: "Concluir a reforma da cozinha", milestone: "Bancada instalada", scope: "semestral", progress: 40 },
    { title: "Formar a reserva de emergência", milestone: "6 meses de despesas", scope: "anual", progress: 25 },
    { title: "Terminar a pós-graduação", milestone: "Entregar o TCC", scope: "anual", progress: 60 },
  ]);
  await ins("study_topics", [
    { subject: "Arquitetura de microsserviços", goal: "Entender padrões de comunicação", step_reading: true, step_summary: true },
    { subject: "Mensageria com Kafka", goal: "Praticar consumers e producers", step_reading: true },
    { subject: "Testes automatizados", goal: "Cobrir os serviços principais" },
  ]);
  await ins("transactions", [
    { description: "Salário", amount: 9500, payment_method: "receita", occurred_on: `${ym}-05` },
    { description: "Condomínio", amount: 780, payment_method: "custo_fixo", category: "Moradia", occurred_on: `${ym}-08` },
    { description: "Assinatura de streaming", amount: 44.9, payment_method: "cartao", category: "Assinaturas", occurred_on: `${ym}-10` },
    { description: "Curso online", amount: 199, payment_method: "cartao", category: "Educação", occurred_on: `${ym}-12` },
    { description: "Salão", amount: 160, payment_method: "debito", category: "Cuidado Pessoal", occurred_on: `${ym}-15` },
    { description: "Aporte: Reserva de emergência", amount: 800, payment_method: "debito", category: "Investimentos", occurred_on: `${ym}-06` },
  ]);
  await ins("piggy_banks", [
    { name: "Reserva de emergência", target: 30000, current: 7500 },
    { name: "Móveis do apartamento", target: 15000, current: 3200 },
  ]);
  await supabase.from("apt_settings").upsert({ budget_cap: 80000 }, { onConflict: "user_id" });
  await ins("apt_stages", DEFAULT_STAGES.map((title, i) => ({ title, position: i, done: i < 2 })));
  await ins("apt_works", [
    { service: "Gesso e sancas", provider: "Gesseiro Silva", status: "Concluído", estimated: 6500, paid: 6500 },
    { service: "Piso porcelanato", provider: "Casa do Piso", status: "Em Andamento", estimated: 14000, paid: 7000 },
    { service: "Marcenaria da cozinha", provider: "Marcenaria Atelier", status: "Orçando", estimated: 28000, paid: 0 },
    { service: "Elétrica e pintura", provider: "A definir", status: "Planejado", estimated: 9000, paid: 0 },
  ]);
  await ins("apt_purchases", [
    { room: "Cozinha", item: "Geladeira", status: "Pesquisando", estimated: 4500 },
    { room: "Sala", item: "Sofá", status: "Comprado", estimated: 5200, paid: 4900 },
    { room: "Quarto", item: "Cama box", status: "Entregue", estimated: 3200, paid: 3000 },
    { room: "Home Office", item: "Cadeira ergonômica", status: "Pesquisando", estimated: 1800 },
  ]);
  const habits = await ins("habits", [{ name: "Ler 20 minutos" }, { name: "Treinar" }, { name: "Beber 2 litros de água" }]);
  const monday = weekStart(today);
  await ins(
    "habit_checks",
    habits.flatMap((h: { id: string }, i: number) =>
      [0, 1, 2].filter((k) => addDays(monday, k) <= today && (k + i) % 3 !== 2).map((k) => ({ habit_id: h.id, day: addDays(monday, k) })),
    ),
  );
  await ins("personal_items", [
    { kind: "gratidao", body: "Um dia tranquilo e produtivo." },
    { kind: "desejo", body: "Viajar sem pressa para um lugar novo." },
    { kind: "amo_fazer", body: "Cozinhar com calma no fim de semana." },
  ]);
}

/** Apaga TODOS os dados do usuário (tabelas e imagens do bucket). */
export async function wipeAllData() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("auth");

  for (const table of TABLES_WITH_ID) {
    const { error } = await supabase.from(table).delete().not("id", "is", null);
    if (error) throw error;
  }
  const { error } = await supabase.from("apt_settings").delete().not("user_id", "is", null);
  if (error) throw error;

  const list = await supabase.storage.from("apt-images").list(auth.user.id, { limit: 1000 });
  const paths = (list.data ?? []).map((f) => `${auth.user.id}/${f.name}`);
  if (paths.length) await supabase.storage.from("apt-images").remove(paths);
}
