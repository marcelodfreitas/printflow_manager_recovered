
"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ShoppingCart,
  Clock3,
  CheckCircle2,
  CircleDollarSign,
  PackageCheck,
  Printer,
  Box,
  CalendarDays,
  UserRound,
  X,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Card, CardContent, CardHeader } from "@/components/common";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "@/components/ui/Table";
import Modal from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";

import type { Order, OrderItem, OrderWithItems } from "@/types";
import { useOrders } from "@/hooks/useOrders";
import { useClients } from "@/hooks/useClients";
import { useProducts } from "@/hooks/useProducts";
import { usePrinters } from "@/hooks/usePrinters";
import { useFilaments } from "@/hooks/useFilaments";
import { formatCurrency, formatDate, translateStatus } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

const orderStatuses = [
  { value: "pending", label: "Pendente" },
  { value: "approved", label: "Aprovado" },
  { value: "printing", label: "Imprimindo" },
  { value: "paused", label: "Pausado" },
  { value: "completed", label: "Concluído" },
  { value: "delivered", label: "Entregue" },
  { value: "cancelled", label: "Cancelado" },
];

type OrderFormItem = {
  key: string;
  productId: string;
  printerId: string;
  filamentId: string;
  quantity: string;
  totalMinutes: string;
  filamentGrams: string;
  price: string;
};

function newItem(): OrderFormItem {
  return {
    key: `${Date.now()}-${Math.random()}`,
    productId: "",
    printerId: "",
    filamentId: "",
    quantity: "1",
    totalMinutes: "",
    filamentGrams: "",
    price: "",
  };
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<
    string,
    { variant: "default" | "warning" | "info" | "success" | "danger"; label: string }
  > = {
    draft: { variant: "default", label: "Rascunho" },
    pending: { variant: "warning", label: "Pendente" },
    approved: { variant: "info", label: "Aprovado" },
    printing: { variant: "info", label: "Imprimindo" },
    paused: { variant: "warning", label: "Pausado" },
    completed: { variant: "success", label: "Concluído" },
    delivered: { variant: "success", label: "Entregue" },
    cancelled: { variant: "danger", label: "Cancelado" },
  };

  const current = config[status] ?? {
    variant: "default" as const,
    label: status,
  };

  return <Badge variant={current.variant}>{current.label}</Badge>;
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof ShoppingCart;
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <Card className="overflow-hidden border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/30 backdrop-blur-2xl">
      <CardContent className="relative p-5">
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[rgba(var(--accent-rgb),0.06)]" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/35">
              {label}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
              {value}
            </p>
            <p className="mt-1 text-xs text-white/35">{description}</p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[rgba(var(--accent-rgb),0.9)]">
            <Icon className="h-4.5 w-4.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getOrderItems(order: OrderWithItems): OrderItem[] {
  return order.items ?? [];
}

function getUsage(items: OrderItem[], cancelled: boolean) {
  const usage = new Map<string, number>();

  if (cancelled) return usage;

  for (const item of items) {
    if (!item.filamentId) continue;

    const grams = Math.max(0, Number(item.filamentGrams) || 0);
    const quantity = Math.max(0, Number(item.quantity) || 0);

    usage.set(
      item.filamentId,
      (usage.get(item.filamentId) ?? 0) + grams * quantity,
    );
  }

  return usage;
}

export default function OrdersPage() {
  const { orders, loading: ordersLoading, create, update, remove } = useOrders();
  const { clients } = useClients();
  const { products } = useProducts();
  const { printers } = usePrinters();
  const { filaments, adjustStock } = useFilaments();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderWithItems | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    clientId: "",
    status: "pending" as Order["status"],
    notes: "",
    deadline: "",
  });

  const [items, setItems] = useState<OrderFormItem[]>([newItem()]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();

    return orders.filter((order) => {
      const productNames = getOrderItems(order)
        .map((item) => item.productName)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !term ||
        order.clientName.toLowerCase().includes(term) ||
        productNames.includes(term) ||
        String(order.orderNumber ?? "").includes(term);

      return (
        matchesSearch &&
        (statusFilter === "all" || order.status === statusFilter)
      );
    });
  }, [orders, search, statusFilter]);

  const totalRevenue = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + (Number(order.price) || 0), 0);

  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  const inProgressOrders = orders.filter(
    (o) => o.status === "approved" || o.status === "printing",
  ).length;

  const completedOrders = orders.filter(
    (o) => o.status === "completed" || o.status === "delivered",
  ).length;

  const itemTotals = items.reduce(
    (totals, item) => {
      const quantity = Math.max(0, Number(item.quantity) || 0);
      const minutes = Math.max(0, Number(item.totalMinutes) || 0);
      const grams = Math.max(0, Number(item.filamentGrams) || 0);
      const price = Math.max(0, Number(item.price) || 0);

      return {
        quantity: totals.quantity + quantity,
        minutes: totals.minutes + minutes * quantity,
        grams: totals.grams + grams * quantity,
        price: totals.price + price * quantity,
      };
    },
    { quantity: 0, minutes: 0, grams: 0, price: 0 },
  );

  function updateItem(key: string, changes: Partial<OrderFormItem>) {
    setItems((previous) =>
      previous.map((item) =>
        item.key === key ? { ...item, ...changes } : item,
      ),
    );
  }

  function selectProduct(key: string, productId: string) {
    const product = products.find((p) => p.id === productId);

    updateItem(key, {
      productId,
      totalMinutes: product ? String(product.printTimeMinutes) : "",
      filamentGrams: product ? String(product.filamentGrams) : "",
      price: product ? String(product.price) : "",
    });
  }

  function openCreate() {
    setEditingOrder(null);
    setError("");
    setForm({
      clientId: "",
      status: "pending",
      notes: "",
      deadline: "",
    });
    setItems([newItem()]);
    setModalOpen(true);
  }

  function openEdit(order: OrderWithItems) {
    setEditingOrder(order);
    setError("");

    setForm({
      clientId: order.clientId,
      status: order.status,
      notes: order.notes || "",
      deadline: order.deadline || "",
    });

    const orderItems = getOrderItems(order);

    setItems(
      orderItems.length
        ? orderItems.map((item) => ({
            key: item.id || `${Date.now()}-${Math.random()}`,
            productId: item.productId || "",
            printerId: item.printerId || "",
            filamentId: item.filamentId || "",
            quantity: String(item.quantity || 1),
            totalMinutes: String((Number(item.totalHours) || 0) * 60),
            filamentGrams: String(item.filamentGrams ?? 0),
            price: String(item.price ?? 0),
          }))
        : [newItem()],
    );

    setModalOpen(true);
  }

  async function reconcileStock(
    previousItems: OrderItem[],
    previousCancelled: boolean,
    nextItems: OrderItem[],
    nextCancelled: boolean,
  ) {
    const before = getUsage(previousItems, previousCancelled);
    const after = getUsage(nextItems, nextCancelled);
const filamentIds = new Set(
  Array.from(before.keys()).concat(Array.from(after.keys()))
);


    filamentIds.forEach((filamentId) => {
      // adjustStock positivo repõe estoque; negativo consome estoque.
      const delta = (before.get(filamentId) ?? 0) - (after.get(filamentId) ?? 0);

      if (delta !== 0) {
        adjustStock(filamentId, delta);
      }
    });
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setError("");

    if (!form.clientId) {
      setError("Selecione um cliente para o pedido.");
      return;
    }

    if (items.length === 0) {
      setError("Adicione pelo menos um produto.");
      return;
    }

    const selectedClient = clients.find((c) => c.id === form.clientId);

    if (!selectedClient) {
      setError("O cliente selecionado não foi encontrado.");
      return;
    }

    const resolvedItems: OrderItem[] = [];

    items.forEach((item, index) => {
      if (!item.productId || !item.printerId || !item.filamentId) {
        setError(`Complete produto, impressora e filamento do item ${index + 1}.`);
        return;
      }

      const quantity = Number(item.quantity);
      const minutes = Number(item.totalMinutes);
      const grams = Number(item.filamentGrams);
      const price = Number(item.price);

      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        !Number.isFinite(minutes) ||
        minutes < 0 ||
        !Number.isFinite(grams) ||
        grams < 0 ||
        !Number.isFinite(price) ||
        price < 0
      ) {
        setError(`Confira quantidade, tempo, filamento e preço do item ${index + 1}.`);
        return;
      }

      const product = products.find((p) => p.id === item.productId);
      const printer = printers.find((p) => p.id === item.printerId);
      const filament = filaments.find((f) => f.id === item.filamentId);

      if (!product || !printer || !filament) {
        setError(`Não foi possível encontrar todos os dados do item ${index + 1}.`);
        return;
      }

      const cost = (filament.costPerKg * grams) / 1000;

      resolvedItems.push({
        productId: product.id,
        productName: product.name,
        printerId: printer.id,
        printerName: printer.name,
        filamentId: filament.id,
        filamentName: filament.name,
        filamentColor: filament.colorHex || filament.color || "",
        quantity,
        // O formulário recebe minutos, mas o banco armazena horas.
        totalHours: minutes / 60,
        filamentGrams: grams,
        cost,
        price,
      });
    });

    const firstItem = resolvedItems[0];
    const totalQuantity = resolvedItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalHours = resolvedItems.reduce(
      (sum, item) => sum + item.totalHours * item.quantity,
      0,
    );
    const totalGrams = resolvedItems.reduce(
      (sum, item) => sum + item.filamentGrams * item.quantity,
      0,
    );
    const totalCost = resolvedItems.reduce(
      (sum, item) => sum + item.cost * item.quantity,
      0,
    );
    const totalPrice = resolvedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const data = {
      productId: firstItem.productId,
      productName:
        resolvedItems.length === 1
          ? firstItem.productName
          : `${firstItem.productName} + ${resolvedItems.length - 1} produto(s)`,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      printerId: firstItem.printerId || "",
      printerName: firstItem.printerName || "",
      filamentId: firstItem.filamentId || "",
      filamentName: firstItem.filamentName || "",
      filamentColor: firstItem.filamentColor || "",
      status: form.status,
      quantity: totalQuantity,
      totalHours,
      filamentGrams: totalGrams,
      cost: totalCost,
      price: totalPrice,
      notes: form.notes || undefined,
      deadline: form.deadline || undefined,
    };

    setSaving(true);

    try {
      const result = editingOrder
        ? await update(editingOrder.id, data, resolvedItems)
        : await create(data, resolvedItems);

      if (!result) {
        setError("Não foi possível salvar o pedido. Confira o console do navegador.");
        return;
      }

      const previousItems = editingOrder ? getOrderItems(editingOrder) : [];
      const previousCancelled = editingOrder?.status === "cancelled";
      const nextItems = getOrderItems(result);

      await reconcileStock(
        previousItems,
        previousCancelled,
        nextItems,
        result.status === "cancelled",
      );

      if (editingOrder) {
        if (result.status !== editingOrder.status) {
          await createNotification({
            type: "order",
            referenceId: result.id,
            title: "Status do pedido atualizado",
            description: `Pedido #${result.orderNumber ?? ""} agora está ${translateStatus(result.status)}.`,
          });
        }
      } else {
        await createNotification({
          type: "order",
          referenceId: result.id,
          title: "Novo pedido criado",
          description: `Pedido #${result.orderNumber ?? ""} de ${result.clientName} criado.`,
        });
      }

      setModalOpen(false);
    } catch (saveError) {
      console.error("Erro ao salvar pedido:", saveError);
      setError("Ocorreu um erro ao salvar o pedido.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(order: OrderWithItems) {
    if (!confirm("Tem certeza que deseja excluir este pedido?")) return;

    if (order.status !== "cancelled") {
      await reconcileStock(getOrderItems(order), false, [], true);
    }

    const deleted = await remove(order.id);

    if (!deleted) {
      setError("Não foi possível excluir o pedido.");
    }
  }

  function productSummary(order: OrderWithItems) {
    const orderItems = getOrderItems(order);

    if (orderItems.length === 0) return order.productName || "Sem produto";

    if (orderItems.length === 1) {
      return `${orderItems[0].productName} × ${orderItems[0].quantity}`;
    }

    return `${orderItems.length} produtos · ${orderItems
      .slice(0, 2)
      .map((item) => item.productName)
      .join(", ")}${orderItems.length > 2 ? "…" : ""}`;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050914]">
      <div className="pointer-events-none fixed -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-[rgba(var(--accent-rgb),0.06)] blur-[140px]" />
      <div className="pointer-events-none fixed -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#071124]/70 blur-[140px]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.045)_1px,transparent_0)] bg-[size:32px_32px]" />

      <div className="relative space-y-6 px-4 py-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[rgba(var(--accent-rgb),0.9)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(var(--accent-rgb),0.18)] bg-[rgba(var(--accent-rgb),0.07)]">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.16em]">Gestão</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Pedidos</h1>
            <p className="mt-1 max-w-2xl text-sm text-white/40">
              Acompanhe pedidos com vários produtos, produção, prazos e faturamento.
            </p>
          </div>

          <Button
            onClick={openCreate}
            className="h-11 w-full bg-gradient-to-r from-[#fd6401] to-[#e95400] text-white shadow-lg shadow-[rgba(var(--accent-rgb),0.16)] hover:brightness-110 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Novo Pedido
          </Button>
        </div>

        {ordersLoading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-sm text-white/40">
            Carregando pedidos...
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <SummaryCard icon={ShoppingCart} label="Total" value={orders.length} description="Pedidos cadastrados" />
              <SummaryCard icon={Clock3} label="Pendentes" value={pendingOrders} description="Aguardando produção" />
              <SummaryCard icon={Printer} label="Em produção" value={inProgressOrders} description="Aprovados ou imprimindo" />
              <SummaryCard icon={CheckCircle2} label="Concluídos" value={completedOrders} description="Finalizados ou entregues" />
              <SummaryCard icon={CircleDollarSign} label="Faturamento" value={formatCurrency(totalRevenue)} description="Pedidos não cancelados" />
            </div>

            <Card className="overflow-hidden border border-white/10 bg-white/[0.025] shadow-2xl shadow-black/40 backdrop-blur-2xl">
              <CardHeader className="border-b border-white/5 px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Lista de pedidos</h2>
                    <p className="mt-1 text-xs text-white/35">
                      {filtered.length} {filtered.length === 1 ? "pedido encontrado" : "pedidos encontrados"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative w-full sm:w-72">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                      <input
                        type="text"
                        placeholder="Buscar pedido, cliente ou produto..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[rgba(var(--accent-rgb),0.45)]"
                      />
                    </div>
                    <Select
                      options={[
                        { value: "all", label: "Todos os status" },
                        ...orderStatuses,
                      ]}
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="h-10 w-full border-white/10 bg-white/[0.04] text-white sm:w-44"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="hidden md:block">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeadCell>Pedido</TableHeadCell>
                        <TableHeadCell>Produtos</TableHeadCell>
                        <TableHeadCell>Cliente</TableHeadCell>
                        <TableHeadCell>Produção</TableHeadCell>
                        <TableHeadCell>Qtd.</TableHeadCell>
                        <TableHeadCell>Valor</TableHeadCell>
                        <TableHeadCell>Status</TableHeadCell>
                        <TableHeadCell>Criação</TableHeadCell>
                        <TableHeadCell className="text-right">Ações</TableHeadCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filtered.map((order) => (
                        <TableRow key={order.id} className="transition-colors hover:bg-white/[0.025]">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[rgba(var(--accent-rgb),0.9)]">
                                <PackageCheck className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-mono text-xs font-semibold text-white">
                                  #{order.orderNumber ?? order.id.slice(0, 7)}
                                </p>
                                {order.deadline && (
                                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-white/30">
                                    <CalendarDays className="h-3 w-3" />
                                    {formatDate(order.deadline)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[210px]">
                              <p className="truncate text-xs font-medium text-white">{productSummary(order)}</p>
                              <p className="mt-0.5 text-[10px] text-white/30">
                                {(Number(order.filamentGrams) || 0).toFixed(1)}g · {(Number(order.totalHours) || 0).toFixed(2)}h
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/40">
                                <UserRound className="h-3.5 w-3.5" />
                              </div>
                              <span className="max-w-[140px] truncate text-xs text-white/70">{order.clientName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[150px]">
                              <div className="flex items-center gap-1.5">
                                <Printer className="h-3.5 w-3.5 text-white/30" />
                                <span className="truncate text-xs text-white/60">{order.printerName || "Várias / não definida"}</span>
                              </div>
                              <div className="mt-1 flex items-center gap-1.5">
                                <Box className="h-3.5 w-3.5 text-white/25" />
                                <span className="truncate text-[10px] text-white/30">{order.filamentName || "Vários filamentos"}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-medium text-white/70">{order.quantity}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-semibold text-white">{formatCurrency(order.price)}</span>
                          </TableCell>
                          <TableCell><StatusBadge status={order.status} /></TableCell>
                          <TableCell>
                            <span className="text-xs text-white/40">{formatDate(order.createdAt)}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(order)}
                                aria-label="Editar pedido"
                                className="h-9 w-9 rounded-lg border border-white/10 bg-white/[0.025] p-0 text-white/45 hover:border-[rgba(var(--accent-rgb),0.35)] hover:text-[rgba(var(--accent-rgb),0.95)]"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(order)}
                                aria-label="Excluir pedido"
                                className="h-9 w-9 rounded-lg border border-white/10 bg-white/[0.025] p-0 text-white/45 hover:border-red-500/30 hover:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9}>
                            <div className="flex flex-col items-center justify-center py-14">
                              <ShoppingCart className="h-6 w-6 text-white/25" />
                              <p className="mt-4 text-sm font-medium text-white/60">Nenhum pedido encontrado</p>
                              <p className="mt-1 text-xs text-white/30">Tente alterar os filtros ou crie um novo pedido.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-3 p-4 md:hidden">
                  {filtered.map((order) => (
                    <div key={order.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 shadow-lg shadow-black/20">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-semibold text-white">#{order.orderNumber ?? order.id.slice(0, 7)}</p>
                          <p className="mt-1 truncate text-xs text-white/40">{order.clientName}</p>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>

                      <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/25">Produtos</p>
                        <p className="mt-1 text-sm font-medium text-white">{productSummary(order)}</p>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-3 border-t border-white/5 pt-3">
                        <div>
                          <p className="text-[10px] uppercase text-white/25">Quantidade</p>
                          <p className="mt-1 text-xs text-white/70">{order.quantity}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-white/25">Tempo</p>
                          <p className="mt-1 text-xs text-white/70">{(Number(order.totalHours) || 0).toFixed(2)}h</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-white/25">Valor</p>
                          <p className="mt-1 text-xs font-semibold text-white">{formatCurrency(order.price)}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                        <div>
                          <p className="text-[10px] uppercase text-white/25">Criado em</p>
                          <p className="mt-1 text-xs text-white/40">{formatDate(order.createdAt)}</p>
                        </div>
                        {order.deadline && (
                          <div className="text-right">
                            <p className="text-[10px] uppercase text-white/25">Prazo</p>
                            <p className="mt-1 text-xs text-white/40">{formatDate(order.deadline)}</p>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex gap-2 border-t border-white/5 pt-3">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(order)} className="h-10 flex-1 rounded-xl border border-white/10 bg-white/[0.025] text-white/55">
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(order)} className="h-10 flex-1 rounded-xl border border-white/10 bg-white/[0.025] text-white/55">
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <div className="py-12 text-center text-sm text-white/40">Nenhum pedido encontrado.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editingOrder ? "Editar Pedido" : "Novo Pedido"}
        size="xl"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <section>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-[#fd6401]" />
              <h3 className="text-sm font-semibold text-white">Dados do pedido</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                id="client"
                label="Cliente"
                options={clients.map((client) => ({ value: client.id, label: client.name }))}
                value={form.clientId}
                onChange={(e) => setForm((prev) => ({ ...prev, clientId: e.target.value }))}
                required
                className="border-white/10 bg-white/[0.04] text-white"
              />
              <Select
                id="status"
                label="Status"
                options={orderStatuses}
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as Order["status"] }))}
                className="border-white/10 bg-white/[0.04] text-white"
              />
            </div>
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="h-5 w-1 rounded-full bg-[#fd6401]" />
                <h3 className="text-sm font-semibold text-white">Produtos do pedido</h3>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-white/50">{items.length}</span>
              </div>
              <Button
                type="button"
                onClick={() => setItems((previous) => [...previous, newItem()])}
                className="h-9 bg-[rgba(var(--accent-rgb),0.1)] text-[rgba(var(--accent-rgb),0.95)] ring-1 ring-[rgba(var(--accent-rgb),0.25)] hover:bg-[rgba(var(--accent-rgb),0.16)]"
              >
                <Plus className="h-4 w-4" /> Adicionar produto
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.key} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/55">Item {index + 1}</p>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setItems((previous) => previous.filter((entry) => entry.key !== item.key))}
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-white/10 px-2 text-xs text-white/45 transition hover:border-red-500/30 hover:text-red-400"
                      >
                        <X className="h-3.5 w-3.5" /> Remover
                      </button>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Select
                      id={`product-${item.key}`}
                      label="Produto"
                      options={products.map((product) => ({ value: product.id, label: product.name }))}
                      value={item.productId}
                      onChange={(e) => selectProduct(item.key, e.target.value)}
                      required
                      className="border-white/10 bg-white/[0.04] text-white"
                    />
                    <Select
                      id={`printer-${item.key}`}
                      label="Impressora"
                      options={printers.map((printer) => ({ value: printer.id, label: `${printer.name} (${printer.status})` }))}
                      value={item.printerId}
                      onChange={(e) => updateItem(item.key, { printerId: e.target.value })}
                      required
                      className="border-white/10 bg-white/[0.04] text-white"
                    />
                    <Select
                      id={`filament-${item.key}`}
                      label="Filamento"
                      options={filaments.map((filament) => ({ value: filament.id, label: `${filament.name} - ${filament.color}` }))}
                      value={item.filamentId}
                      onChange={(e) => updateItem(item.key, { filamentId: e.target.value })}
                      required
                      className="border-white/10 bg-white/[0.04] text-white"
                    />
                    <Input
                      id={`quantity-${item.key}`}
                      label="Quantidade"
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.key, { quantity: e.target.value })}
                      required
                      className="border-white/10 bg-white/[0.04] text-white"
                    />
                    <Input
                      id={`minutes-${item.key}`}
                      label="Tempo por unidade (min)"
                      type="number"
                      min="0"
                      step="any"
                      value={item.totalMinutes}
                      onChange={(e) => updateItem(item.key, { totalMinutes: e.target.value })}
                      required
                      className="border-white/10 bg-white/[0.04] text-white"
                    />
                    <Input
                      id={`grams-${item.key}`}
                      label="Filamento por unidade (g)"
                      type="number"
                      min="0"
                      step="any"
                      value={item.filamentGrams}
                      onChange={(e) => updateItem(item.key, { filamentGrams: e.target.value })}
                      required
                      className="border-white/10 bg-white/[0.04] text-white"
                    />
                    <Input
                      id={`price-${item.key}`}
                      label="Preço por unidade (R$)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateItem(item.key, { price: e.target.value })}
                      required
                      className="border-white/10 bg-white/[0.04] text-white"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-white/5 pt-3 text-xs">
                    <span className="text-white/40">
                      Subtotal: <strong className="text-white">{formatCurrency((Number(item.price) || 0) * (Number(item.quantity) || 0))}</strong>
                    </span>
                    <span className="text-white/40">
                      Consumo: <strong className="text-white">{((Number(item.filamentGrams) || 0) * (Number(item.quantity) || 0)).toFixed(1)} g</strong>
                    </span>
                    <span className="text-white/40">
                      Tempo: <strong className="text-white">{(((Number(item.totalMinutes) || 0) * (Number(item.quantity) || 0)) / 60).toFixed(2)} h</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Unidades", value: String(itemTotals.quantity) },
                { label: "Tempo total", value: `${(itemTotals.minutes / 60).toFixed(2)} h` },
                { label: "Filamento total", value: `${itemTotals.grams.toFixed(1)} g` },
                { label: "Total do pedido", value: formatCurrency(itemTotals.price) },
              ].map((summary) => (
                <div key={summary.label} className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-white/35">{summary.label}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{summary.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-[#fd6401]" />
              <h3 className="text-sm font-semibold text-white">Prazo e observações</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="deadline"
                label="Prazo de entrega"
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
                className="border-white/10 bg-white/[0.04] text-white"
              />
              <div>
                <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-white/65">Observações</label>
                <textarea
                  id="notes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observações sobre o pedido..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[rgba(var(--accent-rgb),0.45)]"
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-white/5 pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={() => setModalOpen(false)}
              className="bg-white/[0.04] text-white/60 ring-1 ring-white/10 hover:bg-white/[0.08] hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-[#fd6401] to-[#e95400] text-white shadow-lg shadow-[rgba(var(--accent-rgb),0.12)] ring-1 ring-white/10 hover:brightness-110"
            >
              {saving ? "Salvando..." : editingOrder ? "Salvar alterações" : "Criar Pedido"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
