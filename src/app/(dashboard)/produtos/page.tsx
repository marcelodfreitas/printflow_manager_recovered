"use client";

import { useState } from "react";
import { Plus, Search, Pencil, Trash2, ExternalLink } from "lucide-react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
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

import type { Product } from "@/types";
import { useProducts } from "@/hooks/useProducts";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ProductsPage() {
  const { products, loading, create, update, remove } = useProducts();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    printTimeHours: "0",
    printTimeMinutes: "0",
    filamentGrams: "",
    productUrl: "",
  });

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  function openCreate() {
    setEditingProduct(null);

    setForm({
      name: "",
      description: "",
      price: "",
      printTimeHours: "0",
      printTimeMinutes: "0",
      filamentGrams: "",
      productUrl: "",
    });

    setModalOpen(true);
  }

  function openEdit(product: Product) {
    const totalMinutes = Number(product.printTimeMinutes ?? 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    setEditingProduct(product);

    setForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price ?? ""),
      printTimeHours: String(hours),
      printTimeMinutes: String(minutes),
      filamentGrams: String(product.filamentGrams ?? ""),
      productUrl: product.productUrl || "",
    });

    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) return;

    const hours = Math.max(0, Number(form.printTimeHours) || 0);

    const minutes = Math.min(
      59,
      Math.max(0, Number(form.printTimeMinutes) || 0),
    );

    const printTimeMinutes = hours * 60 + minutes;

    const data = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: Number(form.price) || 0,
      printTimeMinutes,
      filamentGrams: Math.max(0, Number(form.filamentGrams) || 0),
      productUrl: form.productUrl.trim() || undefined,
    };

    if (editingProduct) {
      await update(editingProduct.id, data);
    } else {
      await create(data);
    }

    setModalOpen(false);
  }

  function handleDelete(id: string) {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      remove(id);
    }
  }

  function formatPrintTime(totalMinutes: number) {
    const minutes = Number(totalMinutes ?? 0);

    if (!minutes || minutes <= 0) {
      return "Não informado";
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0 && remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}min`;
    }

    if (hours > 0) {
      return `${hours}h`;
    }

    return `${remainingMinutes}min`;
  }

  return (
    <div className="relative min-h-screen bg-[#050914]">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[rgba(var(--accent-rgb),0.045)] blur-[140px]" />

        <div className="absolute -bottom-48 -left-40 h-[520px] w-[520px] rounded-full bg-[#071124]/80 blur-[140px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.035)_1px,transparent_0)] bg-[size:32px_32px]" />
      </div>

      <div className="relative z-10">
        {loading ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-white/45">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-[var(--accent)]" />
              Carregando produtos...
            </div>
          </div>
        ) : (
          <div className="space-y-6 px-4 py-5 sm:p-6 lg:px-8 lg:py-7">
            {/* Header */}
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--accent)]">
                  Catálogo
                </p>

                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Produtos
                </h1>

                <p className="mt-1.5 max-w-xl text-sm text-white/45">
                  Cadastre e gerencie os produtos utilizados nos seus pedidos.
                </p>
              </div>

              <Button
                onClick={openCreate}
                className="h-10 gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-white shadow-lg shadow-[rgba(var(--accent-rgb),0.18)] transition-all duration-200 hover:brightness-110 hover:shadow-[0_8px_30px_rgba(var(--accent-rgb),0.25)]"
              >
                <Plus className="h-4 w-4" />
                Novo produto
              </Button>
            </div>

            {/* Main Card */}
            <Card className="overflow-hidden border border-white/10 bg-white/[0.025] shadow-2xl shadow-black/20 backdrop-blur-2xl">
              <CardHeader className="border-b border-white/5 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Lista de produtos
                    </p>

                    <p className="mt-0.5 text-xs text-white/35">
                      {filtered.length}{" "}
                      {filtered.length === 1
                        ? "produto cadastrado"
                        : "produtos cadastrados"}
                    </p>
                  </div>

                  {/* Search */}
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />

                    <input
                      type="text"
                      placeholder="Buscar produtos..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.035] py-2 pl-10 pr-4 text-sm text-white outline-none transition-all duration-200 placeholder:text-white/25 focus:border-[var(--accent)]/40 focus:bg-white/[0.05] focus:ring-1 focus:ring-[var(--accent)]/20"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {/* DESKTOP */}
                <div className="hidden md:block">
                  <Table>
                    <TableHead className="border-b border-white/10 bg-white/[0.015]">
                      <TableRow>
                        <TableHeadCell className="text-left text-[11px] font-medium uppercase tracking-wider text-white/35">
                          Produto
                        </TableHeadCell>

                        <TableHeadCell className="text-left text-[11px] font-medium uppercase tracking-wider text-white/35">
                          Descrição
                        </TableHeadCell>

                        <TableHeadCell className="text-center text-[11px] font-medium uppercase tracking-wider text-white/35">
                          Impressão
                        </TableHeadCell>

                        <TableHeadCell className="text-center text-[11px] font-medium uppercase tracking-wider text-white/35">
                          Filamento
                        </TableHeadCell>

                        <TableHeadCell className="text-right text-[11px] font-medium uppercase tracking-wider text-white/35">
                          Preço
                        </TableHeadCell>

                        <TableHeadCell className="text-center text-[11px] font-medium uppercase tracking-wider text-white/35">
                          Cadastro
                        </TableHeadCell>

                        <TableHeadCell className="text-center text-[11px] font-medium uppercase tracking-wider text-white/35">
                          Ações
                        </TableHeadCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {filtered.map((product) => (
                        <TableRow
                          key={product.id}
                          className="border-b border-white/5 transition-colors hover:bg-white/[0.025] last:border-0"
                        >
                          {/* Produto */}
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035]">
                                <span className="text-xs font-semibold text-[var(--accent)]">
                                  {product.name?.charAt(0)?.toUpperCase() ||
                                    "P"}
                                </span>
                              </div>

                              <div className="min-w-0">
                                <p className="truncate font-medium text-white">
                                  {product.name}
                                </p>

                                {product.productUrl && (
                                  <a
                                    href={product.productUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-1 inline-flex items-center gap-1 text-[11px] text-[var(--accent)] transition-colors hover:text-white"
                                  >
                                    Ver produto
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Descrição */}
                          <TableCell className="max-w-[280px] py-4">
                            <p className="truncate text-sm text-white/45">
                              {product.description || "Sem descrição"}
                            </p>
                          </TableCell>

                          {/* Tempo */}
                          <TableCell className="py-4 text-center">
                            <span className="text-sm font-medium text-white">
                              {formatPrintTime(product.printTimeMinutes)}
                            </span>
                          </TableCell>

                          {/* Filamento */}
                          <TableCell className="py-4 text-center">
                            <span className="text-sm text-white/55">
                              {Number(product.filamentGrams ?? 0)} g
                            </span>
                          </TableCell>

                          {/* Preço */}
                          <TableCell className="py-4 text-right">
                            <span className="font-semibold text-white">
                              {formatCurrency(product.price)}
                            </span>
                          </TableCell>

                          {/* Cadastro */}
                          <TableCell className="py-4 text-center">
                            <span className="text-sm text-white/40">
                              {formatDate(product.createdAt)}
                            </span>
                          </TableCell>

                          {/* Ações */}
                          <TableCell className="py-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(product)}
                                className="h-9 w-9 rounded-lg border border-white/10 bg-white/[0.025] p-0 text-white/50 transition-all duration-200 hover:border-[var(--accent)]/35 hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
                                aria-label={`Editar ${product.name}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(product.id)}
                                className="h-9 w-9 rounded-lg border border-white/10 bg-white/[0.025] p-0 text-white/50 transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                                aria-label={`Excluir ${product.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Empty State */}
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7}>
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                                <Search className="h-5 w-5 text-white/25" />
                              </div>

                              <p className="text-sm font-medium text-white/60">
                                Nenhum produto encontrado
                              </p>

                              <p className="mt-1 max-w-xs text-xs text-white/30">
                                Tente alterar os termos da busca ou cadastre um
                                novo produto.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* MOBILE */}
                <div className="space-y-3 p-4 md:hidden">
                  {filtered.map((product) => (
                    <div
                      key={product.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 shadow-lg shadow-black/10 backdrop-blur-xl"
                    >
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035]">
                              <span className="text-xs font-semibold text-[var(--accent)]">
                                {product.name?.charAt(0)?.toUpperCase() || "P"}
                              </span>
                            </div>

                            <div className="min-w-0">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]/70">
                                Produto
                              </p>

                              <p className="mt-1 truncate text-sm font-semibold text-white">
                                {product.name}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Descrição */}
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
                            Descrição
                          </p>

                          <p className="mt-1 text-sm leading-relaxed text-white/50">
                            {product.description || "Sem descrição"}
                          </p>
                        </div>

                        {/* Informações */}
                        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
                              Tempo
                            </p>

                            <p className="mt-1 text-sm font-semibold text-white">
                              {formatPrintTime(product.printTimeMinutes)}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
                              Filamento
                            </p>

                            <p className="mt-1 text-sm text-white/45">
                              {Number(product.filamentGrams ?? 0)} g
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
                              Preço
                            </p>

                            <p className="mt-1 text-sm font-semibold text-white">
                              {formatCurrency(product.price)}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
                              Cadastro
                            </p>

                            <p className="mt-1 text-sm text-white/45">
                              {formatDate(product.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Link */}
                        {product.productUrl && (
                          <a
                            href={product.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-3 py-2.5 text-xs font-medium text-[var(--accent)] transition-all hover:bg-[var(--accent)]/10 hover:text-white"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Abrir link do produto
                          </a>
                        )}

                        {/* Ações */}
                        <div className="flex items-center gap-2 border-t border-white/10 pt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(product)}
                            className="h-10 flex-1 rounded-xl border border-white/10 bg-white/[0.02] text-white/55 transition-all duration-200 hover:border-[var(--accent)]/35 hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                            className="h-10 flex-1 rounded-xl border border-white/10 bg-white/[0.02] text-white/55 transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Empty State Mobile */}
                  {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                        <Search className="h-5 w-5 text-white/25" />
                      </div>

                      <p className="text-sm font-medium text-white/60">
                        Nenhum produto encontrado
                      </p>

                      <p className="mt-1 max-w-xs text-xs text-white/30">
                        Tente alterar os termos da busca ou cadastre um novo
                        produto.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingProduct ? "Editar produto" : "Novo produto"}
          className="border border-white/10 bg-[#0a1120]/95 text-white shadow-2xl shadow-black/50 backdrop-blur-2xl"
        >
          <form onSubmit={handleSave} className="space-y-6">
            {/* Informações do produto */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
              <div className="mb-5">
                <p className="text-sm font-medium text-white">
                  Informações do produto
                </p>

                <p className="mt-1 text-xs text-white/35">
                  Preencha os dados básicos para cadastrar o produto.
                </p>
              </div>

              <div className="space-y-5">
                <Input
                  id="name"
                  label="Nome"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  required
                  className="border-white/10 bg-white/[0.035] text-white placeholder:text-white/25 focus:border-[var(--accent)]/40 focus:ring-[var(--accent)]/20"
                />

                <Input
                  id="description"
                  label="Descrição"
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  className="border-white/10 bg-white/[0.035] text-white placeholder:text-white/25 focus:border-[var(--accent)]/40 focus:ring-[var(--accent)]/20"
                />

                <Input
                  id="price"
                  label="Preço (R$)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      price: e.target.value,
                    })
                  }
                  required
                  className="border-white/10 bg-white/[0.035] text-white placeholder:text-white/25 focus:border-[var(--accent)]/40 focus:ring-[var(--accent)]/20"
                />
              </div>
            </div>

            {/* Dados de impressão */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
              <div className="mb-5">
                <p className="text-sm font-medium text-white">
                  Dados de impressão
                </p>

                <p className="mt-1 text-xs text-white/35">
                  Informe os dados utilizados para produzir este produto.
                </p>
              </div>

              <div className="space-y-5">
                {/* Tempo */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-white">
                    Tempo de impressão
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      id="printTimeHours"
                      label="Horas"
                      type="number"
                      min="0"
                      step="1"
                      value={form.printTimeHours}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          printTimeHours: e.target.value,
                        })
                      }
                      className="border-white/10 bg-white/[0.035] text-white placeholder:text-white/25 focus:border-[var(--accent)]/40 focus:ring-[var(--accent)]/20"
                    />

                    <Input
                      id="printTimeMinutes"
                      label="Minutos"
                      type="number"
                      min="0"
                      max="59"
                      step="1"
                      value={form.printTimeMinutes}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          printTimeMinutes: e.target.value,
                        })
                      }
                      className="border-white/10 bg-white/[0.035] text-white placeholder:text-white/25 focus:border-[var(--accent)]/40 focus:ring-[var(--accent)]/20"
                    />
                  </div>
                </div>

                {/* Filamento */}
                <Input
                  id="filamentGrams"
                  label="Filamento utilizado (g)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.filamentGrams}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      filamentGrams: e.target.value,
                    })
                  }
                  placeholder="Ex.: 48.5"
                  className="border-white/10 bg-white/[0.035] text-white placeholder:text-white/25 focus:border-[var(--accent)]/40 focus:ring-[var(--accent)]/20"
                />

                {/* Link */}
                <Input
                  id="productUrl"
                  label="Link do produto"
                  type="url"
                  value={form.productUrl}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      productUrl: e.target.value,
                    })
                  }
                  placeholder="https://makerworld.com/..."
                  className="border-white/10 bg-white/[0.035] text-white placeholder:text-white/25 focus:border-[var(--accent)]/40 focus:ring-[var(--accent)]/20"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse gap-3 border-t border-white/5 pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                className="h-10 rounded-xl border border-white/10 bg-white/[0.035] px-5 text-white/60 transition-all hover:bg-white/[0.07] hover:text-white"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                className="h-10 rounded-xl bg-[var(--accent)] px-5 font-semibold text-white shadow-lg shadow-[rgba(var(--accent-rgb),0.15)] transition-all hover:brightness-110"
              >
                {editingProduct ? "Salvar alterações" : "Criar produto"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}