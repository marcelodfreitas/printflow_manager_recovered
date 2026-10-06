"use client";

import { useMemo, useState } from "react";
import {
  Circle,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  Weight,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/common";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "@/components/ui/Table";

import type { Filament } from "@/types";
import { useFilaments } from "@/hooks/useFilaments";
import { formatCurrency } from "@/lib/utils";

const filamentTypes = [
  { value: "PLA", label: "PLA" },
  { value: "ABS", label: "ABS" },
  { value: "PETG", label: "PETG" },
  { value: "TPU", label: "TPU" },
  { value: "Nylon", label: "Nylon" },
  { value: "Polycarbonate", label: "Policarbonato" },
  { value: "Outro", label: "Outro" },
];

const emptyForm = {
  name: "",
  type: "PLA" as Filament["type"],
  color: "",
  colorHex: "#000000",
  manufacturer: "",
  diameter: "1.75",
  weight: "1000",
  quantity: "1",
  costPerKg: "",
  purchaseDate: "",
  purchaseStore: "",
};

export default function FilamentsPage() {
  const {
    filaments,
    loading,
    create,
    update,
    remove,
  } = useFilaments();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFilament, setEditingFilament] =
    useState<Filament | null>(null);

  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return filaments;

    return filaments.filter(
      (filament) =>
        filament.name.toLowerCase().includes(term) ||
        filament.type.toLowerCase().includes(term) ||
        filament.manufacturer.toLowerCase().includes(term) ||
        filament.color.toLowerCase().includes(term) ||
        filament.purchaseStore?.toLowerCase().includes(term),
    );
  }, [filaments, search]);

  const stockOf = (filament: Filament) =>
    filament.remainingWeight ??
    filament.weight * filament.quantity;

  const totalStock = filaments.reduce(
    (acc, filament) => acc + stockOf(filament),
    0,
  );

  const totalUnits = filaments.reduce(
    (acc, filament) => acc + filament.quantity,
    0,
  );

  const totalValue = filaments.reduce(
    (acc, filament) =>
      acc + filament.costPerKg * (stockOf(filament) / 1000),
    0,
  );

  const lowStockCount = filaments.filter(
    (filament) =>
      stockOf(filament) <= filament.weight * 0.2,
  ).length;

  function openCreate() {
    setEditingFilament(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(filament: Filament) {
    setEditingFilament(filament);

    setForm({
      name: filament.name,
      type: filament.type,
      color: filament.color,
      colorHex: filament.colorHex,
      manufacturer: filament.manufacturer,
      diameter: String(filament.diameter),
      weight: String(filament.weight),
      quantity: String(filament.quantity),
      costPerKg: String(filament.costPerKg),
      purchaseDate: filament.purchaseDate ?? "",
      purchaseStore: filament.purchaseStore ?? "",
    });

    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    const data = {
      name: form.name.trim(),
      type: form.type,
      color: form.color.trim(),
      colorHex: form.colorHex,
      manufacturer: form.manufacturer.trim(),
      diameter: Number(form.diameter),
      weight: Number(form.weight),
      quantity: Number(form.quantity),
      costPerKg: Number(form.costPerKg),
      purchaseDate: form.purchaseDate || undefined,
      purchaseStore:
        form.purchaseStore.trim() || undefined,
    };

    if (editingFilament) {
      const weightChanged =
        data.weight !== editingFilament.weight;

      const quantityChanged =
        data.quantity !== editingFilament.quantity;

      const updateData: typeof data & {
        remainingWeight?: number;
      } = {
        ...data,
      };

      if (weightChanged || quantityChanged) {
        updateData.remainingWeight =
          data.weight * data.quantity;
      }

      await update(editingFilament.id, updateData);
    } else {
      await create(data);
    }

    setModalOpen(false);
  }

  function handleDelete(id: string) {
    if (
      confirm(
        "Tem certeza que deseja excluir este filamento?",
      )
    ) {
      remove(id);
    }
  }

  function getStockClass(filament: Filament) {
    const stock = stockOf(filament);
    const fullStock = filament.weight * filament.quantity;

    if (stock <= fullStock * 0.2) {
      return "text-red-400";
    }

    if (stock <= fullStock * 0.5) {
      return "text-amber-400";
    }

    return "text-white";
  }

  function getStockLabel(filament: Filament) {
    const stock = stockOf(filament);
    const fullStock = filament.weight * filament.quantity;

    if (stock <= fullStock * 0.2) {
      return "Estoque baixo";
    }

    if (stock <= fullStock * 0.5) {
      return "Estoque moderado";
    }

    return "Estoque normal";
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#050914]" />

      <div className="pointer-events-none fixed -right-40 -top-40 -z-10 h-[500px] w-[500px] rounded-full bg-[#071124]/70 blur-[130px]" />

      <div className="pointer-events-none fixed -bottom-40 -left-40 -z-10 h-[500px] w-[500px] rounded-full bg-[rgba(var(--accent-rgb),0.06)] blur-[130px]" />

      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.045)_1px,transparent_0)] bg-[size:32px_32px]" />

      <div className="space-y-6 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">

        {/* =====================================================
            HEADER
        ====================================================== */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_12px_rgba(var(--accent-rgb),0.8)]" />

              <span className="text-xs font-medium uppercase tracking-[0.18em] text-white/35">
                Materiais
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Filamentos
            </h1>

            <p className="mt-1.5 max-w-2xl text-sm text-white/45">
              Gerencie seus materiais, acompanhe o estoque
              e controle seus custos de produção.
            </p>
          </div>

          <Button
            onClick={openCreate}
            className="
              h-11
              w-full
              bg-gradient-to-r
              from-[#071124]
              to-[#0d1a35]
              text-white
              shadow-lg
              shadow-black/30
              ring-1
              ring-white/10
              transition-all
              duration-300
              hover:-translate-y-0.5
              hover:ring-[rgba(var(--accent-rgb),0.35)]
              hover:shadow-[0_10px_35px_rgba(var(--accent-rgb),0.15)]
              sm:w-auto
            "
          >
            <Plus className="h-4 w-4" />
            Novo Filamento
          </Button>
        </div>

        {/* =====================================================
            STATS
        ====================================================== */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

          <Card className="border border-white/10 bg-white/[0.025] shadow-xl shadow-black/20 backdrop-blur-2xl">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-white/35">
                    Filamentos
                  </p>

                  <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                    {filaments.length}
                  </p>

                  <p className="mt-1 text-xs text-white/35">
                    materiais cadastrados
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                  <Package className="h-4 w-4 text-[var(--accent)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-white/[0.025] shadow-xl shadow-black/20 backdrop-blur-2xl">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-white/35">
                    Estoque
                  </p>

                  <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                    {(totalStock / 1000).toFixed(1)}
                    <span className="ml-1 text-base font-medium text-white/40">
                      kg
                    </span>
                  </p>

                  <p className="mt-1 text-xs text-white/35">
                    peso disponível
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                  <Weight className="h-4 w-4 text-[var(--accent)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-white/[0.025] shadow-xl shadow-black/20 backdrop-blur-2xl">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-white/35">
                    Unidades
                  </p>

                  <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                    {totalUnits}
                  </p>

                  <p className="mt-1 text-xs text-white/35">
                    rolos em estoque
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                  <ShoppingBag className="h-4 w-4 text-[var(--accent)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`border bg-white/[0.025] shadow-xl shadow-black/20 backdrop-blur-2xl ${
              lowStockCount > 0
                ? "border-amber-400/20"
                : "border-white/10"
            }`}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-white/35">
                    Valor em estoque
                  </p>

                  <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                    {formatCurrency(totalValue)}
                  </p>

                  <p
                    className={`mt-1 text-xs ${
                      lowStockCount > 0
                        ? "text-amber-400/80"
                        : "text-white/35"
                    }`}
                  >
                    {lowStockCount > 0
                      ? `${lowStockCount} com estoque baixo`
                      : "estoque saudável"}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                  <span className="text-sm font-semibold text-[var(--accent)]">
                    R$
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* =====================================================
            TABLE / LIST
        ====================================================== */}
        <Card className="overflow-hidden border border-white/10 bg-white/[0.025] shadow-2xl shadow-black/30 backdrop-blur-2xl">

          <CardHeader className="border-b border-white/[0.06] bg-white/[0.01]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <h2 className="text-sm font-semibold text-white">
                  Seus filamentos
                </h2>

                <p className="mt-1 text-xs text-white/35">
                  {filtered.length}{" "}
                  {filtered.length === 1
                    ? "resultado"
                    : "resultados"}
                  {search && ` para "${search}"`}
                </p>
              </div>

              <div className="relative w-full lg:max-w-sm">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

                <input
                  type="text"
                  placeholder="Buscar filamento..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  className="
                    h-10
                    w-full
                    rounded-xl
                    border
                    border-white/10
                    bg-white/[0.035]
                    pl-10
                    pr-4
                    text-sm
                    text-white
                    outline-none
                    placeholder:text-white/25
                    transition
                    focus:border-[rgba(var(--accent-rgb),0.4)]
                    focus:bg-white/[0.05]
                    focus:ring-2
                    focus:ring-[rgba(var(--accent-rgb),0.08)]
                  "
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">

            {loading ? (
              <div className="flex min-h-[280px] items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-white/40">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-[var(--accent)]" />
                  Carregando filamentos...
                </div>
              </div>
            ) : (
              <>
                {/* =================================================
                    MOBILE
                ================================================== */}
                <div className="space-y-3 p-4 md:hidden">
                  {filtered.map((filament) => (
                    <div
                      key={filament.id}
                      className="
                        rounded-2xl
                        border
                        border-white/10
                        bg-white/[0.025]
                        p-4
                        transition
                        hover:border-white/[0.16]
                        hover:bg-white/[0.04]
                      "
                    >
                      <div className="flex items-start justify-between gap-3">

                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className="h-10 w-10 shrink-0 rounded-xl border border-white/10 shadow-inner"
                            style={{
                              backgroundColor:
                                filament.colorHex,
                            }}
                          />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {filament.name}
                            </p>

                            <p className="mt-0.5 text-xs text-white/35">
                              {filament.manufacturer}
                              {" · "}
                              {filament.type}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              openEdit(filament)
                            }
                            className="
                              h-9
                              w-9
                              rounded-lg
                              border
                              border-white/10
                              bg-white/[0.03]
                              p-0
                              text-white/50
                              hover:border-[rgba(var(--accent-rgb),0.35)]
                              hover:bg-[rgba(var(--accent-rgb),0.08)]
                              hover:text-[var(--accent)]
                            "
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDelete(filament.id)
                            }
                            className="
                              h-9
                              w-9
                              rounded-lg
                              border
                              border-white/10
                              bg-white/[0.03]
                              p-0
                              text-white/50
                              hover:border-red-500/30
                              hover:bg-red-500/10
                              hover:text-red-400
                            "
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-white/[0.06] bg-black/10 p-3">
                          <p className="text-[10px] uppercase tracking-wider text-white/25">
                            Estoque
                          </p>

                          <p
                            className={`mt-1 text-sm font-semibold ${getStockClass(
                              filament,
                            )}`}
                          >
                            {stockOf(filament)}g
                          </p>

                          <p className="mt-0.5 text-[10px] text-white/25">
                            {getStockLabel(filament)}
                          </p>
                        </div>

                        <div className="rounded-xl border border-white/[0.06] bg-black/10 p-3">
                          <p className="text-[10px] uppercase tracking-wider text-white/25">
                            Custo / Kg
                          </p>

                          <p className="mt-1 text-sm font-semibold text-white">
                            {formatCurrency(
                              filament.costPerKg,
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl border border-white/[0.06] bg-black/10 p-3">
                          <p className="text-[10px] uppercase tracking-wider text-white/25">
                            Diâmetro
                          </p>

                          <p className="mt-1 text-sm font-medium text-white/80">
                            {filament.diameter}mm
                          </p>
                        </div>

                        <div className="rounded-xl border border-white/[0.06] bg-black/10 p-3">
                          <p className="text-[10px] uppercase tracking-wider text-white/25">
                            Quantidade
                          </p>

                          <p className="mt-1 text-sm font-medium text-white/80">
                            {filament.quantity} un.
                          </p>
                        </div>
                      </div>

                      {(filament.purchaseDate ||
                        filament.purchaseStore) && (
                        <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.015] px-3 py-2.5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] uppercase tracking-wider text-white/25">
                                Última compra
                              </p>

                              <p className="mt-1 truncate text-xs text-white/60">
                                {filament.purchaseStore ||
                                  "Loja não informada"}
                              </p>
                            </div>

                            {filament.purchaseDate && (
                              <span className="shrink-0 text-[11px] text-white/30">
                                {new Date(
                                  `${filament.purchaseDate}T12:00:00`,
                                ).toLocaleDateString(
                                  "pt-BR",
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {filtered.length === 0 && (
                    <div className="py-16 text-center">
                      <Search className="mx-auto h-8 w-8 text-white/15" />

                      <p className="mt-3 text-sm text-white/40">
                        Nenhum filamento encontrado
                      </p>

                      {search && (
                        <button
                          type="button"
                          onClick={() => setSearch("")}
                          className="mt-2 text-xs text-[var(--accent)] hover:underline"
                        >
                          Limpar busca
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* =================================================
                    DESKTOP
                ================================================== */}
                <div className="hidden overflow-x-auto md:block">
                  <Table>
                    <TableHead className="border-b border-white/[0.06]">
                      <TableRow className="hover:bg-transparent">
                        <TableHeadCell className="px-5 text-left text-[10px] font-medium uppercase tracking-wider text-white/30">
                          Filamento
                        </TableHeadCell>

                        <TableHeadCell className="text-center text-[10px] font-medium uppercase tracking-wider text-white/30">
                          Cor
                        </TableHeadCell>

                        <TableHeadCell className="text-center text-[10px] font-medium uppercase tracking-wider text-white/30">
                          Tipo
                        </TableHeadCell>

                        <TableHeadCell className="text-center text-[10px] font-medium uppercase tracking-wider text-white/30">
                          Diâmetro
                        </TableHeadCell>

                        <TableHeadCell className="text-center text-[10px] font-medium uppercase tracking-wider text-white/30">
                          Estoque
                        </TableHeadCell>

                        <TableHeadCell className="text-center text-[10px] font-medium uppercase tracking-wider text-white/30">
                          Qtd.
                        </TableHeadCell>

                        <TableHeadCell className="text-center text-[10px] font-medium uppercase tracking-wider text-white/30">
                          Custo/Kg
                        </TableHeadCell>

                        <TableHeadCell className="text-center text-[10px] font-medium uppercase tracking-wider text-white/30">
                          Compra
                        </TableHeadCell>

                        <TableHeadCell className="px-5 text-right text-[10px] font-medium uppercase tracking-wider text-white/30">
                          Ações
                        </TableHeadCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {filtered.map((filament) => (
                        <TableRow
                          key={filament.id}
                          className="
                            border-b
                            border-white/[0.045]
                            transition-colors
                            hover:bg-white/[0.02]
                            last:border-0
                          "
                        >
                          <TableCell className="px-5">
                            <div className="flex items-center gap-3">
                              <div
                                className="h-9 w-9 shrink-0 rounded-lg border border-white/10"
                                style={{
                                  backgroundColor:
                                    filament.colorHex,
                                }}
                              />

                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-white">
                                  {filament.name}
                                </p>

                                <p className="mt-0.5 truncate text-[11px] text-white/30">
                                  {filament.manufacturer}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            <div className="inline-flex items-center gap-2">
                              <Circle
                                className="h-3.5 w-3.5"
                                fill={filament.colorHex}
                                stroke={filament.colorHex}
                              />

                              <span className="text-xs text-white/55">
                                {filament.color}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            <span className="rounded-md border border-white/[0.06] bg-white/[0.025] px-2 py-1 text-[11px] font-medium text-white/60">
                              {filament.type}
                            </span>
                          </TableCell>

                          <TableCell className="text-center text-xs text-white/55">
                            {filament.diameter}mm
                          </TableCell>

                          <TableCell className="text-center">
                            <div>
                              <p
                                className={`text-sm font-semibold ${getStockClass(
                                  filament,
                                )}`}
                              >
                                {stockOf(filament)}g
                              </p>

                              <p className="mt-0.5 text-[10px] text-white/25">
                                {getStockLabel(
                                  filament,
                                )}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell className="text-center text-sm text-white/60">
                            {filament.quantity}
                          </TableCell>

                          <TableCell className="text-center">
                            <span className="text-sm font-medium text-white/75">
                              {formatCurrency(
                                filament.costPerKg,
                              )}
                            </span>
                          </TableCell>

                          <TableCell className="text-center">
                            {filament.purchaseStore ||
                            filament.purchaseDate ? (
                              <div>
                                <p className="max-w-[120px] truncate text-xs text-white/60">
                                  {filament.purchaseStore ||
                                    "Loja não informada"}
                                </p>

                                {filament.purchaseDate && (
                                  <p className="mt-0.5 text-[10px] text-white/25">
                                    {new Date(
                                      `${filament.purchaseDate}T12:00:00`,
                                    ).toLocaleDateString(
                                      "pt-BR",
                                    )}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-white/20">
                                Não informado
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="px-5 text-right">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  openEdit(filament)
                                }
                                className="
                                  h-9
                                  w-9
                                  rounded-lg
                                  border
                                  border-white/10
                                  bg-white/[0.025]
                                  p-0
                                  text-white/45
                                  hover:border-[rgba(var(--accent-rgb),0.35)]
                                  hover:bg-[rgba(var(--accent-rgb),0.08)]
                                  hover:text-[var(--accent)]
                                "
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDelete(
                                    filament.id,
                                  )
                                }
                                className="
                                  h-9
                                  w-9
                                  rounded-lg
                                  border
                                  border-white/10
                                  bg-white/[0.025]
                                  p-0
                                  text-white/45
                                  hover:border-red-500/30
                                  hover:bg-red-500/10
                                  hover:text-red-400
                                "
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
                            <div className="py-20 text-center">
                              <Search className="mx-auto h-8 w-8 text-white/15" />

                              <p className="mt-3 text-sm text-white/40">
                                Nenhum filamento encontrado
                              </p>

                              {search && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSearch("")
                                  }
                                  className="mt-2 text-xs text-[var(--accent)] hover:underline"
                                >
                                  Limpar busca
                                </button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* =========================================================
          MODAL
      ========================================================== */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingFilament
            ? "Editar Filamento"
            : "Novo Filamento"
        }
        size="lg"
      >
        <form
          onSubmit={handleSave}
          className="space-y-6"
        >

          {/* Informações principais */}
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white">
                Informações do Filamento
              </h3>

              <p className="mt-1 text-xs text-white/35">
                Cadastre as características e o custo do
                material.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="name"
                label="Nome"
                placeholder="Ex.: Bambu PLA Basic"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                required
                className="
                  border-white/10
                  bg-white/[0.04]
                  text-white
                  placeholder:text-white/25
                  focus:border-[rgba(var(--accent-rgb),0.45)]
                  focus:ring-[rgba(var(--accent-rgb),0.15)]
                "
              />

              <Select
                id="type"
                label="Tipo"
                options={filamentTypes}
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value as Filament["type"],
                  })
                }
                className="
                  border-white/10
                  bg-white/[0.04]
                  text-white
                  focus:border-[rgba(var(--accent-rgb),0.45)]
                  focus:ring-[rgba(var(--accent-rgb),0.15)]
                "
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
  <div>
    <label
      htmlFor="color"
      className="mb-1.5 block text-sm font-medium text-white/65"
    >
      Cor
    </label>

    <div className="flex h-12 mt-1 items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-2.5 focus-within:border-[rgba(var(--accent-rgb),0.45)]">
      <input
        id="colorHex"
        type="color"
        value={form.colorHex}
        onChange={(e) =>
          setForm({
            ...form,
            colorHex: e.target.value,
          })
        }
        className="h-6 w-6 shrink-0 cursor-pointer rounded-md border border-white/10 bg-transparent p-0"
        title="Escolher cor"
      />

      <input
        id="color"
        type="text"
        value={form.color}
        onChange={(e) =>
          setForm({
            ...form,
            color: e.target.value,
          })
        }
        placeholder="Ex.: Preto"
        className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
        required
      />
    </div>
  </div>

  <Input
    id="manufacturer"
    label="Fabricante"
    placeholder="Ex.: 3D Prime"
    value={form.manufacturer}
    onChange={(e) =>
      setForm({
        ...form,
        manufacturer: e.target.value,
      })
    }
    required
    className="
      border-white/10
      bg-white/[0.04]
      text-white
      placeholder:text-white/25
      focus:border-[rgba(var(--accent-rgb),0.45)]
      focus:ring-[rgba(var(--accent-rgb),0.15)]
    "
  />
</div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Input
                id="diameter"
                label="Diâmetro (mm)"
                type="number"
                step="0.05"
                min="0"
                value={form.diameter}
                onChange={(e) =>
                  setForm({
                    ...form,
                    diameter: e.target.value,
                  })
                }
                required
                className="
                  border-white/10
                  bg-white/[0.04]
                  text-white
                  placeholder:text-white/25
                  focus:border-[rgba(var(--accent-rgb),0.45)]
                  focus:ring-[rgba(var(--accent-rgb),0.15)]
                "
              />

              <Input
                id="weight"
                label="Peso (g)"
                type="number"
                min="0"
                value={form.weight}
                onChange={(e) =>
                  setForm({
                    ...form,
                    weight: e.target.value,
                  })
                }
                required
                className="
                  border-white/10
                  bg-white/[0.04]
                  text-white
                  placeholder:text-white/25
                  focus:border-[rgba(var(--accent-rgb),0.45)]
                  focus:ring-[rgba(var(--accent-rgb),0.15)]
                "
              />

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
                className="
                  border-white/10
                  bg-white/[0.04]
                  text-white
                  placeholder:text-white/25
                  focus:border-[rgba(var(--accent-rgb),0.45)]
                  focus:ring-[rgba(var(--accent-rgb),0.15)]
                "
              />
            </div>

            <div className="mt-4">
              <Input
                id="costPerKg"
                label="Custo por Kg (R$)"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex.: 129,90"
                value={form.costPerKg}
                onChange={(e) =>
                  setForm({
                    ...form,
                    costPerKg: e.target.value,
                  })
                }
                required
                className="
                  border-white/10
                  bg-white/[0.04]
                  text-white
                  placeholder:text-white/25
                  focus:border-[rgba(var(--accent-rgb),0.45)]
                  focus:ring-[rgba(var(--accent-rgb),0.15)]
                "
              />
            </div>
          </div>

          {/* =====================================================
              INFORMAÇÕES DA COMPRA
          ====================================================== */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">

            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">
                    Informações da Compra
                  </h3>

                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-white/35">
                    Opcional
                  </span>
                </div>

                <p className="mt-1 text-xs leading-relaxed text-white/35">
                  Registre onde e quando comprou para
                  comparar preços na próxima reposição.
                </p>
              </div>

              <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] sm:flex">
                <ShoppingBag className="h-4 w-4 text-[var(--accent)]" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="purchaseDate"
                label="Data da Compra"
                type="date"
                value={form.purchaseDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    purchaseDate: e.target.value,
                  })
                }
                className="
                  border-white/10
                  bg-white/[0.04]
                  text-white
                  focus:border-[rgba(var(--accent-rgb),0.45)]
                  focus:ring-[rgba(var(--accent-rgb),0.15)]
                "
              />

              <Input
                id="purchaseStore"
                label="Loja"
                placeholder="Ex.: 3D Prime"
                value={form.purchaseStore}
                onChange={(e) =>
                  setForm({
                    ...form,
                    purchaseStore: e.target.value,
                  })
                }
                className="
                  border-white/10
                  bg-white/[0.04]
                  text-white
                  placeholder:text-white/25
                  focus:border-[rgba(var(--accent-rgb),0.45)]
                  focus:ring-[rgba(var(--accent-rgb),0.15)]
                "
              />
            </div>
          </div>

          {/* =====================================================
              ACTIONS
          ====================================================== */}
          <div className="flex flex-col-reverse gap-3 border-t border-white/[0.06] pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
              className="
                border
                border-white/10
                bg-white/[0.04]
                text-white/65
                ring-0
                hover:bg-white/[0.08]
                hover:text-white
              "
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              className="
                bg-gradient-to-r
                from-[#071124]
                to-[#0d1a35]
                text-white
                shadow-lg
                shadow-black/20
                ring-1
                ring-white/10
                hover:ring-[rgba(var(--accent-rgb),0.35)]
              "
            >
              {editingFilament
                ? "Salvar alterações"
                : "Criar Filamento"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}