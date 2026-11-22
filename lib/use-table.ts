"use client";

import { useCallback, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/apartamento/ui";

// Hook genérico: mantém as linhas em estado local e grava no Supabase (RLS garante o dono).
export function useTable<T extends { id: string }>(table: string, initial: T[]) {
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();
  const [rows, setRows] = useState<T[]>(initial);

  const add = useCallback(
    async (values: Partial<T>) => {
      const { data, error } = await supabase.from(table).insert(values as never).select().single();
      if (error || !data) {
        toast("Não foi possível salvar. Tente de novo.", "error");
        return null;
      }
      setRows((r) => [...r, data as T]);
      return data as T;
    },
    [supabase, table, toast],
  );

  const patch = useCallback(
    async (id: string, values: Partial<T>) => {
      const before = rows;
      setRows((r) => r.map((x) => (x.id === id ? { ...x, ...values } : x)));
      const { error } = await supabase.from(table).update(values as never).eq("id", id);
      if (error) {
        setRows(before);
        toast("Não foi possível atualizar.", "error");
      }
    },
    [supabase, table, toast, rows],
  );

  const remove = useCallback(
    async (id: string) => {
      const before = rows;
      setRows((r) => r.filter((x) => x.id !== id));
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) {
        setRows(before);
        toast("Não foi possível excluir.", "error");
      }
    },
    [supabase, table, toast, rows],
  );

  return { rows, setRows, add, patch, remove };
}
