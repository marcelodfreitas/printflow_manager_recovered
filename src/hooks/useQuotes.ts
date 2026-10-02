"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  toCamelCase,
  toCamelCaseArray,
} from "@/lib/supabase/helpers";
import { getUserId } from "@/lib/supabase/auth";
import type { Quote, QuoteItem } from "@/types";

export function useQuotes() {
  const supabase = createClient();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar orçamentos:", error);
        return;
      }

      if (data) {
        const rows = toCamelCaseArray<Quote>(data);

        const withItems = await Promise.all(
          rows.map(async (quote) => {
            const { data: items, error: itemsError } = await supabase
              .from("quote_items")
              .select("*")
              .eq("quote_id", quote.id);

            if (itemsError) {
              console.error(
                `Erro ao buscar itens do orçamento ${quote.id}:`,
                itemsError,
              );
            }

            return {
              ...quote,
              discountPercent: Number(quote.discountPercent ?? 0),
              items: items
                ? toCamelCaseArray<QuoteItem>(items)
                : [],
            } as Quote;
          }),
        );

        setQuotes(withItems);
      }
    } catch (err) {
      console.error("Erro ao buscar orçamentos:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  async function create(input: {
    productId?: string | null;
    productName?: string;
    clientId?: string | null;
    clientName: string;
    status: Quote["status"];
    notes?: string;
    validUntil: string;
    items: Omit<QuoteItem, "id">[];
    subtotal: number;
    tax: number;
    total: number;
    discountPercent?: number;
  }) {
    try {
      const userId = await getUserId();

      if (!userId) {
        console.error("Usuário não autenticado.");
        return null;
      }

      const {
        clientId,
        clientName,
        status,
        notes,
        validUntil,
        items,
        subtotal,
        tax,
        total,
        discountPercent = 0,
      } = input;

      const { data: quoteData, error: quoteError } = await supabase
        .from("quotes")
        .insert({
          product_id: input.productId || null,
          product_name: input.productName?.trim() || null,
          client_id: clientId || null,
          client_name: clientName.trim(),
          status,
          notes: notes?.trim() || null,
          valid_until: validUntil,
          subtotal,
          tax,
          total,
          discount_percent: discountPercent,
          user_id: userId,
        })
        .select()
        .single();

      if (quoteError) {
        console.error("ERRO AO CRIAR ORÇAMENTO:", quoteError);
        throw quoteError;
      }

      if (!quoteData) {
        console.error("Nenhum orçamento foi retornado após o insert.");
        return null;
      }

      const quoteId = quoteData.id;

      const { data: itemData, error: itemError } = await supabase
        .from("quote_items")
        .insert(
          items.map((item) => ({
            quote_id: quoteId,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total: item.total,
          })),
        )
        .select();

      if (itemError) {
        console.error(
          "ERRO AO CRIAR ITENS DO ORÇAMENTO:",
          itemError,
        );

        // Remove o orçamento caso os itens não possam ser criados.
        await supabase
          .from("quotes")
          .delete()
          .eq("id", quoteId);

        throw itemError;
      }

      const created = toCamelCase<Quote>(quoteData);

      created.discountPercent = Number(
        created.discountPercent ?? 0,
      );

      created.items = itemData
        ? toCamelCaseArray<QuoteItem>(itemData)
        : [];

      setQuotes((prev) => [created, ...prev]);

      return created;
    } catch (err) {
      console.error("Erro ao criar orçamento:", err);
      return null;
    }
  }

  async function update(
    id: string,
    input: {
      productId?: string | null;
      productName?: string;
      clientId?: string | null;
      clientName?: string;
      status?: Quote["status"];
      notes?: string;
      validUntil?: string;
      items?: Omit<QuoteItem, "id">[];
      subtotal?: number;
      tax?: number;
      total?: number;
      discountPercent?: number;
    },
  ) {
    try {
      const updateData: Record<string, unknown> = {};

      if (input.productId !== undefined) {
        updateData.product_id = input.productId || null;
      }

      if (input.productName !== undefined) {
        updateData.product_name =
          input.productName.trim() || null;
      }

      if (input.clientId !== undefined) {
        updateData.client_id = input.clientId || null;
      }

      if (input.clientName !== undefined) {
        updateData.client_name =
          input.clientName.trim();
      }

      if (input.status !== undefined) {
        updateData.status = input.status;
      }

      if (input.notes !== undefined) {
        updateData.notes = input.notes.trim() || null;
      }

      if (input.validUntil !== undefined) {
        updateData.valid_until = input.validUntil;
      }

      if (input.subtotal !== undefined) {
        updateData.subtotal = input.subtotal;
      }

      if (input.tax !== undefined) {
        updateData.tax = input.tax;
      }

      if (input.total !== undefined) {
        updateData.total = input.total;
      }

      if (input.discountPercent !== undefined) {
        updateData.discount_percent =
          input.discountPercent;
      }

      const { data: quoteData, error: quoteError } =
        await supabase
          .from("quotes")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();

      if (quoteError) {
        console.error(
          "ERRO AO ATUALIZAR ORÇAMENTO:",
          quoteError,
        );
        throw quoteError;
      }

      if (!quoteData) {
        console.error(
          "Nenhum orçamento foi retornado após a atualização.",
        );
        return null;
      }

      if (input.items) {
        const { error: deleteItemsError } = await supabase
          .from("quote_items")
          .delete()
          .eq("quote_id", id);

        if (deleteItemsError) {
          console.error(
            "ERRO AO REMOVER ITENS ANTIGOS:",
            deleteItemsError,
          );
          throw deleteItemsError;
        }

        const { error: insertItemsError } = await supabase
          .from("quote_items")
          .insert(
            input.items.map((item) => ({
              quote_id: id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              total: item.total,
            })),
          );

        if (insertItemsError) {
          console.error(
            "ERRO AO ATUALIZAR ITENS DO ORÇAMENTO:",
            insertItemsError,
          );
          throw insertItemsError;
        }
      }

      const { data: itemData, error: itemsError } =
        await supabase
          .from("quote_items")
          .select("*")
          .eq("quote_id", id);

      if (itemsError) {
        console.error(
          "ERRO AO BUSCAR ITENS ATUALIZADOS:",
          itemsError,
        );
        throw itemsError;
      }

      const updated = toCamelCase<Quote>(quoteData);

      updated.discountPercent = Number(
        updated.discountPercent ?? 0,
      );

      updated.items = itemData
        ? toCamelCaseArray<QuoteItem>(itemData)
        : [];

      setQuotes((prev) =>
        prev.map((q) => (q.id === id ? updated : q)),
      );

      return updated;
    } catch (err) {
      console.error("Erro ao atualizar orçamento:", err);
      return null;
    }
  }

  async function remove(id: string) {
    try {
      const { error: itemsError } = await supabase
        .from("quote_items")
        .delete()
        .eq("quote_id", id);

      if (itemsError) {
        console.error(
          "Erro ao excluir itens do orçamento:",
          itemsError,
        );
        throw itemsError;
      }

      const { error: quoteError } = await supabase
        .from("quotes")
        .delete()
        .eq("id", id);

      if (quoteError) {
        console.error(
          "Erro ao excluir orçamento:",
          quoteError,
        );
        throw quoteError;
      }

      setQuotes((prev) =>
        prev.filter((q) => q.id !== id),
      );
    } catch (err) {
      console.error("Erro ao excluir orçamento:", err);
    }
  }

  return {
    quotes,
    loading,
    fetchQuotes,
    create,
    update,
    remove,
  };
}