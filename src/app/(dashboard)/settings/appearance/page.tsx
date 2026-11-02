"use client";

import { Sparkles, Check } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

type Accent = "orange" | "green" | "blue" | "purple";

const accentColors: Record<
  Accent,
  {
    label: string;
    color: string;
    hex: string;
  }
> = {
  orange: {
    label: "Laranja",
    color: "bg-[#fd6401]",
    hex: "#fd6401",
  },

  green: {
    label: "Verde",
    color: "bg-emerald-500",
    hex: "#10b981",
  },

  blue: {
    label: "Azul",
    color: "bg-blue-500",
    hex: "#3b82f6",
  },

  purple: {
    label: "Roxo",
    color: "bg-purple-500",
    hex: "#a855f7",
  },
};

export default function AppearanceSettingsPage() {
  const { accent, animations, setAccent, setAnimations } = useTheme();

  return (
    <div className="appearance-page mx-auto w-full max-w-4xl space-y-6 pt-8 pb-8">
      <style jsx global>{`
        html[data-theme="light"] .appearance-page .appearance-section {
          background: var(--surface);
          border-color: var(--border);
        }

        html[data-theme="light"] .appearance-page .appearance-title {
          color: var(--app-foreground);
        }

        html[data-theme="light"] .appearance-page .appearance-description {
          color: var(--muted);
        }

        html[data-theme="light"] .appearance-page .appearance-option {
          background: var(--surface-light);
          border-color: var(--border);
        }

        html[data-theme="light"] .appearance-page .appearance-option:hover {
          border-color: var(--accent);
        }

        html[data-theme="light"] .appearance-page .appearance-icon {
          background: var(--surface-light);
          color: var(--muted);
        }

        html[data-theme="light"] .appearance-page .appearance-preview {
          background: var(--surface-light);
          border-color: var(--border);
        }

        html[data-theme="light"] .appearance-page .appearance-preview-card {
          background: var(--surface);
          border-color: var(--border);
        }

        html[data-theme="light"] .appearance-page .appearance-preview-muted {
          color: var(--muted);
        }

        html[data-theme="light"] .appearance-page .appearance-preview-title {
          color: var(--app-foreground);
        }

        html[data-theme="light"] .appearance-page .appearance-selected-label {
          color: var(--app-foreground);
        }

        html[data-theme="light"] .appearance-page .appearance-toggle-off {
          background: var(--border);
        }
      `}</style>

      {/* COR DE DESTAQUE */}
      <section className="appearance-section rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div>
          <h2 className="accent-text text-base font-semibold">
            Cor de destaque
          </h2>

          <p className="appearance-description mt-1 text-sm text-white/40">
            Escolha a cor principal utilizada nos elementos ativos.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-4">
          {(Object.keys(accentColors) as Accent[]).map((color) => {
            const option = accentColors[color];
            const selected = accent === color;

            return (
              <button
                key={color}
                type="button"
                onClick={() => setAccent(color)}
                title={option.label}
                className={`appearance-option relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] transition ${
                  selected
                    ? "ring-2 accent-ring ring-offset-2 ring-offset-[#08111f]"
                    : "hover:border-white/20"
                }`}
              >
                <span className={`h-6 w-6 rounded-full ${option.color}`} />

                {selected && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
          <span
            className={`h-2 w-2 rounded-full ${accentColors[accent].color}`}
          />

          Cor selecionada:

          <span className="appearance-selected-label text-white/60">
            {accentColors[accent].label}
          </span>
        </div>
      </section>

      {/* ANIMAÇÕES */}
      <section className="appearance-section rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="appearance-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/50">
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <h2 className="appearance-title text-sm font-medium text-white">
                Animações da interface
              </h2>

              <p className="appearance-description mt-1 text-xs leading-relaxed text-white/40">
                Ative ou desative transições e efeitos visuais do sistema.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAnimations(!animations)}
            aria-pressed={animations}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              animations ? "accent-bg" : "appearance-toggle-off bg-white/10"
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                animations ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
      </section>

      {/* PRÉ-VISUALIZAÇÃO */}
      <section className="appearance-section rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div>
          <h2 className="appearance-title text-base font-semibold text-white">
            Pré-visualização
          </h2>

          <p className="appearance-description mt-1 text-sm text-white/40">
            Veja como a cor escolhida será utilizada na interface.
          </p>
        </div>

        <div className="appearance-preview mt-5 rounded-2xl border border-white/10 bg-[#08111f] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="appearance-preview-title text-sm font-semibold text-white">
                Dashboard
              </p>

              <p className="appearance-preview-muted mt-1 text-xs text-white/40">
                Visão geral da produção
              </p>
            </div>

            <div className="accent-bg rounded-xl px-4 py-2 text-xs font-semibold text-white">
              Nova produção
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="appearance-preview-card rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="appearance-preview-muted text-xs text-white/40">
                Pedidos
              </p>

              <p className="appearance-preview-title mt-2 text-xl font-semibold text-white">
                24
              </p>
            </div>

            <div className="appearance-preview-card rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="appearance-preview-muted text-xs text-white/40">
                Produção
              </p>

              <p className="appearance-preview-title mt-2 text-xl font-semibold text-white">
                12
              </p>
            </div>

            <div className="appearance-preview-card rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="appearance-preview-muted text-xs text-white/40">
                Impressoras
              </p>

              <p className="appearance-preview-title mt-2 text-xl font-semibold text-white">
                4
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}