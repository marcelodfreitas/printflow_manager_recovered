"use client";

import { useState, type ReactNode } from "react";
import {
  Calculator,
  ChevronDown,
  Coins,
  Copy,
  Package,
  Printer,
  RotateCcw,
  Ruler,
  Settings2,
  Check,
} from "lucide-react";
import { useFilaments } from "@/hooks/useFilaments";
import { usePrinters } from "@/hooks/usePrinters";
import { formatCurrency } from "@/lib/utils";

const ENERGY_COST_PER_HOUR = 0.17;
const PRINTER_WORK_COST_PER_HOUR = 0.32;
const MACHINE_COST_PER_HOUR =
  ENERGY_COST_PER_HOUR + PRINTER_WORK_COST_PER_HOUR;

const DEFAULT_MARGIN = 30;
const DEFAULT_MARKUP = 3;

const inputClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-[#050914] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#FD6401]/60 focus:ring-2 focus:ring-[#FD6401]/10";

const labelClass = "text-xs font-medium text-white/55";

type TabId = "preco" | "escala" | "lucro";

const TABS: { id: TabId; label: string; hint: string; icon: typeof Calculator }[] =
  [
    { id: "preco", label: "Precificação", hint: "Custo e preço de venda", icon: Calculator },
    { id: "escala", label: "Escala 3D", hint: "Redimensionar peças", icon: Ruler },
    { id: "lucro", label: "Lucro e margem", hint: "Quanto sobra por venda", icon: Coins },
  ];

/* ------------------------------------------------------------------ */
/* Blocos reutilizáveis                                                */
/* ------------------------------------------------------------------ */

function Field({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  step = "any",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  min?: number;
  step?: number | string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <div className="relative">
        <input
          className={inputClass}
          type="number"
          min={min}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-white/30">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[#0A1120]/85 p-5 shadow-xl shadow-black/20 sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function CardTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Printer;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#FD6401]/20 bg-[#FD6401]/10">
        <Icon className="h-5 w-5 text-[#FD6401]" />
      </div>
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-white/35">{subtitle}</p>}
      </div>
    </div>
  );
}

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <p className="sm:col-span-2 text-xs font-semibold text-white/80">
      {children}
    </p>
  );
}

function CopyButton({
  text,
  label,
  disabled,
}: {
  text: string;
  label: string;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-medium text-white/70 transition hover:border-[#FD6401]/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copied ? "Copiado" : label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function CalculosPage() {
  const { printers = [], loading: loadingPrinters } = usePrinters();
  const { filaments = [] } = useFilaments();

  const [tab, setTab] = useState<TabId>("preco");

  // Precificação
  const [printerId, setPrinterId] = useState("");
  const [filamentId, setFilamentId] = useState("");
  const [filamentPrice, setFilamentPrice] = useState(0);
  const [grams, setGrams] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [laborRate, setLaborRate] = useState(0);
  const [prepMinutes, setPrepMinutes] = useState(0);
  const [finishMinutes, setFinishMinutes] = useState(0);
  const [packagingCost, setPackagingCost] = useState(0);
  const [extraCost, setExtraCost] = useState(0);
  const [feePercent, setFeePercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [marginPercent, setMarginPercent] = useState(DEFAULT_MARGIN);
  const [markupMultiplier, setMarkupMultiplier] = useState(DEFAULT_MARKUP);
  const [advanced, setAdvanced] = useState(false);

  // Lucro e margem
  const [profitCost, setProfitCost] = useState(0);
  const [salePrice, setSalePrice] = useState(0);

  // Escala 3D
  const [scaleCurrent, setScaleCurrent] = useState(100);
  const [scaleDesired, setScaleDesired] = useState(150);
  const [dimensions, setDimensions] = useState({
    currentX: 100,
    currentY: 100,
    currentZ: 100,
    desiredX: 100,
    desiredY: 100,
    desiredZ: 100,
  });

  const calculateScale = (current: number, desired: number) =>
    current > 0 ? (desired / current) * 100 : null;

  const uniformScale = calculateScale(scaleCurrent, scaleDesired);

  const axisScales = {
    x: calculateScale(dimensions.currentX, dimensions.desiredX),
    y: calculateScale(dimensions.currentY, dimensions.desiredY),
    z: calculateScale(dimensions.currentZ, dimensions.desiredZ),
  };

  const updateDimension = (field: keyof typeof dimensions, value: number) => {
    setDimensions((previous) => ({ ...previous, [field]: value }));
  };

  const formatScale = (value: number | null) =>
    value === null
      ? "Inválido"
      : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

  // Cálculos de precificação
  const totalMinutes = hours * 60 + minutes;
  const totalHours = totalMinutes / 60;

  const filamentCost = (Math.max(0, grams) / 1000) * Math.max(0, filamentPrice);
  const energyCost = totalHours * ENERGY_COST_PER_HOUR;
  const printerWorkCost = totalHours * PRINTER_WORK_COST_PER_HOUR;
  const machineCost = energyCost + printerWorkCost;
  const laborCost = ((prepMinutes + finishMinutes) / 60) * laborRate;

  const totalCost =
    filamentCost + machineCost + laborCost + packagingCost + extraCost;

  const combinedRate = (feePercent + taxPercent) / 100;
  const basePriceDenominator = 1 - marginPercent / 100 - combinedRate;
  const basePrice =
    basePriceDenominator > 0 ? totalCost / basePriceDenominator : 0;

  // O preço comercial é o custo total multiplicado pelo fator escolhido.
  const commercialPrice = totalCost * markupMultiplier;
  const netAfterFees = commercialPrice * (1 - combinedRate);
  const profit = netAfterFees - totalCost;

  // Cálculos de lucro e margem
  const saleProfit = salePrice - profitCost;
  const profitOnCost = profitCost > 0 ? (saleProfit / profitCost) * 100 : 0;
  const profitMargin = salePrice > 0 ? (saleProfit / salePrice) * 100 : 0;
  const costMultiplier = profitCost > 0 ? salePrice / profitCost : 0;

  const money = (value: number) =>
    formatCurrency(Number.isFinite(value) ? value : 0);

  const pct = (value: number) =>
    `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

  const costRows = [
    { label: "Filamento", value: filamentCost, opacity: 1 },
    { label: "Energia da impressora", value: energyCost, opacity: 0.7 },
    { label: "Hora trabalhada da impressora", value: printerWorkCost, opacity: 0.5 },
    { label: "Mão de obra", value: laborCost, opacity: 0.32 },
    { label: "Embalagem e extras", value: packagingCost + extraCost, opacity: 0.18 },
  ];

  function resetPricing() {
    setPrinterId("");
    setFilamentId("");
    setFilamentPrice(0);
    setGrams(0);
    setHours(0);
    setMinutes(0);
    setLaborRate(0);
    setPrepMinutes(0);
    setFinishMinutes(0);
    setPackagingCost(0);
    setExtraCost(0);
    setFeePercent(0);
    setTaxPercent(0);
    setMarginPercent(DEFAULT_MARGIN);
    setMarkupMultiplier(DEFAULT_MARKUP);
    setAdvanced(false);
  }

  function resetScale() {
    setScaleCurrent(100);
    setScaleDesired(150);
    setDimensions({
      currentX: 100,
      currentY: 100,
      currentZ: 100,
      desiredX: 100,
      desiredY: 100,
      desiredZ: 100,
    });
  }

  function resetProfit() {
    setProfitCost(0);
    setSalePrice(0);
  }

  function resetCurrent() {
    if (tab === "preco") resetPricing();
    else if (tab === "escala") resetScale();
    else resetProfit();
  }

  return (
    <main className="calculos-page relative min-h-screen overflow-hidden bg-[var(--app-background)] text-[var(--app-foreground)]">
      <style jsx global>{`
        /* FUNDO DECORATIVO (manchas e pontilhado) SÓ NO TEMA ESCURO */
        html[data-theme="light"] .calculos-page .calculos-deco {
          display: none !important;
        }

        /* CABEÇALHO SEM CAIXA */
        .calculos-page header {
          background: transparent !important;
          box-shadow: none !important;
        }

        /* TEXTOS */
        html[data-theme="light"] .calculos-page .text-white {
          color: var(--app-foreground) !important;
        }

        html[data-theme="light"] .calculos-page [class*="text-white/"] {
          color: var(--muted) !important;
        }

        /* PRESERVA TEXTOS BRANCOS EM BOTÕES LARANJAS */
        html[data-theme="light"] .calculos-page button.bg-\\[\\#FD6401\\],
        html[data-theme="light"] .calculos-page button.bg-\\[\\#FD6401\\] * {
          color: #ffffff !important;
        }

        /* SUPERFÍCIES E CARDS */
        html[data-theme="light"] .calculos-page [class*="bg-[#0A1120]"],
        html[data-theme="light"] .calculos-page [class*="bg-[#050914]"],
        html[data-theme="light"] .calculos-page [class*="bg-white/"] {
          background-color: var(--surface) !important;
        }

        /* GRADIENTES DECORATIVOS */
        html[data-theme="light"] .calculos-page .bg-gradient-to-br {
          background-color: transparent !important;
          background-image: linear-gradient(
            to bottom right,
            color-mix(in srgb, var(--accent) 10%, transparent),
            transparent
          ) !important;
        }

        /* MANTÉM OS DESTAQUES LARANJAS */
        html[data-theme="light"] .calculos-page [class*="text-[#FD6401]"] {
          color: var(--accent) !important;
        }

        html[data-theme="light"] .calculos-page [class*="border-[#FD6401]"] {
          border-color: color-mix(in srgb, var(--accent) 30%, transparent) !important;
        }

        /* BORDAS */
        html[data-theme="light"] .calculos-page [class*="border-white/"] {
          border-color: var(--border) !important;
        }

        /* CAMPOS */
        html[data-theme="light"] .calculos-page input,
        html[data-theme="light"] .calculos-page select,
        html[data-theme="light"] .calculos-page textarea {
          color: var(--foreground);
          background-color: var(--surface-light);
        }

        html[data-theme="light"] .calculos-page input::placeholder {
          color: var(--muted);
        }

        html[data-theme="light"] .calculos-page option {
          color: var(--foreground);
          background-color: var(--surface);
        }

        /* SLIDERS */
        html[data-theme="light"] .calculos-page input[type="range"] {
          background-color: transparent;
        }

        /* BOTÕES NEUTROS */
        html[data-theme="light"] .calculos-page button:not([class*="bg-[#FD6401]"]) {
          border-color: var(--border);
        }

        /* RESULTADOS E VALORES */
        html[data-theme="light"] .calculos-page .text-emerald-400 {
          color: #059669 !important;
        }

        html[data-theme="light"] .calculos-page .text-rose-400 {
          color: #e11d48 !important;
        }

        html[data-theme="light"] .calculos-page .text-amber-400 {
          color: #d97706 !important;
        }

        /* SOMBRAS */
        html[data-theme="light"] .calculos-page [class*="shadow-black/"] {
          --tw-shadow-color: transparent;
        }
      `}</style>

      <div className="calculos-deco pointer-events-none fixed -right-40 top-10 h-[520px] w-[520px] rounded-full bg-[#071124]/70 blur-[130px]" />
      <div className="calculos-deco pointer-events-none fixed -bottom-40 left-1/3 h-[520px] w-[520px] rounded-full bg-[#FD6401]/[0.06] blur-[140px]" />
      <div className="calculos-deco pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.035)_1px,transparent_0)] bg-[size:32px_32px]" />

      <div
        className="relative mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8"
      >
        {/* CABEÇALHO */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#FD6401]">
              <Calculator className="h-4 w-4" />
              PrintFlow · Cálculos
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Calculadora de impressão
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/45">
              Descubra seu custo real, encontre um preço competitivo e saiba
              quanto sobra no bolso.
            </p>
          </div>

          <button
            onClick={resetCurrent}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-white/65 transition hover:border-white/20 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpar valores
          </button>
        </header>

        {/* NAVEGAÇÃO ENTRE FERRAMENTAS */}
        <nav
          aria-label="Ferramentas de cálculo"
          className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-[#0A1120]/85 p-1.5"
        >
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setTab(item.id)}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-2.5 text-center transition sm:flex-row sm:justify-center sm:gap-2.5 sm:py-3 ${
                  active
                    ? "bg-[#FD6401] text-white shadow-lg shadow-[#FD6401]/20"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-xs font-semibold sm:text-sm">
                  {item.label}
                </span>
                <span
                  className={`hidden text-[11px] lg:inline ${
                    active ? "text-white/80" : "text-white/30"
                  }`}
                >
                  · {item.hint}
                </span>
              </button>
            );
          })}
        </nav>

        {/* ============================================================ */}
        {/* PRECIFICAÇÃO                                                  */}
        {/* ============================================================ */}
        {tab === "preco" && (
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
            <section className="space-y-5">
              <Card>
                <CardTitle
                  icon={Printer}
                  title="Sua impressão"
                  subtitle="Só precisa informar os dados básicos"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelClass}>Impressora</span>
                    <select
                      className={inputClass}
                      value={printerId}
                      onChange={(e) => setPrinterId(e.target.value)}
                    >
                      <option value="">
                        {loadingPrinters
                          ? "Carregando impressoras…"
                          : "Selecione uma impressora"}
                      </option>
                      {printers.map((printer) => (
                        <option key={printer.id} value={printer.id}>
                          {printer.name}
                          {printer.model ? ` · ${printer.model}` : ""}
                        </option>
                      ))}
                    </select>
                    <span className="mt-1.5 block text-[11px] text-white/30">
                      Custo fixo utilizado: {money(MACHINE_COST_PER_HOUR)}/h
                    </span>
                  </label>

                  <label className="block">
                    <span className={labelClass}>
                      Filamento cadastrado (opcional)
                    </span>
                    <select
                      className={inputClass}
                      value={filamentId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setFilamentId(id);
                        const filament = filaments.find((item) => item.id === id);
                        if (filament) {
                          setFilamentPrice(Number(filament.costPerKg) || 0);
                        }
                      }}
                    >
                      <option value="">Informar preço manualmente</option>
                      {filaments.map((filament) => (
                        <option key={filament.id} value={filament.id}>
                          {filament.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <Field
                    label="Preço do filamento por kg"
                    value={filamentPrice}
                    onChange={setFilamentPrice}
                    suffix="R$/kg"
                    step="0.01"
                  />

                  <Field
                    label="Material utilizado"
                    value={grams}
                    onChange={setGrams}
                    suffix="gramas"
                    step="0.1"
                  />

                  <div className="sm:col-span-2">
                    <span className={labelClass}>Tempo estimado de impressão</span>
                    <div className="grid grid-cols-2 gap-3">
                      <Field
                        label="Horas"
                        value={hours}
                        onChange={setHours}
                        suffix="h"
                        step={1}
                      />
                      <Field
                        label="Minutos"
                        value={minutes}
                        onChange={(value) => {
                          setHours((old) => old + Math.floor(value / 60));
                          setMinutes(value % 60);
                        }}
                        suffix="min"
                        step={1}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <button
                  onClick={() => setAdvanced(!advanced)}
                  aria-expanded={advanced}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                      <Settings2 className="h-5 w-5 text-white/65" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold">
                        Custos extras e precificação
                      </h2>
                      <p className="mt-0.5 text-xs text-white/35">
                        Mão de obra, embalagem, taxas e impostos
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-[#FD6401]">
                    {advanced ? "Recolher" : "Personalizar"}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        advanced ? "rotate-180" : ""
                      }`}
                    />
                  </span>
                </button>

                {advanced && (
                  <div className="mt-5 grid gap-4 border-t border-white/[0.07] pt-5 sm:grid-cols-2">
                    <GroupLabel>Mão de obra</GroupLabel>
                    <div className="sm:col-span-2 grid gap-4 sm:grid-cols-3">
                      <Field
                        label="Valor da hora"
                        value={laborRate}
                        onChange={setLaborRate}
                        suffix="R$/h"
                        step="0.01"
                      />
                      <Field
                        label="Preparação"
                        value={prepMinutes}
                        onChange={setPrepMinutes}
                        suffix="min"
                        step={1}
                      />
                      <Field
                        label="Acabamento e remoção"
                        value={finishMinutes}
                        onChange={setFinishMinutes}
                        suffix="min"
                        step={1}
                      />
                    </div>

                    <div className="sm:col-span-2 border-t border-white/[0.07]" />

                    <GroupLabel>Outros custos</GroupLabel>
                    <Field
                      label="Embalagem"
                      value={packagingCost}
                      onChange={setPackagingCost}
                      suffix="R$"
                      step="0.01"
                    />
                    <Field
                      label="Outros custos"
                      value={extraCost}
                      onChange={setExtraCost}
                      suffix="R$"
                      step="0.01"
                    />

                    <div className="sm:col-span-2 border-t border-white/[0.07]" />

                    <GroupLabel>Taxas e margem</GroupLabel>
                    <Field
                      label="Taxa do marketplace"
                      value={feePercent}
                      onChange={setFeePercent}
                      suffix="%"
                      step="0.1"
                    />
                    <Field
                      label="Impostos estimados"
                      value={taxPercent}
                      onChange={setTaxPercent}
                      suffix="%"
                      step="0.1"
                    />

                    <div className="sm:col-span-2">
                      <div className="mb-3 flex items-center justify-between">
                        <span className={labelClass}>Margem de lucro desejada</span>
                        <span className="text-sm font-semibold text-[#FD6401]">
                          {marginPercent}%
                        </span>
                      </div>
                      <input
                        aria-label="Margem de lucro desejada"
                        type="range"
                        min="0"
                        max="70"
                        step="5"
                        value={marginPercent}
                        onChange={(e) => setMarginPercent(Number(e.target.value))}
                        className="w-full accent-[#FD6401]"
                      />
                      <div className="mt-1 flex justify-between text-[10px] text-white/30">
                        <span>0% · Mais competitivo</span>
                        <span>70% · Maior margem</span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </section>

            {/* RESULTADO */}
            <aside className="space-y-5 xl:sticky xl:top-6">
              <div className="overflow-hidden rounded-2xl border border-[#FD6401]/25 bg-[#0A1120]/95 shadow-2xl shadow-black/30">
                <div className="border-b border-white/[0.07] bg-gradient-to-br from-[#FD6401]/[0.13] to-transparent p-5 sm:p-6">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#FD6401]">
                    <Coins className="h-4 w-4" />
                    Resultado em tempo real
                  </div>
                  <p className="mt-4 text-xs text-white/45">Custo total estimado</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight">
                    {money(totalCost)}
                  </p>
                  <p className="mt-2 text-xs text-white/35">
                    {totalMinutes} minutos de impressão · {grams} g de material
                  </p>

                  {/* Barra de composição */}
                  <div
                    className="mt-4 flex h-2 w-full overflow-hidden rounded-full"
                    style={{ background: "rgba(253,100,1,0.08)" }}
                    aria-hidden
                  >
                    {totalCost > 0 &&
                      costRows.map((row) => (
                        <div
                          key={row.label}
                          style={{
                            width: `${(row.value / totalCost) * 100}%`,
                            background: `rgba(253,100,1,${row.opacity})`,
                          }}
                        />
                      ))}
                  </div>
                </div>

                <div className="space-y-3 p-5 sm:p-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
                    Composição do custo
                  </h3>

                  {costRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="flex items-center gap-2 text-white/45">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: `rgba(253,100,1,${row.opacity})` }}
                        />
                        {row.label}
                      </span>
                      <span className="font-medium tabular-nums text-white/80">
                        {money(row.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-white/45">
                      Multiplicador comercial
                    </p>
                    <p className="mt-1 text-2xl font-semibold">
                      {markupMultiplier.toLocaleString("pt-BR", {
                        maximumFractionDigits: 1,
                      })}
                      ×
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#FD6401]/20 bg-[#FD6401]/10 p-3">
                    <Package className="h-5 w-5 text-[#FD6401]" />
                  </div>
                </div>

                <input
                  aria-label="Multiplicador comercial"
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={markupMultiplier}
                  onChange={(e) => setMarkupMultiplier(Number(e.target.value))}
                  className="mt-5 w-full accent-[#FD6401]"
                />

                <div className="mt-1 flex justify-between text-[10px] text-white/30">
                  <span>0×</span>
                  <span>5×</span>
                  <span>10×</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { label: "Atacado · 3×", value: 3 },
                    { label: "Varejo · 5×", value: 5 },
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => setMarkupMultiplier(preset.value)}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                        markupMultiplier === preset.value
                          ? "border-[#FD6401]/50 bg-[#FD6401]/10 text-white"
                          : "border-white/10 text-white/50 hover:text-white"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="mt-5 rounded-xl border border-[#FD6401]/20 bg-[#FD6401]/[0.06] p-4">
                  <p className="text-xs text-white/45">Preço de venda sugerido</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-[#FD6401]">
                    {money(commercialPrice)}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-3 text-xs">
                    <span className="text-white/45">Lucro estimado após taxas</span>
                    <span
                      className={`font-semibold ${
                        profit >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {money(profit)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-white/45">
                    Preço base para margem de {marginPercent}%
                    {combinedRate > 0 ? ` e ${feePercent + taxPercent}% de taxas` : ""}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {money(basePrice)}
                  </span>
                </div>

                {basePrice === 0 && totalCost > 0 && (
                  <p className="mt-2 text-[11px] leading-relaxed text-amber-400">
                    A margem, somada às taxas e aos impostos, não permite calcular
                    um preço base positivo. Revise esses valores.
                  </p>
                )}
              </Card>
            </aside>
          </div>
        )}

        {/* ============================================================ */}
        {/* ESCALA 3D                                                     */}
        {/* ============================================================ */}
        {tab === "escala" && (
          <section className="space-y-5">
            <div className="grid items-start gap-5 lg:grid-cols-2">
              {/* ESCALA UNIFORME */}
              <Card>
                <CardTitle
                  icon={Ruler}
                  title="Escala proporcional"
                  subtitle="Mantém as proporções da peça"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Medida atual da peça"
                    value={scaleCurrent}
                    onChange={setScaleCurrent}
                    suffix="mm"
                    step="0.01"
                  />
                  <Field
                    label="Medida desejada"
                    value={scaleDesired}
                    onChange={setScaleDesired}
                    suffix="mm"
                    step="0.01"
                  />
                </div>

                <div className="mt-5 rounded-xl border border-[#FD6401]/20 bg-[#FD6401]/[0.06] p-4">
                  <p className="text-xs text-white/45">Percentual de escala</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-[#FD6401]">
                    {formatScale(uniformScale)}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-3 text-xs">
                    <span className="text-white/45">Variação de tamanho</span>
                    <span className="font-medium text-white/80">
                      {uniformScale === null
                        ? "Indisponível"
                        : `${uniformScale > 100 ? "+" : ""}${(
                            uniformScale - 100
                          ).toLocaleString("pt-BR", {
                            maximumFractionDigits: 2,
                          })}%`}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-white/45">Dimensão final</span>
                    <span className="font-medium text-white">
                      {scaleDesired.toLocaleString("pt-BR", {
                        maximumFractionDigits: 2,
                      })}{" "}
                      mm
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-[11px] leading-relaxed text-white/35">
                  Use o resultado com a escala uniforme ativada no fatiador.
                </p>

                <CopyButton
                  label="Copiar percentual"
                  disabled={uniformScale === null}
                  text={
                    uniformScale === null
                      ? ""
                      : String(Number(uniformScale.toFixed(2)))
                  }
                />
              </Card>

              {/* ESCALA POR EIXO */}
              <Card>
                <CardTitle
                  icon={Ruler}
                  title="Escala por eixo"
                  subtitle="Largura (X), profundidade (Y) e altura (Z) separadas"
                />

                <div className="space-y-3">
                  {(
                    [
                      { axis: "X", current: "currentX", desired: "desiredX", result: axisScales.x },
                      { axis: "Y", current: "currentY", desired: "desiredY", result: axisScales.y },
                      { axis: "Z", current: "currentZ", desired: "desiredZ", result: axisScales.z },
                    ] as const
                  ).map((item) => (
                    <div
                      key={item.axis}
                      className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/80">
                          Eixo {item.axis}
                        </span>
                        <span className="text-xs font-semibold text-[#FD6401]">
                          {formatScale(item.result)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Field
                          label="Medida atual"
                          value={dimensions[item.current]}
                          onChange={(value) => updateDimension(item.current, value)}
                          suffix="mm"
                          step="0.01"
                        />
                        <Field
                          label="Medida desejada"
                          value={dimensions[item.desired]}
                          onChange={(value) => updateDimension(item.desired, value)}
                          suffix="mm"
                          step="0.01"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
                  <p className="text-xs font-medium text-white/65">
                    Resumo para o fatiador
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {(
                      [
                        ["X", axisScales.x],
                        ["Y", axisScales.y],
                        ["Z", axisScales.z],
                      ] as const
                    ).map(([axis, value]) => (
                      <div
                        key={axis}
                        className="rounded-lg bg-white/[0.035] p-2 text-center"
                      >
                        <p className="text-[10px] text-white/35">Eixo {axis}</p>
                        <p className="mt-1 text-sm font-semibold text-white">
                          {formatScale(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <CopyButton
                  label="Copiar escalas X, Y e Z"
                  disabled={Object.values(axisScales).some((value) => value === null)}
                  text={
                    axisScales.x === null ||
                    axisScales.y === null ||
                    axisScales.z === null
                      ? ""
                      : `X: ${Number(axisScales.x.toFixed(2))}% | Y: ${Number(
                          axisScales.y.toFixed(2),
                        )}% | Z: ${Number(axisScales.z.toFixed(2))}%`
                  }
                />
              </Card>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5 text-xs leading-relaxed text-white/40">
              <Ruler className="mt-0.5 h-4 w-4 shrink-0 text-[#FD6401]/80" />
              <p>
                <strong className="text-white/65">Dica:</strong> a escala por eixo
                pode deformar o modelo de propósito. Se a medida atual for zero,
                não é possível calcular o percentual desse eixo. Confira as
                dimensões no fatiador antes de imprimir.
              </p>
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* LUCRO E MARGEM                                                */}
        {/* ============================================================ */}
        {tab === "lucro" && (
          <div className="grid items-start gap-5 lg:grid-cols-2">
            <Card>
              <CardTitle
                icon={Coins}
                title="Dados do produto"
                subtitle="Informe o custo e o preço de venda"
              />

              <div className="space-y-4">
                <Field
                  label="Custo do produto"
                  value={profitCost}
                  onChange={setProfitCost}
                  suffix="R$"
                  step="0.01"
                />
                <Field
                  label="Preço de venda"
                  value={salePrice}
                  onChange={setSalePrice}
                  suffix="R$"
                  step="0.01"
                />
              </div>
            </Card>

            <div className="overflow-hidden rounded-2xl border border-[#FD6401]/25 bg-[#0A1120]/95 shadow-xl shadow-black/20">
              <div className="border-b border-white/[0.07] bg-gradient-to-br from-[#FD6401]/[0.13] to-transparent p-5 sm:p-6">
                <p className="text-xs font-medium text-[#FD6401]">
                  Lucro por unidade
                </p>
                <p
                  className={`mt-2 text-4xl font-semibold tracking-tight ${
                    saleProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {money(saleProfit)}
                </p>
                <p className="mt-2 text-xs text-white/40">
                  {saleProfit >= 0
                    ? "Resultado positivo na venda"
                    : "Você está vendendo abaixo do custo"}
                </p>
              </div>

              <div className="space-y-4 p-5 sm:p-6">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
                    <p className="text-[10px] text-white/35">Sobre o custo</p>
                    <p className="mt-1 text-lg font-semibold text-[#FD6401]">
                      {pct(profitOnCost)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
                    <p className="text-[10px] text-white/35">Margem na venda</p>
                    <p className="mt-1 text-lg font-semibold text-[#FD6401]">
                      {pct(profitMargin)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
                    <p className="text-[10px] text-white/35">Multiplicador</p>
                    <p className="mt-1 text-lg font-semibold">
                      {costMultiplier.toLocaleString("pt-BR", {
                        maximumFractionDigits: 2,
                      })}
                      ×
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] leading-relaxed text-white/35">
                  <p>
                    <span className="text-white/55">Sobre o custo:</span> quanto
                    você ganhou em relação ao que investiu.
                  </p>
                  <p>
                    <span className="text-white/55">Margem na venda:</span> parte
                    do preço de venda que é lucro.
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/45">Custo</span>
                    <span>{money(profitCost)}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-xs">
                    <span className="text-white/45">Venda</span>
                    <span>{money(salePrice)}</span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-white/[0.07] pt-2 text-xs font-semibold">
                    <span>Lucro</span>
                    <span
                      className={saleProfit >= 0 ? "text-emerald-400" : "text-rose-400"}
                    >
                      {money(saleProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </main>
  );
}
