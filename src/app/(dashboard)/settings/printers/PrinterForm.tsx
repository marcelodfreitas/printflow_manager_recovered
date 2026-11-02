
"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

export interface PrinterFormData {
  name: string;
  manufacturer: string;
  model: string;
  technology: "FDM" | "Resina";
  status: "active" | "maintenance" | "inactive";
  dimension_x: string;
  dimension_y: string;
  dimension_z: string;
  location: string;
  notes: string;
}

interface PrinterFormProps {
  initialData?: Partial<PrinterFormData>;
  onSubmit: (data: PrinterFormData) => void;
  onCancel: () => void;
  saving?: boolean;
}

const defaultData: PrinterFormData = {
  name: "",
  manufacturer: "",
  model: "",
  technology: "FDM",
  status: "active",
  dimension_x: "",
  dimension_y: "",
  dimension_z: "",
  location: "",
  notes: "",
};

const technologyOptions = [
  {
    value: "FDM",
    label: "FDM",
  },
  {
    value: "Resina",
    label: "Resina",
  },
];

const statusOptions = [
  {
    value: "active",
    label: "Ativa",
    dot: "bg-green-400",
  },
  {
    value: "maintenance",
    label: "Manutenção",
    dot: "bg-yellow-400",
  },
  {
    value: "inactive",
    label: "Inativa",
    dot: "bg-white/30",
  },
];

export default function PrinterForm({
  initialData,
  onSubmit,
  onCancel,
  saving = false,
}: PrinterFormProps) {
  const [form, setForm] = useState<PrinterFormData>({
    ...defaultData,
    ...initialData,
  });

  const [error, setError] = useState("");

  function updateField<K extends keyof PrinterFormData>(
    field: K,
    value: PrinterFormData[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!form.name.trim()) {
      setError("Informe o nome da impressora.");
      return;
    }

    if (!form.manufacturer.trim()) {
      setError("Informe o fabricante.");
      return;
    }

    if (!form.model.trim()) {
      setError("Informe o modelo da impressora.");
      return;
    }

    onSubmit(form);
  }

  return (
    <form className="printer-form space-y-6" onSubmit={handleSubmit}>
      <style jsx global>{`
        /* Textos */
        html[data-theme="light"] .printer-form .text-white {
          color: var(--app-foreground) !important;
        }

        html[data-theme="light"] .printer-form [class*="text-white/"] {
          color: var(--muted) !important;
        }

        /* Divisores */
        html[data-theme="light"] .printer-form .border-white\\/10 {
          border-color: var(--border) !important;
        }

        /* Campo de observações */
        html[data-theme="light"] .printer-form textarea {
          background-color: var(--surface-light) !important;
          border-color: var(--border) !important;
          color: var(--app-foreground) !important;
        }

        html[data-theme="light"] .printer-form textarea::placeholder {
          color: var(--muted) !important;
          opacity: 0.7;
        }

        /* Botão cancelar */
        html[data-theme="light"] .printer-form button.border-white\\/10 {
          background-color: var(--surface-light) !important;
          border-color: var(--border) !important;
          color: var(--app-foreground) !important;
        }

        html[data-theme="light"] .printer-form button.border-white\\/10:hover {
          background-color: var(--surface) !important;
        }

        /* Botão principal */
        html[data-theme="light"] .printer-form button.accent-bg {
          color: #ffffff !important;
        }

        html[data-theme="light"] .printer-form button.accent-bg * {
          color: #ffffff !important;
        }
      `}</style>

      {/* IDENTIFICAÇÃO */}
      <div>
        <h3 className="text-sm font-semibold text-white">
          Identificação
        </h3>

        <p className="mt-1 text-xs text-white/40">
          Informações básicas do equipamento.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-white/60">
              Nome da impressora
            </label>

            <Input
              value={form.name}
              placeholder="Ex.: Bambu Lab A1"
              onChange={(event) =>
                updateField("name", event.target.value)
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-white/60">
                Fabricante
              </label>

              <Input
                value={form.manufacturer}
                placeholder="Ex.: Bambu Lab"
                onChange={(event) =>
                  updateField("manufacturer", event.target.value)
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Modelo
              </label>

              <Input
                value={form.model}
                placeholder="Ex.: A1"
                onChange={(event) =>
                  updateField("model", event.target.value)
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* CONFIGURAÇÃO */}
      <div className="border-t border-white/10 pt-6">
        <h3 className="text-sm font-semibold text-white">
          Configuração
        </h3>

        <p className="mt-1 text-xs text-white/40">
          Defina a tecnologia e o estado atual da impressora.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Select
            label="Tecnologia"
            value={form.technology}
            options={technologyOptions}
            onChange={(event) =>
              updateField(
                "technology",
                event.target.value as PrinterFormData["technology"]
              )
            }
          />

          <Select
            label="Status"
            value={form.status}
            options={statusOptions}
            onChange={(event) =>
              updateField(
                "status",
                event.target.value as PrinterFormData["status"]
              )
            }
          />
        </div>
      </div>

      {/* VOLUME */}
      <div className="border-t border-white/10 pt-6">
        <h3 className="text-sm font-semibold text-white">
          Volume de impressão
        </h3>

        <p className="mt-1 text-xs text-white/40">
          Dimensões máximas de impressão em milímetros.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div>
            <label className="mb-2 block text-xs text-white/50">
              X (mm)
            </label>

            <Input
              type="number"
              min="0"
              value={form.dimension_x}
              placeholder="256"
              onChange={(event) =>
                updateField("dimension_x", event.target.value)
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-xs text-white/50">
              Y (mm)
            </label>

            <Input
              type="number"
              min="0"
              value={form.dimension_y}
              placeholder="256"
              onChange={(event) =>
                updateField("dimension_y", event.target.value)
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-xs text-white/50">
              Z (mm)
            </label>

            <Input
              type="number"
              min="0"
              value={form.dimension_z}
              placeholder="256"
              onChange={(event) =>
                updateField("dimension_z", event.target.value)
              }
            />
          </div>
        </div>
      </div>

      {/* LOCALIZAÇÃO */}
      <div className="border-t border-white/10 pt-6">
        <h3 className="text-sm font-semibold text-white">
          Localização
        </h3>

        <div className="mt-4">
          <label className="mb-2 block text-sm text-white/60">
            Local
          </label>

          <Input
            value={form.location}
            placeholder="Ex.: Oficina principal"
            onChange={(event) =>
              updateField("location", event.target.value)
            }
          />
        </div>
      </div>

      {/* OBSERVAÇÕES */}
      <div className="border-t border-white/10 pt-6">
        <h3 className="text-sm font-semibold text-white">
          Observações
        </h3>

        <div className="mt-4">
          <label className="mb-2 block text-sm text-white/60">
            Observações
          </label>

          <textarea
            value={form.notes}
            onChange={(event) =>
              updateField("notes", event.target.value)
            }
            placeholder="Adicione informações importantes sobre esta impressora..."
            rows={4}
            className="
              w-full
              resize-none
              rounded-xl
              border
              border-white/10
              bg-white/5
              px-4
              py-3
              text-sm
              text-white
              placeholder:text-white/25
              outline-none
              transition
              focus:border-[var(--accent)]/60
              focus:ring-2
              focus:ring-[var(--accent)]/20
            "
          />
        </div>
      </div>

      {/* ERRO */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* AÇÕES */}
      <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
        <Button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="
            w-full
            rounded-xl
            border
            border-white/10
            bg-white/5
            px-5
            py-2.5
            text-sm
            font-medium
            text-white/70
            transition
            hover:bg-white/10
            hover:text-white
            disabled:cursor-not-allowed
            disabled:opacity-50
            sm:w-auto
          "
        >
          Cancelar
        </Button>

        <Button
          type="submit"
          disabled={saving}
          className="
            w-full
            rounded-xl
            accent-bg
            px-5
            py-2.5
            text-sm
            font-semibold
            text-white
            transition-all
            duration-200
            hover:bg-[var(--accent)]
            hover:shadow-lg
            hover:shadow-[var(--accent)]/20
            active:scale-[0.98]
            disabled:cursor-not-allowed
            disabled:opacity-50
            sm:w-auto
          "
        >
          {saving ? "Salvando..." : "Salvar impressora"}
        </Button>
      </div>
    </form>
  );
}
