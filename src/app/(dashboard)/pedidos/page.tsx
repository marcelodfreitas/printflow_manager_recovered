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

import type { Order } from "@/types";
import { useOrders } from "@/hooks/useOrders";
import { useClients } from "@/hooks/useClients";
import { useProducts } from "@/hooks/useProducts";
import { usePrinters } from "@/hooks/usePrinters";
import { useFilaments } from "@/hooks/useFilaments";
import {
  formatCurrency,
  formatDate,
  translateStatus,
} from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

const orderStatuses = [
  { value: "pending", label: "Pendente", dot: "bg-amber-400" },
  { value: "approved", label: "Aprovado", dot: "bg-emerald-400" },
  { value: "printing", label: "Imprimindo", dot: "bg-sky-400" },
  { value: "paused", label: "Pausado", dot: "bg-amber-400" },
  { value: "completed", label: "Concluído", dot: "bg-emerald-400" },
  { value: "delivered", label: "Entregue", dot: "bg-emerald-400" },
  { value: "cancelled", label: "Cancelado", dot: "bg-red-400" },
];

function StatusBadge({ status }: { status: string }) {
  const config = {
    draft: {
      variant: "default" as const,
      label: "Rascunho",
    },
    pending: {
      variant: "warning" as const,
      label: "Pendente",
    },
    approved: {
      variant: "info" as const,
      label: "Aprovado",
    },
    printing: {
      variant: "info" as const,
      label: "Imprimindo",
    },
    paused: {
      variant: "warning" as const,
      label: "Pausado",
    },
    completed: {
      variant: "success" as const,
      label: "Concluído",
    },
    delivered: {
      variant: "success" as const,
      label: "Entregue",
    },
    cancelled: {
      variant: "danger" as const,
      label: "Cancelado",
    },
  };

  const current = config[status as keyof typeof config] ?? {
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
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[rgba(var(--accent-rgb),0.06)] blur-2xl" />

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

export default function OrdersPage() {
  const {
    orders,
    loading: ordersLoading,
    create,
    update,
    remove,
  } = useOrders();

  const { clients } = useClients();
  const { products } = useProducts();
  const { printers: printerOptions } = usePrinters();
  const { filaments, adjustStock } = useFilaments();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    productId: "",
    clientId: "",
    printerId: "",
    filamentId: "",
    status: "pending" as Order["status"],
    quantity: "1",
    totalHours: "",
    filamentGrams: "",
    price: "",
    notes: "",
    deadline: "",
  });

  const filtered = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    return orders.filter((o) => {
      const matchesSearch =
        !normalizedSearch ||
        o.clientName.toLowerCase().includes(normalizedSearch) ||
        (o.productName ?? "").toLowerCase().includes(normalizedSearch) ||
        String(o.orderNumber ?? "").includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" || o.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((acc, o) => acc + o.price, 0);

  const pendingOrders = orders.filter(
    (o) => o.status === "pending",
  ).length;

  const inProgressOrders = orders.filter(
    (o) => o.status === "approved" || o.status === "printing",
  ).length;

  const completedOrders = orders.filter(
    (o) => o.status === "completed" || o.status === "delivered",
  ).length;

  function openCreate() {
    setEditingOrder(null);
    setError("");

    setForm({
      productId: "",
      clientId: "",
      printerId: "",
      filamentId: "",
      status: "pending",
      quantity: "1",
      totalHours: "",
      filamentGrams: "",
      price: "",
      notes: "",
      deadline: "",
    });

    setModalOpen(true);
  }

  function openEdit(order: Order) {
    setEditingOrder(order);
    setError("");

    setForm({
      productId: order.productId || "",
      clientId: order.clientId,
      printerId: order.printerId,
      filamentId: order.filamentId,
      status: order.status,
      quantity: String(order.quantity),
      totalHours: String(order.totalHours),
      filamentGrams: String(order.filamentGrams),
      price: String(order.price),
      notes: order.notes || "",
      deadline: order.deadline || "",
    });

    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (
      !form.productId ||
      !form.clientId ||
      !form.printerId ||
      !form.filamentId
    ) {
      setError(
        "Selecione produto, cliente, impressora e filamento.",
      );
      return;
    }

    const selectedProduct = products.find(
      (p) => p.id === form.productId,
    );

    const selectedClient = clients.find(
      (c) => c.id === form.clientId,
    );

    const selectedPrinter = printerOptions.find(
      (p) => p.id === form.printerId,
    );

    const selectedFilament = filaments.find(
      (f) => f.id === form.filamentId,
    );

    const filamentCost =
      (selectedFilament?.costPerKg || 0) *
      (Number(form.filamentGrams) / 1000);

    const cost = filamentCost;

    const data = {
      productId: form.productId || undefined,
      productName: selectedProduct?.name || "",
      clientId: form.clientId || undefined,
      clientName: selectedClient?.name || "",
      printerId: form.printerId || undefined,
      printerName: selectedPrinter?.name || "",
      filamentId: form.filamentId || undefined,
      filamentName: selectedFilament?.name || "",
      filamentColor: selectedFilament?.colorHex || "",
      status: form.status as Order["status"],
      quantity: Number(form.quantity),
      totalHours: Number(form.totalHours),
      filamentGrams: Number(form.filamentGrams),
      cost,
      price: Number(form.price),
      notes: form.notes || undefined,
      deadline: form.deadline || undefined,
    };

    const result = editingOrder
      ? await update(editingOrder.id, data)
      : await create(
          data as Omit<Order, "id" | "createdAt">,
        );

    if (!result) {
      setError(
        "Não foi possível salvar o pedido. Confira o console do navegador para mais detalhes.",
      );
      return;
    }

    const grams = Number(data.filamentGrams) || 0;
    const cancelled = result.status === "cancelled";
    const newConsumed = cancelled ? 0 : grams;

    if (editingOrder) {
      const oldCancelled =
        editingOrder.status === "cancelled";

      const oldConsumed = oldCancelled
        ? 0
        : editingOrder.filamentGrams;

      if (
        editingOrder.filamentId !== result.filamentId
      ) {
        if (oldConsumed > 0) {
          await adjustStock(
            editingOrder.filamentId,
            oldConsumed,
          );
        }

        if (newConsumed > 0) {
          await adjustStock(
            result.filamentId,
            -newConsumed,
          );
        }
      } else {
        const delta = newConsumed - oldConsumed;

        if (delta !== 0) {
          await adjustStock(
            result.filamentId,
            -delta,
          );
        }
      }
    } else if (newConsumed > 0) {
      await adjustStock(
        result.filamentId,
        -newConsumed,
      );
    }

    if (editingOrder) {
      if (result.status !== editingOrder.status) {
        await createNotification({
          type: "order",
          referenceId: result.id,
          title: "Status do pedido atualizado",
          description: `Pedido #${
            result.orderNumber ?? ""
          } agora está ${translateStatus(result.status)}.`,
        });
      }
    } else {
      await createNotification({
        type: "order",
        referenceId: result.id,
        title: "Novo pedido criado",
        description: `Pedido #${
          result.orderNumber ?? ""
        } de ${result.clientName} criado.`,
      });
    }

    setModalOpen(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este pedido?")) {
      return;
    }

    const order = orders.find((o) => o.id === id);

    if (
      order &&
      order.status !== "cancelled" &&
      order.filamentGrams > 0
    ) {
      await adjustStock(
        order.filamentId,
        order.filamentGrams,
      );
    }

    await remove(id);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050914]">
      {/* Atmosfera */}
      <div className="pointer-events-none fixed -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-[rgba(var(--accent-rgb),0.06)] blur-[140px]" />

      <div className="pointer-events-none fixed -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#071124]/70 blur-[140px]" />

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.045)_1px,transparent_0)] bg-[size:32px_32px]" />

      <div className="relative space-y-6 px-4 py-5 sm:p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[rgba(var(--accent-rgb),0.9)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(var(--accent-rgb),0.18)] bg-[rgba(var(--accent-rgb),0.07)]">
                <ShoppingCart className="h-4 w-4" />
              </div>

              <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                Gestão
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Pedidos
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-white/40">
              Acompanhe seus pedidos, produção, prazos e
              faturamento em um só lugar.
            </p>
          </div>

          <Button
            onClick={openCreate}
            className="h-11 w-full bg-gradient-to-r from-[#fd6401] to-[#e95400] text-white shadow-lg shadow-[rgba(var(--accent-rgb),0.16)] transition-all hover:brightness-110 sm:w-auto"
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
            {/* Resumo */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <SummaryCard
                icon={ShoppingCart}
                label="Total"
                value={orders.length}
                description="Pedidos cadastrados"
              />

              <SummaryCard
                icon={Clock3}
                label="Pendentes"
                value={pendingOrders}
                description="Aguardando produção"
              />

              <SummaryCard
                icon={Printer}
                label="Em produção"
                value={inProgressOrders}
                description="Aprovados ou imprimindo"
              />

              <SummaryCard
                icon={CheckCircle2}
                label="Concluídos"
                value={completedOrders}
                description="Finalizados ou entregues"
              />

              <SummaryCard
                icon={CircleDollarSign}
                label="Faturamento"
                value={formatCurrency(totalRevenue)}
                description="Pedidos não cancelados"
              />
            </div>

            {/* Conteúdo */}
            <Card className="overflow-hidden border border-white/10 bg-white/[0.025] shadow-2xl shadow-black/40 backdrop-blur-2xl">
              <CardHeader className="border-b border-white/5 px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Lista de pedidos
                    </h2>

                    <p className="mt-1 text-xs text-white/35">
                      {filtered.length}{" "}
                      {filtered.length === 1
                        ? "pedido encontrado"
                        : "pedidos encontrados"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative w-full sm:w-72">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />

                      <input
                        type="text"
                        placeholder="Buscar pedido, cliente ou produto..."
                        value={search}
                        onChange={(e) =>
                          setSearch(e.target.value)
                        }
                        className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[rgba(var(--accent-rgb),0.45)] focus:bg-white/[0.06] focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.12)]"
                      />
                    </div>

                    <Select
                      options={[
                        {
                          value: "all",
                          label: "Todos os status",
                        },
                        ...orderStatuses,
                      ]}
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(e.target.value)
                      }
                      className="h-10 w-full border-white/10 bg-white/[0.04] text-white sm:w-44"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {/* Desktop */}
                <div className="hidden md:block">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeadCell>
                          Pedido
                        </TableHeadCell>

                        <TableHeadCell>
                          Produto
                        </TableHeadCell>

                        <TableHeadCell>
                          Cliente
                        </TableHeadCell>

                        <TableHeadCell>
                          Produção
                        </TableHeadCell>

                        <TableHeadCell>
                          Qtd.
                        </TableHeadCell>

                        <TableHeadCell>
                          Valor
                        </TableHeadCell>

                        <TableHeadCell>
                          Status
                        </TableHeadCell>

                        <TableHeadCell>
                          Criação
                        </TableHeadCell>

                        <TableHeadCell className="text-right">
                          Ações
                        </TableHeadCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {filtered.map((order) => (
                        <TableRow
                          key={order.id}
                          className="transition-colors hover:bg-white/[0.025]"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[rgba(var(--accent-rgb),0.9)]">
                                <PackageCheck className="h-4 w-4" />
                              </div>

                              <div>
                                <p className="font-mono text-xs font-semibold text-white">
                                  #
                                  {order.orderNumber ??
                                    order.id.slice(
                                      0,
                                      7,
                                    )}
                                </p>

                                {order.deadline && (
                                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-white/30">
                                    <CalendarDays className="h-3 w-3" />
                                    {formatDate(
                                      order.deadline,
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="max-w-[180px]">
                              <p className="truncate text-xs font-medium text-white">
                                {order.productName ||
                                  "Sem produto"}
                              </p>

                              <p className="mt-0.5 text-[10px] text-white/30">
                                {order.filamentGrams}g
                                {" · "}
                                {order.totalHours}h
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/40">
                                <UserRound className="h-3.5 w-3.5" />
                              </div>

                              <span className="max-w-[140px] truncate text-xs text-white/70">
                                {order.clientName}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="max-w-[150px]">
                              <div className="flex items-center gap-1.5">
                                <Printer className="h-3.5 w-3.5 text-white/30" />

                                <span className="truncate text-xs text-white/60">
                                  {order.printerName ||
                                    "—"}
                                </span>
                              </div>

                              <div className="mt-1 flex items-center gap-1.5">
                                <Box className="h-3.5 w-3.5 text-white/25" />

                                <span className="truncate text-[10px] text-white/30">
                                  {order.filamentName ||
                                    "—"}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="text-xs font-medium text-white/70">
                              {order.quantity}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="text-xs font-semibold text-white">
                              {formatCurrency(
                                order.price,
                              )}
                            </span>
                          </TableCell>

                          <TableCell>
                            <StatusBadge
                              status={order.status}
                            />
                          </TableCell>

                          <TableCell>
                            <span className="text-xs text-white/40">
                              {formatDate(
                                order.createdAt,
                              )}
                            </span>
                          </TableCell>

                          <TableCell>
                            <div className="flex justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  openEdit(order)
                                }
                                aria-label="Editar pedido"
                                className="h-9 w-9 rounded-lg border border-white/10 bg-white/[0.025] p-0 text-white/45 transition-all hover:border-[rgba(var(--accent-rgb),0.35)] hover:bg-[rgba(var(--accent-rgb),0.08)] hover:text-[rgba(var(--accent-rgb),0.95)]"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDelete(
                                    order.id,
                                  )
                                }
                                aria-label="Excluir pedido"
                                className="h-9 w-9 rounded-lg border border-white/10 bg-white/[0.025] p-0 text-white/45 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
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
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/20">
                                <ShoppingCart className="h-5 w-5" />
                              </div>

                              <p className="mt-4 text-sm font-medium text-white/60">
                                Nenhum pedido encontrado
                              </p>

                              <p className="mt-1 text-xs text-white/30">
                                Tente alterar os filtros ou
                                crie um novo pedido.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile */}
                <div className="space-y-3 p-4 md:hidden">
                  {filtered.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 shadow-lg shadow-black/20"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[rgba(var(--accent-rgb),0.9)]">
                            <PackageCheck className="h-4 w-4" />
                          </div>

                          <div className="min-w-0">
                            <p className="font-mono text-xs font-semibold text-white">
                              #
                              {order.orderNumber ??
                                order.id.slice(
                                  0,
                                  7,
                                )}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-white/40">
                              {order.clientName}
                            </p>
                          </div>
                        </div>

                        <StatusBadge
                          status={order.status}
                        />
                      </div>

                      <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/25">
                          Produto
                        </p>

                        <p className="mt-1 text-sm font-medium text-white">
                          {order.productName ||
                            "Sem produto"}
                        </p>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                          <div className="flex items-center gap-1.5">
                            <Printer className="h-3.5 w-3.5 text-white/25" />

                            <span className="text-[10px] uppercase tracking-[0.1em] text-white/25">
                              Impressora
                            </span>
                          </div>

                          <p className="mt-1 truncate text-xs text-white/60">
                            {order.printerName ||
                              "—"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                          <div className="flex items-center gap-1.5">
                            <Box className="h-3.5 w-3.5 text-white/25" />

                            <span className="text-[10px] uppercase tracking-[0.1em] text-white/25">
                              Filamento
                            </span>
                          </div>

                          <p className="mt-1 truncate text-xs text-white/60">
                            {order.filamentName ||
                              "—"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-3 border-t border-white/5 pt-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.1em] text-white/25">
                            Quantidade
                          </p>

                          <p className="mt-1 text-xs font-medium text-white/70">
                            {order.quantity}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-[0.1em] text-white/25">
                            Horas
                          </p>

                          <p className="mt-1 text-xs font-medium text-white/70">
                            {order.totalHours}h
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-[0.1em] text-white/25">
                            Valor
                          </p>

                          <p className="mt-1 text-xs font-semibold text-white">
                            {formatCurrency(
                              order.price,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.1em] text-white/25">
                            Criado em
                          </p>

                          <p className="mt-1 text-xs text-white/40">
                            {formatDate(
                              order.createdAt,
                            )}
                          </p>
                        </div>

                        {order.deadline && (
                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-[0.1em] text-white/25">
                              Prazo
                            </p>

                            <p className="mt-1 text-xs text-white/40">
                              {formatDate(
                                order.deadline,
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex gap-2 border-t border-white/5 pt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            openEdit(order)
                          }
                          className="h-10 flex-1 rounded-xl border border-white/10 bg-white/[0.025] text-white/55 hover:border-[rgba(var(--accent-rgb),0.35)] hover:bg-[rgba(var(--accent-rgb),0.08)] hover:text-[rgba(var(--accent-rgb),0.95)]"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDelete(order.id)
                          }
                          className="h-10 flex-1 rounded-xl border border-white/10 bg-white/[0.025] text-white/55 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}

                  {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-14">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/20">
                        <ShoppingCart className="h-5 w-5" />
                      </div>

                      <p className="mt-4 text-sm font-medium text-white/60">
                        Nenhum pedido encontrado
                      </p>

                      <p className="mt-1 text-xs text-white/30">
                        Tente alterar os filtros ou crie
                        um novo pedido.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingOrder ? "Editar Pedido" : "Novo Pedido"
        }
        size="xl"
      >
        <form
          onSubmit={handleSave}
          className="space-y-6"
        >
          {/* Produto e cliente */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-[#fd6401]" />

              <h3 className="text-sm font-semibold text-white">
                Pedido
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                id="product"
                label="Produto"
                options={products.map((p) => ({
                  value: p.id,
                  label: p.name,
                }))}
                value={form.productId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    productId: e.target.value,
                  })
                }
                required
                className="border-white/10 bg-white/[0.04] text-white focus:border-[rgba(var(--accent-rgb),0.45)] focus:ring-[rgba(var(--accent-rgb),0.15)]"
              />

              <Select
                id="client"
                label="Cliente"
                options={clients.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
                value={form.clientId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    clientId: e.target.value,
                  })
                }
                required
                className="border-white/10 bg-white/[0.04] text-white focus:border-[rgba(var(--accent-rgb),0.45)] focus:ring-[rgba(var(--accent-rgb),0.15)]"
              />
            </div>
          </div>

          {/* Produção */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-[#fd6401]" />

              <h3 className="text-sm font-semibold text-white">
                Produção
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Select
                id="printer"
                label="Impressora"
                options={printerOptions.map((p) => ({
                  value: p.id,
                  label: `${p.name} (${p.status})`,
                }))}
                value={form.printerId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    printerId: e.target.value,
                  })
                }
                required
                className="border-white/10 bg-white/[0.04] text-white focus:border-[rgba(var(--accent-rgb),0.45)] focus:ring-[rgba(var(--accent-rgb),0.15)]"
              />

              <Select
                id="filament"
                label="Filamento"
                options={filaments.map((f) => ({
                  value: f.id,
                  label: `${f.name} - ${f.color}`,
                }))}
                value={form.filamentId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    filamentId: e.target.value,
                  })
                }
                required
                className="border-white/10 bg-white/[0.04] text-white focus:border-[rgba(var(--accent-rgb),0.45)] focus:ring-[rgba(var(--accent-rgb),0.15)]"
              />

              <Select
                id="status"
                label="Status"
                options={orderStatuses}
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status:
                      e.target.value as Order["status"],
                  })
                }
                className="border-white/10 bg-white/[0.04] text-white focus:border-[rgba(var(--accent-rgb),0.45)] focus:ring-[rgba(var(--accent-rgb),0.15)]"
              />
            </div>
          </div>

          {/* Dados da produção */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-[#fd6401]" />

              <h3 className="text-sm font-semibold text-white">
                Dados da produção
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                id="quantity"
                label="Quantidade"
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    quantity: e.target.value,
                  })
                }
                required
                className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25 focus:border-[rgba(var(--accent-rgb),0.45)] focus:ring-[rgba(var(--accent-rgb),0.15)]"
              />

              <Input
                id="hours"
                label="Horas estimadas"
                type="number"
                min="0"
                step="0.5"
                value={form.totalHours}
                onChange={(e) =>
                  setForm({
                    ...form,
                    totalHours: e.target.value,
                  })
                }
                required
                className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25 focus:border-[rgba(var(--accent-rgb),0.45)] focus:ring-[rgba(var(--accent-rgb),0.15)]"
              />

              <Input
                id="grams"
                label="Filamento (g)"
                type="number"
                min="0"
                step="0.1"
                value={form.filamentGrams}
                onChange={(e) =>
                  setForm({
                    ...form,
                    filamentGrams: e.target.value,
                  })
                }
                required
                className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25 focus:border-[rgba(var(--accent-rgb),0.45)] focus:ring-[rgba(var(--accent-rgb),0.15)]"
              />
            </div>
          </div>

          {/* Financeiro */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-[#fd6401]" />

              <h3 className="text-sm font-semibold text-white">
                Financeiro e prazo
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="price"
                label="Preço (R$)"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price: e.target.value,
                  })
                }
                required
                className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25 focus:border-[rgba(var(--accent-rgb),0.45)] focus:ring-[rgba(var(--accent-rgb),0.15)]"
              />

              <Input
                id="deadline"
                label="Prazo de entrega"
                type="date"
                value={form.deadline}
                onChange={(e) =>
                  setForm({
                    ...form,
                    deadline: e.target.value,
                  })
                }
                className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25 focus:border-[rgba(var(--accent-rgb),0.45)] focus:ring-[rgba(var(--accent-rgb),0.15)]"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label
              htmlFor="notes"
              className="mb-1.5 block text-sm font-medium text-white/65"
            >
              Observações
            </label>

            <textarea
              id="notes"
              rows={3}
              value={form.notes}
              onChange={(e) =>
                setForm({
                  ...form,
                  notes: e.target.value,
                })
              }
              placeholder="Adicione alguma observação sobre este pedido..."
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[rgba(var(--accent-rgb),0.45)] focus:ring-2 focus:ring-[rgba(var(--accent-rgb),0.12)]"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-white/5 pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
              className="bg-white/[0.04] text-white/60 ring-1 ring-white/10 hover:bg-white/[0.08] hover:text-white"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              className="bg-gradient-to-r from-[#fd6401] to-[#e95400] text-white shadow-lg shadow-[rgba(var(--accent-rgb),0.12)] ring-1 ring-white/10 transition hover:brightness-110"
            >
              {editingOrder
                ? "Salvar alterações"
                : "Criar Pedido"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}