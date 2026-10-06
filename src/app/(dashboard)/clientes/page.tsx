"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Pencil,
  Trash2,
  Users,
  Loader2,
  MapPinned,
} from "lucide-react";

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

import type { Client } from "@/types";
import { useClients } from "@/hooks/useClients";
import { formatDate } from "@/lib/utils";

export default function ClientPage() {
  const { clients, loading, create, update, remove } = useClients();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    document: "",
    cep: "",
    address: "",
  });

  const filtered = clients.filter((client) => {
    const term = search.toLowerCase().trim();

    if (!term) return true;

    return (
      client.name.toLowerCase().includes(term) ||
      client.email.toLowerCase().includes(term) ||
      client.phone.toLowerCase().includes(term) ||
      client.document.toLowerCase().includes(term) ||
      client.address.toLowerCase().includes(term) ||
      (client.cep ?? "").toLowerCase().includes(term)
    );
  });

  function formatCep(value: string) {
    const numbers = value.replace(/\D/g, "").slice(0, 8);

    if (numbers.length > 5) {
      return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
    }

    return numbers;
  }

  async function searchCep(value: string) {
    const cep = value.replace(/\D/g, "");

    if (cep.length !== 8) return;

    setLoadingCep(true);

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cep}/json/`
      );

      if (!response.ok) {
        throw new Error("Não foi possível consultar o CEP.");
      }

      const data = await response.json();

      if (data.erro) {
        return;
      }

      const address = [
        data.logradouro,
        data.bairro,
        data.localidade && data.uf
          ? `${data.localidade} - ${data.uf}`
          : data.localidade,
      ]
        .filter(Boolean)
        .join(", ");

      setForm((prev) => ({
        ...prev,
        cep: formatCep(cep),
        address,
      }));
    } catch (error) {
      console.error("Erro ao consultar CEP:", error);
    } finally {
      setLoadingCep(false);
    }
  }

  function handleCepChange(value: string) {
    const formattedCep = formatCep(value);

    setForm((prev) => ({
      ...prev,
      cep: formattedCep,
    }));

    const numbers = formattedCep.replace(/\D/g, "");

    if (numbers.length === 8) {
      searchCep(numbers);
    }
  }

  function openCreate() {
    setEditingClient(null);

    setForm({
      name: "",
      email: "",
      phone: "",
      document: "",
      cep: "",
      address: "",
    });

    setModalOpen(true);
  }

  function openEdit(client: Client) {
    setEditingClient(client);

    setForm({
      name: client.name,
      email: client.email,
      phone: client.phone,
      document: client.document,
      cep: client.cep ?? "",
      address: client.address,
    });

    setModalOpen(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (editingClient) {
      update(editingClient.id, form);
    } else {
      create(form);
    }

    setModalOpen(false);
  }

  function handleDelete(id: string) {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      remove(id);
    }
  }

  return (
    <div className="relative min-h-screen bg-[#050914]">
      {/* BACKGROUND */}
      <div className="pointer-events-none fixed -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-[#071124]/60 blur-[120px]" />

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[size:32px_32px]" />

      {!loading && (
        <div className="relative space-y-6 px-4 py-5 sm:p-6">
          {/* HEADER */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(var(--accent-rgb),0.20)] bg-[rgba(var(--accent-rgb),0.08)]">
                  <Users className="h-4 w-4 text-[var(--accent)]" />
                </div>

                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
                  Gestão
                </span>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Clientes
              </h1>

              <p className="mt-1 text-sm text-white/40">
                Gerencie seus clientes e mantenha seus contatos organizados.
              </p>
            </div>

            <Button
              onClick={openCreate}
              className="
                h-10
                bg-gradient-to-r
                from-[#071124]
                to-[#0d1a35]
                text-white
                shadow-lg
                shadow-black/30
                ring-1
                ring-white/10
                transition-all
                duration-300
                hover:shadow-[0_8px_30px_rgba(var(--accent-rgb),0.20)]
                hover:ring-[rgba(var(--accent-rgb),0.30)]
              "
            >
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </div>

          {/* SUMMARY */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-white/35">
                  Clientes
                </span>

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(var(--accent-rgb),0.08)]">
                  <Users className="h-4 w-4 text-[var(--accent)]" />
                </div>
              </div>

              <p className="mt-3 text-2xl font-semibold text-white">
                {clients.length}
              </p>

              <p className="mt-1 text-xs text-white/30">
                cadastrados no sistema
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-white/35">
                  Resultados
                </span>

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04]">
                  <Search className="h-4 w-4 text-white/40" />
                </div>
              </div>

              <p className="mt-3 text-2xl font-semibold text-white">
                {filtered.length}
              </p>

              <p className="mt-1 text-xs text-white/30">
                clientes encontrados
              </p>
            </div>

            <div className="hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl sm:block">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-white/35">
                  Contatos
                </span>

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04]">
                  <Phone className="h-4 w-4 text-white/40" />
                </div>
              </div>

              <p className="mt-3 text-2xl font-semibold text-white">
                {clients.filter((client) => client.phone).length}
              </p>

              <p className="mt-1 text-xs text-white/30">
                com telefone cadastrado
              </p>
            </div>

            <div className="hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl lg:block">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-white/35">
                  Localização
                </span>

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04]">
                  <MapPinned className="h-4 w-4 text-white/40" />
                </div>
              </div>

              <p className="mt-3 text-2xl font-semibold text-white">
                {clients.filter((client) => client.cep).length}
              </p>

              <p className="mt-1 text-xs text-white/30">
                com CEP cadastrado
              </p>
            </div>
          </div>

          {/* MAIN CARD */}
          <Card className="overflow-hidden border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/40 backdrop-blur-2xl">
            <CardHeader className="border-b border-white/5 p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Lista de clientes
                  </h2>

                  <p className="mt-1 text-xs text-white/35">
                    Consulte, edite ou remova clientes cadastrados.
                  </p>
                </div>

                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />

                  <input
                    type="text"
                    placeholder="Buscar clientes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="
                      h-10
                      w-full
                      rounded-xl
                      border
                      border-white/10
                      bg-white/[0.04]
                      py-2
                      pl-10
                      pr-4
                      text-sm
                      text-white
                      outline-none
                      placeholder:text-white/25
                      transition-all
                      focus:border-[rgba(var(--accent-rgb),0.45)]
                      focus:bg-white/[0.06]
                      focus:ring-1
                      focus:ring-[rgba(var(--accent-rgb),0.12)]
                    "
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* DESKTOP */}
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHead className="border-b border-white/10">
                    <TableRow>
                      <TableHeadCell className="text-left text-white/40">
                        Cliente
                      </TableHeadCell>

                      <TableHeadCell className="text-left text-white/40">
                        Contato
                      </TableHeadCell>

                      <TableHeadCell className="text-left text-white/40">
                        Documento
                      </TableHeadCell>

                      <TableHeadCell className="text-left text-white/40">
                        Endereço
                      </TableHeadCell>

                      <TableHeadCell className="text-left text-white/40">
                        Cadastro
                      </TableHeadCell>

                      <TableHeadCell className="text-right text-white/40">
                        Ações
                      </TableHeadCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filtered.map((client) => (
                      <TableRow
                        key={client.id}
                        className="
                          border-b
                          border-white/5
                          transition-colors
                          hover:bg-white/[0.025]
                          last:border-0
                        "
                      >
                        {/* CLIENTE */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                              <span className="text-xs font-semibold text-[var(--accent)]">
                                {client.name
                                  .split(" ")
                                  .map((part) => part[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-medium text-white">
                                {client.name}
                              </p>

                              {client.cep && (
                                <p className="mt-0.5 text-xs text-white/30">
                                  CEP {client.cep}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* CONTATO */}
                        <TableCell>
                          <div className="space-y-1">
                            {client.email && (
                              <span className="flex items-center gap-1.5 text-xs text-white/45">
                                <Mail className="h-3 w-3 shrink-0" />
                                <span className="max-w-[180px] truncate">
                                  {client.email}
                                </span>
                              </span>
                            )}

                            {client.phone && (
                              <span className="flex items-center gap-1.5 text-xs text-white/45">
                                <Phone className="h-3 w-3 shrink-0" />
                                {client.phone}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* DOCUMENTO */}
                        <TableCell>
                          <span className="text-sm text-white/55">
                            {client.document || "Não informado"}
                          </span>
                        </TableCell>

                        {/* ENDEREÇO */}
                        <TableCell>
                          <div className="flex max-w-[240px] items-start gap-1.5">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" />

                            <span className="line-clamp-2 text-xs leading-5 text-white/45">
                              {client.address || "Não informado"}
                            </span>
                          </div>
                        </TableCell>

                        {/* CADASTRO */}
                        <TableCell>
                          <span className="text-xs text-white/40">
                            {formatDate(client.createdAt)}
                          </span>
                        </TableCell>

                        {/* AÇÕES */}
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(client)}
                              className="
                                h-9
                                w-9
                                rounded-lg
                                border
                                border-white/10
                                bg-white/[0.03]
                                p-0
                                text-white/50
                                transition-all
                                duration-200
                                hover:border-[rgba(var(--accent-rgb),0.35)]
                                hover:bg-[rgba(var(--accent-rgb),0.08)]
                                hover:text-[var(--accent)]
                              "
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(client.id)}
                              className="
                                h-9
                                w-9
                                rounded-lg
                                border
                                border-white/10
                                bg-white/[0.03]
                                p-0
                                text-white/50
                                transition-all
                                duration-200
                                hover:border-red-500/40
                                hover:bg-red-500/10
                                hover:text-red-400
                              "
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}

                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <div className="py-14 text-center">
                            <Users className="mx-auto h-8 w-8 text-white/15" />

                            <p className="mt-3 text-sm text-white/40">
                              Nenhum cliente encontrado
                            </p>

                            {search && (
                              <p className="mt-1 text-xs text-white/25">
                                Tente buscar por outro nome, e-mail ou
                                telefone.
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
                {filtered.map((client) => (
                  <div
                    key={client.id}
                    className="
                      rounded-2xl
                      border
                      border-white/10
                      bg-white/[0.025]
                      p-4
                      shadow-lg
                      shadow-black/20
                      backdrop-blur-xl
                    "
                  >
                    {/* HEADER */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                          <span className="text-xs font-semibold text-[var(--accent)]">
                            {client.name
                              .split(" ")
                              .map((part) => part[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-white">
                            {client.name}
                          </h3>

                          <p className="mt-0.5 text-xs text-white/30">
                            {client.document || "Documento não informado"}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 rounded-lg border border-[rgba(var(--accent-rgb),0.15)] bg-[rgba(var(--accent-rgb),0.07)] px-2.5 py-1">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                          Cliente
                        </span>
                      </div>
                    </div>

                    {/* DIVISOR */}
                    <div className="my-4 border-t border-white/5" />

                    {/* INFORMAÇÕES */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-white/40">
                          <Mail className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-medium uppercase tracking-wider text-white/25">
                            E-mail
                          </p>

                          <p className="truncate text-sm text-white/65">
                            {client.email || "Não informado"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-white/40">
                          <Phone className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-medium uppercase tracking-wider text-white/25">
                            Telefone
                          </p>

                          <p className="text-sm text-white/65">
                            {client.phone || "Não informado"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-white/40">
                          <MapPin className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-medium uppercase tracking-wider text-white/25">
                            Endereço
                          </p>

                          <p className="text-sm leading-5 text-white/65">
                            {client.address || "Não informado"}
                          </p>

                          {client.cep && (
                            <p className="mt-1 text-xs text-white/25">
                              CEP {client.cep}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* FOOTER */}
                    <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-white/20">
                          Cadastro
                        </p>

                        <p className="mt-0.5 text-xs text-white/35">
                          {formatDate(client.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(client)}
                          className="
                            h-9
                            w-9
                            rounded-xl
                            border
                            border-white/10
                            bg-white/[0.03]
                            p-0
                            text-white/50
                            transition-all
                            hover:border-[rgba(var(--accent-rgb),0.35)]
                            hover:bg-[rgba(var(--accent-rgb),0.08)]
                            hover:text-[var(--accent)]
                          "
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(client.id)}
                          className="
                            h-9
                            w-9
                            rounded-xl
                            border
                            border-white/10
                            bg-white/[0.03]
                            p-0
                            text-white/50
                            transition-all
                            hover:border-red-500/40
                            hover:bg-red-500/10
                            hover:text-red-400
                          "
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {filtered.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-12 text-center">
                    <Users className="mx-auto h-8 w-8 text-white/15" />

                    <p className="mt-3 text-sm text-white/40">
                      Nenhum cliente encontrado
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="relative flex min-h-[60vh] items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-white/40">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
            Carregando clientes...
          </div>
        </div>
      )}

      {/* MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClient ? "Editar Cliente" : "Novo Cliente"}
        className="border border-white/10 bg-[#0a1120]/95 text-white backdrop-blur-2xl"
      >
        <form onSubmit={handleSave} className="space-y-6">
          {/* INFORMAÇÕES DO CLIENTE */}
          <div>
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-white">
                Informações do cliente
              </h3>

              <p className="mt-1 text-xs text-white/30">
                Informe os dados básicos para identificar e entrar em contato
                com o cliente.
              </p>
            </div>

            <div className="space-y-4">
              <Input
                id="name"
                label="Nome"
                placeholder="Ex.: João da Silva"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                required
                className="
                  border-white/10
                  bg-white/[0.04]
                  text-white
                  placeholder:text-white/25
                  focus:border-[rgba(var(--accent-rgb),0.45)]
                  focus:ring-[rgba(var(--accent-rgb),0.15)]
                "
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="email"
                  label="E-mail"
                  type="email"
                  placeholder="Ex.: joao@email.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                  required
                  className="
                    border-white/10
                    bg-white/[0.04]
                    text-white
                    placeholder:text-white/25
                    focus:border-[rgba(var(--accent-rgb),0.45)]
                    focus:ring-[rgba(var(--accent-rgb),0.15)]
                  "
                />

                <Input
                  id="phone"
                  label="Telefone"
                  placeholder="Ex.: (51) 99999-9999"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone: e.target.value,
                    })
                  }
                  required
                  className="
                    border-white/10
                    bg-white/[0.04]
                    text-white
                    placeholder:text-white/25
                    focus:border-[rgba(var(--accent-rgb),0.45)]
                    focus:ring-[rgba(var(--accent-rgb),0.15)]
                  "
                />
              </div>

              <Input
                id="document"
                label="CPF/CNPJ (opcional)"
                placeholder="Ex.: 000.000.000-00"
                value={form.document}
                onChange={(e) =>
                  setForm({
                    ...form,
                    document: e.target.value,
                  })
                }
                className="
                  border-white/10
                  bg-white/[0.04]
                  text-white
                  placeholder:text-white/25
                  focus:border-[rgba(var(--accent-rgb),0.45)]
                  focus:ring-[rgba(var(--accent-rgb),0.15)]
                "
              />
            </div>
          </div>

          {/* ENDEREÇO */}
          <div>
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-white">
                Endereço
              </h3>

              <p className="mt-1 text-xs text-white/30">
                Informe o CEP e o endereço será preenchido automaticamente.
              </p>
            </div>

            <div className="space-y-4">
              {/* CEP */}
              <div>
                <label
                  htmlFor="cep"
                  className="mb-1.5 block text-sm font-medium text-white/65"
                >
                  CEP
                </label>

                <div className="relative">
                  <input
                    id="cep"
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="Ex.: 92010-000"
                    value={form.cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    maxLength={9}
                    className="
                      h-10
                      w-full
                      rounded-lg
                      border
                      border-white/10
                      bg-white/[0.04]
                      px-3
                      pr-10
                      text-sm
                      text-white
                      outline-none
                      placeholder:text-white/25
                      transition-all
                      focus:border-[rgba(var(--accent-rgb),0.45)]
                      focus:ring-1
                      focus:ring-[rgba(var(--accent-rgb),0.15)]
                    "
                  />

                  {loadingCep && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--accent)]" />
                  )}

                  {!loadingCep &&
                    form.cep.replace(/\D/g, "").length === 8 &&
                    form.address && (
                      <MapPinned className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
                    )}
                </div>

                <p className="mt-1.5 text-[11px] text-white/25">
                  Digite os 8 números do CEP para buscar o endereço.
                </p>
              </div>

              {/* ENDEREÇO */}
              <Input
                id="address"
                label="Endereço"
                placeholder="Rua, número, bairro, cidade..."
                value={form.address}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: e.target.value,
                  })
                }
                required
                className="
                  border-white/10
                  bg-white/[0.04]
                  text-white
                  placeholder:text-white/25
                  focus:border-[rgba(var(--accent-rgb),0.45)]
                  focus:ring-[rgba(var(--accent-rgb),0.15)]
                "
              />
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col-reverse gap-3 border-t border-white/5 pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="
                bg-white/[0.04]
                text-white/65
                ring-1
                ring-white/10
                hover:bg-white/[0.08]
                hover:text-white
              "
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              className="
                bg-gradient-to-r
                from-[#071124]
                to-[#0d1a35]
                text-white
                shadow-lg
                shadow-black/20
                ring-1
                ring-white/10
                hover:ring-[rgba(var(--accent-rgb),0.35)]
              "
            >
              {editingClient ? "Salvar alterações" : "Criar cliente"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}