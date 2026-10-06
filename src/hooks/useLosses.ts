"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  toCamelCase,
  toCamelCaseArray,
  toSnakeCase,
} from "@/lib/supabase/helpers";
import { getUserId } from "@/lib/supabase/auth";

export interface Loss {
  id: string;
  userId: string;
  printerId?: string | null;
  filamentId?: string | null;
  reason: string;
  grams: number;
  timeMinutes: number;
  materialCost: number;
  machineCost: number;
  observation?: string | null;
  createdAt: string;
}

export type CreateLossInput = Omit<
  Loss,
  "id" | "userId" | "createdAt"
>;

export function useLosses() {
  const supabase = createClient();

  const [losses, setLosses] = useState<Loss[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLosses = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("losses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar perdas:", error);
        return;
      }

      if (data) {
        setLosses(toCamelCaseArray<Loss>(data));
      }
    } catch (err) {
      console.error("Erro ao buscar perdas:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchLosses();
  }, [fetchLosses]);

  useEffect(() => {
    const channel = supabase
      .channel("losses-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "losses",
        },
        (payload) => {
          const created = toCamelCase<Loss>(
            payload.new as Record<string, unknown>,
          );

          setLosses((prev) => {
            if (prev.some((loss) => loss.id === created.id)) {
              return prev;
            }

            return [created, ...prev];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "losses",
        },
        (payload) => {
          const updated = toCamelCase<Loss>(
            payload.new as Record<string, unknown>,
          );

          setLosses((prev) =>
            prev.map((loss) =>
              loss.id === updated.id ? updated : loss,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "losses",
        },
        (payload) => {
          const deleted = payload.old as { id: string };

          setLosses((prev) =>
            prev.filter((loss) => loss.id !== deleted.id),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function create(input: CreateLossInput) {
    try {
      const userId = await getUserId();

      if (!userId) {
        console.error("Usuário não autenticado.");
        return null;
      }

      const payload = {
        ...toSnakeCase(
          input as unknown as Record<string, unknown>,
        ),
        user_id: userId,
      };

      const { data, error } = await supabase
        .from("losses")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar perda:", error);
        return null;
      }

      if (data) {
        const created = toCamelCase<Loss>(data);

        setLosses((prev) => {
          if (prev.some((loss) => loss.id === created.id)) {
            return prev;
          }

          return [created, ...prev];
        });

        return created;
      }
    } catch (err) {
      console.error("Erro ao criar perda:", err);
    }

    return null;
  }

  async function update(
    id: string,
    input: Partial<CreateLossInput>,
  ) {
    try {
      const { data, error } = await supabase
        .from("losses")
        .update(
          toSnakeCase(
            input as unknown as Record<string, unknown>,
          ),
        )
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao atualizar perda:", error);
        return null;
      }

      if (data) {
        const updated = toCamelCase<Loss>(data);

        setLosses((prev) =>
          prev.map((loss) =>
            loss.id === id ? updated : loss,
          ),
        );

        return updated;
      }
    } catch (err) {
      console.error("Erro ao atualizar perda:", err);
    }

    return null;
  }

  async function remove(id: string) {
    try {
      const { error } = await supabase
        .from("losses")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Erro ao excluir perda:", error);
        return false;
      }

      setLosses((prev) =>
        prev.filter((loss) => loss.id !== id),
      );

      return true;
    } catch (err) {
      console.error("Erro ao excluir perda:", err);
      return false;
    }
  }

  return {
    losses,
    loading,
    fetchLosses,
    create,
    update,
    remove,
  };
}