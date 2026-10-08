"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  Clock3,
  CircleDollarSign,
  DollarSign,
  Download,
  FileText,
  Factory,
  Layers3,
  Package,
  Printer as PrinterIcon,
  TrendingUp,
  Wallet,
  Boxes,
  Activity,
  X,
} from "lucide-react";
import { jsPDF } from "jspdf";

import logo from "@/assets/logo.png";

import { useOrders } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
import { usePrinters } from "@/hooks/usePrinters";
import { useFilaments } from "@/hooks/useFilaments";

type PeriodKey =
  | "today"
  | "7days"
  | "month"
  | "previousMonth"
  | "3months"
  | "year";

type DateRange = {
  start: Date;
  end: Date;
};

type ExportType =
  | "all"
  | "revenue-profit"
  | "printers"
  | "statuses"
  | "products"
  | "filaments"
  | "costs";

const periodLabels: Record<PeriodKey, string> = {
  today: "Hoje",
  "7days": "Últimos 7 dias",
  month: "Este mês",
  previousMonth: "Mês anterior",
  "3months": "Últimos 3 meses",
  year: "Este ano",
};

const exportLabels: Record<ExportType, string> = {
  all: "Tudo",
  "revenue-profit": "Receita x Lucro",
  printers: "Desempenho das Impressoras",
  statuses: "Pedidos por Status",
  products: "Produtos Mais Vendidos",
  filaments: "Consumo de Filamentos",
  costs: "Custo dos Produtos",
};

const exportFileNames: Record<ExportType, string> = {
  all: "relatorio-completo",
  "revenue-profit": "relatorio-receita-x-lucro",
  printers: "relatorio-desempenho-impressoras",
  statuses: "relatorio-pedidos-por-status",
  products: "relatorio-produtos-mais-vendidos",
  filaments: "relatorio-consumo-filamentos",
  costs: "relatorio-custo-dos-produtos",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  printing: "Em impressão",
  paused: "Pausado",
  completed: "Concluído",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const statusClasses: Record<string, string> = {
  pending: "bg-white/5 text-slate-300 border-white/10",
  approved: "bg-blue-500/10 text-blue-300 border-blue-400/20",
  printing: "bg-orange-500/10 text-orange-300 border-orange-400/20",
  paused: "bg-yellow-500/10 text-yellow-300 border-yellow-400/20",
  completed: "bg-emerald-500/10 text-emerald-300 border-emerald-400/20",
  delivered: "bg-green-500/10 text-green-300 border-green-400/20",
  cancelled: "bg-red-500/10 text-red-300 border-red-400/20",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

function formatNumber(value: number, decimals = 0) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value || 0);
}

function formatDate(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatFullDate(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(date: Date) {
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
}

function getDateRange(period: PeriodKey): DateRange {
  const now = new Date();

  switch (period) {
    case "today":
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      };

    case "7days": {
      const start = startOfDay(now);
      start.setDate(start.getDate() - 6);

      return {
        start,
        end: endOfDay(now),
      };
    }

    case "previousMonth": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      return {
        start,
        end: new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
          23,
          59,
          59,
          999,
        ),
      };
    }

    case "3months": {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);

      return {
        start,
        end: endOfDay(now),
      };
    }

    case "year":
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: endOfDay(now),
      };

    case "month":
    default:
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
  }
}

function isDateInRange(dateString: string, range: DateRange) {
  const date = new Date(dateString);

  return date >= range.start && date <= range.end;
}

function isRevenueStatus(status: string) {
  return [
    "approved",
    "printing",
    "paused",
    "completed",
    "delivered",
  ].includes(status);
}

function isProductionCompletedStatus(status: string) {
  return ["completed", "delivered"].includes(status);
}

function truncateText(value: string, max = 38) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

export default function RelatoriosPage() {
  const [period, setPeriod] = useState<PeriodKey>("month");
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedExport, setSelectedExport] =
    useState<ExportType>("all");
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const { orders, loading: loadingOrders } = useOrders();
  const { products, loading: loadingProducts } = useProducts();
  const { printers, loading: loadingPrinters } = usePrinters();
  const { filaments, loading: loadingFilaments } = useFilaments();

  const range = useMemo(() => getDateRange(period), [period]);

  const periodOrders = useMemo(
    () =>
      orders.filter((order) =>
        isDateInRange(order.createdAt, range),
      ),
    [orders, range],
  );

  const revenueOrders = useMemo(
    () =>
      periodOrders.filter(
        (order) =>
          order.status !== "cancelled" &&
          order.status !== "pending" &&
          isRevenueStatus(order.status),
      ),
    [periodOrders],
  );

  const deliveredOrders = useMemo(
    () =>
      periodOrders.filter(
        (order) => order.status === "delivered",
      ),
    [periodOrders],
  );

  const productionOrders = useMemo(
    () =>
      periodOrders.filter((order) =>
        isProductionCompletedStatus(order.status),
      ),
    [periodOrders],
  );

  const monthlyRevenue = useMemo(
    () =>
      revenueOrders.reduce(
        (sum, order) => sum + (order.price || 0),
        0,
      ),
    [revenueOrders],
  );

  const monthlyProfit = useMemo(
    () =>
      deliveredOrders.reduce(
        (sum, order) =>
          sum + ((order.price || 0) - (order.cost || 0)),
        0,
      ),
    [deliveredOrders],
  );

  const totalCosts = useMemo(
    () =>
      deliveredOrders.reduce(
        (sum, order) => sum + (order.cost || 0),
        0,
      ),
    [deliveredOrders],
  );

  const profitMargin =
    monthlyRevenue > 0
      ? (monthlyProfit / monthlyRevenue) * 100
      : 0;

  const deliveredRevenue = useMemo(
    () =>
      deliveredOrders.reduce(
        (sum, order) => sum + (order.price || 0),
        0,
      ),
    [deliveredOrders],
  );

  const deliveredMargin =
    deliveredRevenue > 0
      ? (monthlyProfit / deliveredRevenue) * 100
      : 0;

  const totalHours = useMemo(
    () =>
      productionOrders.reduce(
        (sum, order) => sum + (order.totalHours || 0),
        0,
      ),
    [productionOrders],
  );

  const statusSummary = useMemo(() => {
    const statuses = [
      "pending",
      "approved",
      "printing",
      "paused",
      "completed",
      "delivered",
      "cancelled",
    ];

    return statuses.map((status) => ({
      status,
      label: statusLabels[status],
      count: periodOrders.filter(
        (order) => order.status === status,
      ).length,
    }));
  }, [periodOrders]);

  const productRanking = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        quantity: number;
        revenue: number;
        profit: number;
        cost: number;
      }
    >();

    revenueOrders.forEach((order) => {
      const key =
        order.productId ||
        order.productName ||
        order.id;

      const current = map.get(key) || {
        id: key,
        name: order.productName || "Produto sem nome",
        quantity: 0,
        revenue: 0,
        profit: 0,
        cost: 0,
      };

      current.quantity += order.quantity || 0;
      current.revenue += order.price || 0;

      if (order.status === "delivered") {
        current.cost += order.cost || 0;
        current.profit +=
          (order.price || 0) - (order.cost || 0);
      }

      map.set(key, current);
    });

    return Array.from(map.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);
  }, [revenueOrders]);

  const filamentRanking = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        grams: number;
        cost: number;
      }
    >();

    productionOrders.forEach((order) => {
      const key =
        order.filamentId ||
        order.filamentName ||
        order.id;

      const filament = filaments.find(
        (item) => item.id === order.filamentId,
      );

      const current = map.get(key) || {
        id: key,
        name:
          order.filamentName ||
          filament?.name ||
          "Filamento",
        grams: 0,
        cost: 0,
      };

      const grams = order.filamentGrams || 0;
      const costPerKg = filament?.costPerKg || 0;

      current.grams += grams;
      current.cost += (grams / 1000) * costPerKg;

      map.set(key, current);
    });

    return Array.from(map.values())
      .sort((a, b) => b.grams - a.grams)
      .slice(0, 8);
  }, [productionOrders, filaments]);

  const printerRanking = useMemo(() => {
    return printers
      .map((printer) => {
        const printerOrders = periodOrders.filter(
          (order) =>
            order.printerId === printer.id &&
            order.status !== "cancelled",
        );

        const completedOrders = orders.filter(
          (order) =>
            order.printerId === printer.id &&
            isProductionCompletedStatus(order.status),
        );

        const periodRevenue = printerOrders
          .filter((order) => isRevenueStatus(order.status))
          .reduce(
            (sum, order) => sum + (order.price || 0),
            0,
          );

        const periodProfit = printerOrders
          .filter((order) => order.status === "delivered")
          .reduce(
            (sum, order) =>
              sum + ((order.price || 0) - (order.cost || 0)),
            0,
          );

        const periodHours = printerOrders
          .filter((order) =>
            isProductionCompletedStatus(order.status),
          )
          .reduce(
            (sum, order) =>
              sum + (order.totalHours || 0),
            0,
          );

        const recovered = completedOrders.reduce(
          (sum, order) =>
            sum + ((order.price || 0) - (order.cost || 0)),
          0,
        );

        const purchasePrice = printer.purchasePrice || 0;

        const recoveryPercentage =
          purchasePrice > 0
            ? Math.min(
                100,
                (recovered / purchasePrice) * 100,
              )
            : 0;

        return {
          printer,
          orders: printerOrders.length,
          revenue: periodRevenue,
          profit: periodProfit,
          hours: periodHours,
          recovered,
          purchasePrice,
          recoveryPercentage,
        };
      })
      .sort((a, b) => b.profit - a.profit);
  }, [orders, periodOrders, printers]);

  const productCostRanking = useMemo(() => {
    return [...productRanking]
      .sort((a, b) => {
        const costA =
          a.quantity > 0 ? a.cost / a.quantity : 0;
        const costB =
          b.quantity > 0 ? b.cost / b.quantity : 0;

        return costB - costA;
      })
      .map((product) => ({
        ...product,
        unitCost:
          product.quantity > 0
            ? product.cost / product.quantity
            : 0,
        unitPrice:
          product.quantity > 0
            ? product.revenue / product.quantity
            : 0,
        margin:
          product.revenue > 0
            ? (product.profit / product.revenue) * 100
            : 0,
      }));
  }, [productRanking]);

  const chartData = useMemo(() => {
    if (period === "today") {
      return [
        {
          date: new Date(),
          label: "Hoje",
          revenue: monthlyRevenue,
          profit: monthlyProfit,
        },
      ];
    }

    const days: {
      date: Date;
      label: string;
      revenue: number;
      profit: number;
    }[] = [];

    const cursor = new Date(range.start);

    while (cursor <= range.end) {
      const dayStart = startOfDay(cursor);
      const dayEnd = endOfDay(cursor);

      const dayOrders = periodOrders.filter((order) => {
        const date = new Date(order.createdAt);

        return date >= dayStart && date <= dayEnd;
      });

      const revenue = dayOrders
        .filter(
          (order) =>
            order.status !== "cancelled" &&
            order.status !== "pending" &&
            isRevenueStatus(order.status),
        )
        .reduce(
          (sum, order) => sum + (order.price || 0),
          0,
        );

      const profit = dayOrders
        .filter((order) => order.status === "delivered")
        .reduce(
          (sum, order) =>
            sum + ((order.price || 0) - (order.cost || 0)),
          0,
        );

      days.push({
        date: new Date(cursor),
        label: formatDate(cursor),
        revenue,
        profit,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    if (days.length > 31) {
      const grouped: typeof days = [];

      for (let i = 0; i < days.length; i += 7) {
        const chunk = days.slice(i, i + 7);

        grouped.push({
          date: chunk[0].date,
          label: chunk[0].label,
          revenue: chunk.reduce(
            (sum, item) => sum + item.revenue,
            0,
          ),
          profit: chunk.reduce(
            (sum, item) => sum + item.profit,
            0,
          ),
        });
      }

      return grouped;
    }

    return days;
  }, [
    period,
    periodOrders,
    range,
    monthlyRevenue,
    monthlyProfit,
  ]);

  const chartMax = Math.max(
    ...chartData.map((item) =>
      Math.max(item.revenue, item.profit),
    ),
    1,
  );

  const topProduct = productRanking[0];
  const topFilament = filamentRanking[0];

  const insights = useMemo(() => {
    const result: {
      icon: typeof TrendingUp;
      title: string;
      text: string;
    }[] = [];

    if (topProduct) {
      result.push({
        icon: Package,
        title: "Produto em destaque",
        text: `${topProduct.name} foi o produto mais vendido no período, com ${formatNumber(
          topProduct.quantity,
        )} unidade(s).`,
      });
    }

    if (printerRanking[0]) {
      result.push({
        icon: PrinterIcon,
        title: "Impressora de maior resultado",
        text: `${printerRanking[0].printer.name} gerou ${formatCurrency(
          printerRanking[0].profit,
        )} de lucro no período.`,
      });
    }

    if (topFilament) {
      result.push({
        icon: Layers3,
        title: "Maior consumo",
        text: `${topFilament.name} foi o filamento mais utilizado, com ${formatNumber(
          topFilament.grams,
        )} g consumidos.`,
      });
    }

    if (profitMargin > 0) {
      result.push({
        icon: TrendingUp,
        title: "Margem atual",
        text: `A margem de lucro considerando as vendas do período está em ${formatNumber(
          profitMargin,
          1,
        )}%.`,
      });
    }

    return result.slice(0, 4);
  }, [
    topProduct,
    topFilament,
    printerRanking,
    profitMargin,
  ]);

  const loading =
    loadingOrders ||
    loadingProducts ||
    loadingPrinters ||
    loadingFilaments;

  async function generatePDF(type: ExportType) {
    if (generatingPDF) return;

    setGeneratingPDF(true);
    setExportOpen(false);

    try {
      const doc = new jsPDF();

      let logoData: string | null = null;

      try {
        const response = await fetch(logo.src);
        const blob = await response.blob();

        logoData = await new Promise<string>((resolve) => {
          const reader = new FileReader();

          reader.onloadend = () =>
            resolve(reader.result as string);

          reader.readAsDataURL(blob);
        });
      } catch {
        logoData = null;
      }

      const pageWidth = 210;
      const pageHeight = 297;

      const margin = 14;
      const contentWidth = pageWidth - margin * 2;

      let y = 0;

      const addPageHeader = (
        title: string,
        subtitle?: string,
      ) => {
        doc.setFillColor(10, 17, 32);
        doc.rect(0, 0, pageWidth, 28, "F");

        doc.setFillColor(253, 100, 1);
        doc.rect(0, 28, pageWidth, 1.2, "F");

        if (logoData) {
          doc.addImage(
            logoData,
            "PNG",
            14,
            5,
            17,
            17,
          );
        }

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);

        doc.text(
          "PrintFlow",
          logoData ? 37 : 14,
          14,
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(253, 100, 1);

        doc.text(
          title,
          logoData ? 37 : 14,
          20,
        );

        doc.setTextColor(180, 190, 205);
        doc.setFontSize(8);

        doc.text(
          "Período:",
          145,
          11,
        );

        doc.setTextColor(255, 255, 255);

        doc.text(
          `${formatFullDate(range.start)} a ${formatFullDate(
            range.end,
          )}`,
          196,
          11,
          {
            align: "right",
          },
        );

        doc.setTextColor(180, 190, 205);

        doc.text(
          "Gerado em:",
          145,
          19,
        );

        doc.setTextColor(255, 255, 255);

        doc.text(
          formatDateTime(new Date()),
          196,
          19,
          {
            align: "right",
          },
        );

        y = 41;

        if (subtitle) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(110, 110, 110);

          doc.text(subtitle, margin, y);

          y += 8;
        }
      };

      const addFooter = () => {
        const pageCount = doc.getNumberOfPages();

        for (let page = 1; page <= pageCount; page++) {
          doc.setPage(page);

          doc.setDrawColor(225, 225, 225);
          doc.line(
            margin,
            pageHeight - 17,
            pageWidth - margin,
            pageHeight - 17,
          );

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(130, 130, 130);

          doc.text(
            "PrintFlow • Relatório gerencial",
            margin,
            pageHeight - 10,
          );

          doc.text(
            `Página ${page} de ${pageCount}`,
            pageWidth - margin,
            pageHeight - 10,
            {
              align: "right",
            },
          );
        }
      };

      const ensureSpace = (height: number) => {
        if (y + height > pageHeight - 25) {
          doc.addPage();

          const currentTitle =
            exportLabels[type];

          addPageHeader(
            currentTitle,
            `Continuação do relatório • ${periodLabels[period]}`,
          );
        }
      };

      const sectionTitle = (
        title: string,
        subtitle?: string,
      ) => {
        ensureSpace(18);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(25, 25, 25);

        doc.text(title, margin, y);

        y += 5;

        doc.setDrawColor(253, 100, 1);
        doc.setLineWidth(0.8);

        doc.line(
          margin,
          y,
          margin + 28,
          y,
        );

        y += 5;

        if (subtitle) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(115, 115, 115);

          doc.text(subtitle, margin, y);

          y += 6;
        }
      };

      const drawSummaryCard = (
        x: number,
        width: number,
        label: string,
        value: string,
        description: string,
      ) => {
        doc.setFillColor(247, 248, 250);
        doc.roundedRect(
          x,
          y,
          width,
          29,
          2,
          2,
          "F",
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);

        doc.text(label, x + 5, y + 7);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(25, 25, 25);

        doc.text(value, x + 5, y + 16);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(125, 125, 125);

        doc.text(
          truncateText(description, 30),
          x + 5,
          y + 23,
        );
      };

      const drawTableHeader = (
        columns: {
          label: string;
          x: number;
          align?: "left" | "right";
        }[],
      ) => {
        ensureSpace(14);

        doc.setFillColor(245, 246, 248);
        doc.rect(
          margin,
          y - 4,
          contentWidth,
          9,
          "F",
        );

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(75, 75, 75);

        columns.forEach((column) => {
          doc.text(
            column.label,
            column.x,
            y + 1,
            column.align === "right"
              ? { align: "right" }
              : undefined,
          );
        });

        y += 10;
      };

      const drawTableRow = (
        values: {
          value: string;
          x: number;
          align?: "left" | "right";
        }[],
      ) => {
        ensureSpace(10);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);

        values.forEach((item) => {
          doc.text(
            truncateText(item.value, 35),
            item.x,
            y,
            item.align === "right"
              ? { align: "right" }
              : undefined,
          );
        });

        doc.setDrawColor(232, 232, 232);

        doc.line(
          margin,
          y + 3,
          pageWidth - margin,
          y + 3,
        );

        y += 8;
      };

      const drawEmptyPDF = (message: string) => {
        ensureSpace(30);

        doc.setFillColor(247, 248, 250);

        doc.roundedRect(
          margin,
          y,
          contentWidth,
          25,
          2,
          2,
          "F",
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(110, 110, 110);

        doc.text(
          message,
          pageWidth / 2,
          y + 14,
          {
            align: "center",
          },
        );

        y += 34;
      };

      const drawRevenueProfit = () => {
        sectionTitle(
          "Receita x Lucro",
          "Evolução financeira do período selecionado.",
        );

        const cardGap = 4;
        const cardWidth =
          (contentWidth - cardGap * 3) / 4;

        drawSummaryCard(
          margin,
          cardWidth,
          "RECEITA",
          formatCurrency(monthlyRevenue),
          "Vendas aprovadas ou posteriores",
        );

        drawSummaryCard(
          margin + cardWidth + cardGap,
          cardWidth,
          "LUCRO",
          formatCurrency(monthlyProfit),
          "Somente pedidos entregues",
        );

        drawSummaryCard(
          margin + (cardWidth + cardGap) * 2,
          cardWidth,
          "CUSTOS",
          formatCurrency(totalCosts),
          "Custos dos pedidos entregues",
        );

        drawSummaryCard(
          margin + (cardWidth + cardGap) * 3,
          cardWidth,
          "MARGEM",
          `${formatNumber(profitMargin, 1)}%`,
          "Lucro sobre a receita",
        );

        y += 37;

        if (
          chartData.every(
            (item) =>
              item.revenue === 0 &&
              item.profit === 0,
          )
        ) {
          drawEmptyPDF(
            "Ainda não existem dados financeiros para este período.",
          );

          return;
        }

        sectionTitle(
          "Evolução do período",
          "Valores agrupados por dia ou semana.",
        );

        const chartHeight = 55;
        const chartWidth = contentWidth;
        const chartBottom = y + chartHeight;

        doc.setDrawColor(225, 225, 225);

        doc.line(
          margin,
          chartBottom,
          margin + chartWidth,
          chartBottom,
        );

        const step =
          chartData.length > 0
            ? chartWidth / chartData.length
            : chartWidth;

        chartData.forEach((item, index) => {
          const x =
            margin +
            step * index +
            step / 2;

          const revenueHeight =
            item.revenue > 0
              ? Math.max(
                  2,
                  (item.revenue / chartMax) *
                    chartHeight,
                )
              : 1;

          const profitHeight =
            item.profit > 0
              ? Math.max(
                  2,
                  (item.profit / chartMax) *
                    chartHeight,
                )
              : 1;

          doc.setFillColor(253, 100, 1);

          doc.rect(
            x - 3.5,
            chartBottom - revenueHeight,
            3,
            revenueHeight,
            "F",
          );

          doc.setFillColor(52, 211, 153);

          doc.rect(
            x + 0.5,
            chartBottom - profitHeight,
            3,
            profitHeight,
            "F",
          );

          if (
            index === 0 ||
            index === chartData.length - 1 ||
            chartData.length <= 12 ||
            index % 3 === 0
          ) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(6);
            doc.setTextColor(120, 120, 120);

            doc.text(
              item.label,
              x,
              chartBottom + 5,
              {
                align: "center",
              },
            );
          }
        });

        y = chartBottom + 14;

        doc.setFontSize(7.5);
        doc.setTextColor(90, 90, 90);

        doc.setFillColor(253, 100, 1);
        doc.rect(margin, y - 3, 3, 3, "F");

        doc.text(
          "Receita",
          margin + 6,
          y,
        );

        doc.setFillColor(52, 211, 153);
        doc.rect(margin + 35, y - 3, 3, 3, "F");

        doc.text(
          "Lucro",
          margin + 41,
          y,
        );

        y += 10;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(110, 110, 110);

        doc.text(
          `Receita reconhecida: ${formatCurrency(
            monthlyRevenue,
          )}`,
          margin,
          y,
        );

        doc.text(
          `Lucro realizado: ${formatCurrency(
            monthlyProfit,
          )}`,
          196,
          y,
          {
            align: "right",
          },
        );

        y += 10;
      };

      const drawPrinters = () => {
        sectionTitle(
          "Desempenho das Impressoras",
          "Resultado no período e recuperação histórica do investimento.",
        );

        if (printerRanking.length === 0) {
          drawEmptyPDF(
            "Nenhuma impressora encontrada.",
          );

          return;
        }

        drawTableHeader([
          {
            label: "Impressora",
            x: 14,
          },
          {
            label: "Pedidos",
            x: 112,
            align: "right",
          },
          {
            label: "Horas",
            x: 138,
            align: "right",
          },
          {
            label: "Lucro",
            x: 168,
            align: "right",
          },
          {
            label: "Recuperado",
            x: 196,
            align: "right",
          },
        ]);

        printerRanking.forEach((item) => {
          drawTableRow([
            {
              value: item.printer.name,
              x: 14,
            },
            {
              value: String(item.orders),
              x: 112,
              align: "right",
            },
            {
              value: `${formatNumber(item.hours, 1)}h`,
              x: 138,
              align: "right",
            },
            {
              value: formatCurrency(item.profit),
              x: 168,
              align: "right",
            },
            {
              value: item.purchasePrice
                ? `${formatCurrency(
                    item.recovered,
                  )} (${formatNumber(
                    item.recoveryPercentage,
                    0,
                  )}%)`
                : "Sem investimento",
              x: 196,
              align: "right",
            },
          ]);
        });

        y += 4;

        sectionTitle(
          "Recuperação do investimento",
          "Acumulado desde o primeiro pedido concluído ou entregue.",
        );

        printerRanking.forEach((item) => {
          ensureSpace(18);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(45, 45, 45);

          doc.text(
            item.printer.name,
            margin,
            y,
          );

          if (!item.purchasePrice) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(120, 120, 120);

            doc.text(
              "Valor de compra não informado.",
              margin,
              y + 6,
            );

            y += 14;

            return;
          }

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(100, 100, 100);

          doc.text(
            `${formatCurrency(
              item.recovered,
            )} de ${formatCurrency(
              item.purchasePrice,
            )}`,
            196,
            y,
            {
              align: "right",
            },
          );

          y += 5;

          doc.setFillColor(232, 232, 232);

          doc.roundedRect(
            margin,
            y,
            contentWidth,
            3,
            1.5,
            1.5,
            "F",
          );

          doc.setFillColor(253, 100, 1);

          doc.roundedRect(
            margin,
            y,
            contentWidth *
              (item.recoveryPercentage / 100),
            3,
            1.5,
            1.5,
            "F",
          );

          y += 8;
        });
      };

      const drawStatuses = () => {
        sectionTitle(
          "Pedidos por Status",
          "Distribuição dos pedidos registrados no período.",
        );

        if (periodOrders.length === 0) {
          drawEmptyPDF(
            "Nenhum pedido encontrado no período.",
          );

          return;
        }

        drawTableHeader([
          {
            label: "Status",
            x: 14,
          },
          {
            label: "Quantidade",
            x: 105,
            align: "right",
          },
          {
            label: "Participação",
            x: 145,
            align: "right",
          },
        ]);

        statusSummary.forEach((item) => {
          const percentage =
            periodOrders.length > 0
              ? (item.count / periodOrders.length) * 100
              : 0;

          drawTableRow([
            {
              value: item.label,
              x: 14,
            },
            {
              value: String(item.count),
              x: 105,
              align: "right",
            },
            {
              value: `${formatNumber(
                percentage,
                1,
              )}%`,
              x: 145,
              align: "right",
            },
          ]);
        });

        y += 4;

        const cardWidth =
          (contentWidth - 4) / 2;

        drawSummaryCard(
          margin,
          cardWidth,
          "TOTAL DE PEDIDOS",
          String(periodOrders.length),
          "Pedidos registrados no período",
        );

        drawSummaryCard(
          margin + cardWidth + 4,
          cardWidth,
          "HORAS PRODUZIDAS",
          `${formatNumber(totalHours, 1)}h`,
          "Pedidos concluídos ou entregues",
        );

        y += 37;
      };

      const drawProducts = () => {
        sectionTitle(
          "Produtos Mais Vendidos",
          "Ranking dos produtos por quantidade vendida.",
        );

        if (productRanking.length === 0) {
          drawEmptyPDF(
            "Ainda não existem vendas de produtos neste período.",
          );

          return;
        }

        drawTableHeader([
          {
            label: "#",
            x: 14,
          },
          {
            label: "Produto",
            x: 27,
          },
          {
            label: "Quantidade",
            x: 115,
            align: "right",
          },
          {
            label: "Receita",
            x: 150,
            align: "right",
          },
          {
            label: "Lucro",
            x: 196,
            align: "right",
          },
        ]);

        productRanking.forEach((product, index) => {
          drawTableRow([
            {
              value: String(index + 1).padStart(2, "0"),
              x: 14,
            },
            {
              value: product.name,
              x: 27,
            },
            {
              value: formatNumber(
                product.quantity,
              ),
              x: 115,
              align: "right",
            },
            {
              value: formatCurrency(
                product.revenue,
              ),
              x: 150,
              align: "right",
            },
            {
              value: formatCurrency(
                product.profit,
              ),
              x: 196,
              align: "right",
            },
          ]);
        });

        y += 4;
      };

      const drawFilaments = () => {
        sectionTitle(
          "Consumo de Filamentos",
          "Material utilizado nas impressões concluídas.",
        );

        if (filamentRanking.length === 0) {
          drawEmptyPDF(
            "Ainda não existem dados de consumo neste período.",
          );

          return;
        }

        drawTableHeader([
          {
            label: "#",
            x: 14,
          },
          {
            label: "Filamento",
            x: 27,
          },
          {
            label: "Consumo",
            x: 130,
            align: "right",
          },
          {
            label: "Custo estimado",
            x: 170,
            align: "right",
          },
        ]);

        filamentRanking.forEach((filament, index) => {
          drawTableRow([
            {
              value: String(index + 1).padStart(2, "0"),
              x: 14,
            },
            {
              value: filament.name,
              x: 27,
            },
            {
              value: `${formatNumber(
                filament.grams,
              )} g`,
              x: 130,
              align: "right",
            },
            {
              value: formatCurrency(
                filament.cost,
              ),
              x: 170,
              align: "right",
            },
          ]);
        });

        y += 4;

        const totalGrams = filamentRanking.reduce(
          (sum, item) => sum + item.grams,
          0,
        );

        const totalFilamentCost =
          filamentRanking.reduce(
            (sum, item) => sum + item.cost,
            0,
          );

        drawSummaryCard(
          margin,
          (contentWidth - 4) / 2,
          "CONSUMO TOTAL",
          `${formatNumber(totalGrams)} g`,
          "Filamento utilizado no período",
        );

        drawSummaryCard(
          margin +
            (contentWidth - 4) / 2 +
            4,
          (contentWidth - 4) / 2,
          "CUSTO ESTIMADO",
          formatCurrency(totalFilamentCost),
          "Com base no custo atual cadastrado",
        );

        y += 37;
      };

      const drawCosts = () => {
        sectionTitle(
          "Custo dos Produtos",
          "Custos e margem dos produtos com pedidos entregues.",
        );

        if (productCostRanking.length === 0) {
          drawEmptyPDF(
            "Ainda não existem custos realizados no período.",
          );

          return;
        }

        drawTableHeader([
          {
            label: "Produto",
            x: 14,
          },
          {
            label: "Qtd.",
            x: 92,
            align: "right",
          },
          {
            label: "Custo unit.",
            x: 125,
            align: "right",
          },
          {
            label: "Preço unit.",
            x: 160,
            align: "right",
          },
          {
            label: "Margem",
            x: 196,
            align: "right",
          },
        ]);

        productCostRanking.forEach((product) => {
          drawTableRow([
            {
              value: product.name,
              x: 14,
            },
            {
              value: formatNumber(
                product.quantity,
              ),
              x: 92,
              align: "right",
            },
            {
              value: formatCurrency(
                product.unitCost,
              ),
              x: 125,
              align: "right",
            },
            {
              value: formatCurrency(
                product.unitPrice,
              ),
              x: 160,
              align: "right",
            },
            {
              value: `${formatNumber(
                product.margin,
                1,
              )}%`,
              x: 196,
              align: "right",
            },
          ]);
        });

        y += 4;

        const totalProductCost =
          productCostRanking.reduce(
            (sum, product) =>
              sum + product.cost,
            0,
          );

        const totalProductProfit =
          productCostRanking.reduce(
            (sum, product) =>
              sum + product.profit,
            0,
          );

        const averageMargin =
          deliveredRevenue > 0
            ? (totalProductProfit /
                deliveredRevenue) *
              100
            : 0;

        const cardWidth =
          (contentWidth - 8) / 3;

        drawSummaryCard(
          margin,
          cardWidth,
          "CUSTO REALIZADO",
          formatCurrency(totalProductCost),
          "Pedidos entregues",
        );

        drawSummaryCard(
          margin + cardWidth + 4,
          cardWidth,
          "LUCRO REALIZADO",
          formatCurrency(totalProductProfit),
          "Preço menos custo",
        );

        drawSummaryCard(
          margin +
            (cardWidth + 4) * 2,
          cardWidth,
          "MARGEM",
          `${formatNumber(
            averageMargin,
            1,
          )}%`,
          "Margem das entregas",
        );

        y += 37;
      };

      const drawInsights = () => {
        sectionTitle(
          "Insights da Operação",
          "Destaques calculados a partir dos dados do período.",
        );

        if (insights.length === 0) {
          drawEmptyPDF(
            "Ainda não existem dados suficientes para gerar insights.",
          );

          return;
        }

        insights.forEach((insight) => {
          ensureSpace(28);

          doc.setFillColor(247, 248, 250);

          doc.roundedRect(
            margin,
            y,
            contentWidth,
            23,
            2,
            2,
            "F",
          );

          doc.setFillColor(253, 100, 1);

          doc.roundedRect(
            margin + 5,
            y + 6,
            3,
            11,
            1,
            1,
            "F",
          );

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(40, 40, 40);

          doc.text(
            insight.title,
            margin + 14,
            y + 8,
          );

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(100, 100, 100);

          const lines = doc.splitTextToSize(
            insight.text,
            contentWidth - 20,
          );

          doc.text(
            lines.slice(0, 2),
            margin + 14,
            y + 14,
          );

          y += 28;
        });
      };

      if (type === "all") {
        addPageHeader(
          "Relatório completo",
          "Visão geral financeira e operacional.",
        );

        drawRevenueProfit();
        drawPrinters();
        drawStatuses();
        drawProducts();
        drawFilaments();
        drawCosts();
        drawInsights();
      } else {
        addPageHeader(
          exportLabels[type],
          `Relatório de ${periodLabels[period].toLowerCase()}.`,
        );

        switch (type) {
          case "revenue-profit":
            drawRevenueProfit();
            break;

          case "printers":
            drawPrinters();
            break;

          case "statuses":
            drawStatuses();
            break;

          case "products":
            drawProducts();
            break;

          case "filaments":
            drawFilaments();
            break;

          case "costs":
            drawCosts();
            break;
        }
      }

      addFooter();

      doc.save(
        `${exportFileNames[type]}-${period}.pdf`,
      );
    } catch (error) {
      console.error(
        "Erro ao gerar relatório em PDF:",
        error,
      );
    } finally {
      setGeneratingPDF(false);
    }
  }

  return (
    <div className="min-h-full bg-[#020617] text-white">
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-orange-400">
              <BarChart3 className="h-4 w-4" />
              Análise da operação
            </div>

            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Relatórios
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Acompanhe o desempenho financeiro e operacional da
              sua produção.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Export */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setExportOpen((value) => !value)
                }
                disabled={generatingPDF || loading}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 text-sm font-medium text-orange-300 transition hover:border-orange-500/40 hover:bg-orange-500/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" />

                {generatingPDF
                  ? "Gerando PDF..."
                  : "Exportar relatório"}

                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    exportOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {exportOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Fechar menu"
                    onClick={() => setExportOpen(false)}
                    className="fixed inset-0 z-30 cursor-default"
                  />

                  <div className="absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#0a1120] p-2 shadow-2xl shadow-black/40">
                    <div className="px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Exportar como PDF
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Escolha qual parte do relatório deseja
                        exportar.
                      </p>
                    </div>

                    <div className="my-1 h-px bg-white/5" />

                    {(
                      Object.keys(
                        exportLabels,
                      ) as ExportType[]
                    ).map((type) => {
                      const active =
                        selectedExport === type;

                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setSelectedExport(type);
                            generatePDF(type);
                          }}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                            active
                              ? "bg-orange-500/10 text-orange-300"
                              : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                              active
                                ? "bg-orange-500/10 text-orange-400"
                                : "bg-white/5 text-slate-500"
                            }`}
                          >
                            {type === "all" ? (
                              <FileText className="h-4 w-4" />
                            ) : type ===
                              "revenue-profit" ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : type === "printers" ? (
                              <PrinterIcon className="h-4 w-4" />
                            ) : type === "statuses" ? (
                              <Package className="h-4 w-4" />
                            ) : type === "products" ? (
                              <Boxes className="h-4 w-4" />
                            ) : type === "filaments" ? (
                              <Layers3 className="h-4 w-4" />
                            ) : (
                              <Wallet className="h-4 w-4" />
                            )}
                          </div>

                          <span className="text-sm font-medium">
                            {exportLabels[type]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Period */}
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <select
                value={period}
                onChange={(e) =>
                  setPeriod(
                    e.target.value as PeriodKey,
                  )
                }
                className="h-11 appearance-none rounded-xl border border-white/10 bg-[#0a1120] pl-10 pr-10 text-sm font-medium text-white outline-none transition focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10"
              >
                {Object.entries(
                  periodLabels,
                ).map(([value, label]) => (
                  <option
                    key={value}
                    value={value}
                    className="bg-[#0a1120]"
                  >
                    {label}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Selected export helper */}
        <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FileText className="h-4 w-4 text-orange-400" />

            <span>
              PDF selecionado:
            </span>

            <span className="font-medium text-slate-300">
              {exportLabels[selectedExport]}
            </span>
          </div>

          <span className="text-xs text-slate-600">
            Período: {periodLabels[period]}
          </span>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
              />
            ))}
          </div>
        ) : (
          <>
            {/* Financial summary */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                icon={CircleDollarSign}
                label="Receita"
                value={formatCurrency(monthlyRevenue)}
                description="Vendas aprovadas ou posteriores"
                accent="orange"
              />

              <SummaryCard
                icon={TrendingUp}
                label="Lucro"
                value={formatCurrency(monthlyProfit)}
                description="Somente pedidos entregues"
                accent="green"
              />

              <SummaryCard
                icon={Wallet}
                label="Custos"
                value={formatCurrency(totalCosts)}
                description="Custos dos pedidos entregues"
                accent="blue"
              />

              <SummaryCard
                icon={Activity}
                label="Margem"
                value={`${formatNumber(
                  profitMargin,
                  1,
                )}%`}
                description="Lucro sobre a receita"
                accent="purple"
              />
            </div>

            {/* Main chart */}
            <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a1120]">
              <div className="flex flex-col gap-2 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-semibold">
                    Receita x Lucro
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Evolução financeira no período selecionado.
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                    Receita
                  </span>

                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    Lucro
                  </span>
                </div>
              </div>

              <div className="p-5">
                {chartData.every(
                  (item) =>
                    item.revenue === 0 &&
                    item.profit === 0,
                ) ? (
                  <EmptyState
                    icon={BarChart3}
                    text="Ainda não existem dados financeiros para este período."
                  />
                ) : (
                  <div className="flex h-72 items-end gap-2 overflow-x-auto pb-8 pt-6">
                    {chartData.map(
                      (item, index) => {
                        const revenueHeight =
                          item.revenue > 0
                            ? Math.max(
                                6,
                                (item.revenue /
                                  chartMax) *
                                  100,
                              )
                            : 2;

                        const profitHeight =
                          item.profit > 0
                            ? Math.max(
                                6,
                                (item.profit /
                                  chartMax) *
                                  100,
                              )
                            : 2;

                        return (
                          <div
                            key={`${item.label}-${index}`}
                            className="group relative flex min-w-[42px] flex-1 items-end justify-center gap-1"
                          >
                            <div className="relative flex h-full w-4 items-end">
                              <div
                                className="w-full rounded-t-md bg-orange-500/80 transition-all group-hover:bg-orange-400"
                                style={{
                                  height: `${revenueHeight}%`,
                                }}
                                title={`Receita: ${formatCurrency(
                                  item.revenue,
                                )}`}
                              />
                            </div>

                            <div className="relative flex h-full w-4 items-end">
                              <div
                                className="w-full rounded-t-md bg-emerald-400/80 transition-all group-hover:bg-emerald-300"
                                style={{
                                  height: `${profitHeight}%`,
                                }}
                                title={`Lucro: ${formatCurrency(
                                  item.profit,
                                )}`}
                              />
                            </div>

                            <span className="absolute top-full mt-2 whitespace-nowrap text-[10px] text-slate-600">
                              {item.label}
                            </span>
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Operation */}
            <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
              {/* Printers */}
              <section className="rounded-2xl border border-white/10 bg-[#0a1120]">
                <div className="border-b border-white/10 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                      <PrinterIcon className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="font-semibold">
                        Desempenho das impressoras
                      </h2>

                      <p className="text-xs text-slate-500">
                        Resultado no período e recuperação do
                        investimento.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-white/5">
                  {printerRanking.length === 0 ? (
                    <div className="p-6">
                      <EmptyState
                        icon={PrinterIcon}
                        text="Nenhuma impressora encontrada."
                      />
                    </div>
                  ) : (
                    printerRanking.map((item) => (
                      <div
                        key={item.printer.id}
                        className="p-5"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#111827]">
                              {item.printer.imageUrl ? (
                                <img
                                  src={
                                    item.printer.imageUrl
                                  }
                                  alt={
                                    item.printer.name
                                  }
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <PrinterIcon className="h-5 w-5 text-slate-500" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate font-medium">
                                  {
                                    item.printer
                                      .name
                                  }
                                </p>

                                {item.printer
                                  .isPrimary && (
                                  <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-300">
                                    Principal
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-500">
                                {
                                  item.printer
                                    .manufacturer
                                }{" "}
                                {
                                  item.printer
                                    .model
                                }
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-5 text-right">
                            <Metric
                              label="Pedidos"
                              value={String(
                                item.orders,
                              )}
                            />

                            <Metric
                              label="Horas"
                              value={`${formatNumber(
                                item.hours,
                                1,
                              )}h`}
                            />

                            <Metric
                              label="Lucro"
                              value={formatCurrency(
                                item.profit,
                              )}
                            />
                          </div>
                        </div>

                        {item.purchasePrice ? (
                          <div className="mt-5">
                            <div className="mb-2 flex items-center justify-between text-xs">
                              <span className="text-slate-400">
                                Recuperação do investimento
                              </span>

                              <span className="font-medium text-slate-200">
                                {formatCurrency(
                                  item.recovered,
                                )}{" "}
                                /{" "}
                                {formatCurrency(
                                  item.purchasePrice,
                                )}
                              </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-white/5">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all"
                                style={{
                                  width: `${item.recoveryPercentage}%`,
                                }}
                              />
                            </div>

                            <div className="mt-2 flex items-center justify-between text-[11px]">
                              <span className="text-slate-600">
                                Recuperado desde o primeiro
                                pedido
                              </span>

                              <span className="text-orange-300">
                                {formatNumber(
                                  item.recoveryPercentage,
                                  0,
                                )}
                                %
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-4 text-xs text-slate-600">
                            Informe o valor de compra da
                            impressora para acompanhar a
                            recuperação do investimento.
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Order status */}
              <section className="rounded-2xl border border-white/10 bg-[#0a1120]">
                <div className="border-b border-white/10 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                      <Package className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="font-semibold">
                        Pedidos por status
                      </h2>

                      <p className="text-xs text-slate-500">
                        Distribuição dos pedidos no período.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  {statusSummary.map((item) => {
                    const percentage =
                      periodOrders.length > 0
                        ? (item.count /
                            periodOrders.length) *
                          100
                        : 0;

                    return (
                      <div key={item.status}>
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full border px-2 py-1 text-[10px] font-medium ${
                                statusClasses[
                                  item.status
                                ]
                              }`}
                            >
                              {item.label}
                            </span>
                          </div>

                          <span className="text-sm font-semibold text-slate-200">
                            {item.count}
                          </span>
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-white/30"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/5 pt-5">
                    <MiniStat
                      icon={Boxes}
                      label="Total"
                      value={String(
                        periodOrders.length,
                      )}
                    />

                    <MiniStat
                      icon={Clock3}
                      label="Horas produzidas"
                      value={`${formatNumber(
                        totalHours,
                        1,
                      )}h`}
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Products and filament */}
            <div className="grid gap-6 xl:grid-cols-2">
              {/* Products */}
              <section className="rounded-2xl border border-white/10 bg-[#0a1120]">
                <div className="flex items-center justify-between border-b border-white/10 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                      <Package className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="font-semibold">
                        Produtos mais vendidos
                      </h2>

                      <p className="text-xs text-slate-500">
                        Ranking por quantidade vendida.
                      </p>
                    </div>
                  </div>

                  <span className="text-xs text-slate-500">
                    {products.length} cadastrados
                  </span>
                </div>

                <div className="divide-y divide-white/5">
                  {productRanking.length === 0 ? (
                    <div className="p-6">
                      <EmptyState
                        icon={Package}
                        text="Ainda não existem vendas de produtos neste período."
                      />
                    </div>
                  ) : (
                    productRanking.map(
                      (product, index) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-4 p-4"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm font-bold text-slate-400">
                            {String(
                              index + 1,
                            ).padStart(2, "0")}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-200">
                              {product.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatNumber(
                                product.quantity,
                              )}{" "}
                              unidade(s)
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-semibold text-slate-200">
                              {formatCurrency(
                                product.revenue,
                              )}
                            </p>

                            <p className="mt-1 text-xs text-emerald-400">
                              Lucro realizado:{" "}
                              {formatCurrency(
                                product.profit,
                              )}
                            </p>
                          </div>
                        </div>
                      ),
                    )
                  )}
                </div>
              </section>

              {/* Filaments */}
              <section className="rounded-2xl border border-white/10 bg-[#0a1120]">
                <div className="border-b border-white/10 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                      <Layers3 className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="font-semibold">
                        Consumo de filamento
                      </h2>

                      <p className="text-xs text-slate-500">
                        Material utilizado nas impressões concluídas.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-white/5">
                  {filamentRanking.length === 0 ? (
                    <div className="p-6">
                      <EmptyState
                        icon={Layers3}
                        text="Ainda não existem dados de consumo neste período."
                      />
                    </div>
                  ) : (
                    filamentRanking.map(
                      (filament, index) => {
                        const maxGrams =
                          filamentRanking[0]
                            ?.grams || 1;

                        const percentage =
                          (filament.grams /
                            maxGrams) *
                          100;

                        return (
                          <div
                            key={filament.id}
                            className="p-4"
                          >
                            <div className="mb-2 flex items-center justify-between gap-4">
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="text-xs font-semibold text-slate-600">
                                  {String(
                                    index + 1,
                                  ).padStart(
                                    2,
                                    "0",
                                  )}
                                </span>

                                <span className="truncate text-sm font-medium text-slate-200">
                                  {filament.name}
                                </span>
                              </div>

                              <div className="text-right">
                                <span className="text-sm font-semibold text-slate-200">
                                  {formatNumber(
                                    filament.grams,
                                  )}{" "}
                                  g
                                </span>

                                <p className="text-[11px] text-slate-500">
                                  {formatCurrency(
                                    filament.cost,
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                              <div
                                className="h-full rounded-full bg-cyan-400/70"
                                style={{
                                  width: `${percentage}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      },
                    )
                  )}
                </div>
              </section>
            </div>

            {/* Product costs */}
            <section className="rounded-2xl border border-white/10 bg-[#0a1120]">
              <div className="border-b border-white/10 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <Wallet className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      Custo dos produtos
                    </h2>

                    <p className="text-xs text-slate-500">
                      Custos realizados, preço médio e margem por produto.
                    </p>
                  </div>
                </div>
              </div>

              {productCostRanking.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={Wallet}
                    text="Ainda não existem custos realizados neste período."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-white/5 text-left">
                        <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-slate-600">
                          Produto
                        </th>

                        <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-wider text-slate-600">
                          Qtd.
                        </th>

                        <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-wider text-slate-600">
                          Custo unit.
                        </th>

                        <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-wider text-slate-600">
                          Preço unit.
                        </th>

                        <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-wider text-slate-600">
                          Margem
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-white/5">
                      {productCostRanking.map(
                        (product) => (
                          <tr
                            key={product.id}
                            className="transition hover:bg-white/[0.02]"
                          >
                            <td className="px-5 py-4">
                              <p className="text-sm font-medium text-slate-200">
                                {product.name}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-right text-sm text-slate-400">
                              {formatNumber(
                                product.quantity,
                              )}
                            </td>

                            <td className="px-5 py-4 text-right text-sm text-slate-400">
                              {formatCurrency(
                                product.unitCost,
                              )}
                            </td>

                            <td className="px-5 py-4 text-right text-sm text-slate-300">
                              {formatCurrency(
                                product.unitPrice,
                              )}
                            </td>

                            <td className="px-5 py-4 text-right">
                              <span className="text-sm font-medium text-emerald-400">
                                {formatNumber(
                                  product.margin,
                                  1,
                                )}
                                %
                              </span>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Insights */}
            <section className="rounded-2xl border border-orange-500/10 bg-gradient-to-br from-[#0a1120] to-[#0d1422]">
              <div className="border-b border-white/10 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                    <BarChart3 className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      Insights da operação
                    </h2>

                    <p className="text-xs text-slate-500">
                      Alguns destaques calculados a partir dos seus
                      dados.
                    </p>
                  </div>
                </div>
              </div>

              {insights.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={BarChart3}
                    text="Assim que sua operação tiver mais dados, os insights aparecerão aqui."
                  />
                </div>
              ) : (
                <div className="grid gap-3 p-5 md:grid-cols-2">
                  {insights.map(
                    (insight, index) => {
                      const Icon = insight.icon;

                      return (
                        <div
                          key={`${insight.title}-${index}`}
                          className="rounded-xl border border-white/5 bg-white/[0.025] p-4"
                        >
                          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                            <Icon className="h-4 w-4" />
                          </div>

                          <p className="text-sm font-semibold text-slate-200">
                            {insight.title}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {insight.text}
                          </p>
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
  accent,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  description: string;
  accent:
    | "orange"
    | "green"
    | "blue"
    | "purple";
}) {
  const accents = {
    orange: {
      icon: "bg-orange-500/10 text-orange-400",
      value: "text-white",
    },
    green: {
      icon: "bg-emerald-500/10 text-emerald-400",
      value: "text-emerald-300",
    },
    blue: {
      icon: "bg-blue-500/10 text-blue-400",
      value: "text-white",
    },
    purple: {
      icon: "bg-purple-500/10 text-purple-400",
      value: "text-white",
    },
  };

  const styles = accents[accent];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a1120] p-5 transition-colors hover:border-white/15">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">
            {label}
          </p>

          <p
            className={`mt-2 text-2xl font-bold tracking-tight ${styles.value}`}
          >
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-600">
        {description}
      </p>
    </div>
  );
}

function Metric({
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

      <p className="mt-1 text-sm font-semibold text-slate-200">
        {value}
      </p>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Boxes;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-3.5 w-3.5" />

        <span className="text-[10px] uppercase tracking-wider">
          {label}
        </span>
      </div>

      <p className="mt-2 text-sm font-semibold text-slate-200">
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  text,
}: {
  icon: typeof BarChart3;
  text: string;
}) {
  return (
    <div className="flex min-h-[140px] flex-col items-center justify-center text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-600">
        <Icon className="h-5 w-5" />
      </div>

      <p className="max-w-sm text-xs leading-5 text-slate-600">
        {text}
      </p>
    </div>
  );
}