
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  toCamelCase,
  toCamelCaseArray,
  toSnakeCase,
} from "@/lib/supabase/helpers";
import { getUserId } from "@/lib/supabase/auth";
import type { Order, OrderItem, OrderWithItems } from "@/types";

type OrderInput = Omit<Order, "id" | "createdAt">;

type OrderPayload = {
  clientId: string;
  clientName: string;
  status: Order["status"];
  notes?: string;
  deadline?: string;
};

type OrderItemInput = Omit<OrderItem, "id" | "orderId" | "createdAt">;

type SavedOrderResponse = Record<string, unknown> & {
  items?: Record<string, unknown>[];
};

export function useOrders() {
  const supabase = createClient();

  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = data ?? [];

      if (rows.length === 0) {
        setOrders([]);
        return;
      }

      const orderIds = rows.map((order) => order.id);

      const { data: itemRows, error: itemError } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIds);

      if (itemError) throw itemError;

      const itemsByOrder = new Map<string, OrderItem[]>();

      for (const rawItem of itemRows ?? []) {
        const item = toCamelCase<OrderItem>(rawItem);

        if (!item.orderId) continue;

        const existing = itemsByOrder.get(item.orderId) ?? [];
        existing.push(item);
        itemsByOrder.set(item.orderId, existing);
      }

      const mappedOrders = rows.map((row) => {
        const order = toCamelCase<Order>(row);
        const savedItems = itemsByOrder.get(order.id) ?? [];

        // Compatibilidade com pedidos antigos que ainda não possuem
        // registros na tabela order_items.
        const items: OrderItem[] =
          savedItems.length > 0
            ? savedItems
            : [
                {
                  productId: order.productId,
                  productName: order.productName || "Produto sem nome",
                  printerId: order.printerId,
                  printerName: order.printerName,
                  filamentId: order.filamentId,
                  filamentName: order.filamentName,
                  filamentColor: order.filamentColor,
                  quantity: order.quantity || 1,
                  totalHours: order.totalHours || 0,
                  filamentGrams: order.filamentGrams || 0,
                  cost: order.cost || 0,
                  price: order.price || 0,
                },
              ];

        return { ...order, items };
      });

      setOrders(mappedOrders);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const saveWithItems = async (
    orderId: string | null,
    order: OrderPayload,
    items: OrderItemInput[],
  ): Promise<OrderWithItems | null> => {
    try {
      const userId = await getUserId();

      if (!userId) {
        console.error("Usuário não autenticado.");
        return null;
      }

      if (items.length === 0) {
        console.error("Adicione pelo menos um produto ao pedido.");
        return null;
      }

      const orderJson = {
        client_id: order.clientId,
        client_name: order.clientName,
        status: order.status,
        notes: order.notes ?? "",
        deadline: order.deadline ?? "",
      };

      const itemsJson = items.map((item) => ({
        product_id: item.productId || "",
        product_name: item.productName,
        printer_id: item.printerId || "",
        printer_name: item.printerName || "",
        filament_id: item.filamentId || "",
        filament_name: item.filamentName || "",
        filament_color: item.filamentColor || "",
        quantity: Number(item.quantity),
        total_hours: Number(item.totalHours),
        filament_grams: Number(item.filamentGrams),
        cost: Number(item.cost),
        price: Number(item.price),
      }));

      const { data, error } = await supabase.rpc(
        "save_order_with_items",
        {
          p_order_id: orderId,
          p_order: orderJson,
          p_items: itemsJson,
        },
      );

      if (error) throw error;

      const response = data as SavedOrderResponse;
      const savedOrder = toCamelCase<Order>(response);
      const savedItems = toCamelCaseArray<OrderItem>(
        response.items ?? [],
      );

      const result: OrderWithItems = {
        ...savedOrder,
        items: savedItems,
      };

      setOrders((previous) => {
        const withoutSaved = previous.filter(
          (existing) => existing.id !== result.id,
        );

        return [result, ...withoutSaved].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
        );
      });

      return result;
    } catch (error) {
      console.error("Erro ao salvar pedido com itens:", error);
      return null;
    }
  };

  async function create(
    input: OrderInput,
    items?: OrderItemInput[],
  ): Promise<OrderWithItems | null> {
    const resolvedItems: OrderItemInput[] =
      items ??
      [
        {
          productId: input.productId,
          productName: input.productName || "Produto sem nome",
          printerId: input.printerId,
          printerName: input.printerName,
          filamentId: input.filamentId,
          filamentName: input.filamentName,
          filamentColor: input.filamentColor,
          quantity: input.quantity,
          totalHours: input.totalHours,
          filamentGrams: input.filamentGrams,
          cost: input.cost,
          price: input.price,
        },
      ];

    return saveWithItems(
      null,
      {
        clientId: input.clientId,
        clientName: input.clientName,
        status: input.status,
        notes: input.notes,
        deadline: input.deadline,
      },
      resolvedItems,
    );
  }

  async function update(
    id: string,
    input: Partial<Order>,
    items?: OrderItemInput[],
  ): Promise<OrderWithItems | null> {
    const existing = orders.find((order) => order.id === id);

    if (!existing) {
      console.error("Pedido não encontrado na lista local.");
      return null;
    }

    const merged: Order = { ...existing, ...input };

    const resolvedItems: OrderItemInput[] =
      items ??
      existing.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        printerId: item.printerId,
        printerName: item.printerName,
        filamentId: item.filamentId,
        filamentName: item.filamentName,
        filamentColor: item.filamentColor,
        quantity: item.quantity,
        totalHours: item.totalHours,
        filamentGrams: item.filamentGrams,
        cost: item.cost,
        price: item.price,
      }));

    return saveWithItems(
      id,
      {
        clientId: merged.clientId,
        clientName: merged.clientName,
        status: merged.status,
        notes: merged.notes,
        deadline: merged.deadline,
      },
      resolvedItems,
    );
  }

  async function remove(id: string) {
    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setOrders((previous) =>
        previous.filter((order) => order.id !== id),
      );

      return true;
    } catch (error) {
      console.error("Erro ao excluir pedido:", error);
      return false;
    }
  }

  return {
    orders,
    loading,
    fetchOrders,
    create,
    update,
    remove,
  };
}
