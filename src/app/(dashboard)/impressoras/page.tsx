"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ImageOff,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Card, CardContent, CardHeader } from "@/components/common";
import Modal from "@/components/ui/Modal";
import { Badge as StatusBadge } from "@/components/ui/Badge";

import type { Printer } from "@/types";
import { formatDate } from "@/lib/utils";
import { usePrinters } from "@/hooks/usePrinters";
import {
  printerManufacturers,
  getPrinterModelsByManufacturer,
} from "@/data/printer-models";

const printerStatuses = [
  { value: "active", label: "Ativa" },
  { value: "idle", label: "Ociosa" },
  { value: "maintenance", label: "Manutenção" },
  { value: "offline", label: "Offline" },
];

const inputClassName = `
  bg-white/5
  border-white/10
  text-white
  placeholder:text-white/30
  focus:border-[var(--accent)]/50
  focus:ring-[var(--accent)]/20
`;

function getStatusVariant(status: Printer["status"]) {
  if (status === "active") return "success";
  if (status === "idle") return "warning";
  if (status === "maintenance") return "info";
  return "danger";
}

function getStatusLabel(status: Printer["status"]) {
  return (
    printerStatuses.find((item) => item.value === status)?.label ?? status
  );
}

function formatCurrency(value?: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value ?? 0);
}

type EnergyLookup = {
  status: "idle" | "loading" | "success" | "not-found" | "error";
  city?: string;
  state?: string;
  distributor?: string | null;
  energyRateSource?: "automatic" | "manual";
  source?: string;
  reference?: string;
  updatedAt?: string;
  validUntil?: string;
  includesTaxes?: boolean;
  message?: string;
  error?: string;
};


function parseNumericValue(value: string): number {
  const normalized = value.trim().replace(",", ".");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateCostPerHour({
  powerConsumption,
  energyRate,
  purchasePrice,
  usefulLifeHours,
  maintenanceCostPerHour,
}: {
  powerConsumption: number;
  energyRate: number;
  purchasePrice: number;
  usefulLifeHours: number;
  maintenanceCostPerHour: number;
}) {
  const energyCost = (powerConsumption / 1000) * energyRate;
  const depreciationCost =
    usefulLifeHours > 0 ? purchasePrice / usefulLifeHours : 0;

  return energyCost + depreciationCost + maintenanceCostPerHour;
}


export default function PrintersPage() {
  const { printers, loading, create, update, remove } = usePrinters();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);
  const [saving, setSaving] = useState(false);


  const [energyLookup, setEnergyLookup] = useState<EnergyLookup>({
  status: "idle",
});

const [energyRateSource, setEnergyRateSource] = useState<
  "" | "automatic" | "manual"
>("");

  const [form, setForm] = useState({
    name: "",
    manufacturer: "",
    model: "",
    type: "FDM" as Printer["type"],
    status: "idle" as Printer["status"],
    nozzleSize: "",
    buildVolume: "",
    powerConsumption: "",
    costPerHour: "",
    purchasePrice: "",
    imageUrl: "",
    isPrimary: false,
    cep: "",
    energyRate: "",
    usefulLifeHours: "8000",
maintenanceCostPerHour: "0.10",
    
  });

  const availableModels = useMemo(() => {
    if (!form.manufacturer) return [];

    return getPrinterModelsByManufacturer(form.manufacturer);
  }, [form.manufacturer]);

  const selectedModel = useMemo(() => {
    if (!form.manufacturer || !form.model) return undefined;

    return availableModels.find((item) => item.model === form.model);
  }, [availableModels, form.manufacturer, form.model]);

  
const calculatedCostPerHour = useMemo(() => {
  return calculateCostPerHour({
    powerConsumption: parseNumericValue(form.powerConsumption),
    energyRate: parseNumericValue(form.energyRate),
    purchasePrice: parseNumericValue(form.purchasePrice),
    usefulLifeHours: parseNumericValue(form.usefulLifeHours),
    maintenanceCostPerHour: parseNumericValue(
      form.maintenanceCostPerHour,
    ),
  });
}, [
  form.powerConsumption,
  form.energyRate,
  form.purchasePrice,
  form.usefulLifeHours,
  form.maintenanceCostPerHour,
]);


  const filtered = printers.filter((printer) => {
    const query = search.toLowerCase().trim();

    if (!query) return true;

    return (
      printer.name.toLowerCase().includes(query) ||
      printer.model.toLowerCase().includes(query) ||
      printer.manufacturer.toLowerCase().includes(query)
    );
  });

  function resetForm() {
    setForm({
      name: "",
      manufacturer: "",
      model: "",
      type: "FDM",
      status: "idle",
      nozzleSize: "",
      buildVolume: "",
      powerConsumption: "",
      costPerHour: "",
      purchasePrice: "",
      imageUrl: "",
      isPrimary: false,
      cep: "",
      energyRate: "",
      usefulLifeHours: "8000",
      maintenanceCostPerHour: "0.10",
    });

    setEnergyLookup({ status: "idle" });
    setEnergyRateSource("");
  }

  function openCreate() {
    setEditingPrinter(null);
    resetForm();
    setModalOpen(true);
    setEnergyLookup({ status: "idle" });
    setEnergyRateSource("");
  }

  function openEdit(printer: Printer) {
    setEditingPrinter(printer);

    setForm({
      name: printer.name,
      manufacturer: printer.manufacturer,
      model: printer.model,
      type: printer.type,
      status: printer.status,
      nozzleSize: printer.nozzleSize?.toString() || "",
      buildVolume: printer.buildVolume || "",
      powerConsumption: printer.powerConsumption?.toString() || "",
      costPerHour: printer.costPerHour?.toString() || "",
      purchasePrice: printer.purchasePrice?.toString() || "",
      imageUrl: printer.imageUrl || "",
      isPrimary: Boolean(printer.isPrimary),
      cep: printer.cep || "",
      energyRate: printer.energyRate?.toString() || "",
      usefulLifeHours:
      printer.usefulLifeHours?.toString() || "8000",
      maintenanceCostPerHour:
      printer.maintenanceCostPerHour?.toString() || "0.10",
    });

    setEnergyLookup({ status: "idle" });
    setEnergyRateSource(printer.energyRateSource || "");
    setModalOpen(true);
  }

  function handleManufacturerChange(manufacturer: string) {
    const models = getPrinterModelsByManufacturer(manufacturer);
    const firstModel = models[0];

    if (!firstModel) {
      setForm((current) => ({
        ...current,
        manufacturer,
        model: "",
        type: "FDM",
        nozzleSize: "",
        buildVolume: "",
        powerConsumption: "",
        imageUrl: "",
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      manufacturer,
      model: firstModel.model,
      type: firstModel.type,
      nozzleSize: firstModel.nozzleSize?.toString() || "",
      buildVolume: firstModel.buildVolume,
      powerConsumption: firstModel.powerConsumption?.toString() || "",
      imageUrl: firstModel.imageUrl,
    }));
  }

  function handleModelChange(modelName: string) {
    const model = availableModels.find(
      (item) => item.model === modelName,
    );

    if (!model) {
      setForm((current) => ({
        ...current,
        model: modelName,
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      model: model.model,
      type: model.type,
      nozzleSize: model.nozzleSize?.toString() || "",
      buildVolume: model.buildVolume,
      powerConsumption: model.powerConsumption?.toString() || "",
      imageUrl: model.imageUrl,
    }));
  }

  async function makePrimary(printerId: string) {
    const currentPrimary = printers.find((printer) => printer.isPrimary);

    if (currentPrimary?.id === printerId) {
      return;
    }

    try {
      setSaving(true);

      const otherPrinters = printers.filter(
        (printer) =>
          printer.id !== printerId && printer.isPrimary,
      );

      for (const printer of otherPrinters) {
        await update(printer.id, {
          isPrimary: false,
        });
      }

      await update(printerId, {
        isPrimary: true,
      });
    } finally {
      setSaving(false);
    }
  }


async function lookupEnergyRate(cepValue: string) {
  const digits = cepValue.replace(/\D/g, "");

  if (digits.length !== 8) return;

  setEnergyLookup({ status: "loading" });

  try {
    const response = await fetch(
      `/api/energy-tariff?cep=${digits}`,
      { cache: "no-store" },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error || "Não foi possível consultar o CEP.",
      );
    }

    setEnergyLookup({
      ...result,
      status: result.energyRate != null ? "success" : "not-found",
    });

    if (result.energyRate != null) {
      setForm((current) => ({
        ...current,
        cep: digits.replace(/^(\d{5})(\d{3})$/, "$1-$2"),
        energyRate: String(result.energyRate),
      }));

      setEnergyRateSource("automatic");
    } else {
      setEnergyRateSource((current) =>
        current === "automatic" ? "" : current,
      );
    }
  } catch (error) {
    setEnergyLookup({
      status: "error",
      error:
        error instanceof Error
          ? error.message
          : "Erro inesperado ao consultar a tarifa.",
    });
  }
}


  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) return;
    if (!form.manufacturer || !form.model) return;

    const normalizedEnergyRate = form.energyRate.trim().replace(",", ".");
    const energyRateValue =
      normalizedEnergyRate !== "" ? Number(normalizedEnergyRate) : undefined;

    if (
      energyRateValue !== undefined &&
      (!Number.isFinite(energyRateValue) || energyRateValue < 0)
    ) {
      return;
    }

    try {
      setSaving(true);

      if (form.isPrimary) {
        const otherPrinters = printers.filter(
          (printer) =>
            printer.id !== editingPrinter?.id && printer.isPrimary,
        );

        for (const printer of otherPrinters) {
          await update(printer.id, {
            isPrimary: false,
          });
        }
      }

      const data = {
        name: form.name.trim(),
        model: form.model,
        manufacturer: form.manufacturer,
        type: form.type,
        status: form.status,
        nozzleSize: form.nozzleSize
          ? Number(form.nozzleSize)
          : undefined,
        buildVolume: form.buildVolume,
        powerConsumption: form.powerConsumption
          ? Number(form.powerConsumption)
          : undefined,
        costPerHour: Number(calculatedCostPerHour.toFixed(5)),
        purchasePrice: parseNumericValue(form.purchasePrice),
        usefulLifeHours: parseNumericValue(form.usefulLifeHours),
        maintenanceCostPerHour: parseNumericValue(
        form.maintenanceCostPerHour,
),
        imageUrl: form.imageUrl || undefined,
        isPrimary: form.isPrimary,
        lastMaintenance:
          editingPrinter?.lastMaintenance ||
          new Date().toISOString().split("T")[0],
        cep: form.cep.replace(/\D/g, "") || undefined,
        energyRate: energyRateValue,
energyRateSource:
  energyRateValue !== undefined
    ? energyRateSource || "manual"
    : undefined,

energyDistributor: energyLookup.distributor || undefined,

energyRateUpdatedAt:
  energyRateSource === "automatic" && energyLookup.updatedAt
    ? new Date(energyLookup.updatedAt).toISOString()
    : undefined,

energyRateReference:
  energyRateSource === "automatic"
    ? energyLookup.reference || undefined
    : undefined,
      };

      if (editingPrinter) {
        await update(editingPrinter.id, data);
      } else {
        await create(data);
      }

      setModalOpen(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const printer = printers.find((item) => item.id === id);

    const message = printer?.isPrimary
      ? "Esta é a impressora principal do dashboard. Tem certeza que deseja excluí-la?"
      : "Tem certeza que deseja excluir esta impressora?";

    if (!confirm(message)) return;

    await remove(id);
  }

  return (
    <div className="relative min-h-screen bg-[#050914]">
      <div className="pointer-events-none fixed -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-[#071124]/60 blur-[120px]" />

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] bg-[size:32px_32px]" />

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center px-4 py-5 text-white/50 sm:p-6">
          Carregando impressoras...
        </div>
      ) : (
        <div className="relative space-y-5 px-4 py-5 sm:space-y-6 sm:p-6">
          <Card className="border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/40 backdrop-blur-2xl">
            <CardHeader className="border-b border-white/5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full flex-1 sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />

                  <input
                    type="text"
                    placeholder="Buscar impressoras..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-[var(--accent)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <Button
                  onClick={openCreate}
                  className="bg-gradient-to-r from-[#071124] to-[#0d1a35] text-white shadow-lg shadow-black/30 ring-1 ring-white/10 transition-all duration-300 hover:ring-[rgba(var(--accent-rgb),0.30)] hover:shadow-[0_8px_30px_rgba(var(--accent-rgb),0.20)]"
                >
                  <Plus className="h-4 w-4" />
                  Nova Impressora
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((printer) => (
                    <div
                      key={printer.id}
                      className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] shadow-xl shadow-black/20 backdrop-blur-2xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04] hover:shadow-2xl hover:shadow-black/30"
                    >
                      <div className="relative h-64 overflow-hidden border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent">
                        {printer.imageUrl ? (
                          <img
                            src={printer.imageUrl}
                            alt={printer.model}
                            className="h-full w-full object-contain p-8 transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ImageOff className="h-12 w-12 text-white/15" />
                          </div>
                        )}

                        {printer.isPrimary && (
                          <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-[var(--accent)]/30 bg-[rgba(var(--accent-rgb),0.12)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] backdrop-blur-md">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            Principal
                          </div>
                        )}

                        <div className="absolute right-4 top-4">
                          <StatusBadge variant={getStatusVariant(printer.status)}>
                            {getStatusLabel(printer.status)}
                          </StatusBadge>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="mb-5">
                          <p className="text-xs font-medium uppercase tracking-wider text-white/35">
                            {printer.manufacturer}
                          </p>
                          <h3 className="mt-1 text-xl font-semibold tracking-tight text-white">
                            {printer.name}
                          </h3>
                          <p className="mt-1 text-sm text-white/40">
                            {printer.model}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
                            <p className="text-[10px] uppercase tracking-wider text-white/30">
                              Tecnologia
                            </p>
                            <p className="mt-1.5 text-sm font-medium text-white/80">
                              {printer.type}
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
                            <p className="text-[10px] uppercase tracking-wider text-white/30">
                              Bico
                            </p>
                            <p className="mt-1.5 text-sm font-medium text-white/80">
                              {printer.nozzleSize
                                ? `${printer.nozzleSize} mm`
                                : "-"}
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
                            <p className="text-[10px] uppercase tracking-wider text-white/30">
                              Volume
                            </p>
                            <p className="mt-1.5 text-xs font-medium text-white/80">
                              {printer.buildVolume || "-"}
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
                            <p className="text-[10px] uppercase tracking-wider text-white/30">
                              Consumo
                            </p>
                            <p className="mt-1.5 text-sm font-medium text-white/80">
                              {printer.powerConsumption
                                ? `${printer.powerConsumption} W`
                                : "-"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-[var(--accent)]/10 bg-[rgba(var(--accent-rgb),0.04)] p-3">
                            <p className="text-[10px] uppercase tracking-wider text-white/30">
                              Investimento
                            </p>
                            <p className="mt-1 text-base font-semibold text-white">
                              {formatCurrency(printer.purchasePrice)}
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
                            <p className="text-[10px] uppercase tracking-wider text-white/30">
                              Custo / hora
                            </p>
                            <p className="mt-1 text-base font-semibold text-white">
                              {formatCurrency(printer.costPerHour)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
                            <p className="text-[10px] uppercase tracking-wider text-white/30">
                              Tarifa energia
                            </p>
                            <p className="mt-1 text-sm font-semibold text-white">
                              {printer.energyRate != null
                                ? `${formatCurrency(printer.energyRate)}/kWh`
                                : "Não informada"}
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
                            <p className="text-[10px] uppercase tracking-wider text-white/30">
                              CEP
                            </p>
                            <p className="mt-1 text-sm font-semibold text-white">
                              {printer.cep
                                ? printer.cep.replace(
                                    /^(\d{5})(\d{3})$/,
                                    "$1-$2",
                                  )
                                : "Não informado"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.025] px-4 py-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-white/30">
                              Última manutenção
                            </p>
                            <p className="mt-1 text-xs text-white/60">
                              {formatDate(printer.lastMaintenance)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2 border-t border-white/10 pt-4">
                          {!printer.isPrimary && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={saving}
                              onClick={() => makePrimary(printer.id)}
                              className="h-10 flex-1 rounded-lg border border-white/10 bg-white/[0.03] text-white/60 transition-all hover:border-[var(--accent)]/40 hover:bg-[rgba(var(--accent-rgb),0.08)] hover:text-[var(--accent)]"
                            >
                              <Star className="mr-2 h-4 w-4" />
                              Principal
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(printer)}
                            className="h-10 flex-1 rounded-lg border border-white/10 bg-white/[0.03] text-white/70 transition-all hover:border-[var(--accent)]/40 hover:bg-[rgba(var(--accent-rgb),0.08)] hover:text-[var(--accent)]"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(printer.id)}
                            className="h-10 flex-1 rounded-lg border border-white/10 bg-white/[0.03] text-white/70 transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filtered.length === 0 && (
                    <div className="col-span-full py-16 text-center text-sm text-white/40">
                      Nenhuma impressora encontrada
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editingPrinter ? "Editar Impressora" : "Nova Impressora"}
        className="border border-white/10 bg-[#0a1120]/95 text-white backdrop-blur-2xl"
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="manufacturer"
                  className="mb-1.5 block text-sm font-medium text-white/70"
                >
                  Fabricante
                </label>
                <Select
                  id="manufacturer"
                  label=""
                  options={printerManufacturers.map((manufacturer) => ({
                    value: manufacturer,
                    label: manufacturer,
                  }))}
                  value={form.manufacturer}
                  onChange={(e) => handleManufacturerChange(e.target.value)}
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="model"
                  className="mb-1.5 block text-sm font-medium text-white/70"
                >
                  Modelo
                </label>
                <Select
                  id="model"
                  label=""
                  options={availableModels.map((model) => ({
                    value: model.model,
                    label: model.model,
                  }))}
                  value={form.model}
                  onChange={(e) => handleModelChange(e.target.value)}
                  disabled={!form.manufacturer}
                  className={inputClassName}
                />
              </div>

              <Input
                id="name"
                label="Nome da impressora"
                placeholder="Ex.: Minha A1 Mini"
                value={form.name}
                className={inputClassName}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    name: e.target.value,
                  }))
                }
                required
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  id="status"
                  label="Status"
                  options={printerStatuses}
                  value={form.status}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      status: e.target.value as Printer["status"],
                    }))
                  }
                  className={inputClassName}
                />

                
<Input
  id="costPerHour"
  label="Custo calculado por hora (R$)"
  type="number"
  value={calculatedCostPerHour.toFixed(2)}
  disabled
  className={inputClassName}
/>

<p className="flex text-xs text-white/40">
   Depreciação, manutenção e energia.
</p>

              </div>

              <Input
                id="purchasePrice"
                label="Valor de aquisição (R$)"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex.: 2499,00"
                value={form.purchasePrice}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    purchasePrice: e.target.value,
                  }))
                }
                className={inputClassName}
              />

              <p className="-mt-2 text-xs text-white/30">
                Esse valor será usado para calcular a recuperação do
                investimento da impressora no Dashboard.
              </p>

              
<div className="grid gap-4 sm:grid-cols-2">
  <Input
    id="usefulLifeHours"
    label="Vida útil estimada (horas)"
    type="number"
    min="1"
    step="100"
    value={form.usefulLifeHours}
    onChange={(e) =>
      setForm((current) => ({
        ...current,
        usefulLifeHours: e.target.value,
      }))
    }
    className={inputClassName}
  />

  <Input
    id="maintenanceCostPerHour"
    label="Manutenção por hora (R$)"
    type="number"
    min="0"
    step="0.01"
    value={form.maintenanceCostPerHour}
    onChange={(e) =>
      setForm((current) => ({
        ...current,
        maintenanceCostPerHour: e.target.value,
      }))
    }
    className={inputClassName}
  />
</div>

<p className="text-xs text-white/35">
  Valores iniciais editáveis. Ajuste conforme a vida útil e a
  manutenção esperadas para sua impressora.
</p>

            </div>

            

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
              <div className="flex h-[220px] items-center justify-center p-5">
                {form.imageUrl ? (
                  <img
                    src={form.imageUrl}
                    alt={form.model || "Impressora"}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-white/20">
                    <ImageOff className="h-10 w-10" />
                    <span className="text-xs">
                      Selecione uma impressora
                    </span>
                  </div>
                )}
              </div>

              {selectedModel && (
                <div className="border-t border-white/10 px-4 py-3">
                  <p className="text-xs font-medium text-white/70">
                    {selectedModel.manufacturer}
                  </p>
                  <p className="text-sm text-white">
                    {selectedModel.model}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* LOCALIZAÇÃO E ENERGIA */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <div className="mb-4">
              <p className="text-sm font-medium text-white">
                Localização e energia
              </p>
              <p className="mt-1 text-xs text-white/35">
                Informe o CEP e a tarifa efetiva da sua conta de luz.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="cep"
                label="CEP da instalação"
                placeholder="Ex.: 92010-000"
                value={form.cep}
                maxLength={9}
                className={inputClassName}
                onChange={(e) => {
  const digits = e.target.value.replace(/\D/g, "").slice(0, 8);

  const cep = digits.replace(/^(\d{5})(\d)/, "$1-$2");

  setForm((current) => ({
    ...current,
    cep,
    ...(energyRateSource === "automatic" && digits.length !== 8
      ? { energyRate: "" }
      : {}),
  }));

  if (digits.length !== 8) {
    setEnergyLookup({ status: "idle" });

    if (energyRateSource === "automatic") {
      setEnergyRateSource("");
    }

    return;
  }

  void lookupEnergyRate(digits);
}}
              />

              <Input
                id="energyRate"
                label="Tarifa de energia (R$/kWh)"
                type="number"
                step="0.00001"
                min="0"
                placeholder="Ex.: 0.85"
                value={form.energyRate}
                className={inputClassName}
                onChange={(e) => {
  setForm((current) => ({
    ...current,
    energyRate: e.target.value,
  }));

  setEnergyRateSource(
    e.target.value.trim() ? "manual" : "",
  );
}}
              />
            </div>

            <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.025] p-3">
  <div className="flex items-center gap-2">
    <span
      className={`h-2 w-2 rounded-full ${
        energyLookup.status === "loading"
          ? "animate-pulse bg-blue-400"
          : energyLookup.status === "success"
            ? "bg-emerald-400"
            : energyLookup.status === "error"
              ? "bg-red-400"
              : "bg-white/30"
      }`}
    />

    <p className="text-xs font-medium text-white/80">
      {energyLookup.status === "loading"
        ? "Consultando CEP e tarifa..."
        : energyLookup.status === "success"
          ? `Tarifa localizada: ${energyLookup.distributor}`
          : energyRateSource === "manual"
            ? "Origem da tarifa: Manual"
            : "Aguardando consulta de tarifa"}
    </p>
  </div>

  {energyLookup.city && (
    <p className="mt-2 text-xs text-white/60">
      {energyLookup.city}, {energyLookup.state}
    </p>
  )}

  {energyLookup.status === "success" && (
    <>
      <p className="mt-2 text-xs text-emerald-300">
        Referência: {energyLookup.source}
      </p>

      {energyLookup.validUntil && (
        <p className="mt-1 text-xs text-white/40">
          Vigência informada até{" "}
          {new Date(`${energyLookup.validUntil}T12:00:00`).toLocaleDateString("pt-BR")}
        </p>
      )}

      {energyLookup.message && (
        <p className="mt-2 text-xs text-white/50">
          {energyLookup.message}
        </p>
      )}
    </>
  )}

  {energyLookup.status === "not-found" && energyLookup.message && (
    <p className="mt-2 text-xs text-amber-300">
      {energyLookup.message}
    </p>
  )}

  {energyLookup.status === "error" && (
    <p className="mt-2 text-xs text-red-300">
      {energyLookup.error}
    </p>
  )}

  {energyLookup.status === "idle" && (
    <p className="mt-1 text-xs text-white/35">
      Digite os 8 dígitos do CEP para consultar a tarifa disponível.
    </p>
  )}

  {energyLookup.status === "loading" && (
    <p className="mt-1 text-xs text-white/35">
      Aguarde enquanto consultamos a localização.
    </p>
  )}

  {energyRateSource === "manual" && (
    <p className="mt-2 text-xs text-white/40">
      Você pode editar a tarifa para usar o valor efetivo da sua conta de luz.
    </p>
  )}
</div>
          </div>

          {/* DADOS TÉCNICOS */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <div className="mb-4">
              <p className="text-sm font-medium text-white">
                Dados técnicos
              </p>
              <p className="mt-1 text-xs text-white/35">
                Esses dados são preenchidos automaticamente pelo catálogo.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                id="type"
                label="Tecnologia"
                value={form.type}
                disabled
                className={inputClassName}
              />
              <Input
                id="nozzle"
                label="Bico (mm)"
                type="number"
                step="0.1"
                value={form.nozzleSize}
                disabled
                className={inputClassName}
              />
              <Input
                id="powerConsumption"
                label="Consumo (W)"
                type="number"
                value={form.powerConsumption}
                disabled
                className={inputClassName}
              />
              <Input
                id="buildVolume"
                label="Volume de impressão"
                value={form.buildVolume}
                disabled
                className={inputClassName}
              />
            </div>
          </div>

          {/* PRINCIPAL */}
          <button
            type="button"
            onClick={() =>
              setForm((current) => ({
                ...current,
                isPrimary: !current.isPrimary,
              }))
            }
            className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all ${
              form.isPrimary
                ? "border-[var(--accent)]/40 bg-[rgba(var(--accent-rgb),0.08)]"
                : "border-white/10 bg-white/[0.025] hover:border-white/20"
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                form.isPrimary
                  ? "border-[var(--accent)]/40 bg-[rgba(var(--accent-rgb),0.12)]"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              {form.isPrimary ? (
                <Check className="h-4 w-4 text-[var(--accent)]" />
              ) : (
                <Star className="h-4 w-4 text-white/30" />
              )}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-white">
                Usar como impressora principal
              </p>
              <p className="mt-0.5 text-xs text-white/40">
                Essa impressora será exibida no Dashboard.
              </p>
            </div>
          </button>

          {/* AÇÕES */}
          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              className="bg-white/5 text-white/70 ring-1 ring-white/10 hover:bg-white/10 hover:text-white"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={
                saving ||
                !form.name.trim() ||
                !form.manufacturer ||
                !form.model
              }
              className="bg-gradient-to-r from-[#071124] to-[#0d1a35] text-white ring-1 ring-white/10 hover:ring-[var(--accent)]/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Salvando..."
                : editingPrinter
                  ? "Salvar alterações"
                  : "Adicionar impressora"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
