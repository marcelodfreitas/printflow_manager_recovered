"use client";

import { useState } from "react";
import {
  Plus,
  Printer,
  Pencil,
  Trash2,
} from "lucide-react";

import Button from "@/components/ui/Button";
import PrinterModal from "@/components/printers/PrinterModal";
import { usePrinters } from "@/hooks/usePrinters";
import type { Printer as PrinterType } from "@/types";

export default function PrintersPage() {
  const {
    printers,
    loading,
    create,
    update,
    remove,
  } = usePrinters();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] =
    useState<PrinterType | null>(null);

  function handleAdd() {
    setEditingPrinter(null);
    setModalOpen(true);
  }

  function handleEdit(printer: PrinterType) {
    setEditingPrinter(printer);
    setModalOpen(true);
  }

  async function handleSave(
    data: Omit<PrinterType, "id" | "createdAt">
  ) {
    if (editingPrinter) {
      await update(editingPrinter.id, data);
    } else {
      await create(data);
    }

    setModalOpen(false);
    setEditingPrinter(null);
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir esta impressora?"
    );

    if (!confirmed) return;

    await remove(id);
  }

  function handleClose() {
    setModalOpen(false);
    setEditingPrinter(null);
  }

  return (
    <div className="printers-page mx-auto max-w-6xl space-y-6 p-4 pt-6 sm:p-6 sm:pt-8">
<style jsx global>{`
  /* Textos */
  html[data-theme="light"] .printers-page .text-white {
    color: var(--app-foreground) !important;
  }

  html[data-theme="light"] .printers-page [class*="text-white/"] {
    color: var(--muted) !important;
  }

  /* Cores dos status */
  html[data-theme="light"] .printers-page .text-green-400 {
    color: #059669 !important;
  }

  html[data-theme="light"] .printers-page .text-yellow-400 {
    color: #b45309 !important;
  }

  html[data-theme="light"] .printers-page .text-blue-400 {
    color: #2563eb !important;
  }

  html[data-theme="light"] .printers-page .text-red-400 {
    color: #dc2626 !important;
  }

  /* Cards e superfícies */
  html[data-theme="light"] .printers-page [class*="bg-white/"] {
    background-color: var(--surface) !important;
  }

  /* Bordas e divisores */
  html[data-theme="light"] .printers-page [class*="border-white/"],
  html[data-theme="light"] .printers-page [class*="divide-white/"] > * + * {
    border-color: var(--border) !important;
  }

  /* Hover das impressoras */
  html[data-theme="light"] .printers-page [class*="hover:bg-white/"]:hover {
    background-color: var(--surface-light) !important;
  }

  /* Botões de ação */
  html[data-theme="light"] .printers-page button.text-white\\/40 {
    color: var(--muted) !important;
  }

  html[data-theme="light"] .printers-page button.hover\\:text-white:hover {
    color: var(--app-foreground) !important;
  }

  html[data-theme="light"] .printers-page button.hover\\:text-red-400:hover {
    color: #dc2626 !important;
  }
`}</style>
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">
            Impressoras
          </h1>

          <p className="mt-1 text-sm text-white/40">
            Gerencie as impressoras utilizadas na sua produção.
          </p>
        </div>

        {/* <Button
          onClick={handleAdd}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-xl
            accent-bg
            px-5
            py-2.5
            text-sm
            font-semibold
            text-white
            transition-all
            hover:bg-[var(--accent)]
            hover:shadow-lg
            hover:shadow-[var(--accent)]/20
            active:scale-[0.98]
          "
        >
          <Plus className="h-4 w-4" />
          Adicionar impressora
        </Button> */}
      </div>

      {/* LOADING */}
      {loading && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
          <p className="text-sm text-white/40">
            Carregando impressoras...
          </p>
        </div>
      )}

      {/* LISTA */}
      {!loading && (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">

          {/* HEADER DESKTOP */}
          <div className="
            hidden
            grid-cols-[1.6fr_1fr_1fr_1fr_80px]
            gap-4
            border-b
            border-white/10
            px-6
            py-4
            text-xs
            font-medium
            uppercase
            tracking-wider
            text-white/30
            md:grid
          ">
            <span>Impressora</span>
            <span>Tipo</span>
            <span>Volume</span>
            <span>Custo / hora</span>
            <span />
          </div>

          {/* IMPRESSORAS */}
          <div className="divide-y divide-white/10">

            {printers.map((printer) => (
              <div
                key={printer.id}
                className="
                  grid
                  gap-5
                  px-5
                  py-5
                  transition
                  hover:bg-white/[0.02]
                  md:grid-cols-[1.6fr_1fr_1fr_1fr_80px]
                  md:items-center
                  md:px-6
                "
              >

                {/* IMPRESSORA */}
                <div className="flex items-center gap-4">
                  <div className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-white/10
                    bg-white/5
                  ">
                    <Printer className="h-5 w-5 accent-text" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-white">
                        {printer.name}
                      </p>

                      <span
                        className={`
                          h-2
                          w-2
                          shrink-0
                          rounded-full
                          ${
                            printer.status === "active"
                              ? "bg-green-400"
                              : printer.status === "idle"
                                ? "bg-yellow-400"
                                : printer.status === "maintenance"
                                  ? "bg-blue-400"
                                  : "bg-white/30"
                          }
                        `}
                      />
                    </div>

                    <p className="mt-1 text-xs text-white/35">
                      {printer.manufacturer} · {printer.model}
                    </p>
                  </div>
                </div>

                {/* TIPO */}
                <div>
                  <p className="mb-1 text-xs text-white/30 md:hidden">
                    Tipo
                  </p>

                  <p className="text-sm text-white/70">
                    {printer.type}
                  </p>
                </div>

                {/* VOLUME */}
                <div>
                  <p className="mb-1 text-xs text-white/30 md:hidden">
                    Volume
                  </p>

                  <p className="text-sm text-white/70">
                    {printer.buildVolume}
                  </p>
                </div>

                {/* CUSTO */}
                <div>
                  <p className="mb-1 text-xs text-white/30 md:hidden">
                    Custo / hora
                  </p>

                  <p className="text-sm font-medium text-white">
                    R$ {printer.costPerHour.toFixed(2)}
                  </p>
                </div>

                {/* AÇÕES */}
                <div className="flex items-center gap-2 md:justify-end">

                  <button
                    type="button"
                    title="Editar"
                    onClick={() => handleEdit(printer)}
                    className="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-lg
                      text-white/40
                      transition
                      hover:bg-white/5
                      hover:text-white
                    "
                  >
                    <Pencil className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    title="Excluir"
                    onClick={() => handleDelete(printer.id)}
                    className="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-lg
                      text-white/40
                      transition
                      hover:bg-red-500/10
                      hover:text-red-400
                    "
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                </div>

              </div>
            ))}

            {/* VAZIO */}
            {printers.length === 0 && (
              <div className="px-6 py-12 text-center">
                <Printer className="mx-auto h-10 w-10 text-white/20" />

                <p className="mt-3 text-sm text-white/40">
                  Nenhuma impressora cadastrada.
                </p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL */}
      <PrinterModal
        open={modalOpen}
        onClose={handleClose}
        onSave={handleSave}
        printer={editingPrinter}
      />

    </div>
  );
}