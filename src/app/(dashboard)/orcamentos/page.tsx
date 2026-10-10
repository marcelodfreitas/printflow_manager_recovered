"use client";

import { useState } from "react";

import { jsPDF } from "jspdf";
import {
  Plus,
  Search,
  FileDown,
  Trash2,
  Pencil,
  FileText,
  Send,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import logo from "@/assets/logo.png";

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

import type { Quote, QuoteItem } from "@/types";
import { useQuotes } from "@/hooks/useQuotes";
import { useClients } from "@/hooks/useClients";
import { formatCurrency, formatDate, translateStatus } from "@/lib/utils";

interface QuoteFormItem {
  description: string;
  quantity: string;
  unitPrice: string;
}

const quoteStatuses = [
  { value: "draft", label: "Rascunho" },
  { value: "sent", label: "Enviado" },
  { value: "approved", label: "Aprovado" },
  { value: "rejected", label: "Rejeitado" },
  { value: "converted", label: "Convertido" },
];

function StatusBadge({ status }: { status: string }) {
  const config = {
    draft: {
      variant: "default" as const,
      label: "Rascunho",
    },
    sent: {
      variant: "warning" as const,
      label: "Enviado",
    },
    approved: {
      variant: "success" as const,
      label: "Aprovado",
    },
    rejected: {
      variant: "danger" as const,
      label: "Rejeitado",
    },
    converted: {
      variant: "info" as const,
      label: "Convertido",
    },
  };

  const current = config[status as keyof typeof config] ?? {
    variant: "default" as const,
    label: status,
  };

  return <Badge variant={current.variant}>{current.label}</Badge>;
}

export default function QuotesPage() {
  const { quotes, loading, create, update, remove } = useQuotes();
  const { clients } = useClients();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  const [errors, setErrors] = useState({
    product: "",
    client: "",
  });

  const [form, setForm] = useState({
    productId: "",
    productName: "",
    clientId: "",
    clientName: "",
    status: "draft" as Quote["status"],
    notes: "",
    validUntil: "",
    discountPercent: "",
    items: [] as QuoteFormItem[],
  });

  const [itemForm, setItemForm] = useState({
    description: "",
    quantity: "1",
    unitPrice: "",
  });

  const filtered = quotes.filter((q) => {
    const term = search.toLowerCase().trim();

    const matchesSearch =
      q.clientName.toLowerCase().includes(term) ||
      (q.productName ?? "").toLowerCase().includes(term) ||
      String(q.quoteNumber ?? "").includes(term);

    const matchesStatus =
      statusFilter === "all" || q.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalQuotes = quotes.length;
  const draftQuotes = quotes.filter((q) => q.status === "draft").length;
  const sentQuotes = quotes.filter((q) => q.status === "sent").length;
  const approvedQuotes = quotes.filter(
    (q) => q.status === "approved",
  ).length;

  const approvedValue = quotes
    .filter((q) => q.status === "approved")
    .reduce((acc, q) => acc + Number(q.total ?? 0), 0);

  /*
   * NOVO ORÇAMENTO
   *
   * Importante:
   * items começa SEMPRE como [].
   * Não criamos um item vazio automaticamente.
   */
  function openCreate() {
    setEditingQuote(null);

    setForm({
      productId: "",
      productName: "",
      clientId: "",
      clientName: "",
      status: "draft",
      notes: "",
      validUntil: "",
      discountPercent: "",
      items: [],
    });

    setItemForm({
      description: "",
      quantity: "1",
      unitPrice: "",
    });

    setErrors({
      product: "",
      client: "",
    });

    setModalOpen(true);
  }

  function openEdit(quote: Quote) {
    setEditingQuote(quote);

    setForm({
      productId: quote.productId || "",
      productName: quote.productName || "",
      clientId: quote.clientId || "",
      clientName: quote.clientName || "",
      status: quote.status,
      notes: quote.notes || "",
      validUntil: quote.validUntil || "",
      discountPercent:
        quote.discountPercent !== undefined &&
        quote.discountPercent !== null &&
        quote.discountPercent > 0
          ? String(quote.discountPercent)
          : "",
      items: (quote.items || []).map((item) => ({
        description: item.description || "",
        quantity: String(item.quantity ?? 1),
        unitPrice: String(item.unitPrice ?? 0),
      })),
    });

    setItemForm({
      description: "",
      quantity: "1",
      unitPrice: "",
    });

    setErrors({
      product: "",
      client: "",
    });

    setModalOpen(true);
  }

  function addItem() {
    const productName = form.productName.trim();

    if (!productName) {
      (
        document.getElementById("product") as HTMLInputElement | null
      )?.reportValidity();

      return;
    }

    const quantity = Number(itemForm.quantity);
    const unitPrice = Number(itemForm.unitPrice);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return;
    }

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description:
            itemForm.description.trim() || productName,
          quantity: String(quantity),
          unitPrice: String(unitPrice),
        },
      ],
    }));

    setItemForm({
      description: "",
      quantity: "1",
      unitPrice: "",
    });
  }

  function removeItem(index: number) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }

  function calcSubtotal() {
    return form.items.reduce((acc, item) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);

      if (
        !Number.isFinite(quantity) ||
        !Number.isFinite(unitPrice)
      ) {
        return acc;
      }

      return acc + quantity * unitPrice;
    }, 0);
  }


function calcTax() {
  return 0;
}

function calcTotal() {
  return calcSubtotal();
}


  function calcDiscountPercent() {
    const value = Number(form.discountPercent);

    if (!Number.isFinite(value)) return 0;

    return Math.min(100, Math.max(0, value));
  }

  function calcDiscountAmount() {
    return calcTotal() * (calcDiscountPercent() / 100);
  }

  function calcPixTotal() {
    return calcTotal() - calcDiscountAmount();
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();

    const productName = form.productName.trim();
    const clientName = form.clientName.trim();

    const newErrors = {
      product: productName ? "" : "required",
      client: clientName ? "" : "required",
    };

    setErrors(newErrors);

    if (newErrors.product || newErrors.client) {
      return;
    }

    /*
     * Remove qualquer item inválido antes de salvar.
     *
     * Isso também protege contra itens antigos contendo:
     * quantity = ""
     * unitPrice = ""
     * ou valores NaN.
     */
    const validItems = form.items.filter((item) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);

      return (
        item.description.trim() &&
        Number.isFinite(quantity) &&
        quantity > 0 &&
        Number.isFinite(unitPrice) &&
        unitPrice > 0
      );
    });

    const subtotal = validItems.reduce((acc, item) => {
      return (
        acc +
        Number(item.quantity) * Number(item.unitPrice)
      );
    }, 0);

    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    const discountPercent = calcDiscountPercent();

    const items: QuoteItem[] = validItems.map((item, idx) => ({
      id: String(idx),
      description: item.description.trim(),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      total:
        Number(item.quantity) * Number(item.unitPrice),
    }));

    if (editingQuote) {
      update(editingQuote.id, {
        productId: form.productId || undefined,
        productName,
        clientId: form.clientId || null,
        clientName,
        status: form.status,
        items,
        subtotal,
        tax,
        total,
        discountPercent,
        notes: form.notes,
        validUntil: form.validUntil,
      });
    } else {
      create({
        productId: form.productId || undefined,
        productName,
        clientId: form.clientId || null,
        clientName,
        status: form.status,
        notes: form.notes,
        validUntil: form.validUntil,
        items,
        subtotal,
        tax,
        total,
        discountPercent,
      });
    }

    setModalOpen(false);
  }

  function handleDelete(id: string) {
    if (confirm("Tem certeza que deseja excluir este orçamento?")) {
      remove(id);
    }
  }

  async function generatePDF(quote?: Quote) {
    const doc = new jsPDF();

    const productName = quote
      ? quote.productName?.trim() || ""
      : form.productName.trim();

    const clientName = quote
      ? quote.clientName?.trim() || ""
      : form.clientName.trim();

    const validUntil = quote
      ? quote.validUntil || ""
      : form.validUntil;

    const status = quote ? quote.status : form.status;

    const notes = quote ? quote.notes || "" : form.notes;

    const items = quote ? quote.items || [] : form.items;

    const subtotal = quote
      ? Number(quote.subtotal ?? 0)
      : calcSubtotal();

    const total = quote
      ? Number(quote.total ?? 0)
      : calcTotal();

    const discountPercent = quote
      ? Number(quote.discountPercent ?? 0)
      : calcDiscountPercent();

    const discountAmount =
      total * (discountPercent / 100);

    const pixTotal = total - discountAmount;

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

    doc.setFillColor(10, 17, 32);
    doc.rect(0, 0, 210, 27, "F");

    doc.setFillColor(253, 100, 1);
    doc.rect(0, 27, 210, 1.2, "F");

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
    doc.setFontSize(9);
    doc.setTextColor(253, 100, 1);

    doc.text(
      "Orçamento de impressão 3D",
      logoData ? 37 : 14,
      20,
    );

    doc.setTextColor(180, 190, 205);
    doc.text("Data:", 150, 12);

    doc.setTextColor(255, 255, 255);

    doc.text(
      new Date().toLocaleDateString("pt-BR"),
      194,
      12,
      {
        align: "right",
      },
    );

    doc.setTextColor(180, 190, 205);
    doc.text("Status:", 150, 18);

    doc.setTextColor(255, 255, 255);

    doc.text(
      translateStatus(status),
      194,
      18,
      {
        align: "right",
      },
    );

    let y = 40;

    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text("CLIENTE", 14, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);

    doc.text(
      clientName || "—",
      14,
      y + 6,
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);

    if (validUntil) {
      doc.text(
        `Validade: ${formatDate(validUntil)}`,
        14,
        y + 12,
      );
    }

    y += 24;

    doc.setFillColor(245, 245, 245);
    doc.rect(
      14,
      y - 5,
      182,
      7,
      "F",
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);

    doc.text("Descrição", 16, y);

    doc.text("Qtd", 124, y, {
      align: "right",
    });

    doc.text("Unit.", 152, y, {
      align: "right",
    });

    doc.text("Total", 194, y, {
      align: "right",
    });

    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);

    items.forEach((item) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);

      if (
        !Number.isFinite(quantity) ||
        !Number.isFinite(unitPrice)
      ) {
        return;
      }

      const itemTotal = quantity * unitPrice;

      doc.text(
        item.description?.trim() ||
          productName ||
          "Impressão 3D",
        16,
        y,
      );

      doc.text(
        String(quantity),
        124,
        y,
        {
          align: "right",
        },
      );

      doc.text(
        formatCurrency(unitPrice),
        152,
        y,
        {
          align: "right",
        },
      );

      doc.text(
        formatCurrency(itemTotal),
        194,
        y,
        {
          align: "right",
        },
      );

      y += 7;
    });

    y += 8;

    doc.setDrawColor(220, 220, 220);
    doc.line(
      14,
      y - 4,
      196,
      y - 4,
    );

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    doc.text(
      "Subtotal",
      150,
      y,
      {
        align: "right",
      },
    );

    doc.text(
      formatCurrency(subtotal),
      194,
      y,
      {
        align: "right",
      },
    );

    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(253, 100, 1);

    doc.text(
      "Total",
      150,
      y,
      {
        align: "right",
      },
    );

    doc.text(
      formatCurrency(total),
      194,
      y,
      {
        align: "right",
      },
    );

    if (discountPercent > 0) {
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(70, 70, 70);

      doc.text(
        `Desconto PIX (${discountPercent}%)`,
        150,
        y,
        {
          align: "right",
        },
      );

      doc.setTextColor(190, 60, 60);

      doc.text(
        `- ${formatCurrency(discountAmount)}`,
        194,
        y,
        {
          align: "right",
        },
      );

      y += 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(20, 20, 20);

      doc.text(
        "Total no PIX",
        150,
        y,
        {
          align: "right",
        },
      );

      doc.text(
        formatCurrency(pixTotal),
        194,
        y,
        {
          align: "right",
        },
      );
    }

    doc.setFont("helvetica", "normal");

    if (notes) {
      y += 16;

      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);

      doc.text(
        "OBSERVAÇÕES",
        14,
        y,
      );

      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);

      const lines = doc.splitTextToSize(
        notes,
        180,
      );

      doc.text(
        lines,
        14,
        y + 5,
      );
    }

    doc.save(
      `orcamento-${
        quote?.quoteNumber ??
        editingQuote?.quoteNumber ??
        "novo"
      }.pdf`,
    );
  }

  if (loading) {
    return (
      <div className="relative min-h-screen bg-[#050914]">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[size:32px_32px]" />

        <div className="relative flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[var(--accent)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050914]">
      <div className="pointer-events-none fixed -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-[#071124]/60 blur-[120px]" />

      <div className="pointer-events-none fixed -left-40 top-20 h-[420px] w-[420px] rounded-full bg-[rgba(var(--accent-rgb),0.025)] blur-[130px]" />

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[size:32px_32px]" />

      <div className="relative space-y-6 px-4 py-5 sm:p-6">
        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(var(--accent-rgb),0.20)] bg-[rgba(var(--accent-rgb),0.08)]">
                <FileText className="h-4 w-4 text-[var(--accent)]" />
              </div>

              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
                Comercial
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Orçamentos
            </h1>

            <p className="mt-1 text-sm text-white/40">
              Crie, acompanhe e gerencie suas propostas comerciais.
            </p>
          </div>

          <Button
            onClick={openCreate}
            className="h-10 bg-gradient-to-r from-[#071124] to-[#0d1a35] text-white shadow-lg shadow-black/30 ring-1 ring-white/10 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(var(--accent-rgb),0.20)] hover:ring-[rgba(var(--accent-rgb),0.30)]"
          >
            <Plus className="h-4 w-4" />
            Novo Orçamento
          </Button>
        </div>

        {/* STATS */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            {
              label: "Total",
              value: totalQuotes,
              text: "orçamentos cadastrados",
              icon: FileText,
            },
            {
              label: "Rascunhos",
              value: draftQuotes,
              text: "aguardando envio",
              icon: Clock3,
            },
            {
              label: "Enviados",
              value: sentQuotes,
              text: "aguardando retorno",
              icon: Send,
            },
            {
              label: "Aprovados",
              value: approvedQuotes,
              text: "propostas aprovadas",
              icon: CheckCircle2,
            },
            {
              label: "Valor aprovado",
              value: formatCurrency(approvedValue),
              text: "total aprovado",
              icon: CheckCircle2,
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-white/35">
                    {stat.label}
                  </span>

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04]">
                    <Icon className="h-4 w-4 text-white/40" />
                  </div>
                </div>

                <p className="mt-3 truncate text-2xl font-semibold text-white">
                  {stat.value}
                </p>

                <p className="mt-1 text-xs text-white/30">
                  {stat.text}
                </p>
              </div>
            );
          })}
        </div>

        {/* LISTA */}
        <Card className="overflow-hidden border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/40 backdrop-blur-2xl">
          <CardHeader className="border-b border-white/5 p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Lista de orçamentos
                </h2>

                <p className="mt-1 text-xs text-white/35">
                  Consulte, edite, exporte ou acompanhe suas propostas.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />

                  <input
                    type="text"
                    placeholder="Buscar cliente, produto ou número..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/25 transition-all focus:border-[rgba(var(--accent-rgb),0.45)] focus:bg-white/[0.06] focus:ring-1 focus:ring-[rgba(var(--accent-rgb),0.12)]"
                  />
                </div>

                <Select
                  options={[
                    {
                      value: "all",
                      label: "Todos os status",
                    },
                    ...quoteStatuses,
                  ]}
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value)
                  }
                  className="h-10 w-full border-white/10 bg-white/[0.04] text-white focus:border-[rgba(var(--accent-rgb),0.45)] focus:ring-[rgba(var(--accent-rgb),0.15)] sm:w-44"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHead className="border-b border-white/10">
                  <TableRow>
                    <TableHeadCell className="text-left text-white/40">
                      Orçamento
                    </TableHeadCell>

                    <TableHeadCell className="text-left text-white/40">
                      Produto
                    </TableHeadCell>

                    <TableHeadCell className="text-left text-white/40">
                      Cliente
                    </TableHeadCell>

                    <TableHeadCell className="text-center text-white/40">
                      Itens
                    </TableHeadCell>

                    <TableHeadCell className="text-right text-white/40">
                      Subtotal
                    </TableHeadCell>

                    <TableHeadCell className="text-right text-white/40">
                      Total
                    </TableHeadCell>

                    <TableHeadCell className="text-center text-white/40">
                      Status
                    </TableHeadCell>

                    <TableHeadCell className="text-center text-white/40">
                      Validade
                    </TableHeadCell>

                    <TableHeadCell className="text-center text-white/40">
                      Criação
                    </TableHeadCell>

                    <TableHeadCell className="text-right text-white/40">
                      Ações
                    </TableHeadCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filtered.map((quote) => (
                    <TableRow
                      key={quote.id}
                      className="border-b border-white/5 transition-colors hover:bg-white/[0.025] last:border-0"
                    >
                      <TableCell>
                        <div>
                          <p className="font-mono text-xs font-semibold text-white">
                            #{quote.quoteNumber ?? quote.id}
                          </p>

                          <p className="mt-1 text-[10px] uppercase tracking-wider text-white/25">
                            Proposta
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="block max-w-[170px] truncate text-sm text-white/65">
                          {quote.productName || "—"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="block max-w-[170px] truncate text-sm text-white/75">
                          {quote.clientName}
                        </span>
                      </TableCell>

                      <TableCell className="text-center">
                        <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-white/50">
                          {quote.items?.length ?? 0}
                        </span>
                      </TableCell>

                      <TableCell className="text-right text-sm text-white/50">
                        {formatCurrency(
                          Number(quote.subtotal ?? 0),
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <span className="text-sm font-semibold text-white">
                          {formatCurrency(
                            Number(quote.total ?? 0),
                          )}
                        </span>
                      </TableCell>

                      <TableCell className="text-center">
                        <StatusBadge status={quote.status} />
                      </TableCell>

                      <TableCell className="text-center text-xs text-white/45">
                        {formatDate(quote.validUntil)}
                      </TableCell>

                      <TableCell className="text-center text-xs text-white/35">
                        {formatDate(quote.createdAt)}
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              generatePDF(quote)
                            }
                            className="h-9 w-9 rounded-lg border border-white/10 bg-white/[0.03] p-0 text-white/50 hover:border-[rgba(var(--accent-rgb),0.35)] hover:bg-[rgba(var(--accent-rgb),0.08)] hover:text-[var(--accent)]"
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              openEdit(quote)
                            }
                            className="h-9 w-9 rounded-lg border border-white/10 bg-white/[0.03] p-0 text-white/50 hover:border-[rgba(var(--accent-rgb),0.35)] hover:bg-[rgba(var(--accent-rgb),0.08)] hover:text-[var(--accent)]"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDelete(quote.id)
                            }
                            className="h-9 w-9 rounded-lg border border-white/10 bg-white/[0.03] p-0 text-white/50 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10}>
                        <div className="py-14 text-center">
                          <FileText className="mx-auto h-8 w-8 text-white/15" />

                          <p className="mt-3 text-sm text-white/40">
                            Nenhum orçamento encontrado
                          </p>

                          {search && (
                            <p className="mt-1 text-xs text-white/25">
                              Tente buscar por outro cliente,
                              produto ou número.
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* MOBILE */}
            <div className="space-y-3 p-4 md:hidden">
              {filtered.map((quote) => (
                <div
                  key={quote.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 shadow-lg shadow-black/20 backdrop-blur-xl"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-white/30">
                          Orçamento
                        </p>

                        <p className="mt-1 font-mono text-sm font-semibold text-white">
                          #{quote.quoteNumber ?? quote.id}
                        </p>
                      </div>

                      <StatusBadge status={quote.status} />
                    </div>

                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-white/30">
                        Cliente
                      </p>

                      <p className="mt-1 truncate text-sm font-medium text-white">
                        {quote.clientName}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-white/30">
                        Produto
                      </p>

                      <p className="mt-1 text-sm text-white/65">
                        {quote.productName || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-white/30">
                            Total
                          </p>

                          <p className="mt-1 text-lg font-bold text-white">
                            {formatCurrency(
                              Number(quote.total ?? 0),
                            )}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-white/30">
                            Subtotal
                          </p>

                          <p className="mt-1 text-sm text-white/50">
                            {formatCurrency(
                              Number(quote.subtotal ?? 0),
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-white/30">
                          Itens
                        </p>

                        <p className="mt-1 text-sm text-white/60">
                          {quote.items?.length ?? 0}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-white/30">
                          Validade
                        </p>

                        <p className="mt-1 text-sm text-white/60">
                          {formatDate(
                            quote.validUntil,
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-white/30">
                          Criação
                        </p>

                        <p className="mt-1 text-sm text-white/60">
                          {formatDate(
                            quote.createdAt,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border-t border-white/5 pt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          generatePDF(quote)
                        }
                        className="h-10 flex-1 rounded-xl border border-white/10 bg-white/[0.03] text-white/50 hover:border-[rgba(var(--accent-rgb),0.35)] hover:bg-[rgba(var(--accent-rgb),0.08)] hover:text-[var(--accent)]"
                      >
                        <FileDown className="h-4 w-4" />
                        <span className="ml-2 text-xs">
                          PDF
                        </span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          openEdit(quote)
                        }
                        className="h-10 flex-1 rounded-xl border border-white/10 bg-white/[0.03] text-white/50 hover:border-[rgba(var(--accent-rgb),0.35)] hover:bg-[rgba(var(--accent-rgb),0.08)] hover:text-[var(--accent)]"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="ml-2 text-xs">
                          Editar
                        </span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDelete(quote.id)
                        }
                        className="h-10 w-10 rounded-xl border border-white/10 bg-white/[0.03] p-0 text-white/50 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-12 text-center">
                  <FileText className="mx-auto h-8 w-8 text-white/15" />

                  <p className="mt-3 text-sm text-white/40">
                    Nenhum orçamento encontrado
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingQuote
            ? "Editar Orçamento"
            : "Novo Orçamento"
        }
        size="xl"
        className="border border-white/10 bg-[#0a1120]/95 text-white backdrop-blur-2xl"
      >
        <form onSubmit={handleSave}>
          <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
            {/* ESQUERDA */}
            <div className="space-y-6">
              <div>
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-white">
                    Informações do orçamento
                  </h3>

                  <p className="mt-1 text-xs text-white/30">
                    Defina o cliente, produto e validade da
                    proposta.
                  </p>
                </div>

                <div className="space-y-4">
                  <Input
                    id="product"
                    label="Produto"
                    placeholder="Digite o nome do produto"
                    value={form.productName}
                    onChange={(e) => {
                      const productName =
                        e.target.value;

                      setForm((prev) => ({
                        ...prev,
                        productName,
                      }));

                      if (productName.trim()) {
                        setErrors((prev) => ({
                          ...prev,
                          product: "",
                        }));
                      }
                    }}
                    error={errors.product}
                    required
                    className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25 focus:border-[rgba(var(--accent-rgb),0.45)] focus:ring-[rgba(var(--accent-rgb),0.15)]"
                  />

                  <Input
                    id="client"
                    label="Cliente"
                    placeholder="Digite o nome do cliente"
                    value={form.clientName}
                    onChange={(e) => {
                      setForm((prev) => ({
                        ...prev,
                        clientName:
                          e.target.value,
                      }));

                      if (
                        e.target.value.trim()
                      ) {
                        setErrors((prev) => ({
                          ...prev,
                          client: "",
                        }));
                      }
                    }}
                    error={errors.client}
                    required
                    className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25 focus:border-[rgba(var(--accent-rgb),0.45)] focus:ring-[rgba(var(--accent-rgb),0.15)]"
                  />

                  <Input
                    id="validUntil"
                    label="Validade"
                    type="date"
                    value={form.validUntil}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        validUntil:
                          e.target.value,
                      }))
                    }
                    required
                    className="border-white/10 bg-white/[0.04] text-white focus:border-[rgba(var(--accent-rgb),0.45)] focus:ring-[rgba(var(--accent-rgb),0.15)]"
                  />

                  <Input
                    id="notes"
                    label="Observações"
                    placeholder="Informações adicionais para o cliente..."
                    value={form.notes}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25 focus:border-[rgba(var(--accent-rgb),0.45)] focus:ring-[rgba(var(--accent-rgb),0.15)]"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-white">
                    Status
                  </h3>

                  <p className="mt-1 text-xs text-white/30">
                    Defina em qual etapa está esta proposta.
                  </p>
                </div>

                <Select
                  options={quoteStatuses}
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      status:
                        e.target.value as Quote["status"],
                    }))
                  }
                  className="border-white/10 bg-white/[0.04] text-white focus:border-[rgba(var(--accent-rgb),0.45)] focus:ring-[rgba(var(--accent-rgb),0.15)]"
                />
              </div>
            </div>

            {/* DIREITA */}
            <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
              <div className="border-b border-white/10 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Itens do orçamento
                    </h3>

                    <p className="mt-1 text-xs text-white/30">
                      Adicione os itens e seus valores.
                    </p>
                  </div>

                  <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-white/40">
                    {form.items.length}{" "}
                    {form.items.length === 1
                      ? "item"
                      : "itens"}
                  </span>
                </div>
              </div>

              {/* ADICIONAR ITEM */}
              <div className="border-b border-white/10 p-5">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Quantidade"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={itemForm.quantity}
                    onChange={(e) =>
                      setItemForm((prev) => ({
                        ...prev,
                        quantity:
                          e.target.value,
                      }))
                    }
                    className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25"
                  />

                  <Input
                    label="Valor unitário"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={itemForm.unitPrice}
                    onChange={(e) =>
                      setItemForm((prev) => ({
                        ...prev,
                        unitPrice:
                          e.target.value,
                      }))
                    }
                    className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25"
                  />
                </div>

                <Button
                  type="button"
                  onClick={addItem}
                  className="mt-3 h-9 w-full bg-[var(--accent)] text-white shadow-lg shadow-orange-950/20 hover:bg-[#ff7b24]"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar item
                </Button>
              </div>

              {/* LISTA */}
              <div className="max-h-72 flex-1 space-y-3 overflow-y-auto p-5">
                {form.items.length === 0 && (
                  <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.015] px-4 text-center">
                    <FileText className="h-7 w-7 text-white/15" />

                    <p className="mt-2 text-xs text-white/35">
                      Nenhum item adicionado
                    </p>

                    <p className="mt-1 text-[11px] text-white/20">
                      Adicione pelo menos um item ao
                      orçamento.
                    </p>
                  </div>
                )}

                {form.items.map((item, idx) => {
                  const quantity = Number(
                    item.quantity,
                  );

                  const unitPrice = Number(
                    item.unitPrice,
                  );

                  const itemTotal =
                    Number.isFinite(quantity) &&
                    Number.isFinite(unitPrice)
                      ? quantity * unitPrice
                      : 0;

                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-white/10 bg-[#071124] p-3 transition-colors hover:border-white/15"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {item.description ||
                              "Item"}
                          </p>

                          <p className="mt-1 text-xs text-white/35">
                            {quantity} ×{" "}
                            {formatCurrency(
                              unitPrice,
                            )}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            {formatCurrency(
                              itemTotal,
                            )}
                          </span>

                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() =>
                              removeItem(idx)
                            }
                            className="h-8 w-8 rounded-lg p-0 text-white/30 hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* RESUMO */}
              <div className="border-t border-white/10 bg-white/[0.02] p-5">
                <div className="space-y-3">
                  <div className="flex justify-between text-white/50">
                    <span className="text-xs">
                      Subtotal
                    </span>

                    <span className="text-xs">
                      {formatCurrency(
                        calcSubtotal(),
                      )}
                    </span>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-white">
                          Desconto PIX
                        </p>

                        <p className="mt-0.5 text-[10px] text-white/30">
                          Percentual para pagamento à vista
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="0"
                          value={
                            form.discountPercent
                          }
                          onChange={(e) => {
                            const value =
                              e.target.value;

                            if (
                              value === "" ||
                              Number(value) <= 100
                            ) {
                              setForm((prev) => ({
                                ...prev,
                                discountPercent:
                                  value,
                              }));
                            }
                          }}
                          className="h-9 w-20 border-white/10 bg-white/[0.04] px-2 text-center text-sm text-white"
                        />

                        <span className="text-sm text-white/40">
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  {calcDiscountPercent() >
                    0 && (
                    <div className="flex justify-between text-white/50">
                      <span className="text-xs">
                        Desconto (
                        {calcDiscountPercent()}
                        %)
                      </span>

                      <span className="text-xs text-red-400">
                        -{" "}
                        {formatCurrency(
                          calcDiscountAmount(),
                        )}
                      </span>
                    </div>
                  )}

                  <div className="h-px bg-white/10" />

                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-white/30">
                        Total
                      </p>

                      <p className="mt-1 text-2xl font-bold text-white">
                        {formatCurrency(
                          calcTotal(),
                        )}
                      </p>
                    </div>
                  </div>

                  {calcDiscountPercent() >
                    0 && (
                    <div className="rounded-xl border border-[rgba(var(--accent-rgb),0.25)] bg-[rgba(var(--accent-rgb),0.05)] px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                            Total no PIX
                          </p>

                          <p className="mt-0.5 text-[10px] text-white/30">
                            Pagamento à vista
                          </p>
                        </div>

                        <span className="text-lg font-bold text-[var(--accent)]">
                          {formatCurrency(
                            calcPixTotal(),
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                generatePDF()
              }
              className="border-white/10 bg-white/[0.04] text-white/60 ring-1 ring-white/5 hover:bg-white/[0.08] hover:text-white"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Gerar PDF
            </Button>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setModalOpen(false)
                }
                className="border-white/10 bg-white/[0.04] text-white/60 ring-1 ring-white/5 hover:bg-white/[0.08] hover:text-white"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                className="bg-gradient-to-r from-[#071124] to-[#0d1a35] text-white shadow-lg shadow-black/20 ring-1 ring-white/10 hover:ring-[rgba(var(--accent-rgb),0.35)]"
              >
                {editingQuote
                  ? "Salvar alterações"
                  : "Criar orçamento"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

