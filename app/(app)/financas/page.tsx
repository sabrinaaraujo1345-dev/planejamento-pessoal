import { FinanceClient } from "@/components/financas/finance-client";
import type { Piggy, Tx } from "@/lib/apartment-types";
import { createClient } from "@/lib/supabase/server";

export default async function FinancasPage({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { aba } = await searchParams;
  const supabase = await createClient();
  const [txs, piggies] = await Promise.all([
    supabase.from("transactions").select("*").order("occurred_on", { ascending: false }),
    supabase.from("piggy_banks").select("*").order("created_at"),
  ]);
  return (
    <FinanceClient
      txs={(txs.data ?? []) as Tx[]}
      piggies={(piggies.data ?? []) as Piggy[]}
      initialSub={aba === "lancamentos" ? "lanc" : "dash"}
    />
  );
}
