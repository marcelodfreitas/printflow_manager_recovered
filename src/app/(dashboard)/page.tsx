"use client";

import {
  ArrowUpRight,
  CalendarDays,
  Calculator,
  CheckCircle2,
  Clock3,
  Crown,
  DollarSign,
  Package,
  Printer,
  UploadCloud,
  Users,
  WalletCards,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useClients } from "@/hooks/useClients";
import { useFilaments } from "@/hooks/useFilaments";
import { useOrders } from "@/hooks/useOrders";
import { usePrinters } from "@/hooks/usePrinters";
import { formatCurrency, translateStatus } from "@/lib/utils";
import { RevenueChart } from "@/components/dashboard/RevenueChart";

import { createClient } from "@/lib/supabase/client";

function formatWeight(grams: number) {
  if (grams >= 1000) {
    return `${(grams / 1000).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} kg`;
  }

  return `${grams.toLocaleString("pt-BR", {
    maximumFractionDigits: 0,
  })} g`;
}

function formatHours(hours: number) {
  if (hours <= 0) return "0h";

  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (wholeHours === 0) {
    return `${minutes}min`;
  }

  if (minutes === 0) {
    return `${wholeHours}h`;
  }

  return `${wholeHours}h ${minutes}min`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function isCurrentMonth(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function isCompletedOrder(status: string) {
  return status === "completed" || status === "delivered";
}

export default function DashboardPage() {
  const router = useRouter();

  const [userName, setUserName] = useState("Usuário");

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    async function loadUserName() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Erro ao carregar usuário:", error.message);
          return;
        }

        if (!user || !isMounted) return;

        const metadata = user.user_metadata ?? {};
        const name =
          metadata.full_name ||
          metadata.name ||
          user.email?.split("@")[0] ||
          "Usuário";

        if (isMounted) {
          setUserName(String(name));
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      }
    }

    void loadUserName();

    return () => {
      isMounted = false;
    };
  }, []);

  const { clients, loading: loadingClients } = useClients();
  const { printers, loading: loadingPrinters } = usePrinters();
  const { orders, loading: loadingOrders } = useOrders();
  const { filaments, loading: loadingFilaments } = useFilaments();

  const loading =
    loadingClients ||
    loadingPrinters ||
    loadingOrders ||
    loadingFilaments;

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[var(--app-background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
          <span className="text-sm text-[var(--muted)]">
            Carregando seu dashboard...
          </span>
        </div>
      </div>
    );
  }

  const primaryPrinter =
    printers.find((printer) => printer.isPrimary) ?? null;

  const currentMonthOrders = orders.filter(
  (order) =>
    order.status !== "cancelled" &&
    order.status !== "pending" &&
    isCurrentMonth(order.createdAt),
);

const deliveredMonthOrders = orders.filter(
  (order) =>
    order.status === "delivered" &&
    isCurrentMonth(order.createdAt),
);

const monthlyRevenue = currentMonthOrders.reduce(
  (sum, order) => sum + (order.price || 0),
  0,
);

const monthlyProfit = deliveredMonthOrders.reduce(
  (sum, order) =>
    sum + ((order.price || 0) - (order.cost || 0)),
  0,
);

  const pendingOrders = orders.filter(
    (order) =>
      order.status === "pending" || order.status === "approved",
  ).length;

  const activePrinters = printers.filter(
    (printer) => printer.status === "active",
  ).length;

  const filamentStock = filaments.reduce(
    (sum, filament) =>
      sum +
      (filament.remainingWeight ??
        filament.weight * filament.quantity),
    0,
  );

  const primaryPrinterOrders = primaryPrinter
    ? orders.filter(
        (order) =>
          order.printerId === primaryPrinter.id &&
          isCompletedOrder(order.status),
      )
    : [];

  const primaryPrinterHours = primaryPrinterOrders.reduce(
    (sum, order) => sum + (order.totalHours || 0),
    0,
  );

  const primaryPrinterRecovered = primaryPrinterOrders.reduce(
    (sum, order) => sum + (order.price - order.cost),
    0,
  );

  const investment = primaryPrinter?.purchasePrice ?? 0;

  const recoveryPercent =
    investment > 0
      ? Math.min(
          Math.max((primaryPrinterRecovered / investment) * 100, 0),
          100,
        )
      : 0;

  const remainingInvestment = Math.max(
    investment - primaryPrinterRecovered,
    0,
  );

const revenueData = currentMonthOrders
  .reduce(
    (acc, order) => {
      const date = new Date(order.createdAt).toLocaleDateString(
        "pt-BR",
        {
          day: "2-digit",
          month: "2-digit",
        },
      );

      const existing = acc.find((item) => item.date === date);

      if (existing) {
        existing.revenue += order.price;
      } else {
        acc.push({
          date,
          revenue: order.price,
        });
      }

      return acc;
    },
    [] as { date: string; revenue: number }[],
  )
  .sort((a, b) => {
    const [dayA, monthA] = a.date.split("/").map(Number);
    const [dayB, monthB] = b.date.split("/").map(Number);

    return monthA - monthB || dayA - dayB;
  });


  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  const currentDate = new Date();

  function handle3MFUpload() {
    router.push("/calculos");
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-[var(--app-background)]">
      {/* Ambient background */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-orange-500/[0.07] blur-[120px]" />
        <div className="absolute -left-40 top-[420px] h-[420px] w-[420px] rounded-full bg-blue-600/[0.05] blur-[120px]" />
      </div>

      <div className="relative space-y-5 px-4 py-4 sm:space-y-6 sm:p-6">
        {/* ================================================================
            PRO / TRIAL BANNER
        ================================================================= */}

        <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--surface)] via-[var(--surface-light)] to-[var(--surface)]">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-orange-500/[0.10] blur-3xl" />

          <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-white shadow-[0_0_30px_rgba(var(--accent-rgb),0.25)]">
                <Crown className="h-5 w-5 text-white" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    Plano Gratuito
                  </span>

                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface-light)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
                    PrintFlow
                  </span>
                </div>

                <p className="mt-1 text-xs text-[var(--muted)] sm:text-sm">
                  Desbloqueie recursos avançados e leve sua operação para o
                  próximo nível.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/planos")}
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(var(--accent-rgb),0.18)] transition-all hover:-translate-y-0.5 hover:brightness-110"
            >
              Assinar o Pro
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </section>

        {/* ================================================================
            HERO + FINANCEIRO
        ================================================================= */}

        <section className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
          {/* Left */}

          <Card className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] via-[var(--surface-light)] to-[var(--app-background)] shadow-2xl">
            <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-orange-500/[0.08] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-blue-600/[0.06] blur-3xl" />

            <CardContent className="relative p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-8 xl:flex-row">
                <div>
                  <p className="text-sm font-medium text-[var(--muted)]">
                    {formatDate(currentDate)}
                  </p>

                  <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
                    Olá, {userName}
                  </h1>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                    <span className="text-sm text-[var(--muted)]">
                      Plano Gratuito
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:min-w-[360px]">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <div className="flex items-center gap-2 text-[var(--muted)]">
                      <DollarSign className="h-4 w-4 text-[var(--accent)]" />
                      <span className="text-xs font-medium">
                        Receita do mês
                      </span>
                    </div>

                    <p className="mt-3 text-xl font-bold text-[var(--foreground)] sm:text-2xl">
                      {formatCurrency(monthlyRevenue)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <div className="flex items-center gap-2 text-[var(--muted)]">
                      <WalletCards className="h-4 w-4 text-[var(--accent)]" />
                      <span className="text-xs font-medium">
                        Lucro do mês
                      </span>
                    </div>

                    <p
                      className={`mt-3 text-xl font-bold sm:text-2xl ${
                        monthlyProfit >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {formatCurrency(monthlyProfit)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-6 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-[var(--muted)]">
                    Pedidos aguardando
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                    {pendingOrders}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[var(--muted)]">
                    Impressoras ativas
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                    {activePrinters}/{printers.length}
                  </p>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs text-[var(--muted)]">
                    Estoque de filamento
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                    {formatWeight(filamentStock)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Primary printer */}

          <Card className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl backdrop-blur-xl">
            {primaryPrinter ? (
              <>
                <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-orange-500/[0.08] blur-3xl" />

                <CardContent className="relative flex h-full flex-col p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                        Impressora principal
                      </p>

                      <h2 className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                        {primaryPrinter.name}
                      </h2>
                    </div>

                    <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    </div>
                  </div>

                  <div className="mt-4 flex min-h-[150px] items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-light)]">
                    {primaryPrinter.imageUrl ? (
                      <img
                        src={primaryPrinter.imageUrl}
                        alt={primaryPrinter.model}
                        className="h-full max-h-[170px] w-full object-contain p-5"
                      />
                    ) : (
                      <Printer className="h-16 w-16 text-[var(--muted)]" />
                    )}
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {primaryPrinter.manufacturer}
                    </p>

                    <p className="text-xs text-[var(--muted)]">
                      {primaryPrinter.model}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                      <div className="flex items-center gap-1.5 text-[var(--muted)]">
                        <Clock3 className="h-3.5 w-3.5" />
                        <span className="text-[10px]">
                          Horas utilizadas
                        </span>
                      </div>

                      <p className="mt-1.5 text-sm font-semibold text-[var(--foreground)]">
                        {formatHours(primaryPrinterHours)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                      <div className="flex items-center gap-1.5 text-[var(--muted)]">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span className="text-[10px]">
                          Investimento
                        </span>
                      </div>

                      <p className="mt-1.5 text-sm font-semibold text-[var(--foreground)]">
                        {formatCurrency(investment)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[11px] text-[var(--muted)]">
                          Investimento recuperado
                        </p>

                        <p className="mt-1 text-lg font-bold text-[var(--foreground)]">
                          {formatCurrency(primaryPrinterRecovered)}
                        </p>
                      </div>

                      <span className="text-xs font-semibold text-[var(--accent)]">
                        {recoveryPercent.toFixed(0)}%
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--border)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent)] transition-all duration-700"
                        style={{ width: `${recoveryPercent}%` }}
                      />
                    </div>

                    <p className="mt-2 text-[10px] text-[var(--muted)]">
                      {investment > 0
                        ? remainingInvestment > 0
                          ? `${formatCurrency(
                              remainingInvestment,
                            )} restantes para recuperar o investimento`
                          : "Investimento totalmente recuperado"
                        : "Informe o valor de aquisição da impressora"}
                    </p>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex h-full min-h-[420px] flex-col items-center justify-center p-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-light)]">
                  <Printer className="h-7 w-7 text-[var(--muted)]" />
                </div>

                <h2 className="mt-4 text-lg font-semibold text-[var(--foreground)]">
                  Nenhuma impressora principal
                </h2>

                <p className="mt-2 max-w-[260px] text-sm leading-6 text-[var(--muted)]">
                  Defina uma impressora como principal para acompanhar o
                  investimento e a recuperação diretamente no Dashboard.
                </p>

                <button
                  type="button"
                  onClick={() => router.push("/impressoras")}
                  className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-light)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:bg-[var(--border)]"
                >
                  Configurar impressora
                </button>
              </CardContent>
            )}
          </Card>
        </section>

        {/* ================================================================
            3MF UPLOAD
        ================================================================= */}

        {/* <section
          onClick={handle3MFUpload}
          className="group relative cursor-pointer overflow-hidden rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] transition-all duration-300 hover:border-[var(--accent)] hover:bg-[var(--surface-light)]"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-orange-500/[0.03] via-transparent to-blue-500/[0.03] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="relative flex flex-col items-center justify-center px-6 py-9 text-center sm:py-11">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-light)] transition-transform duration-300 group-hover:scale-105 group-hover:border-[var(--accent)]">
              <UploadCloud className="h-6 w-6 text-[var(--accent)]" />
            </div>

            <h2 className="mt-4 text-base font-semibold text-[var(--foreground)]">
              Envie seu arquivo .3MF
            </h2>

            <p className="mt-1 max-w-lg text-sm text-[var(--muted)]">
              Arraste seu projeto para cá ou clique para abrir a calculadora
              e descobrir o custo e o preço ideal de impressão.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-[var(--muted)] transition group-hover:text-[var(--foreground)]/70">
              <Calculator className="h-3.5 w-3.5" />
              Abrir calculadora
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </section> */}

        {/* ================================================================
            QUICK STATS
        ================================================================= */}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-center gap-2 text-[var(--muted)]">
              <Users className="h-4 w-4 text-[var(--accent)]" />
              <span className="text-xs">Clientes</span>
            </div>

            <p className="mt-2 text-xl font-bold text-[var(--foreground)]">
              {clients.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-center gap-2 text-[var(--muted)]">
              <Printer className="h-4 w-4 text-[var(--accent)]" />
              <span className="text-xs">Impressoras</span>
            </div>

            <p className="mt-2 text-xl font-bold text-[var(--foreground)]">
              {activePrinters}/{printers.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-center gap-2 text-[var(--muted)]">
              <Package className="h-4 w-4 text-[var(--accent)]" />
              <span className="text-xs">Pedidos</span>
            </div>

            <p className="mt-2 text-xl font-bold text-[var(--foreground)]">
              {pendingOrders}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-center gap-2 text-[var(--muted)]">
              <CalendarDays className="h-4 w-4 text-[var(--accent)]" />
              <span className="text-xs">Pedidos no mês</span>
            </div>

            <p className="mt-2 text-xl font-bold text-[var(--foreground)]">
              {currentMonthOrders.length}
            </p>
          </div>
        </div>

        {/* ================================================================
            REVENUE CHART
        ================================================================= */}

        <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl backdrop-blur-xl">
          <CardHeader className="border-b border-[var(--border)] px-5 py-5 sm:px-6">
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Receita do mês
              </h2>

              <p className="mt-1 text-sm text-[var(--muted)]">
                Faturamento dos pedidos entregues neste mês
              </p>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            {revenueData.length > 0 ? (
              <RevenueChart data={revenueData} />
            ) : (
              <div className="flex h-[280px] flex-col items-center justify-center text-center">
                <DollarSign className="h-8 w-8 text-[var(--foreground)]/10" />

                <p className="mt-3 text-sm text-[var(--muted)]">
                  Ainda não existem dados de receita neste mês.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ================================================================
            RECENT ORDERS + FILAMENT
        ================================================================= */}

        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[2fr_1fr]">
          <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl backdrop-blur-xl">
            <CardHeader className="flex items-center justify-between border-b border-[var(--border)] px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  Pedidos recentes
                </h2>

                <p className="mt-1 text-sm text-[var(--muted)]">
                  Últimos pedidos registrados no sistema
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/pedidos")}
                className="hidden items-center gap-1 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--foreground)] sm:flex"
              >
                Ver todos
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </CardHeader>

            <CardContent className="divide-y divide-[var(--border)] px-4 sm:px-6">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <h3 className="font-medium text-[var(--foreground)]">
                        {order.clientName}
                      </h3>

                      <p className="truncate text-sm text-[var(--muted)]">
                        {order.printerName} • {order.filamentName}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                      <span className="font-semibold text-[var(--foreground)]">
                        {formatCurrency(order.price)}
                      </span>

                      <Badge
                        variant={
                          order.status === "printing"
                            ? "info"
                            : order.status === "completed" ||
                                order.status === "delivered"
                              ? "success"
                              : order.status === "cancelled"
                                ? "danger"
                                : "warning"
                        }
                      >
                        {translateStatus(order.status)}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-[var(--muted)]">
                  Nenhum pedido registrado.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--surface-light)] shadow-2xl">
            <CardContent className="flex h-full min-h-[260px] flex-col items-center justify-center p-6 text-center sm:p-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--accent)] text-white shadow-[0_15px_45px_rgba(var(--accent-rgb),0.2)] ring-1 ring-[var(--accent)] sm:h-24 sm:w-24">
                <Package className="h-10 w-10 text-white sm:h-12 sm:w-12" />
              </div>

              <h2 className="mt-5 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:mt-6">
                {formatWeight(filamentStock)}
              </h2>

              <p className="mt-2 max-w-[220px] text-sm text-[var(--muted)]">
                Filamento disponível em estoque
              </p>

              <button
                type="button"
                onClick={() => router.push("/estoque")}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]"
              >
                Ver estoque
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}