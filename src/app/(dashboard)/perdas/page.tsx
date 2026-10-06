"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  Clock3,
  DollarSign,
  Filter,
  Package,
  Plus,
  Printer,
  Search,
  Trash2,
  TrendingDown,
  Weight,
  X,
} from "lucide-react";

import Button from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useFilaments } from "@/hooks/useFilaments";
import { useLosses } from "@/hooks/useLosses";
import { usePrinters } from "@/hooks/usePrinters";

const LOSS_REASONS = [
  "Falha de impressão",
  "Peça defeituosa",
  "Suporte descartado",
  "Brim / Raft",
  "Teste / calibração",
  "Filamento danificado",
  "Erro de configuração",
  "Outro",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: string) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

function formatTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;

  return `${hours}h ${mins}min`;
}

function getReasonIcon(reason: string) {
  if (reason === "Falha de impressão") return "FP";
  if (reason === "Peça defeituosa") return "PD";
  if (reason === "Suporte descartado") return "SD";
  if (reason === "Teste / calibração") return "TC";
  return "OU";
}

function getPeriodStart(period: string) {
  const now = new Date();

  switch (period) {
    case "7 dias": {
      const date = new Date(now);
      date.setDate(date.getDate() - 7);
      return date;
    }

    case "30 dias": {
      const date = new Date(now);
      date.setDate(date.getDate() - 30);
      return date;
    }

    case "90 dias": {
      const date = new Date(now);
      date.setDate(date.getDate() - 90);
      return date;
    }

    case "Este ano":
      return new Date(now.getFullYear(), 0, 1);

    default:
      return null;
  }
}

export default function PerdasPage() {
  const { filaments } = useFilaments();
  const { printers } = usePrinters();

  const {
    losses,
    loading,
    create: createLoss,
  } = useLosses();

  const [search, setSearch] = useState("");
  const [reasonFilter, setReasonFilter] = useState("Todos");
  const [period, setPeriod] = useState("30 dias");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    reason: "Falha de impressão",
    printerId: "",
    filamentId: "",
    grams: "",
    timeHours: "",
    timeMinutes: "",
    observation: "",
  });

  const lossesWithDetails = useMemo(() => {
    return losses.map((loss) => {
      const printer = printers.find(
        (item) => item.id === loss.printerId
      );

      const filament = filaments.find(
        (item) => item.id === loss.filamentId
      );

      return {
        ...loss,
        printerName: printer?.name || "Não informado",
        filamentName: filament?.name || "Não informado",
        materialType: filament?.type || "Outro",
      };
    });
  }, [losses, printers, filaments]);

  const filteredLosses = useMemo(() => {
    const term = search.toLowerCase().trim();
    const periodStart = getPeriodStart(period);

    return lossesWithDetails.filter((loss) => {
      const lossDate = new Date(loss.createdAt);

      const matchesPeriod =
        !periodStart || lossDate >= periodStart;

      const matchesSearch =
        !term ||
        loss.reason.toLowerCase().includes(term) ||
        loss.printerName.toLowerCase().includes(term) ||
        loss.filamentName.toLowerCase().includes(term) ||
        (loss.observation || "").toLowerCase().includes(term);

      const matchesReason =
        reasonFilter === "Todos" || loss.reason === reasonFilter;

      return matchesPeriod && matchesSearch && matchesReason;
    });
  }, [lossesWithDetails, search, reasonFilter, period]);

  const metrics = useMemo(() => {
    const material = filteredLosses.reduce(
      (total, loss) => total + Number(loss.grams || 0),
      0
    );

    const time = filteredLosses.reduce(
      (total, loss) => total + Number(loss.timeMinutes || 0),
      0
    );

    const materialCost = filteredLosses.reduce(
      (total, loss) => total + Number(loss.materialCost || 0),
      0
    );

    const machineCost = filteredLosses.reduce(
      (total, loss) => total + Number(loss.machineCost || 0),
      0
    );

    return {
      material,
      time,
      materialCost,
      machineCost,
      totalCost: materialCost + machineCost,
    };
  }, [filteredLosses]);

  const reasonStats = useMemo(() => {
    const total = filteredLosses.reduce(
      (sum, loss) =>
        sum +
        Number(loss.materialCost || 0) +
        Number(loss.machineCost || 0),
      0
    );

    return LOSS_REASONS.map((reason) => {
      const value = filteredLosses
        .filter((loss) => loss.reason === reason)
        .reduce(
          (sum, loss) =>
            sum +
            Number(loss.materialCost || 0) +
            Number(loss.machineCost || 0),
          0
        );

      return {
        reason,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
      };
    })
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredLosses]);

  const selectedFilament = filaments.find(
    (filament) => filament.id === form.filamentId
  );

  const selectedPrinter = printers.find(
    (printer) => printer.id === form.printerId
  );

  const previewMaterialCost = selectedFilament
    ? (Number(form.grams || 0) / 1000) *
      selectedFilament.costPerKg
    : 0;

  const previewMachineCost = selectedPrinter
    ? ((Number(form.timeHours || 0) * 60 +
        Number(form.timeMinutes || 0)) /
        60) *
      selectedPrinter.costPerHour
    : 0;

  const previewTotalCost =
    previewMaterialCost + previewMachineCost;

  function resetForm() {
    setForm({
      reason: "Falha de impressão",
      printerId: "",
      filamentId: "",
      grams: "",
      timeHours: "",
      timeMinutes: "",
      observation: "",
    });
  }

  async function handleAddLoss() {
    if (!form.grams || Number(form.grams) <= 0) {
      return;
    }

    if (saving) {
      return;
    }

    const grams = Number(form.grams);
    const hours = Number(form.timeHours || 0);
    const minutes = Number(form.timeMinutes || 0);

    const totalMinutes = hours * 60 + minutes;

    setSaving(true);

    try {
      const created = await createLoss({
        printerId: form.printerId || null,
        filamentId: form.filamentId || null,
        reason: form.reason,
        grams,
        timeMinutes: totalMinutes,
        materialCost: previewMaterialCost,
        machineCost: previewMachineCost,
        observation:
          form.observation.trim() || null,
      });

      if (!created) {
        return;
      }

      resetForm();
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-orange-500/[0.07] blur-[120px]" />

        <div className="absolute right-0 top-[20%] h-[360px] w-[360px] rounded-full bg-blue-500/[0.04] blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <span>Gestão</span>

              <ChevronDown className="h-3 w-3 rotate-[-90deg]" />

              <span className="text-slate-400">
                Perdas
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Perdas
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Controle o material e o tempo desperdiçados na produção.
            </p>
          </div>

          <Button
            onClick={() => setShowModal(true)}
            className="h-11 gap-2 rounded-xl bg-[#FD6401] px-5 font-medium text-white shadow-lg shadow-orange-500/10 hover:bg-[#e95800]"
          >
            <Plus className="h-4 w-4" />
            Registrar perda
          </Button>
        </div>

        {/* Metrics */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<DollarSign className="h-5 w-5" />}
            label="Custo total das perdas"
            value={formatCurrency(metrics.totalCost)}
            description="material + máquina"
          />

          <MetricCard
            icon={<Weight className="h-5 w-5" />}
            label="Material perdido"
            value={`${metrics.material.toFixed(1)} g`}
            description="filamento desperdiçado"
          />

          <MetricCard
            icon={<Clock3 className="h-5 w-5" />}
            label="Tempo perdido"
            value={formatTime(metrics.time)}
            description="tempo de máquina"
          />

          <MetricCard
            icon={<TrendingDown className="h-5 w-5" />}
            label="Registros"
            value={String(filteredLosses.length)}
            description="perdas registradas"
          />
        </div>

        {/* Main grid */}
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          {/* Table */}
          <Card className="overflow-hidden rounded-2xl border-white/[0.08] bg-[#080e1b]/80 shadow-2xl shadow-black/10 backdrop-blur-xl">
            <CardContent className="p-0">
              {/* Table header */}
              <div className="border-b border-white/[0.07] p-5 sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-white">
                      Histórico de perdas
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Acompanhe onde o material e o tempo estão sendo
                      desperdiçados.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                      <input
                        value={search}
                        onChange={(e) =>
                          setSearch(e.target.value)
                        }
                        placeholder="Buscar perda..."
                        className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.025] pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-orange-500/40 sm:w-[210px]"
                      />
                    </div>

                    <div className="relative">
                      <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />

                      <select
                        value={reasonFilter}
                        onChange={(e) =>
                          setReasonFilter(e.target.value)
                        }
                        className="h-10 appearance-none rounded-xl border border-white/[0.08] bg-white/[0.025] pl-9 pr-9 text-sm text-slate-300 outline-none focus:border-orange-500/40"
                      >
                        <option
                          value="Todos"
                          className="bg-[#0a1120]"
                        >
                          Todos os motivos
                        </option>

                        {LOSS_REASONS.map((reason) => (
                          <option
                            key={reason}
                            value={reason}
                            className="bg-[#0a1120]"
                          >
                            {reason}
                          </option>
                        ))}
                      </select>

                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Loading */}
              {loading && (
                <div className="flex min-h-[280px] items-center justify-center">
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-orange-500" />
                    Carregando perdas...
                  </div>
                </div>
              )}

              {/* Desktop table */}
              {!loading && (
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-left">
                        <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                          Data
                        </th>

                        <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                          Motivo
                        </th>

                        <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                          Produção
                        </th>

                        <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                          Material
                        </th>

                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                          Tempo
                        </th>

                        <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                          Custo
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredLosses.map((loss) => {
                        const total =
                          Number(loss.materialCost || 0) +
                          Number(loss.machineCost || 0);

                        return (
                          <tr
                            key={loss.id}
                            className="group border-b border-white/[0.045] transition hover:bg-white/[0.018]"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-sm text-slate-300">
                                <CalendarDays className="h-3.5 w-3.5 text-slate-600" />

                                {formatDate(loss.createdAt)}
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-orange-500/15 bg-orange-500/[0.07] text-[9px] font-bold text-orange-400">
                                  {getReasonIcon(loss.reason)}
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-slate-200">
                                    {loss.reason}
                                  </p>

                                  <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-slate-600">
                                    {loss.observation ||
                                      "Sem observação."}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Printer className="h-3.5 w-3.5 text-slate-600" />

                                <span className="text-xs text-slate-400">
                                  {loss.printerName}
                                </span>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div>
                                <p className="text-xs font-medium text-slate-300">
                                  {loss.filamentName}
                                </p>

                                <p className="mt-0.5 text-[11px] text-slate-600">
                                  {Number(loss.grams).toFixed(1)} g
                                </p>
                              </div>
                            </td>

                            <td className="px-4 py-4 text-right">
                              <span className="text-xs text-slate-400">
                                {formatTime(
                                  Number(loss.timeMinutes || 0)
                                )}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-right">
                              <p className="text-sm font-semibold text-white">
                                {formatCurrency(total)}
                              </p>

                              <p className="mt-0.5 text-[10px] text-slate-600">
                                mat.{" "}
                                {formatCurrency(
                                  Number(loss.materialCost || 0)
                                )}
                              </p>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Mobile */}
              {!loading && (
                <div className="divide-y divide-white/[0.05] md:hidden">
                  {filteredLosses.map((loss) => {
                    const total =
                      Number(loss.materialCost || 0) +
                      Number(loss.machineCost || 0);

                    return (
                      <div
                        key={loss.id}
                        className="p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-500/15 bg-orange-500/[0.07] text-[9px] font-bold text-orange-400">
                              {getReasonIcon(loss.reason)}
                            </div>

                            <div>
                              <p className="text-sm font-medium text-slate-200">
                                {loss.reason}
                              </p>

                              <p className="text-[11px] text-slate-600">
                                {formatDate(loss.createdAt)}
                              </p>
                            </div>
                          </div>

                          <p className="text-sm font-semibold text-white">
                            {formatCurrency(total)}
                          </p>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-600">
                              Material
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {loss.filamentName} ·{" "}
                              {Number(loss.grams).toFixed(1)} g
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-600">
                              Tempo
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {formatTime(
                                Number(loss.timeMinutes || 0)
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!loading && filteredLosses.length === 0 && (
                <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.025]">
                    <Search className="h-5 w-5 text-slate-600" />
                  </div>

                  <p className="text-sm font-medium text-slate-300">
                    {losses.length === 0
                      ? "Nenhuma perda registrada"
                      : "Nenhuma perda encontrada"}
                  </p>

                  <p className="mt-1 max-w-xs text-xs text-slate-600">
                    {losses.length === 0
                      ? "Quando uma perda for registrada, ela aparecerá aqui."
                      : "Tente alterar os filtros ou registre uma nova perda."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right column */}
          <div className="space-y-6">
            {/* Period */}
            <Card className="rounded-2xl border-white/[0.08] bg-[#080e1b]/80 shadow-xl shadow-black/10 backdrop-blur-xl">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Visão geral
                    </h3>

                    <p className="mt-1 text-[11px] text-slate-600">
                      Desempenho das perdas
                    </p>
                  </div>

                  <div className="relative">
                    <select
                      value={period}
                      onChange={(e) =>
                        setPeriod(e.target.value)
                      }
                      className="appearance-none rounded-lg border border-white/[0.07] bg-white/[0.025] py-1.5 pl-3 pr-7 text-[11px] text-slate-400 outline-none"
                    >
                      <option className="bg-[#0a1120]">
                        7 dias
                      </option>

                      <option className="bg-[#0a1120]">
                        30 dias
                      </option>

                      <option className="bg-[#0a1120]">
                        90 dias
                      </option>

                      <option className="bg-[#0a1120]">
                        Este ano
                      </option>
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-600" />
                  </div>
                </div>

                <div className="rounded-xl border border-orange-500/10 bg-orange-500/[0.035] p-4">
                  <div className="flex items-center gap-2 text-orange-400">
                    <AlertTriangle className="h-4 w-4" />

                    <span className="text-xs font-medium">
                      Custo das perdas
                    </span>
                  </div>

                  <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                    {formatCurrency(metrics.totalCost)}
                  </p>

                  <p className="mt-1 text-[11px] text-slate-600">
                    nos últimos {period.toLowerCase()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Reasons */}
            <Card className="rounded-2xl border-white/[0.08] bg-[#080e1b]/80 shadow-xl shadow-black/10 backdrop-blur-xl">
              <CardContent className="p-5">
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-white">
                    Perdas por motivo
                  </h3>

                  <p className="mt-1 text-[11px] text-slate-600">
                    Distribuição do custo das perdas
                  </p>
                </div>

                <div className="space-y-4">
                  {reasonStats.map((item) => (
                    <div key={item.reason}>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <span className="truncate text-xs text-slate-400">
                          {item.reason}
                        </span>

                        <span className="shrink-0 text-[11px] font-medium text-slate-500">
                          {item.percentage.toFixed(0)}%
                        </span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                        <div
                          className="h-full rounded-full bg-[#FD6401] transition-all"
                          style={{
                            width: `${Math.max(
                              item.percentage,
                              3
                            )}%`,
                          }}
                        />
                      </div>

                      <p className="mt-1 text-[10px] text-slate-700">
                        {formatCurrency(item.value)}
                      </p>
                    </div>
                  ))}

                  {reasonStats.length === 0 && (
                    <p className="text-xs text-slate-600">
                      Ainda não existem perdas registradas.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Breakdown */}
            <Card className="rounded-2xl border-white/[0.08] bg-[#080e1b]/80 shadow-xl shadow-black/10 backdrop-blur-xl">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-white">
                  Composição do custo
                </h3>

                <div className="mt-4 space-y-3">
                  <CostRow
                    icon={<Package className="h-3.5 w-3.5" />}
                    label="Material"
                    value={metrics.materialCost}
                  />

                  <CostRow
                    icon={<Printer className="h-3.5 w-3.5" />}
                    label="Máquina"
                    value={metrics.machineCost}
                  />

                  <div className="my-2 border-t border-white/[0.06]" />

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">
                      Total
                    </span>

                    <span className="text-sm font-semibold text-white">
                      {formatCurrency(metrics.totalCost)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => {
              if (!saving) {
                setShowModal(false);
              }
            }}
          />

          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#080e1b] shadow-2xl shadow-black/50">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Registrar perda
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Registre o material e o tempo desperdiçados.
                </p>
              </div>

              <button
                onClick={() => {
                  if (!saving) {
                    setShowModal(false);
                  }
                }}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-slate-500 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-6 p-6">
              {/* Reason */}
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Motivo da perda
                </label>

                <select
                  value={form.reason}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      reason: e.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 text-sm text-slate-300 outline-none focus:border-orange-500/40"
                >
                  {LOSS_REASONS.map((reason) => (
                    <option
                      key={reason}
                      value={reason}
                      className="bg-[#0a1120]"
                    >
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              {/* Printer + filament */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormSelect
                  label="Impressora"
                  value={form.printerId}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      printerId: value,
                    }))
                  }
                  placeholder="Selecione a impressora"
                  options={printers.map((printer) => ({
                    value: printer.id,
                    label: printer.name,
                  }))}
                />

                <FormSelect
                  label="Filamento"
                  value={form.filamentId}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      filamentId: value,
                    }))
                  }
                  placeholder="Selecione o filamento"
                  options={filaments.map((filament) => ({
                    value: filament.id,
                    label: `${filament.name} · ${filament.type}`,
                  }))}
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Material desperdiçado
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.grams}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        grams: e.target.value,
                      }))
                    }
                    placeholder="0,00"
                    className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 pr-10 text-sm text-white outline-none placeholder:text-slate-700 focus:border-orange-500/40"
                  />

                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600">
                    g
                  </span>
                </div>
              </div>

              {/* Time */}
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Tempo de máquina perdido
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={form.timeHours}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          timeHours: e.target.value,
                        }))
                      }
                      placeholder="0"
                      className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 pr-12 text-sm text-white outline-none placeholder:text-slate-700 focus:border-orange-500/40"
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600">
                      horas
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={form.timeMinutes}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          timeMinutes: e.target.value,
                        }))
                      }
                      placeholder="0"
                      className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 pr-14 text-sm text-white outline-none placeholder:text-slate-700 focus:border-orange-500/40"
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600">
                      minutos
                    </span>
                  </div>
                </div>
              </div>

              {/* Observation */}
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Observação
                </label>

                <textarea
                  value={form.observation}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      observation: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Descreva o que aconteceu..."
                  className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-orange-500/40"
                />
              </div>

              {/* Preview */}
              {(form.grams ||
                form.timeHours ||
                form.timeMinutes) && (
                <div className="rounded-xl border border-orange-500/10 bg-orange-500/[0.035] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-orange-400" />

                    <span className="text-xs font-medium text-orange-300">
                      Estimativa da perda
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <PreviewValue
                      label="Material"
                      value={formatCurrency(
                        previewMaterialCost
                      )}
                    />

                    <PreviewValue
                      label="Máquina"
                      value={formatCurrency(
                        previewMachineCost
                      )}
                    />

                    <PreviewValue
                      label="Total"
                      value={formatCurrency(
                        previewTotalCost
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-white/[0.06] pt-5 sm:flex-row sm:justify-end">
                <button
                  onClick={() => {
                    if (saving) return;

                    resetForm();
                    setShowModal(false);
                  }}
                  disabled={saving}
                  className="h-11 rounded-xl border border-white/[0.08] bg-white/[0.025] px-5 text-sm font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Cancelar
                </button>

                <Button
                  onClick={handleAddLoss}
                  disabled={
                    saving ||
                    !form.grams ||
                    Number(form.grams) <= 0
                  }
                  className="h-11 rounded-xl bg-[#FD6401] px-6 text-sm font-medium text-white hover:bg-[#e95800] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Registrar perda
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <Card className="rounded-2xl border-white/[0.08] bg-[#080e1b]/80 shadow-xl shadow-black/10 backdrop-blur-xl">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-500/10 bg-orange-500/[0.06] text-orange-400">
            {icon}
          </div>

          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-700">
            Perdas
          </span>
        </div>

        <p className="text-xs text-slate-500">
          {label}
        </p>

        <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
          {value}
        </p>

        <p className="mt-1 text-[10px] text-slate-700">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function CostRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-slate-600">
          {icon}
        </span>

        <span className="text-xs text-slate-500">
          {label}
        </span>
      </div>

      <span className="text-xs font-medium text-slate-300">
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function PreviewValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-slate-400">
        {label}
      </label>

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full appearance-none rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 pr-9 text-sm text-slate-300 outline-none focus:border-orange-500/40"
        >
          <option
            value=""
            className="bg-[#0a1120]"
          >
            {placeholder}
          </option>

          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-[#0a1120]"
            >
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
      </div>
    </div>
  );
}