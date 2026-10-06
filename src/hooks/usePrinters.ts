"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  toCamelCase,
  toCamelCaseArray,
  toSnakeCase,
} from "@/lib/supabase/helpers";
import { getUserId } from "@/lib/supabase/auth";
import type { Printer } from "@/types";

export function usePrinters() {
  const supabase = createClient();

  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Busca apenas as impressoras pertencentes ao usuário logado.
   */
  const fetchPrinters = useCallback(async () => {
    setLoading(true);

    try {
      const userId = await getUserId();

      if (!userId) {
        setPrinters([]);
        return;
      }

      const { data, error } = await supabase
        .from("printers")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar impressoras:", error);
        setPrinters([]);
        return;
      }

      setPrinters(toCamelCaseArray<Printer>(data ?? []));
    } catch (err) {
      console.error("Erro ao buscar impressoras:", err);
      setPrinters([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPrinters();
  }, [fetchPrinters]);

  /**
   * Cria uma nova impressora vinculada ao usuário logado.
   */
  async function create(input: Omit<Printer, "id" | "createdAt">) {
    try {
      const userId = await getUserId();

      if (!userId) {
        console.error("Usuário não autenticado.");
        return null;
      }

      const payload = {
        ...toSnakeCase(
          input as unknown as Record<string, unknown>
        ),
        user_id: userId,
      };

      const { data, error } = await supabase
        .from("printers")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar impressora:", error);
        return null;
      }

      if (!data) {
        return null;
      }

      const created = toCamelCase<Printer>(data);

      setPrinters((prev) => [created, ...prev]);

      return created;
    } catch (err) {
      console.error("Erro ao criar impressora:", err);
      return null;
    }
  }

  /**
   * Atualiza uma impressora pertencente ao usuário logado.
   */
  async function update(id: string, input: Partial<Printer>) {
    try {
      const userId = await getUserId();

      if (!userId) {
        console.error("Usuário não autenticado.");
        return null;
      }

      const payload = toSnakeCase(
        input as unknown as Record<string, unknown>
      );

      const { data, error } = await supabase
        .from("printers")
        .update(payload)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.error("Erro ao atualizar impressora:", error);
        return null;
      }

      if (!data) {
        return null;
      }

      const updated = toCamelCase<Printer>(data);

      setPrinters((prev) =>
        prev.map((printer) =>
          printer.id === id ? updated : printer
        )
      );

      return updated;
    } catch (err) {
      console.error("Erro ao atualizar impressora:", err);
      return null;
    }
  }

  /**
   * Exclui uma impressora do usuário logado.
   *
   * Só remove do estado local depois que o Supabase
   * confirmar que uma linha realmente foi excluída.
   */
  async function remove(id: string) {
    try {
      const userId = await getUserId();

      if (!userId) {
        console.error("Usuário não autenticado.");
        return false;
      }

      const { data, error } = await supabase
        .from("printers")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
        .select("id");

      if (error) {
        console.error("Erro ao excluir impressora:", error);
        return false;
      }

      /**
       * Se nenhuma linha foi retornada, significa que o Supabase
       * não excluiu a impressora. Isso pode acontecer, por exemplo,
       * por causa de uma política RLS de DELETE.
       */
      if (!data || data.length === 0) {
        console.error(
          "Nenhuma impressora foi excluída. Verifique as políticas RLS da tabela printers."
        );
        return false;
      }

      setPrinters((prev) =>
        prev.filter((printer) => printer.id !== id)
      );

      return true;
    } catch (err) {
      console.error("Erro ao excluir impressora:", err);
      return false;
    }
  }

  return {
    printers,
    loading,
    fetchPrinters,
    create,
    update,
    remove,
  };
}