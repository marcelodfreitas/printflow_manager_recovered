"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toCamelCase, toCamelCaseArray, toSnakeCase } from "@/lib/supabase/helpers";
import { getUserId } from "@/lib/supabase/auth";
import type { Filament } from "@/types";

export function useFilaments() {
  const supabase = createClient();
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [loading, setLoading] = useState(true);

  

  const fetchFilaments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("filaments")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setFilaments(toCamelCaseArray<Filament>(data));
    } catch (err) {
      console.error("Erro ao buscar filamentos:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchFilaments(); }, [fetchFilaments]);

  useEffect(() => {
    const channel = supabase
      .channel("filaments-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "filaments" },
        (payload) => {
          const created = toCamelCase<Filament>(
            payload.new as Record<string, unknown>,
          );
          setFilaments((prev) => [created, ...prev]);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "filaments" },
        (payload) => {
          const updated = toCamelCase<Filament>(
            payload.new as Record<string, unknown>,
          );
          setFilaments((prev) =>
            prev.map((f) => (f.id === updated.id ? updated : f)),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "filaments" },
        (payload) => {
          const deleted = payload.old as { id: string };
          setFilaments((prev) => prev.filter((f) => f.id !== deleted.id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function create(input: Omit<Filament, "id" | "createdAt">) {
    try {
      const userId = await getUserId();
      if (!userId) return null;
      const { data } = await supabase
        .from("filaments")
        .insert({
          ...toSnakeCase(input as unknown as Record<string, unknown>),
          remaining_weight: input.weight * input.quantity,
          user_id: userId,
        })
        .select()
        .single();
      if (data) {
        const created = toCamelCase<Filament>(data);
        setFilaments((prev) => [created, ...prev]);
        return created;
      }
    } catch (err) {
      console.error("Erro ao criar filamento:", err);
    }
    return null;
  }

  async function update(id: string, input: Partial<Filament>) {
    try {
      const { data } = await supabase
        .from("filaments")
        .update(toSnakeCase(input as unknown as Record<string, unknown>))
        .eq("id", id)
        .select()
        .single();
      if (data) {
        const updated = toCamelCase<Filament>(data);
        setFilaments((prev) => prev.map((f) => (f.id === id ? updated : f)));
        return updated;
      }
    } catch (err) {
      console.error("Erro ao atualizar filamento:", err);
    }
    return null;
  }

  async function remove(id: string) {
    try {
      await supabase.from("filaments").delete().eq("id", id);
      setFilaments((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error("Erro ao excluir filamento:", err);
    }
  }

  async function adjustStock(id: string, deltaGrams: number) {
    if (!id || !deltaGrams) return null;
    try {
      const current = filaments.find((f) => f.id === id);
      if (!current) return null;
      const currentRemaining =
        current.remainingWeight ?? current.weight * current.quantity;
      const nextRemaining = Math.max(0, currentRemaining + deltaGrams);
      return await update(id, { remainingWeight: nextRemaining });
    } catch (err) {
      console.error("Erro ao ajustar estoque de filamento:", err);
    }
    return null;
  }

async function addStockEntry(input: {
  filamentId: string;
  quantity: number;
  purchaseDate: string;
  totalCost: number;
  supplier: string;
}) {
  try {
    const { data, error } = await supabase.rpc(
      "add_filament_stock_entry",
      {
        p_filament_id: input.filamentId,
        p_quantity: input.quantity,
        p_purchase_date: input.purchaseDate || null,
        p_total_cost: input.totalCost,
        p_supplier: input.supplier.trim() || null,
      },
    );

    if (error) {
      console.error("Erro ao registrar entrada de filamento:", error);
      throw error;
    }

    await fetchFilaments();
    return data;
  } catch (err) {
    console.error("Erro ao registrar entrada de filamento:", err);
    throw err;
  }
}

  return {
  filaments,
  loading,
  fetchFilaments,
  create,
  update,
  remove,
  adjustStock,
  addStockEntry,
};
}
