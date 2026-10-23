"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileDown,
  Package,
  Printer,
  UserRound,
  Wallet,
} from "lucide-react";

import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/common";
import { useOrders } from "@/hooks/useOrders";
import type { OrderItem, OrderWithItems } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  printing: "Imprimindo",
  paused: "Pausado",
  completed: "Concluído",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const statusStyles: Record<string, string> = {
  pending: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  approved: "border-sky-400/20 bg-sky-400/10 text-sky-200",
  printing: "border-[rgba(var(--accent-rgb),0.35)] bg-[rgba(var(--accent-rgb),0.12)] text-[var(--accent)]",
  paused: "border-violet-400/20 bg-violet-400/10 text-violet-200",
  completed: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  delivered: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  cancelled: "border-white/10 bg-white/5 text-white/45",
};

function asNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function minutesLabel(hours: unknown): string {
  const totalMinutes = Math.max(0, Math.round(asNumber(hours) * 60));
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (wholeHours === 0) return `${minutes} min`;
  if (minutes === 0) return `${wholeHours} h`;
  return `${wholeHours} h ${minutes} min`;
}

function InfoTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Package;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
      <div className="flex items-center gap-2 text-xs text-white/40">
        <Icon className="h-4 w-4 text-[var(--accent)]" />
        {label}
      </div>
      <p className="mt-2 break-words text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { orders, loading } = useOrders();
  const order = orders.find((entry) => entry.id === orderId) as
    | OrderWithItems
    | undefined;

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-white/45">
        Carregando detalhes do pedido...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/35">
          <Package className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-white">Pedido não encontrado</h1>
        <p className="mt-2 text-sm text-white/40">
          Ele pode ter sido removido ou não estar disponível para esta conta.
        </p>
        <div className="mt-6">
          <Link href="/pedidos">
            <Button><ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos pedidos</Button>
          </Link>
        </div>
      </div>
    );
  }

  const items: OrderItem[] = order.items ?? [];
  const recordedCost = asNumber(order.cost);
  const orderRevenue = asNumber(order.price);
  const estimatedProfit = orderRevenue - recordedCost;
  const totalQuantity = items.length
    ? items.reduce((sum, item) => sum + Math.max(0, asNumber(item.quantity)), 0)
    : Math.max(0, asNumber(order.quantity));
  const totalGrams = items.length
    ? items.reduce(
        (sum, item) => sum + Math.max(0, asNumber(item.filamentGrams)) * Math.max(0, asNumber(item.quantity)),
        0,
      )
    : asNumber(order.filamentGrams);
  const totalHours = asNumber(order.totalHours);
  const orderNumber = order.orderNumber ?? order.id.slice(0, 8).toUpperCase();
  const statusClass = statusStyles[order.status] ?? "border-white/10 bg-white/5 text-white/60";

  // Gera o documento comercial em uma janela isolada para não depender do CSS
  // de impressão da ficha interna, que pode ocultar o conteúdo do pedido.
  const handleClientPrint = async () => {
    // Abre a janela imediatamente para evitar que o navegador bloqueie o pop-up.
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      window.alert("O navegador bloqueou a janela do pedido. Permita pop-ups para este site e tente novamente.");
      return;
    }
    printWindow.document.write("<p style='font-family:Arial;padding:24px'>Carregando os dados da empresa...</p>");

    // Busca a identidade visual cadastrada pelo usuário autenticado.
    let companyLogoUrl = "";
    let companyName = "";
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("company_logo_url, company_name")
          .eq("id", user.id)
          .maybeSingle();
        if (error) throw error;
        companyLogoUrl = profile?.company_logo_url?.trim() || "";
        companyName = profile?.company_name?.trim() || "";
      }
    } catch (error) {
      console.error("Não foi possível carregar o nome e a logo da empresa:", error);
    }

    const escapeHtml = (value: unknown) => String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

    const paymentMethod = (order as OrderWithItems & { paymentMethod?: string; payment_method?: string }).paymentMethod
      || (order as OrderWithItems & { payment_method?: string }).payment_method
      || "Chave Pix: 65035705000190";

    const rows = items.length > 0
      ? items.map((item) => {
          const quantity = Math.max(0, asNumber(item.quantity));
          const unitPrice = quantity > 0 ? asNumber(item.price) : 0;
          const subtotal = unitPrice * quantity;
          return `<tr>
            <td><strong>${escapeHtml(item.productName || "Produto personalizado")}</strong>${item.filamentColor ? `<small>Cor: ${escapeHtml(item.filamentName)}</small>` : ""}</td>
            <td class="numeric">${quantity}</td>
            <td class="numeric">${escapeHtml(formatCurrency(unitPrice))}</td>
            <td class="numeric">${escapeHtml(formatCurrency(subtotal))}</td>
          </tr>`;
        }).join("")
      : `<tr><td><strong>${escapeHtml(order.productName || "Produto personalizado")}</strong></td><td class="numeric">${totalQuantity}</td><td class="numeric">${escapeHtml(formatCurrency(totalQuantity > 0 ? orderRevenue / totalQuantity : orderRevenue))}</td><td class="numeric">${escapeHtml(formatCurrency(orderRevenue))}</td></tr>`;

    const notes = order.notes?.trim()
      ? `<section class="section"><h2>Observações</h2><p class="notes">${escapeHtml(order.notes.trim()).replace(/\n/g, "<br>")}</p></section>`
      : "";

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base href="${window.location.origin}/">
<title>Pedido #${escapeHtml(orderNumber)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #0f172a; background: #fff; font: 12px Arial, Helvetica, sans-serif; }
  header { display:flex; align-items:center; justify-content:space-between; gap:20px; padding-bottom:18px; border-bottom:3px solid #fd6401; }
  .brand { display:flex; align-items:center; gap:14px; min-width:0; }
  .logo { width:64px; height:64px; object-fit:contain; }
  .brand h1 { margin:0; color:#071124; font-size:20px; }
  .brand p { margin:5px 0 0; color:#64748b; font-size:10px; }
  .quote { text-align:right; flex-shrink:0; }
  .quote span, .total span { display:block; color:#9a3d00; font-size:9px; font-weight:800; letter-spacing:1.5px; }
  .quote strong { display:block; margin-top:5px; font-size:15px; }
  .section { margin-top:24px; }
  h2 { margin:0 0 12px; font-size:13px; }
  .client-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px 22px; }
  .field span { display:block; margin-bottom:5px; color:#64748b; font-size:10px; }
  .field strong { font-size:12px; font-weight:600; }
  table { width:100%; border-collapse:collapse; font-size:11px; }
  th { padding:10px 8px; background:#f1f5f9; color:#334155; text-align:left; }
  td { padding:12px 8px; border-bottom:1px solid #e2e8f0; vertical-align:top; }
  td strong, td small { display:block; }
  td small { margin-top:4px; color:#64748b; font-size:10px; }
  .numeric { text-align:right; white-space:nowrap; }
  .total-row { display:flex; justify-content:space-between; align-items:flex-start; gap:20px; margin-top:24px; padding-top:16px; border-top:1px solid #e2e8f0; }
  .total { min-width:180px; padding:14px 16px; background:#fff2e9; text-align:right; }
  .total strong { display:block; margin-top:6px; color:#9a3d00; font-size:23px; }
  .notes { margin:0; color:#475569; line-height:1.6; overflow-wrap:anywhere; }
  footer { margin-top:44px; padding-top:14px; border-top:1px solid #e2e8f0; text-align:center; }
  footer strong { font-size:12px; } footer p { margin:5px 0 0; color:#64748b; font-size:10px; }
  @media screen { body { max-width:780px; margin:24px auto; padding:24px; box-shadow:0 2px 18px #0001; } }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } tr { break-inside:avoid; } }
</style></head><body>
<header><div class="brand">${companyLogoUrl ? `<img class="logo" src="${escapeHtml(companyLogoUrl)}" alt="Logo da empresa" onerror="this.style.display='none'">` : ""}<div><h1>${escapeHtml(companyName || "Empresa")}</h1><p>Pedido de impressão 3D</p></div></div><div class="quote"><span>PEDIDO</span><strong>#${escapeHtml(orderNumber)}</strong></div></header>
<section class="section"><h2>Dados do cliente</h2><div class="client-grid">
<div class="field"><span>Cliente</span><strong>${escapeHtml(order.clientName || "Cliente não informado")}</strong></div>
<div class="field"><span>Data de emissão</span><strong>${escapeHtml(formatDate(new Date().toISOString()))}</strong></div>
<div class="field"><span>Prazo de entrega</span><strong>${escapeHtml(order.deadline ? formatDate(order.deadline) : "A combinar")}</strong></div>
<div class="field"><span>Forma de pagamento</span><strong>A Combinar</strong></div>
</div></section>
<section class="section"><h2>Itens do pedido</h2><table><thead><tr><th>Descrição</th><th class="numeric">Qtd.</th><th class="numeric">Valor unitário</th><th class="numeric">Subtotal</th></tr></thead><tbody>${rows}</tbody></table></section>
<section class="total-row"><div class="field"><span>Condição de pagamento</span><strong>${escapeHtml(paymentMethod)}</strong></div><div class="total"><span>VALOR TOTAL</span><strong>${escapeHtml(formatCurrency(orderRevenue))}</strong></div></section>
${notes}<footer><strong>Obrigado pela preferência!</strong><p>Em caso de dúvidas sobre este pedido, entre em contato conosco.</p></footer>
<script>window.addEventListener('load', function(){ window.focus(); window.print(); });<\/script>
</body></html>`);
    printWindow.document.close();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050914] text-white">
      <div className="pointer-events-none absolute -right-32 top-0 h-80 w-80 rounded-full bg-[rgba(var(--accent-rgb),0.07)] blur-3xl no-print" />

      <div className="relative mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center no-print">
          <div>
            <Link href="/pedidos" className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Voltar aos pedidos
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Pedido #{orderNumber}</h1>
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusClass}`}>
                {statusLabels[order.status] ?? order.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-white/40">Detalhes, acompanhamento e ficha interna de produção.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handlePrint} className="shrink-0">
              <FileDown className="mr-2 h-4 w-4" /> Gerar PDF Produção
            </Button>
            <Button onClick={handleClientPrint} className="shrink-0">
              <FileDown className="mr-2 h-4 w-4" /> Gerar PDF Cliente
            </Button>
          </div>
        </div>

        <div className="print-heading hidden">
          <div className="flex items-start justify-between gap-4 border-b-2 border-[#FD6401] pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FD6401]">PrintFlow Manager</p>
              <h1 className="mt-2 text-2xl font-bold text-[#071124]">Ficha interna de produção</h1>
              <p className="mt-1 text-sm text-slate-500">Pedido #{orderNumber}</p>
            </div>
            <div className="text-right text-sm text-slate-600">
              <p><strong>Status:</strong> {statusLabels[order.status] ?? order.status}</p>
              <p><strong>Gerado em:</strong> {new Date().toLocaleDateString("pt-BR")}</p>
            </div>
          </div>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 print-grid">
          <InfoTile label="Valor do pedido" value={formatCurrency(orderRevenue)} icon={Wallet} />
          <InfoTile label="Custo registrado" value={formatCurrency(recordedCost)} icon={Wallet} />
          <InfoTile label="Lucro estimado*" value={formatCurrency(estimatedProfit)} icon={CheckCircle2} />
          <InfoTile label="Tempo de produção" value={minutesLabel(totalHours)} icon={Clock3} />
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
          <div className="space-y-6">
            <Card className="border border-white/[0.08] bg-[#0A1120]/90 shadow-xl shadow-black/10 print-card">
              <CardHeader className="border-b border-white/[0.06] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(var(--accent-rgb),0.2)] bg-[rgba(var(--accent-rgb),0.08)] text-[var(--accent)]">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">Itens do pedido</h2>
                    <p className="mt-0.5 text-xs text-white/35">Materiais, equipamentos, quantidades e valores</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left text-sm print-table">
                      <thead className="bg-white/[0.025] text-[10px] uppercase tracking-wider text-white/35">
                        <tr>
                          <th className="px-5 py-3 font-medium">Produto / configuração</th>
                          <th className="px-3 py-3 font-medium">Qtd.</th>
                          <th className="px-3 py-3 font-medium">Tempo</th>
                          <th className="px-3 py-3 font-medium">Filamento</th>
                          <th className="px-3 py-3 text-right font-medium">Custo registrado</th>
                          <th className="px-5 py-3 text-right font-medium">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.05]">
                        {items.map((item, index) => {
                          const quantity = Math.max(0, asNumber(item.quantity));
                          const unitCost = asNumber(item.cost);
                          const subtotal = asNumber(item.price) * quantity;
                          return (
                            <tr key={item.id ?? `${item.productName}-${index}`}>
                              <td className="px-5 py-4">
                                <p className="font-medium text-white">{item.productName || "Produto sem nome"}</p>
                                <p className="mt-1 text-xs text-white/35">{item.printerName || "Impressora não definida"}</p>
                              </td>
                              <td className="px-3 py-4 text-white/70">{quantity}</td>
                              <td className="px-3 py-4 text-white/70">{minutesLabel(item.totalHours)}</td>
                              <td className="px-3 py-4">
                                <p className="text-white/70">{item.filamentName || "Não informado"}</p>
                                <p className="mt-1 text-xs text-white/35">{item.filamentColor || "Cor não informada"}</p>
                                <p className="mt-1 text-xs text-white/35">{(asNumber(item.filamentGrams) * quantity).toFixed(1)} g no total</p>
                              </td>
                              <td className="px-3 py-4 text-right text-white/60">{formatCurrency(unitCost * quantity)}</td>
                              <td className="px-5 py-4 text-right font-semibold text-white">{formatCurrency(subtotal)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-5">
                    <p className="font-medium text-white">{order.productName || "Produto não informado"}</p>
                    <p className="mt-2 text-sm text-white/45">Este pedido usa o formato legado e não possui itens detalhados.</p>
                  </div>
                )}
                <div className="grid gap-3 border-t border-white/[0.06] p-5 sm:grid-cols-3 print-summary">
                  <div><p className="text-xs text-white/35">Quantidade total</p><p className="mt-1 font-semibold text-white">{totalQuantity}</p></div>
                  <div><p className="text-xs text-white/35">Filamento estimado</p><p className="mt-1 font-semibold text-white">{totalGrams.toFixed(1)} g</p></div>
                  <div><p className="text-xs text-white/35">Valor total</p><p className="mt-1 text-lg font-bold text-[var(--accent)]">{formatCurrency(orderRevenue)}</p></div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/[0.08] bg-[#0A1120]/90 print-card">
              <CardHeader className="border-b border-white/[0.06] p-5">
                <h2 className="font-semibold text-white">Observações do pedido</h2>
              </CardHeader>
              <CardContent className="p-5">
                <p className="whitespace-pre-wrap text-sm leading-6 text-white/65">{order.notes?.trim() || "Nenhuma observação registrada."}</p>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="border border-white/[0.08] bg-[#0A1120]/90 print-card">
              <CardHeader className="border-b border-white/[0.06] p-5">
                <div className="flex items-center gap-3">
                  <UserRound className="h-5 w-5 text-[var(--accent)]" />
                  <h2 className="font-semibold text-white">Cliente e datas</h2>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div>
                  <p className="text-xs text-white/35">Cliente</p>
                  <p className="mt-1 font-medium text-white">{order.clientName || "Cliente não informado"}</p>
                </div>
                <div className="flex items-start gap-3 border-t border-white/[0.06] pt-4">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-white/35" />
                  <div><p className="text-xs text-white/35">Criado em</p><p className="mt-1 text-sm text-white/75">{formatDate(order.createdAt)}</p></div>
                </div>
                <div className="flex items-start gap-3 border-t border-white/[0.06] pt-4">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-[var(--accent)]" />
                  <div><p className="text-xs text-white/35">Prazo de entrega</p><p className="mt-1 text-sm text-white/75">{order.deadline ? formatDate(order.deadline) : "Sem prazo definido"}</p></div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/[0.08] bg-[#0A1120]/90 print-card">
              <CardHeader className="border-b border-white/[0.06] p-5">
                <div className="flex items-center gap-3">
                  <Printer className="h-5 w-5 text-[var(--accent)]" />
                  <h2 className="font-semibold text-white">Resumo de produção</h2>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3"><span className="text-sm text-white/40">Impressora(s)</span><span className="text-right text-sm font-medium text-white">{order.printerName || "Não definida / múltiplas"}</span></div>
                <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4"><span className="text-sm text-white/40">Tempo total</span><span className="text-sm font-medium text-white">{minutesLabel(totalHours)}</span></div>
                <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4"><span className="text-sm text-white/40">Consumo estimado</span><span className="text-sm font-medium text-white">{totalGrams.toFixed(1)} g</span></div>
                <div className="border-t border-white/[0.06] pt-4"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusClass}`}>{statusLabels[order.status] ?? order.status}</span></div>
              </CardContent>
            </Card>

            <Card className="border border-[rgba(var(--accent-rgb),0.18)] bg-[rgba(var(--accent-rgb),0.045)] print-card">
              <CardHeader className="p-5 pb-2"><h2 className="font-semibold text-white">Resumo financeiro</h2></CardHeader>
              <CardContent className="space-y-3 p-5 pt-2">
                <div className="flex justify-between gap-3 text-sm"><span className="text-white/45">Valor do pedido</span><span className="font-medium text-white">{formatCurrency(orderRevenue)}</span></div>
                <div className="flex justify-between gap-3 text-sm"><span className="text-white/45">Custo registrado</span><span className="font-medium text-white">{formatCurrency(recordedCost)}</span></div>
                <div className="flex justify-between gap-3 border-t border-white/[0.08] pt-3"><span className="text-sm text-white/65">Lucro estimado*</span><span className={`font-bold ${estimatedProfit >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{formatCurrency(estimatedProfit)}</span></div>
                <p className="border-t border-white/[0.06] pt-3 text-[11px] leading-5 text-white/35">*Estimativa calculada como valor do pedido menos custo registrado no pedido. Confira a observação de custos no rodapé da ficha.</p>
              </CardContent>
            </Card>
          </aside>
        </div>

        <div className="hidden print-footnote">
          <p><strong>Nota sobre custos:</strong> o lucro acima é uma estimativa baseada no custo que está salvo neste pedido. No formulário atual, o custo calculado por item considera o filamento; energia, mão de obra, embalagem, manutenção e depreciação podem não estar incluídos. Não use esse valor como lucro líquido contábil sem completar esses custos.</p>
        </div>

        <div className="flex justify-end gap-3 no-print">
          <Link href="/pedidos"><Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button></Link>
          <Button onClick={handlePrint}><FileDown className="mr-2 h-4 w-4" /> Gerar PDF A4</Button>
          <Button onClick={handleClientPrint}><FileDown className="mr-2 h-4 w-4" /> Gerar PDF Cliente</Button>
        </div>
      </div>

      {/*
        Documento comercial separado da ficha de produção.
        Ajuste /logo.png para o caminho real do logotipo dentro da pasta public.
      */}
      <section className="client-pdf hidden">
        <header className="client-pdf-header">
          <div className="client-brand">
            <img src="/logo.png" alt="Logo da empresa" className="client-logo" />
            <div>
              <h1>PrintFlow Manager</h1>
              <p>Impressão 3D • Transformando ideias em realidade</p>
            </div>
          </div>
          <div className="client-quote-number">
            <span>PEDIDO</span>
            <strong>#{orderNumber}</strong>
          </div>
        </header>

        <section className="client-section">
          <h2>Dados do cliente</h2>
          <div className="client-data-grid">
            <p><span>Cliente</span><strong>{order.clientName || "Cliente não informado"}</strong></p>
            <p><span>Data de emissão</span><strong>{formatDate(new Date().toISOString())}</strong></p>
            <p><span>Prazo de entrega</span><strong>{order.deadline ? formatDate(order.deadline) : "A combinar"}</strong></p>
          </div>
        </section>

        <section className="client-section">
          <h2>Itens do pedido</h2>
          <table className="client-items-table">
            <thead><tr><th>Descrição</th><th>Qtd.</th><th>Valor unitário</th><th>Subtotal</th></tr></thead>
            <tbody>
              {items.length > 0 ? items.map((item, index) => {
                const quantity = Math.max(0, asNumber(item.quantity));
                const subtotal = asNumber(item.price) * quantity;
                return (
                  <tr key={item.id ?? `${item.productName}-${index}`}>
                    <td>
                      <strong>{item.productName || "Produto personalizado"}</strong>
                      {item.filamentColor ? <small>Cor: {item.filamentName}</small> : null}
                    </td>
                    <td>{quantity}</td>
                    <td>{formatCurrency(quantity > 0 ? asNumber(item.price) : 0)}</td>
                    <td>{formatCurrency(subtotal)}</td>
                  </tr>
                );
              }) : (
                <tr><td><strong>{order.productName || "Produto personalizado"}</strong></td><td>{totalQuantity}</td><td>{formatCurrency(totalQuantity > 0 ? orderRevenue / totalQuantity : orderRevenue)}</td><td>{formatCurrency(orderRevenue)}</td></tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="client-total-row">
          <div>
            <span>Forma de pagamento</span>
            <strong>{((order as OrderWithItems & { paymentMethod?: string; payment_method?: string }).paymentMethod || (order as OrderWithItems & { payment_method?: string }).payment_method || "A combinar")}</strong>
          </div>
          <div className="client-total">
            <span>VALOR TOTAL</span>
            <strong>{formatCurrency(orderRevenue)}</strong>
          </div>
        </section>

        {order.notes?.trim() ? (
          <section className="client-section client-notes">
            <h2>Observações</h2>
            <p>{order.notes.trim()}</p>
          </section>
        ) : null}

        <footer className="client-pdf-footer">
          <strong>Obrigado pela preferência!</strong>
          <p>Em caso de dúvidas sobre este pedsido, entre em contato conosco.</p>
        </footer>
      </section>

      <style jsx global>{`
        @page { size: A4; margin: 12mm; }
        .client-pdf { display: none; }
        @media print {
          html, body { background: #fff !important; color: #0f172a !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          body * { visibility: hidden !important; }
          .relative.min-h-screen, .relative.min-h-screen * { visibility: visible !important; }
          .relative.min-h-screen { position: absolute !important; inset: 0 !important; width: 100% !important; min-height: 0 !important; overflow: visible !important; background: #fff !important; color: #0f172a !important; }
          .relative.min-h-screen > .relative { padding: 0 !important; max-width: none !important; gap: 10px !important; }
          .no-print { display: none !important; }
          .print-heading { display: block !important; margin-bottom: 14px !important; }
          .print-footnote { display: block !important; margin-top: 12px !important; border-top: 1px solid #cbd5e1; padding-top: 8px; color: #475569 !important; font-size: 9px; line-height: 1.45; }
          .print-grid { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; gap: 7px !important; }
          .print-grid > div { border: 1px solid #dbe2ea !important; background: #f8fafc !important; padding: 9px !important; }
          .print-grid > div * { color: #0f172a !important; }
          .grid.xl\\:grid-cols-\\[minmax\\(0\\,1\\.7fr\\)_minmax\\(280px\\,1fr\\)\\] { grid-template-columns: minmax(0, 1.55fr) minmax(220px, 1fr) !important; gap: 10px !important; }
          .space-y-6 > :not([hidden]) ~ :not([hidden]) { margin-top: 10px !important; }
          .print-card { break-inside: avoid; border: 1px solid #dbe2ea !important; background: #fff !important; box-shadow: none !important; }
          .print-card * { color: #0f172a !important; }
          .print-card .text-white\\/35, .print-card .text-white\\/40, .print-card .text-white\\/45 { color: #64748b !important; }
          .print-card .text-\\[var\\(--accent\\)\\] { color: #c94f00 !important; }
          .print-card .border-white\\/\\[0\\.06\\], .print-card .border-white\\/\\[0\\.08\\], .print-card .divide-white\\/\\[0\\.05\\] { border-color: #e2e8f0 !important; }
          .print-card table { min-width: 0 !important; font-size: 9px !important; }
          .print-card th, .print-card td { padding: 6px 5px !important; }
          .print-card thead { background: #f1f5f9 !important; }
          .print-card .overflow-x-auto { overflow: visible !important; }
          .print-summary { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
          .print-summary .text-\\[var\\(--accent\\)\\] { color: #c94f00 !important; }
          .print-card aside, aside { break-inside: avoid; }
          .rounded-full { print-color-adjust: exact; -webkit-print-color-adjust: exact; }

          /* Modo cliente: oculta a tela do pedido e imprime somente o documento comercial. */
          html[data-print-mode="client"] body { background: #fff !important; }
          html[data-print-mode="client"] body * { visibility: hidden !important; }
          html[data-print-mode="client"] .relative.min-h-screen { 
            position: static !important; inset: auto !important; width: 100% !important;
            min-height: 0 !important; overflow: visible !important; background: #fff !important;
          }
          html[data-print-mode="client"] .relative.min-h-screen > .relative { display: none !important; }
          html[data-print-mode="client"] .relative.min-h-screen > .client-pdf {
            display: block !important; visibility: visible !important; position: relative !important;
            width: 100% !important; height: auto !important; overflow: visible !important;
            color: #0f172a !important; background: #fff !important;
            font-family: Arial, Helvetica, sans-serif !important; font-size: 11px !important;
          }
          html[data-print-mode="client"] .relative.min-h-screen > .client-pdf,
          html[data-print-mode="client"] .relative.min-h-screen > .client-pdf * {
            visibility: visible !important;
          }
          .client-pdf-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding-bottom: 18px; border-bottom: 3px solid #fd6401; }
          .client-brand { display: flex; align-items: center; gap: 14px; }
          .client-logo { width: 64px; height: 64px; object-fit: contain; }
          .client-brand h1 { margin: 0; font-size: 20px; font-weight: 800; color: #071124 !important; }
          .client-brand p { margin: 5px 0 0; color: #64748b !important; font-size: 9px; }
          .client-quote-number { text-align: right; }
          .client-quote-number span, .client-total span { display: block; color: #9a3d00 !important; font-size: 9px; font-weight: 800; letter-spacing: 1.5px; }
          .client-quote-number strong { display: block; margin-top: 5px; color: #071124 !important; font-size: 14px; }
          .client-section { margin-top: 22px; }
          .client-section h2 { margin: 0 0 12px; color: #071124 !important; font-size: 13px; font-weight: 800; }
          .client-data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; }
          .client-data-grid p { margin: 0; }
          .client-data-grid span, .client-total-row > div > span { display: block; margin-bottom: 5px; color: #64748b !important; font-size: 9px; }
          .client-data-grid strong, .client-total-row > div > strong { color: #0f172a !important; font-size: 11px; }
          .client-items-table { width: 100%; border-collapse: collapse; font-size: 10px; }
          .client-items-table th { padding: 10px 8px; background: #f1f5f9 !important; color: #334155 !important; text-align: left; }
          .client-items-table td { padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #334155 !important; vertical-align: top; }
          .client-items-table td:nth-child(n+2), .client-items-table th:nth-child(n+2) { text-align: right; }
          .client-items-table td strong { display: block; color: #0f172a !important; }
          .client-items-table small { display: block; margin-top: 4px; color: #64748b !important; }
          .client-total-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
          .client-total { min-width: 170px; padding: 14px 16px; border-radius: 8px; background: #fff2e9 !important; text-align: right; }
          .client-total strong { display: block; margin-top: 6px; color: #9a3d00 !important; font-size: 22px; }
          .client-notes p { margin: 0; white-space: pre-wrap; color: #475569 !important; line-height: 1.5; }
          .client-pdf-footer { margin-top: 44px; padding-top: 14px; border-top: 1px solid #e2e8f0; text-align: center; }
          .client-pdf-footer strong { color: #071124 !important; font-size: 12px; }
          .client-pdf-footer p { margin-top: 5px; color: #64748b !important; font-size: 9px; }
        }
      `}</style>
    </div>
  );
}

