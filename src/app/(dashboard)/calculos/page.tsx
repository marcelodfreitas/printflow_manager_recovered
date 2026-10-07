"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Calculator,
  Check,
  ChevronRight,
  FileCode2,
  FileUp,
  Layers3,
  Package,
  Printer,
  RotateCcw,
  ScanLine,
  Settings2,
  Upload,
  Weight,
  X,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { Card, CardContent } from "@/components/common";
import { useFilaments } from "@/hooks/useFilaments";
import { usePrinters } from "@/hooks/usePrinters";
import type { Filament, Printer as PrinterType } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface ParsedFilament {
  index: number;
  color: string;
  colorHex?: string;
  material?: string;
  grams: number;
  meters: number;
  vendor?: string;
  matchedFilamentId?: string;
}

interface ParsedGCode {
  fileName: string;

  modelPrintTimeSeconds: number;
  totalEstimatedTimeSeconds: number;

  filamentGrams: number;
  filamentMeters: number;

  printerName: string;
  printerSettingsId?: string;

  material: string;
  vendor: string;

  colors: string[];
  layers: number;
  objects: number;

  filaments: ParsedFilament[];
}

interface PreparedFilament extends ParsedFilament {
  matchedFilament?: Filament;
}

interface CalculationResult {
  filamentCosts: {
    item: ParsedFilament;
    filament?: Filament;
    cost: number;
  }[];

  machineCost: number;
  laborCost: number;
  filamentCost: number;
  totalCost: number;

  minimumPrice: number;
  recommendedPrice: number;
  premiumPrice: number;

  recommendedProfit: number;
}

const DEFAULT_MARGINS = {
  minimum: 30,
  recommended: 50,
  premium: 70,
};

const DEFAULT_COLOR_MAP: Record<string, string> = {
  white: "#ffffff",
  branco: "#ffffff",
  black: "#000000",
  preto: "#000000",
  blue: "#2563eb",
  azul: "#2563eb",
  cyan: "#00b1b7",
  ciano: "#00b1b7",
  turquesa: "#00b1b7",
  red: "#ef4444",
  vermelho: "#ef4444",
  green: "#22c55e",
  verde: "#22c55e",
  yellow: "#eab308",
  amarelo: "#eab308",
  orange: "#f97316",
  laranja: "#f97316",
  purple: "#a855f7",
  roxo: "#a855f7",
  pink: "#ec4899",
  rosa: "#ec4899",
  gray: "#6b7280",
  grey: "#6b7280",
  cinza: "#6b7280",
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");

  const match = normalized.match(/-?\d+(?:\.\d+)?/);

  if (!match) {
    return undefined;
  }

  const number = Number(match[0]);

  return Number.isFinite(number) ? number : undefined;
}

function parseNumberList(value: string | undefined): number[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => parseNumber(item))
    .filter((item): item is number => item !== undefined);
}

function parseStringList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(";")
    .map((item) =>
      item
        .trim()
        .replace(/^"+|"+$/g, "")
        .trim(),
    )
    .filter(Boolean);
}

function parseTimeToSeconds(value: string): number {
  const normalized = value.toLowerCase().trim();

  const hourMatch = normalized.match(
    /(\d+(?:[.,]\d+)?)\s*(?:h|hr|hrs|hour|hours)/,
  );

  const minuteMatch = normalized.match(
    /(\d+(?:[.,]\d+)?)\s*(?:m|min|mins|minute|minutes)/,
  );

  const secondMatch = normalized.match(
    /(\d+(?:[.,]\d+)?)\s*(?:s|sec|secs|second|seconds)/,
  );

  if (hourMatch || minuteMatch || secondMatch) {
    const hours = hourMatch ? Number(hourMatch[1].replace(",", ".")) : 0;

    const minutes = minuteMatch ? Number(minuteMatch[1].replace(",", ".")) : 0;

    const seconds = secondMatch ? Number(secondMatch[1].replace(",", ".")) : 0;

    return hours * 3600 + minutes * 60 + seconds;
  }

  const clockMatch = normalized.match(/^(\d+):(\d+)(?::(\d+))?$/);

  if (clockMatch) {
    const hours = Number(clockMatch[1]);
    const minutes = Number(clockMatch[2]);
    const seconds = Number(clockMatch[3] || 0);

    return hours * 3600 + minutes * 60 + seconds;
  }

  return parseNumber(normalized) || 0;
}

function formatDuration(seconds: number) {
  if (!seconds || seconds <= 0) {
    return "—";
  }

  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}min`;
  }

  return `${hours}h ${String(minutes).padStart(2, "0")}min`;
}

function formatDurationDetailed(seconds: number) {
  if (!seconds || seconds <= 0) {
    return "—";
  }

  const totalSeconds = Math.round(seconds);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}min ${String(
      remainingSeconds,
    ).padStart(2, "0")}s`;
  }

  return `${minutes}min ${String(remainingSeconds).padStart(2, "0")}s`;
}

function hoursFromSeconds(seconds: number) {
  return seconds / 3600;
}

function getCommentValue(text: string, key: string) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const regex = new RegExp(`^\\s*;\\s*${escapedKey}\\s*=\\s*(.*?)\\s*$`, "im");

  return text.match(regex)?.[1]?.trim();
}

function getHeaderValue(text: string, pattern: RegExp) {
  return text.match(pattern)?.[1]?.trim();
}

function colorNameFromHex(hex?: string) {
  if (!hex) {
    return "Cor";
  }

  const normalized = hex.replace("#", "").toLowerCase();

  const known: Record<string, string> = {
    ffffff: "Branco",
    "000000": "Preto",
    "00b1b7": "Azul",
    "2563eb": "Azul",
    c12e1f: "Vermelho",
    ff0000: "Vermelho",
    "00ff00": "Verde",
    "22c55e": "Verde",
    ffff00: "Amarelo",
    eab308: "Amarelo",
    ffa500: "Laranja",
    f97316: "Laranja",
    a855f7: "Roxo",
    ec4899: "Rosa",
    "6b7280": "Cinza",
  };

  return known[normalized] || `#${normalized}`;
}

function hexToRgb(hex?: string) {
  if (!hex) {
    return null;
  }

  const normalized = hex.replace("#", "");

  if (normalized.length !== 6) {
    return null;
  }

  const value = Number.parseInt(normalized, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function colorDistance(first?: string, second?: string) {
  const a = hexToRgb(first);
  const b = hexToRgb(second);

  if (!a || !b) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.sqrt(
    Math.pow(a.r - b.r, 2) + Math.pow(a.g - b.g, 2) + Math.pow(a.b - b.b, 2),
  );
}

function findMatchingFilament(item: ParsedFilament, filaments: Filament[]) {
  if (item.matchedFilamentId) {
    const manuallySelected = filaments.find(
      (filament) => filament.id === item.matchedFilamentId,
    );

    if (manuallySelected) {
      return manuallySelected;
    }
  }

  const itemColor = item.colorHex?.toLowerCase();
  const itemMaterial = normalizeText(item.material || "");

  if (itemColor) {
    const exactColor = filaments.find(
      (filament) =>
        filament.colorHex?.toLowerCase() === itemColor &&
        (!itemMaterial || normalizeText(filament.type) === itemMaterial),
    );

    if (exactColor) {
      return exactColor;
    }

    const sameColor = filaments.find(
      (filament) => filament.colorHex?.toLowerCase() === itemColor,
    );

    if (sameColor) {
      return sameColor;
    }

    const closestColor = [...filaments]
      .map((filament) => ({
        filament,
        distance: colorDistance(item.colorHex, filament.colorHex),
      }))
      .filter((entry) => Number.isFinite(entry.distance))
      .sort((a, b) => a.distance - b.distance)[0];

    if (
      closestColor &&
      closestColor.distance <= 35 &&
      (!itemMaterial ||
        normalizeText(closestColor.filament.type) === itemMaterial)
    ) {
      return closestColor.filament;
    }
  }

  const color = normalizeText(item.color);
  const material = normalizeText(item.material || "");

  const exact = filaments.find((filament) => {
    const filamentColor = normalizeText(filament.color);
    const filamentName = normalizeText(filament.name);
    const filamentType = normalizeText(filament.type);

    const colorMatches =
      filamentColor === color ||
      filamentName.includes(color) ||
      color.includes(filamentColor);

    const materialMatches =
      !material || filamentType === material || filamentName.includes(material);

    return colorMatches && materialMatches;
  });

  if (exact) {
    return exact;
  }

  return filaments.find((filament) => {
    const filamentColor = normalizeText(filament.color);
    const filamentName = normalizeText(filament.name);

    return (
      filamentColor === color ||
      filamentName.includes(color) ||
      color.includes(filamentColor)
    );
  });
}

function findMatchingPrinter(printerName: string, printers: PrinterType[]) {
  const normalized = normalizeText(printerName);

  if (!normalized) {
    return undefined;
  }

  return printers.find((printer) => {
    const name = normalizeText(printer.name);
    const model = normalizeText(printer.model);

    return (
      normalized === name ||
      normalized === model ||
      normalized.includes(name) ||
      normalized.includes(model) ||
      name.includes(normalized) ||
      model.includes(normalized)
    );
  });
}

function parseGCode(text: string, fileName: string): ParsedGCode {
  const modelTimeValue = getHeaderValue(
    text,
    /;\s*model printing time:\s*([^;]+);/i,
  );

  const totalTimeValue = getHeaderValue(
    text,
    /;\s*model printing time:\s*[^;]+;\s*total estimated time:\s*([^\r\n]+)/i,
  );

  const modelPrintTimeSeconds = parseTimeToSeconds(modelTimeValue || "");

  const totalEstimatedTimeSeconds = parseTimeToSeconds(totalTimeValue || "");

  const layerValue = getHeaderValue(
    text,
    /;\s*total layer number:\s*([0-9]+)/i,
  );

  const layers = parseNumber(layerValue) || 0;

  const weightValue = getHeaderValue(
    text,
    /;\s*total filament weight\s*\[g\]\s*:\s*([^\r\n]+)/i,
  );

  const lengthValue = getHeaderValue(
    text,
    /;\s*total filament length\s*\[mm\]\s*:\s*([^\r\n]+)/i,
  );

  const weightValues = parseNumberList(weightValue);
  const lengthValues = parseNumberList(lengthValue);

  const filamentIndexes = parseNumberList(
    getCommentValue(text, "filament"),
  ).map((value) => Math.round(value));

  const filamentColors = parseStringList(
    getCommentValue(text, "filament_colour"),
  );

  const filamentTypes = parseStringList(getCommentValue(text, "filament_type"));

  const filamentVendors = parseStringList(
    getCommentValue(text, "filament_vendor"),
  );

  const filamentSelfIndexes = parseNumberList(
    getCommentValue(text, "filament_self_index"),
  ).map((value) => Math.round(value));

  const printerName =
    getCommentValue(text, "printer_model") ||
    getCommentValue(text, "print_compatible_printers") ||
    "";

  const printerSettingsId = getCommentValue(text, "printer_settings_id");

  const material = filamentTypes.find(Boolean) || "";
  const vendor = filamentVendors.find(Boolean) || "";

  const usedIndexes =
    filamentIndexes.length > 0
      ? filamentIndexes
      : weightValues.map((_, index) => index + 1);

  const filaments: ParsedFilament[] = usedIndexes
    .map((selfIndex) => {
      const selfIndexPosition = filamentSelfIndexes.indexOf(selfIndex);

      const arrayIndex =
        selfIndexPosition >= 0 ? selfIndexPosition : selfIndex - 1;

      const rawColor = filamentColors[arrayIndex] || "";

      const hex =
        rawColor.match(/#[0-9a-f]{6}/i)?.[0]?.toLowerCase() ||
        DEFAULT_COLOR_MAP[normalizeText(rawColor)];

      const grams = weightValues[arrayIndex] || 0;

      const meters = lengthValues[arrayIndex]
        ? lengthValues[arrayIndex] / 1000
        : 0;

      const filamentMaterial = filamentTypes[arrayIndex] || material;

      const filamentVendor = filamentVendors[arrayIndex] || vendor;

      return {
        index: selfIndex,
        color: colorNameFromHex(hex),
        colorHex: hex,
        material: filamentMaterial,
        grams,
        meters,
        vendor: filamentVendor,
      };
    })
    .filter((item) => item.grams > 0);

  const filamentGrams = filaments.reduce(
    (sum, filament) => sum + filament.grams,
    0,
  );

  const filamentMeters = filaments.reduce(
    (sum, filament) => sum + filament.meters,
    0,
  );

  return {
    fileName,
    modelPrintTimeSeconds,
    totalEstimatedTimeSeconds:
      totalEstimatedTimeSeconds || modelPrintTimeSeconds,
    filamentGrams,
    filamentMeters,
    printerName: printerName.trim(),
    printerSettingsId,
    material,
    vendor,
    colors: filaments.map((filament) => filament.color),
    layers,
    objects: 1,
    filaments,
  };
}

export default function CalculosPage() {
  
  const { filaments, loading: loadingFilaments } = useFilaments();

  const { printers, loading: loadingPrinters } = usePrinters();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsed, setParsed] = useState<ParsedGCode | null>(null);

  const [selectedPrinterId, setSelectedPrinterId] = useState("");

  const [dragActive, setDragActive] = useState(false);

  const [loadingFile, setLoadingFile] = useState(false);

  const [error, setError] = useState("");

  const [margins, setMargins] = useState(DEFAULT_MARGINS);

  const [laborCost, setLaborCost] = useState(0);

  const loading = loadingFilaments || loadingPrinters;

  const matchedPrinter = useMemo(() => {
    if (!parsed) {
      return undefined;
    }

    if (selectedPrinterId) {
      return printers.find((printer) => printer.id === selectedPrinterId);
    }

    return findMatchingPrinter(parsed.printerName, printers);
  }, [parsed, printers, selectedPrinterId]);

  const preparedFilaments = useMemo<PreparedFilament[]>(() => {
    if (!parsed) {
      return [];
    }

    return parsed.filaments.map((item) => ({
      ...item,
      matchedFilament: findMatchingFilament(item, filaments),
    }));
  }, [parsed, filaments]);

  const unmatchedFilaments = preparedFilaments.filter(
    (item) => item.grams > 0 && !item.matchedFilament,
  );

  const result: CalculationResult | null = useMemo(() => {
    if (!parsed || !matchedPrinter || unmatchedFilaments.length > 0) {
      return null;
    }

    const filamentCosts = preparedFilaments.map((item) => {
      const filament = item.matchedFilament;

      const cost = filament ? (item.grams / 1000) * filament.costPerKg : 0;

      return {
        item,
        filament,
        cost,
      };
    });

    const filamentCost = filamentCosts.reduce(
      (sum, item) => sum + item.cost,
      0,
    );

    const machineHours = hoursFromSeconds(parsed.totalEstimatedTimeSeconds);

    const machineCost = machineHours * matchedPrinter.costPerHour;

    const totalCost = filamentCost + machineCost + laborCost;

    const minimumPrice =
      margins.minimum >= 100 ? 0 : totalCost / (1 - margins.minimum / 100);

    const recommendedPrice =
      margins.recommended >= 100
        ? 0
        : totalCost / (1 - margins.recommended / 100);

    const premiumPrice =
      margins.premium >= 100 ? 0 : totalCost / (1 - margins.premium / 100);

    const recommendedProfit = recommendedPrice - totalCost;

    return {
      filamentCosts,
      machineCost,
      laborCost,
      filamentCost,
      totalCost,
      minimumPrice,
      recommendedPrice,
      premiumPrice,
      recommendedProfit,
    };
  }, [
    parsed,
    matchedPrinter,
    preparedFilaments,
    unmatchedFilaments.length,
    margins,
    laborCost,
  ]);

  const processFile = useCallback(
    async (file: File) => {
      setError("");

      const extension = file.name.split(".").pop()?.toLowerCase();

      if (extension !== "gcode") {
        setError(
          "Para calcular a impressão com precisão, envie o arquivo .gcode exportado pelo Bambu Studio após o fatiamento.",
        );
        return;
      }

      setLoadingFile(true);

      try {
        const text = await file.text();

        if (
          !text.includes("total filament weight") ||
          !text.includes("printer_model")
        ) {
          throw new Error("G-code incompatível");
        }

        const data = parseGCode(text, file.name);

        if (!data.totalEstimatedTimeSeconds && !data.modelPrintTimeSeconds) {
          throw new Error("Tempo de impressão não encontrado");
        }

        if (data.filamentGrams <= 0) {
          throw new Error("Consumo de filamento não encontrado");
        }

        setParsed(data);

        const printer = findMatchingPrinter(data.printerName, printers);

        setSelectedPrinterId(printer?.id || "");
      } catch (err) {
        console.error("Erro ao analisar G-code:", err);

        setError(
          "Não foi possível analisar este G-code. Exporte o G-code diretamente pelo Bambu Studio após clicar em Slice Plate.",
        );
      } finally {
        setLoadingFile(false);
      }
    },
    [printers],
  );

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      void processFile(file);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      void processFile(file);
    }
  }

  function reset() {
    setParsed(null);
    setSelectedPrinterId("");
    setError("");
    setMargins(DEFAULT_MARGINS);
    setLaborCost(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function updateFilament(itemIndex: number, filamentId: string) {
    setParsed((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        filaments: current.filaments.map((filament) =>
          filament.index === itemIndex
            ? {
                ...filament,
                matchedFilamentId: filamentId,
              }
            : filament,
        ),
      };
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#050914]">
        <div className="flex items-center gap-3 text-sm text-white/50">
          <Calculator className="h-5 w-5 animate-pulse accent-text" />
          Carregando calculadora...
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050914]">
      {/* Background */}
      <div className="pointer-events-none fixed -right-40 top-10 h-[520px] w-[520px] rounded-full bg-[#071124]/70 blur-[130px]" />
      <div className="pointer-events-none fixed -bottom-40 left-1/3 h-[520px] w-[520px] rounded-full bg-[#FD6401]/[0.045] blur-[140px]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.035)_1px,transparent_0)] bg-[size:32px_32px]" />

      <div className="relative space-y-6 px-4 py-5 sm:p-6">
        {/* Header */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] accent-text">
              <Calculator className="h-4 w-4" />
              Cálculos
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Calculadora de impressão
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-white/40">
              Transforme os dados do fatiamento em custo real e preço de venda.
            </p>
          </div>

          {parsed && (
            <Button
              variant="ghost"
              onClick={reset}
              className="border-white/10 bg-white/[0.03] text-white hover:border-white/20 hover:bg-white/[0.06]"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Nova análise
            </Button>
          )}
        </div>

        {!parsed ? (
          <UploadArea
            dragActive={dragActive}
            loading={loadingFile}
            error={error}
            inputRef={fileInputRef}
            onDragEnter={() => setDragActive(true)}
            onDragLeave={() => setDragActive(false)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            onSelect={() => fileInputRef.current?.click()}
            onChange={handleFileChange}
          />
        ) : (
          <div className="space-y-5">
            {/* File / Print summary */}
            <Card className="overflow-hidden border border-white/10 bg-[#0A1120]/80 backdrop-blur-2xl shadow-2xl shadow-black/30">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row lg:items-stretch">
                  <div className="flex min-w-0 flex-1 items-center gap-4 p-5 lg:p-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/10">
                      <FileCode2 className="h-6 w-6 accent-text" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-white">
                          {parsed.fileName}
                        </p>

                        <span className="rounded-full border border-emerald-400/15 bg-emerald-400/5 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-400">
                          G-code analisado
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-white/35">
                        Dados extraídos diretamente do fatiamento do Bambu
                        Studio
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 border-t border-white/10 sm:grid-cols-4 lg:w-[620px] lg:border-l lg:border-t-0">
                    <CompactMetric
                      label="Tempo total"
                      value={formatDuration(parsed.totalEstimatedTimeSeconds)}
                      accent
                    />

                    <CompactMetric
                      label="Filamento"
                      value={`${parsed.filamentGrams.toFixed(2)} g`}
                    />

                    <CompactMetric
                      label="Camadas"
                      value={
                        parsed.layers
                          ? parsed.layers.toLocaleString("pt-BR")
                          : "—"
                      }
                    />

                    <CompactMetric
                      label="Impressora"
                      value={parsed.printerName || "Não identificada"}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main workspace */}
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
              {/* LEFT */}
              <div className="space-y-5">
                {/* Analysis */}
                <Card className="border border-white/10 bg-[#0A1120]/85 backdrop-blur-2xl shadow-xl shadow-black/20">
                  <SectionHeader
                    icon={ScanLine}
                    title="Análise da impressão"
                    description="Dados encontrados no arquivo de impressão."
                  />

                  <CardContent className="p-5">
                    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-4">
                      <AnalysisMetric
                        label="Tempo total"
                        value={formatDuration(parsed.totalEstimatedTimeSeconds)}
                        accent
                      />

                      <AnalysisMetric
                        label="Tempo do modelo"
                        value={formatDuration(parsed.modelPrintTimeSeconds)}
                      />

                      <AnalysisMetric
                        label="Peso total"
                        value={`${parsed.filamentGrams.toFixed(2)} g`}
                      />

                      <AnalysisMetric
                        label="Filamento"
                        value={`${parsed.filamentMeters.toFixed(2)} m`}
                      />
                    </div>

                    <div className="mt-5 grid gap-x-8 gap-y-4 border-t border-white/10 pt-5 sm:grid-cols-2">
                      <DetailRow
                        label="Impressora"
                        value={parsed.printerName || "Não identificada"}
                      />

                      <DetailRow
                        label="Perfil"
                        value={parsed.printerSettingsId || "Não identificado"}
                      />

                      <DetailRow
                        label="Material"
                        value={parsed.material || "Não identificado"}
                      />

                      <DetailRow
                        label="Fabricante"
                        value={parsed.vendor || "Não identificado"}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Filaments */}
                <Card className="overflow-hidden border border-white/10 bg-[#0A1120]/85 backdrop-blur-2xl shadow-xl shadow-black/20">
                  <SectionHeader
                    icon={Weight}
                    title="Filamentos utilizados"
                    description="Associe cada material ao seu estoque para calcular o custo."
                    right={
                      <span className="text-xs text-white/30">
                        {preparedFilaments.length}{" "}
                        {preparedFilaments.length === 1
                          ? "material"
                          : "materiais"}
                      </span>
                    }
                  />

                  <CardContent className="p-0">
                    <div className="divide-y divide-white/5">
                      {preparedFilaments.map((item) => (
                        <FilamentRow
                          key={`${item.index}-${item.color}`}
                          item={item}
                          filaments={filaments}
                          onSelect={(filamentId) =>
                            updateFilament(item.index, filamentId)
                          }
                        />
                      ))}
                    </div>

                    {preparedFilaments.length === 0 && (
                      <div className="p-8 text-center text-sm text-white/35">
                        Nenhum filamento foi identificado no G-code.
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Printer */}
                <Card className="border border-white/10 bg-[#0A1120]/85 backdrop-blur-2xl shadow-xl shadow-black/20">
                  <SectionHeader
                    icon={Printer}
                    title="Impressora"
                    description="O custo da máquina é calculado usando o valor por hora cadastrado."
                  />

                  <CardContent className="p-5">
                    <Select
                      label="Impressora utilizada"
                      placeholder="Selecione a impressora..."
                      options={printers.map((printer) => ({
                        value: printer.id,
                        label: `${printer.name} • ${formatCurrency(
                          printer.costPerHour,
                        )}/h`,
                      }))}
                      value={selectedPrinterId}
                      onChange={(event) =>
                        setSelectedPrinterId(event.target.value)
                      }
                      className="border-white/10 bg-white/5 text-white"
                    />

                    {matchedPrinter && (
                      <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10">
                            <Check className="h-4 w-4 text-emerald-400" />
                          </div>

                          <div>
                            <p className="text-sm font-medium text-white">
                              {matchedPrinter.name}
                            </p>

                            <p className="text-xs text-white/35">
                              Impressora selecionada
                            </p>
                          </div>
                        </div>

                        <span className="text-sm font-semibold text-emerald-400">
                          {formatCurrency(matchedPrinter.costPerHour)}
                          /h
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Technical info */}
                <div className="flex flex-wrap gap-x-5 gap-y-2 px-1 text-[11px] text-white/25">
                  <span className="flex items-center gap-1.5">
                    <Layers3 className="h-3.5 w-3.5" />
                    {parsed.layers} camadas
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" />
                    {parsed.objects} objeto
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Weight className="h-3.5 w-3.5" />
                    {parsed.filamentGrams.toFixed(2)} g
                  </span>
                </div>
              </div>

              {/* RIGHT */}
              <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
                {/* MAIN COST CARD */}
                <Card className="relative overflow-hidden border border-white/10 bg-[#0A1120]/95 backdrop-blur-2xl shadow-2xl shadow-black/40">
                  <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#FD6401]/10 blur-[70px]" />

                  <CardContent className="relative p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                          Custo da impressão
                        </p>

                        <p className="mt-1 text-xs text-white/25">
                          Custo real estimado
                        </p>
                      </div>

                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--accent)]/15 bg-[var(--accent)]/5">
                        <Calculator className="h-4 w-4 accent-text" />
                      </div>
                    </div>

                    {!result ? (
                      <EmptyCalculationState
                        reason={
                          !matchedPrinter
                            ? "Selecione uma impressora para calcular o custo da máquina."
                            : "Associe todos os filamentos utilizados ao estoque."
                        }
                      />
                    ) : (
                      <>
                        <div className="mt-6">
                          <span className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                            {formatCurrency(result.totalCost)}
                          </span>
                        </div>

                        <div className="mt-6 space-y-4 border-t border-white/10 pt-5">
                          <CostRow
                            label="Filamentos"
                            value={result.filamentCost}
                          />

                          <CostRow label="Máquina" value={result.machineCost} />

                          <div className="space-y-2">
                            <label
                              htmlFor="labor-cost"
                              className="text-xs font-medium text-white/60"
                            >
                              Mão de obra / acabamento
                            </label>

                            <div className="relative">
                              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/40">
                                R$
                              </span>

                              <input
                                id="labor-cost"
                                type="number"
                                min="0"
                                step="0.01"
                                value={laborCost || ""}
                                onChange={(event) =>
                                  setLaborCost(Number(event.target.value) || 0)
                                }
                                placeholder="0,00"
                                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[var(--accent)]/50 focus:bg-white/[0.05]"
                              />
                            </div>
                          </div>

                          <CostRow
                            label="Tempo cobrado"
                            valueText={formatDuration(
                              parsed.totalEstimatedTimeSeconds,
                            )}
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* SELLING PRICE */}
                <Card className="overflow-hidden border border-white/10 bg-[#0A1120]/95 backdrop-blur-2xl shadow-2xl shadow-black/40">
                  <SectionHeader
                    icon={Settings2}
                    title="Preço de venda"
                    description="Margem aplicada sobre o preço final."
                  />

                  <CardContent className="p-5">
                    <div className="grid grid-cols-3 gap-2">
                      <MarginInput
                        label="Mínimo"
                        value={margins.minimum}
                        onChange={(value) =>
                          setMargins((current) => ({
                            ...current,
                            minimum: value,
                          }))
                        }
                      />

                      <MarginInput
                        label="Recomendado"
                        value={margins.recommended}
                        onChange={(value) =>
                          setMargins((current) => ({
                            ...current,
                            recommended: value,
                          }))
                        }
                      />

                      <MarginInput
                        label="Premium"
                        value={margins.premium}
                        onChange={(value) =>
                          setMargins((current) => ({
                            ...current,
                            premium: value,
                          }))
                        }
                      />
                    </div>

                    {result ? (
                      <div className="mt-5 space-y-2">
                        <PriceOption
                          label={`Mínimo • ${margins.minimum}%`}
                          price={result.minimumPrice}
                        />

                        <PriceOption
                          label={`Recomendado • ${margins.recommended}%`}
                          price={result.recommendedPrice}
                          featured
                          
                        />

                        <PriceOption
                          label={`Premium • ${margins.premium}%`}
                          price={result.premiumPrice}
                          
                        />
                      </div>
                    ) : (
                      <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
                        <p className="text-xs text-white/30">
                          O preço aparecerá quando o custo da impressão estiver
                          completo.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* RECOMMENDED PRICE */}
                {result && (
                  <div className="relative overflow-hidden rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/[0.045] p-5">
                    <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[var(--accent)]/10 blur-[40px]" />

                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                            Preço recomendado
                          </p>

                          <p className="mt-2 text-2xl font-semibold text-white">
                            {formatCurrency(result.recommendedPrice)}
                          </p>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/10">
                          <ChevronRight className="h-5 w-5 accent-text" />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                        <span className="text-xs text-white/35">Lucro</span>

                        <span className="text-sm font-semibold accent-text">
                          {formatCurrency(result.recommendedProfit)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* WARNING */}
                {unmatchedFilaments.length > 0 && (
                  <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-4">
                    <div className="flex gap-3">
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />

                      <div>
                        <p className="text-sm font-medium text-white">
                          Associação necessária
                        </p>

                        <p className="mt-1 text-xs leading-5 text-white/40">
                          {unmatchedFilaments.length === 1
                            ? "Existe 1 filamento utilizado que ainda não foi associado ao estoque."
                            : `Existem ${unmatchedFilaments.length} filamentos utilizados que ainda não foram associados ao estoque.`}
                        </p>

                        <p className="mt-2 text-[11px] text-amber-400/80">
                          Selecione o filamento correspondente na lista acima.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UploadArea({
  dragActive,
  loading,
  error,
  inputRef,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onSelect,
  onChange,
}: {
  dragActive: boolean;
  loading: boolean;
  error: string;
  inputRef: React.Ref<HTMLInputElement>;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onSelect: () => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl pt-4">
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          onDragEnter();
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          onDragLeave();
        }}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={`relative overflow-hidden rounded-2xl border transition-all ${
          dragActive
            ? "border-[var(--accent)] bg-[var(--accent)]/10"
            : "border-white/10 bg-[#0A1120]/75 hover:border-white/20"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(253,100,1,0.09),transparent_45%)]" />

        <div className="relative grid min-h-[430px] items-center lg:grid-cols-[1.1fr_0.9fr]">
          <div className="px-6 py-14 text-center lg:px-14 lg:text-left">
            <div
              className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border ${
                dragActive
                  ? "border-[var(--accent)]/40 bg-[var(--accent)]/15"
                  : "border-white/10 bg-white/[0.04]"
              } mx-auto lg:mx-0`}
            >
              {loading ? (
                <ScanLine className="h-7 w-7 animate-pulse accent-text" />
              ) : (
                <Upload className="h-7 w-7 text-white/45" />
              )}
            </div>

            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] accent-text">
              Nova análise
            </p>

            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {loading
                ? "Analisando sua impressão..."
                : "Calcule o custo da sua impressão"}
            </h2>

            <p className="mt-3 max-w-lg text-sm leading-6 text-white/40">
              {loading
                ? "Estamos lendo tempo, camadas, filamentos e impressora diretamente do arquivo."
                : "Envie o G-code gerado pelo Bambu Studio depois do fatiamento. O PrintFlow usa os dados reais da impressão."}
            </p>

            {!loading && (
              <Button
                onClick={onSelect}
                className="mt-7 accent-bg text-white shadow-lg shadow-orange-950/20 hover:brightness-110"
              >
                <FileUp className="mr-2 h-4 w-4" />
                Selecionar G-code
              </Button>
            )}

            <input
              ref={inputRef}
              type="file"
              accept=".gcode"
              className="hidden"
              onChange={onChange}
            />
          </div>

          <div className="border-t border-white/10 bg-black/10 p-6 lg:border-l lg:border-t-0 lg:p-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/25">
              O que o PrintFlow analisa
            </p>

            <div className="mt-5 space-y-2">
              <UploadFeature
                icon={ScanLine}
                title="Tempo de impressão"
                description="Tempo total estimado pelo slicer"
              />

              <UploadFeature
                icon={Weight}
                title="Consumo de filamento"
                description="Peso e comprimento por material"
              />

              <UploadFeature
                icon={Printer}
                title="Impressora"
                description="Modelo e custo por hora"
              />

              <UploadFeature
                icon={Layers3}
                title="Dados do fatiamento"
                description="Camadas e perfil utilizado"
              />

              <UploadFeature
                icon={Calculator}
                title="Custo e preço"
                description="Margens calculadas sobre o custo real"
              />
            </div>

            <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
              <p className="text-[11px] leading-5 text-white/25">
                No Bambu Studio:{" "}
                <span className="text-white/45">Slice Plate</span> →{" "}
                <span className="text-white/45">Export G-code</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-400/15 bg-red-400/5 px-4 py-3">
          <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}

function UploadFeature({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ScanLine;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
        <Icon className="h-3.5 w-3.5 text-white/40" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-white/75">{title}</p>

        <p className="mt-0.5 truncate text-[10px] text-white/25">
          {description}
        </p>
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
  right,
}: {
  icon: typeof ScanLine;
  title: string;
  description: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.035]">
          <Icon className="h-4 w-4 text-white/40" />
        </div>

        <div className="min-w-0">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
            {title}
          </h2>

          <p className="mt-0.5 truncate text-[11px] text-white/25">
            {description}
          </p>
        </div>
      </div>

      {right}
    </div>
  );
}

function CompactMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="border-r border-white/5 px-4 py-4 last:border-r-0">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/25">
        {label}
      </p>

      <p
        className={`mt-1 truncate text-sm font-medium ${
          accent ? "accent-text" : "text-white/80"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function AnalysisMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-[#0A1120] p-4">
      <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/25">
        {label}
      </p>

      <p
        className={`mt-2 text-lg font-semibold ${
          accent ? "accent-text" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-white/30">{label}</span>

      <span className="max-w-[65%] truncate text-right font-medium text-white/75">
        {value}
      </span>
    </div>
  );
}

function FilamentRow({
  item,
  filaments,
  onSelect,
}: {
  item: PreparedFilament;
  filaments: Filament[];
  onSelect: (filamentId: string) => void;
}) {
  const matched = item.matchedFilament;

  return (
    <div className="p-5 transition-colors hover:bg-white/[0.012]">
      <div className="grid gap-5 lg:grid-cols-[minmax(180px,1fr)_190px_270px] lg:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/15 shadow-inner"
            style={{
              backgroundColor:
                item.colorHex ||
                DEFAULT_COLOR_MAP[normalizeText(item.color)] ||
                "#666",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-white">{item.color}</p>

              {matched && <Check className="h-3.5 w-3.5 text-emerald-400" />}
            </div>

            <p className="mt-1 text-xs text-white/30">
              {item.material || "Material não identificado"}
              {item.vendor ? ` • ${item.vendor}` : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:flex lg:gap-6">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-white/20">
              Peso
            </p>

            <p className="mt-1 text-sm font-medium text-white/80">
              {item.grams.toFixed(2)} g
            </p>
          </div>

          <div>
            <p className="text-[9px] uppercase tracking-wider text-white/20">
              Comprimento
            </p>

            <p className="mt-1 text-sm font-medium text-white/80">
              {item.meters.toFixed(2)} m
            </p>
          </div>
        </div>

        <div>
          <Select
            label="Filamento no estoque"
            placeholder="Selecionar..."
            options={filaments.map((filament) => ({
              value: filament.id,
              label: `${filament.name} • ${formatCurrency(
                filament.costPerKg,
              )}/kg`,
            }))}
            value={matched?.id || item.matchedFilamentId || ""}
            onChange={(event) => onSelect(event.target.value)}
            className={`border-white/10 bg-white/5 text-white ${
              matched ? "border-emerald-400/15" : ""
            }`}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 pl-[60px] text-[11px]">
        {matched ? (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-emerald-400/80">Associado ao estoque</span>
          </>
        ) : (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span className="text-amber-400/80">
              Selecione o filamento correspondente
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyCalculationState({ reason }: { reason: string }) {
  return (
    <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-5 text-center">
      <Calculator className="mx-auto h-6 w-6 text-white/15" />

      <p className="mt-3 text-xs leading-5 text-white/30">{reason}</p>
    </div>
  );
}

function CostRow({
  label,
  value,
  valueText,
  bold,
}: {
  label: string;
  value?: number;
  valueText?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          bold ? "text-sm font-semibold text-white" : "text-xs text-white/40"
        }
      >
        {label}
      </span>

      <span
        className={
          bold
            ? "text-sm font-semibold text-white"
            : "text-xs font-medium text-white/70"
        }
      >
        {valueText ?? (typeof value === "number" ? formatCurrency(value) : "—")}
      </span>
    </div>
  );
}

function MarginInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="mb-2 block truncate text-[10px] uppercase tracking-wider text-white/30">
        {label}
      </label>

      <div className="relative">
        <input
          type="number"
          min="0"
          max="99"
          step="1"
          value={value}
          onChange={(event) => onChange(Number(event.target.value) || 0)}
          className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.035] px-3 pr-7 text-sm font-medium text-white outline-none transition focus:border-[var(--accent)] focus:bg-white/[0.05]"
        />

        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/25">
          %
        </span>
      </div>
    </div>
  );
}

function PriceOption({
  label,
  price,
  featured,
  }: {
  label: string;
  price: number;
  featured?: boolean;
  
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3.5 transition ${
        featured
          ? "border-[var(--accent)]/25 bg-[var(--accent)]/[0.055]"
          : "border-white/5 bg-white/[0.02]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={
            featured
              ? "text-xs font-medium text-white"
              : "text-xs text-white/40"
          }
        >
          {label}
        </span>

        <span
          className={
            featured
              ? "text-base font-bold accent-text"
              : "text-sm font-medium text-white/75"
          }
        >
          {formatCurrency(price)}
        </span>
      </div>

      
    </div>
  );
}
