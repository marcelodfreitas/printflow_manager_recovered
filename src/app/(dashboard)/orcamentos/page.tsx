"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";
import { Plus, Search, FileDown, Trash2, Pencil } from "lucide-react";
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
import { useProducts } from "@/hooks/useProducts";
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
      variant: "info" as const,
      label: "Aprovado",
    },
    rejected: {
      variant: "danger" as const,
      label: "Rejeitado",
    },
    converted: {
      variant: "success" as const,
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
  const { products } = useProducts();

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
    const matchesSearch =
      q.clientName.toLowerCase().includes(search.toLowerCase()) ||
      (q.productName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      String(q.quoteNumber ?? "").includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || q.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
      items: quote.items.map((i) => ({
        description: i.description,
        quantity: String(i.quantity),
        unitPrice: String(i.unitPrice),
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
    if (!form.productName.trim()) {
      (
        document.getElementById("product") as HTMLInputElement | null
      )?.reportValidity();
      return;
    }

    if (!itemForm.unitPrice) return;

    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: prev.productName.trim(),
          quantity: itemForm.quantity,
          unitPrice: itemForm.unitPrice,
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
      return acc + Number(item.quantity) * Number(item.unitPrice);
    }, 0);
  }

  function calcTax() {
    return calcSubtotal() * 0.1;
  }

  function calcTotal() {
    return calcSubtotal() + calcTax();
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

    if (!productName) {
      document
        .getElementById("product")
        ?.closest("form")
        ?.querySelector<HTMLInputElement>("#product")
        ?.reportValidity();

      return;
    }

    if (!clientName) {
      document
        .getElementById("client")
        ?.closest("form")
        ?.querySelector<HTMLInputElement>("#client")
        ?.reportValidity();

      return;
    }

    const subtotal = calcSubtotal();
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    const discountPercent = calcDiscountPercent();

    const items: QuoteItem[] = form.items.map((item, idx) => ({
      id: String(idx),
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      total: Number(item.quantity) * Number(item.unitPrice),
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

    const validUntil = quote ? quote.validUntil || "" : form.validUntil;

    const status = quote ? quote.status : form.status;

    const notes = quote ? quote.notes || "" : form.notes;

    const items = quote ? quote.items || [] : form.items;

    const subtotal = quote ? Number(quote.subtotal ?? 0) : calcSubtotal();

    const total = quote ? Number(quote.total ?? 0) : calcTotal();

    const discountPercent = quote
      ? Number(quote.discountPercent ?? 0)
      : calcDiscountPercent();

    const discountAmount = total * (discountPercent / 100);

    const pixTotal = total - discountAmount;

    let logoData: string | null = null;

    try {
      const response = await fetch(logo.src);
      const blob = await response.blob();

      logoData = await new Promise<string>((resolve) => {
        const reader = new FileReader();

        reader.onloadend = () => resolve(reader.result as string);

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
      doc.addImage(logoData, "PNG", 14, 5, 17, 17);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);

    doc.text("PrintFlow", logoData ? 37 : 14, 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(253, 100, 1);

    doc.text("Orçamento de impressão 3D", logoData ? 37 : 14, 20);

    doc.setTextColor(180, 190, 205);
    doc.text("Data:", 150, 12);

    doc.setTextColor(255, 255, 255);

    doc.text(new Date().toLocaleDateString("pt-BR"), 194, 12, {
      align: "right",
    });

    doc.setTextColor(180, 190, 205);
    doc.text("Status:", 150, 18);

    doc.setTextColor(255, 255, 255);

    doc.text(translateStatus(status), 194, 18, {
      align: "right",
    });

    let y = 40;

    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text("CLIENTE", 14, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);

    doc.text(clientName || "—", 14, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);

    if (validUntil) {
      doc.text(`Validade: ${formatDate(validUntil)}`, 14, y + 12);
    }

    y += 24;

    doc.setFillColor(245, 245, 245);
    doc.rect(14, y - 5, 182, 7, "F");

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
      const itemTotal = Number(item.quantity) * Number(item.unitPrice);

      doc.text(item.description, 16, y);

      doc.text(String(item.quantity), 124, y, {
        align: "right",
      });

      doc.text(formatCurrency(Number(item.unitPrice)), 152, y, {
        align: "right",
      });

      doc.text(formatCurrency(itemTotal), 194, y, {
        align: "right",
      });

      y += 7;
    });

    y += 8;

    doc.setDrawColor(220, 220, 220);
    doc.line(14, y - 4, 196, y - 4);

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    doc.text("Subtotal", 150, y, {
      align: "right",
    });

    doc.text(formatCurrency(subtotal), 194, y, {
      align: "right",
    });

    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(253, 100, 1);

    doc.text("Total", 150, y, {
      align: "right",
    });

    doc.text(formatCurrency(total), 194, y, {
      align: "right",
    });

    if (discountPercent > 0) {
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(70, 70, 70);

      doc.text(`Desconto PIX (${discountPercent}%)`, 150, y, {
        align: "right",
      });

      doc.setTextColor(190, 60, 60);

      doc.text(`- ${formatCurrency(discountAmount)}`, 194, y, {
        align: "right",
      });

      y += 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(20, 20, 20);

      doc.text("Total no PIX", 150, y, {
        align: "right",
      });

      doc.text(formatCurrency(pixTotal), 194, y, {
        align: "right",
      });
    }

    doc.setFont("helvetica", "normal");

    if (notes) {
      y += 16;

      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);

      doc.text("OBSERVAÇÕES", 14, y);

      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);

      const lines = doc.splitTextToSize(notes, 180);

      doc.text(lines, 14, y + 5);
    }

    doc.save(
      `orcamento-${
        quote?.quoteNumber ?? editingQuote?.quoteNumber ?? "novo"
      }.pdf`,
    );
  }

  if (loading) {
    return (
      <div className="relative min-h-screen bg-[#050914]">
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[var(--accent)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050914]">
      <div className="pointer-events-none fixed -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-[#071124]/60 blur-[120px]" />

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] bg-[size:32px_32px]" />

      <div className="space-y-5 px-4 py-5 sm:space-y-6 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border border-white/10 bg-[#050914] backdrop-blur-2xl shadow-2xl shadow-black/40">
            <CardContent className="p-6">
              <p className="text-sm text-white">Total de Orçamentos</p>

              <p className="text-2xl font-bold text-white/50">
                {quotes.length}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-[#050914] backdrop-blur-2xl shadow-2xl shadow-black/40">
            <CardContent className="p-6">
              <p className="text-sm text-white">Aprovados</p>

              <p className="text-2xl font-bold text-green-600">
                {quotes.filter((q) => q.status === "approved").length}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-[#050914] backdrop-blur-2xl shadow-2xl shadow-black/40">
            <CardContent className="p-6">
              <p className="text-sm text-white">Valor Total Aprovado</p>

              <p className="text-2xl font-bold text-white/50">
                {formatCurrency(
                  quotes
                    .filter((q) => q.status === "approved")
                    .reduce((acc, q) => acc + q.total, 0),
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-2xl shadow-2xl shadow-black/40">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:gap-4">
                <div className="relative w-full flex-1 sm:max-w-xs">
                  <Input
                    type="text"
                    placeholder="Buscar clientes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    icon={<Search className="h-4 w-4" />}
                    className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-[var(--accent)]/50 focus:ring-[var(--accent)]/20"
                  />
                </div>

                <Select
                  options={[
                    {
                      value: "all",
                      label: "Todos Status",
                    },
                    ...quoteStatuses,
                  ]}
                  value={statusFilter}
                  className="w-full border-white/10 bg-white/5 text-white focus:border-[var(--accent)]/50 focus:ring-[var(--accent)]/20 sm:w-44"
                  onChange={(e) => setStatusFilter(e.target.value)}
                />
              </div>

              <Button
                onClick={openCreate}
                className="bg-gradient-to-r from-[#071124] to-[#0d1a35] text-white shadow-lg shadow-black/30 ring-1 ring-white/10 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(var(--accent-rgb),0.20)] hover:ring-[rgba(var(--accent-rgb),0.30)]"
              >
                <Plus className="h-4 w-4" />
                Novo Orçamento
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="hidden md:block">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeadCell className="text-center text-white/50">
                      Orçamento
                    </TableHeadCell>

                    <TableHeadCell className="text-center text-white/50">
                      Produto
                    </TableHeadCell>

                    <TableHeadCell className="text-center text-white/50">
                      Cliente
                    </TableHeadCell>

                    <TableHeadCell className="text-center text-white/50">
                      Itens
                    </TableHeadCell>

                    <TableHeadCell className="text-center text-white/50">
                      Subtotal
                    </TableHeadCell>

                    <TableHeadCell className="text-center text-white/50">
                      Total
                    </TableHeadCell>

                    <TableHeadCell className="text-center text-white/50">
                      Status
                    </TableHeadCell>

                    <TableHeadCell className="text-center text-white/50">
                      Validade
                    </TableHeadCell>

                    <TableHeadCell className="text-center text-white/50">
                      Criação
                    </TableHeadCell>

                    <TableHeadCell className="text-center text-white/50">
                      Ações
                    </TableHeadCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filtered.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="text-center font-mono text-xs font-medium">
                        #{quote.quoteNumber ?? quote.id}
                      </TableCell>

                      <TableCell className="text-center text-xs">
                        {quote.productName || "—"}
                      </TableCell>

                      <TableCell className="text-center">
                        {quote.clientName}
                      </TableCell>

                      <TableCell className="text-center text-xs">
                        {quote.items.length} item(ns)
                      </TableCell>

                      <TableCell className="text-center">
                        {formatCurrency(quote.subtotal)}
                      </TableCell>

                      <TableCell className="text-center font-medium">
                        {formatCurrency(quote.total)}
                      </TableCell>

                      <TableCell className="text-center">
                        <StatusBadge status={quote.status} />
                      </TableCell>

                      <TableCell className="text-center text-xs">
                        {formatDate(quote.validUntil)}
                      </TableCell>

                      <TableCell className="text-center text-xs">
                        {formatDate(quote.createdAt)}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => generatePDF(quote)}
                            className="h-10 w-10 rounded-lg border border-white/10 bg-white/[0.03] text-white/60 transition-all duration-200 hover:border-[var(--accent)]/40 hover:accent-bg hover:accent-text"
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(quote)}
                            className="h-10 w-10 rounded-lg border border-white/10 bg-white/[0.03] text-white/60 transition-all duration-200 hover:border-[var(--accent)]/40 hover:accent-bg hover:accent-text"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(quote.id)}
                            className="h-10 w-10 rounded-lg border border-white/10 bg-white/[0.03] text-white/60 transition-all duration-200 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
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
                        <div className="py-8 text-center text-sm text-gray-500">
                          Nenhum orçamento encontrado
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-3 p-4 md:hidden">
              {filtered.map((quote) => (
                <div
                  key={quote.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-lg shadow-black/20 backdrop-blur-2xl"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">
                          Orçamento
                        </p>

                        <p className="mt-1 font-mono text-sm font-semibold text-white">
                          #{quote.quoteNumber ?? quote.id}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <StatusBadge status={quote.status} />
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">
                        Cliente
                      </p>

                      <p className="mt-1 truncate text-sm font-medium text-white">
                        {quote.clientName}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">
                        Produto
                      </p>

                      <p className="mt-1 text-sm text-white/70">
                        {quote.productName || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">
                            Total
                          </p>

                          <p className="mt-1 text-lg font-bold text-white">
                            {formatCurrency(quote.total)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">
                            Subtotal
                          </p>

                          <p className="mt-1 text-sm text-white/60">
                            {formatCurrency(quote.subtotal)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">
                          Validade
                        </p>

                        <p className="mt-1 text-sm text-white/60">
                          {formatDate(quote.validUntil)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">
                          Criação
                        </p>

                        <p className="mt-1 text-sm text-white/60">
                          {formatDate(quote.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">
                        Itens
                      </p>

                      <p className="mt-1 text-sm text-white/60">
                        {quote.items.length}{" "}
                        {quote.items.length === 1 ? "item" : "itens"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 border-t border-white/10 pt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => generatePDF(quote)}
                        className="h-10 flex-1 rounded-xl border border-white/10 bg-transparent text-white/60 transition-all duration-200 hover:border-[var(--accent)]/40 hover:accent-bg hover:accent-text"
                      >
                        <FileDown className="mr-1 h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(quote)}
                        className="h-10 flex-1 rounded-xl border border-white/10 bg-transparent text-white/60 transition-all duration-200 hover:border-[var(--accent)]/40 hover:accent-bg hover:accent-text"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(quote.id)}
                        className="h-10 flex-1 rounded-xl border border-white/10 bg-transparent text-white/60 transition-all duration-200 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="py-8 text-center text-sm text-white/40">
                  Nenhum orçamento encontrado
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingQuote ? "Editar Orçamento" : "Novo Orçamento"}
        size="xl"
      >
        <form onSubmit={handleSave}>
          <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
            <div className="space-y-3">
              <Input
  id="product"
  label="Produto"
  placeholder="Digite o nome do produto"
  value={form.productName}
  onChange={(e) => {
    setForm((prev) => ({
      ...prev,
      productName: e.target.value,
    }));

    if (e.target.value.trim()) {
      setErrors((prev) => ({
        ...prev,
        product: "",
      }));
    }
  }}
  error={errors.product}
  required
/>

              <Input
  id="client"
  label="Cliente"
  placeholder="Digite o nome do cliente"
  value={form.clientName}
  onChange={(e) => {
    setForm((prev) => ({
      ...prev,
      clientName: e.target.value,
    }));

    if (e.target.value.trim()) {
      setErrors((prev) => ({
        ...prev,
        client: "",
      }));
    }
  }}
  error={errors.client}
  required
/>

<Input
  id="validUntil"
  label="Validade"
  type="date"
  value={form.validUntil}
  onChange={(e) =>
    setForm((prev) => ({
      ...prev,
      validUntil: e.target.value,
    }))
  }
  required
/>

              <Input
                id="notes"
                label="Observações"
                value={form.notes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    notes: e.target.value,
                  })
                }
                className="border-white/10 bg-white/5 text-white"
              />
            </div>

            <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <div className="border-b border-white/10 px-6 py-5">
                <h3 className="text-lg font-semibold text-white">
                  Itens do orçamento
                </h3>
              </div>

              <div className="flex-1 space-y-5 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <Input
                    label="Quantidade"
                    type="number"
                    placeholder="1"
                    value={itemForm.quantity}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        quantity: e.target.value,
                      })
                    }
                    className="w-full border-white/10 bg-white/5 text-white sm:w-20"
                  />

                  <Input
                    label="Valor Unit."
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={itemForm.unitPrice}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        unitPrice: e.target.value,
                      })
                    }
                    className="w-full border-white/10 bg-white/5 text-white sm:w-28"
                  />

                  <Button
                    type="button"
                    onClick={addItem}
                    className="h-9 whitespace-nowrap px-6 accent-bg hover:bg-[#ff7b24]"
                  >
                    Adicionar Item
                  </Button>
                </div>

                <div className="max-h-72 space-y-3 overflow-y-auto">
                  {form.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-white/10 bg-[#071124] p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-white">
                            {item.description}
                          </p>

                          <p className="mt-1 text-sm text-white/50">
                            {item.quantity} ×{" "}
                            {formatCurrency(Number(item.unitPrice))}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-white">
                            {formatCurrency(
                              Number(item.quantity) * Number(item.unitPrice),
                            )}
                          </span>

                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => removeItem(idx)}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RESUMO FINANCEIRO */}
              <div className="border-t border-white/10 bg-white/[0.03] px-6 py-5">
                <div className="space-y-3">
                  <div className="flex justify-between text-white/60">
                    <span className="text-xs">Subtotal</span>

                    <span className="text-xs">
                      {formatCurrency(calcSubtotal())}
                    </span>
                  </div>


                  {/* DESCONTO PIX */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium text-white">
                          Desconto PIX
                        </p>

                        <p className="mt-0.5 text-[11px] text-white/35">
                          Escolha o percentual para pagamento à vista
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="0"
                          value={form.discountPercent}
                          onChange={(e) => {
                            const value = e.target.value;

                            if (value === "" || Number(value) <= 100) {
                              setForm({
                                ...form,
                                discountPercent: value,
                              });
                            }
                          }}
                          className="h-9 w-20 border-white/10 bg-white/5 px-3 text-center text-sm text-white"
                        />

                        <span className="text-sm text-white/50">%</span>
                      </div>
                    </div>
                  </div>

                  {calcDiscountPercent() > 0 && (
                    <div className="flex justify-between text-white/60">
                      <span className="text-xs">
                        Desconto ({calcDiscountPercent()}
                        %)
                      </span>

                      <span className="text-xs text-red-400">
                        - {formatCurrency(calcDiscountAmount())}
                      </span>
                    </div>
                  )}

                  <div className="h-px bg-white/10" />

                  <div className="flex justify-between text-xl font-bold text-white">
                    <span>Total</span>

                    <span>{formatCurrency(calcTotal())}</span>
                  </div>

                  {calcDiscountPercent() > 0 && (
                    <div className="mt-2 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-[var(--accent)]">
                            Total no PIX
                          </p>

                          <p className="mt-0.5 text-[11px] text-white/40">
                            Pagamento à vista
                          </p>
                        </div>

                        <span className="text-xl font-bold text-[var(--accent)]">
                          {formatCurrency(calcPixTotal())}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={generatePDF}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Gerar PDF
            </Button>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setModalOpen(false)}
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                className="bg-gradient-to-r from-[#071124] to-[#0d1a35] text-white ring-1 ring-white/10 hover:ring-[var(--accent)]/30"
              >
                {editingQuote ? "Salvar" : "Criar Orçamento"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
