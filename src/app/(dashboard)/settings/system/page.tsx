
"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  CalendarDays,
  Ruler,
  DollarSign,
  Scale,
  Calculator,
  Trash2,
  ShieldAlert,
  Loader2,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { getUserId } from "@/lib/supabase/auth";

type Settings = {
  language: string;
  date_format: string;
  unit: string;
  currency: string;
  weight_unit: string;
  automatic_cost: boolean;
  waste_enabled: boolean;
  waste_percentage: string;
  confirm_delete: boolean;
  auto_save: boolean;
  success_notifications: boolean;
};

const defaultSettings: Settings = {
  language: "pt-BR",
  date_format: "DD/MM/YYYY",
  unit: "mm",
  currency: "BRL",
  weight_unit: "g",
  automatic_cost: true,
  waste_enabled: true,
  waste_percentage: "5.00",
  confirm_delete: true,
  auto_save: true,
  success_notifications: true,
};

export default function SystemSettingsPage() {
  const supabase = createClient();

  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const userId = await getUserId();

        if (!userId) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("user_settings")
          .select(`
            language,
            date_format,
            unit,
            currency,
            weight_unit,
            automatic_cost,
            waste_enabled,
            waste_percentage,
            confirm_delete,
            auto_save,
            success_notifications
          `)
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          console.error("Erro ao carregar configurações:", error);
          return;
        }

        if (data) {
          setSettings({
            language: data.language ?? defaultSettings.language,
            date_format: data.date_format ?? defaultSettings.date_format,
            unit: data.unit ?? defaultSettings.unit,
            currency: data.currency ?? defaultSettings.currency,
            weight_unit: data.weight_unit ?? defaultSettings.weight_unit,
            automatic_cost: data.automatic_cost ?? defaultSettings.automatic_cost,
            waste_enabled: data.waste_enabled ?? defaultSettings.waste_enabled,
            waste_percentage: String(
              data.waste_percentage ?? defaultSettings.waste_percentage
            ),
            confirm_delete: data.confirm_delete ?? defaultSettings.confirm_delete,
            auto_save: data.auto_save ?? defaultSettings.auto_save,
            success_notifications:
              data.success_notifications ?? defaultSettings.success_notifications,
          });
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [supabase]);

  async function updateSetting<K extends keyof Settings>(
    field: K,
    value: Settings[K]
  ) {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));

    setSaving(field);

    try {
      const userId = await getUserId();

      if (!userId) return;

      const { error } = await supabase
        .from("user_settings")
        .update({
          [field]: value,
        })
        .eq("user_id", userId);

      if (error) {
        console.error(`Erro ao salvar ${field}:`, error);
      }
    } catch (error) {
      console.error(`Erro ao salvar ${field}:`, error);
    } finally {
      setSaving(null);
    }
  }

  function Toggle({
    enabled,
    onChange,
    field,
  }: {
    enabled: boolean;
    onChange: () => void;
    field: keyof Settings;
  }) {
    return (
      <div className="flex shrink-0 items-center gap-2">
        {saving === field && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-white/30" />
        )}

        <button
          type="button"
          onClick={onChange}
          aria-pressed={enabled}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            enabled ? "accent-bg" : "system-toggle-off bg-white/10"
          }`}
        >
          <span
            className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
              enabled ? "left-6" : "left-1"
            }`}
          />
        </button>
      </div>
    );
  }

  function SelectField({
    value,
    field,
    children,
  }: {
    value: string;
    field: keyof Settings;
    children: React.ReactNode;
  }) {
    return (
      <div className="relative w-full sm:w-auto">
        {saving === field && (
          <Loader2 className="pointer-events-none absolute right-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 animate-spin text-white/30" />
        )}

        <select
          value={value}
          onChange={(e) =>
            updateSetting(
              field,
              e.target.value as Settings[typeof field]
            )
          }
          className="system-select w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 pr-9 text-sm text-white outline-none transition focus:border-[var(--accent)] sm:w-auto"
        >
          {children}
        </select>
      </div>
    );
  }

  async function handleDeleteAccount() {
    if (deleteConfirmation !== "EXCLUIR") {
      return;
    }

    setDeletingAccount(true);

    try {
      // MODO DE TESTE: NÃO EXCLUI NADA.
      console.log("🧪 TESTE — exclusão de conta acionada");

      await new Promise((resolve) => setTimeout(resolve, 1500));

      alert(
        "🧪 MODO DE TESTE\n\nA exclusão seria executada aqui, mas sua conta NÃO foi excluída."
      );

      setDeleteModalOpen(false);
      setDeleteConfirmation("");
    } catch (error) {
      console.error("Erro ao testar exclusão da conta:", error);
    } finally {
      setDeletingAccount(false);
    }
  }

  if (loading) {
    return (
      <div className="system-settings-page mx-auto flex min-h-[400px] w-full max-w-4xl items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-white/40">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando configurações...
        </div>

        <style jsx global>{`
          html[data-theme="light"] .system-settings-page {
            color: var(--app-foreground);
          }

          html[data-theme="light"] .system-settings-page .text-white\\/40 {
            color: var(--muted);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="system-settings-page mx-auto w-full max-w-4xl space-y-6 pt-6 pb-8 sm:pt-8">
      {/* PREFERÊNCIAS GERAIS */}
      <section className="system-section rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="mb-5">
          <h2 className="system-title text-base font-semibold text-white">
            Preferências gerais
          </h2>

          <p className="system-description mt-1 text-sm text-white/40">
            Defina como as informações serão apresentadas no sistema.
          </p>
        </div>

        <div className="space-y-5">
          {/* IDIOMA */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-4">
              <div className="system-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/50">
                <Globe className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1 sm:min-w-[180px]">
                <p className="system-title text-sm font-medium text-white">
                  Idioma
                </p>

                <p className="system-description mt-1 text-xs text-white/40">
                  Idioma utilizado na interface.
                </p>
              </div>
            </div>

            <div className="sm:ml-auto">
              <SelectField value={settings.language} field="language">
                <option value="pt-BR" className="bg-[#08111f]">
                  Português (Brasil)
                </option>
                <option value="en" className="bg-[#08111f]">
                  English
                </option>
                <option value="es" className="bg-[#08111f]">
                  Español
                </option>
              </SelectField>
            </div>
          </div>

          {/* DATA */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-4">
              <div className="system-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/50">
                <CalendarDays className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="system-title text-sm font-medium text-white">
                  Formato de data
                </p>

                <p className="system-description mt-1 text-xs text-white/40">
                  Formato utilizado para exibir datas.
                </p>
              </div>
            </div>

            <div className="sm:ml-auto">
              <SelectField value={settings.date_format} field="date_format">
                <option value="DD/MM/YYYY" className="bg-[#08111f]">
                  DD/MM/AAAA
                </option>
                <option value="MM/DD/YYYY" className="bg-[#08111f]">
                  MM/DD/AAAA
                </option>
                <option value="YYYY-MM-DD" className="bg-[#08111f]">
                  AAAA-MM-DD
                </option>
              </SelectField>
            </div>
          </div>

          {/* UNIDADE */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-4">
              <div className="system-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/50">
                <Ruler className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="system-title text-sm font-medium text-white">
                  Unidade de medida
                </p>

                <p className="system-description mt-1 text-xs text-white/40">
                  Unidade padrão utilizada nas dimensões das impressoras.
                </p>
              </div>
            </div>

            <div className="sm:ml-auto">
              <SelectField value={settings.unit} field="unit">
                <option value="mm" className="bg-[#08111f]">
                  Milímetros (mm)
                </option>
                <option value="cm" className="bg-[#08111f]">
                  Centímetros (cm)
                </option>
              </SelectField>
            </div>
          </div>

          {/* MOEDA */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-4">
              <div className="system-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/50">
                <DollarSign className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="system-title text-sm font-medium text-white">
                  Moeda
                </p>

                <p className="system-description mt-1 text-xs text-white/40">
                  Moeda utilizada nos custos e valores financeiros.
                </p>
              </div>
            </div>

            <div className="sm:ml-auto">
              <SelectField value={settings.currency} field="currency">
                <option value="BRL" className="bg-[#08111f]">
                  Real (BRL)
                </option>
                <option value="USD" className="bg-[#08111f]">
                  Dólar (USD)
                </option>
                <option value="EUR" className="bg-[#08111f]">
                  Euro (EUR)
                </option>
              </SelectField>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUÇÃO */}
      <section className="system-section rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="mb-5">
          <h2 className="system-title text-base font-semibold text-white">
            Produção
          </h2>

          <p className="system-description mt-1 text-sm text-white/40">
            Configure como o PrintFlow calcula e apresenta os custos de produção.
          </p>
        </div>

        <div className="space-y-5">
          {/* PESO */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-4">
              <div className="system-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/50">
                <Scale className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="system-title text-sm font-medium text-white">
                  Unidade de peso
                </p>

                <p className="system-description mt-1 text-xs text-white/40">
                  Unidade utilizada para o peso dos filamentos.
                </p>
              </div>
            </div>

            <div className="sm:ml-auto">
              <SelectField value={settings.weight_unit} field="weight_unit">
                <option value="g" className="bg-[#08111f]">
                  Gramas (g)
                </option>
                <option value="kg" className="bg-[#08111f]">
                  Quilogramas (kg)
                </option>
              </SelectField>
            </div>
          </div>

          {/* CUSTO AUTOMÁTICO */}
          <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-5">
            <div className="flex min-w-0 items-center gap-4">
              <div className="system-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/50">
                <Calculator className="h-5 w-5" />
              </div>

              <div>
                <p className="system-title text-sm font-medium text-white">
                  Cálculo automático de custos
                </p>

                <p className="system-description mt-1 text-xs text-white/40">
                  Calcular automaticamente o custo estimado das produções.
                </p>
              </div>
            </div>

            <Toggle
              enabled={settings.automatic_cost}
              field="automatic_cost"
              onChange={() =>
                updateSetting("automatic_cost", !settings.automatic_cost)
              }
            />
          </div>

          {/* DESPERDÍCIO */}
          <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-5">
            <div className="min-w-0">
              <p className="system-title text-sm font-medium text-white">
                Considerar desperdício de material
              </p>

              <p className="system-description mt-1 text-xs text-white/40">
                Adicionar uma margem de desperdício ao cálculo do material.
              </p>
            </div>

            <Toggle
              enabled={settings.waste_enabled}
              field="waste_enabled"
              onChange={() =>
                updateSetting("waste_enabled", !settings.waste_enabled)
              }
            />
          </div>

          {/* PERCENTUAL */}
          {settings.waste_enabled && (
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="system-title text-sm font-medium text-white">
                  Desperdício padrão
                </p>

                <p className="system-description mt-1 text-xs text-white/40">
                  Percentual adicional considerado nos cálculos.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.waste_percentage}
                  onChange={(e) =>
                    setSettings((current) => ({
                      ...current,
                      waste_percentage: e.target.value,
                    }))
                  }
                  onBlur={() =>
                    updateSetting(
                      "waste_percentage",
                      settings.waste_percentage
                    )
                  }
                  className="system-input w-24 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-right text-sm text-white outline-none transition focus:border-[var(--accent)]"
                />

                <span className="system-description text-sm text-white/40">
                  %
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* COMPORTAMENTO */}
      <section className="system-section rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="mb-5">
          <h2 className="system-title text-base font-semibold text-white">
            Comportamento
          </h2>

          <p className="system-description mt-1 text-sm text-white/40">
            Defina como o sistema deve se comportar durante o uso.
          </p>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="system-title text-sm font-medium text-white">
                Confirmar exclusões
              </p>

              <p className="system-description mt-1 text-xs text-white/40">
                Solicitar confirmação antes de excluir registros.
              </p>
            </div>

            <Toggle
              enabled={settings.confirm_delete}
              field="confirm_delete"
              onChange={() =>
                updateSetting("confirm_delete", !settings.confirm_delete)
              }
            />
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-5">
            <div className="min-w-0">
              <p className="system-title text-sm font-medium text-white">
                Salvamento automático
              </p>

              <p className="system-description mt-1 text-xs text-white/40">
                Salvar alterações automaticamente quando possível.
              </p>
            </div>

            <Toggle
              enabled={settings.auto_save}
              field="auto_save"
              onChange={() =>
                updateSetting("auto_save", !settings.auto_save)
              }
            />
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-5">
            <div className="min-w-0">
              <p className="system-title text-sm font-medium text-white">
                Notificações de sucesso
              </p>

              <p className="system-description mt-1 text-xs text-white/40">
                Exibir avisos quando uma operação for concluída.
              </p>
            </div>

            <Toggle
              enabled={settings.success_notifications}
              field="success_notifications"
              onChange={() =>
                updateSetting(
                  "success_notifications",
                  !settings.success_notifications
                )
              }
            />
          </div>
        </div>
      </section>

      {/* ZONA DE PERIGO */}
      <section className="system-danger-section relative overflow-hidden rounded-3xl border border-red-500/30 bg-red-500/[0.04] p-4 shadow-[0_20px_60px_rgba(239,68,68,0.08)] sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-red-500/10 blur-3xl" />

        {/* CABEÇALHO */}
        <div className="relative mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="system-title text-base font-semibold text-white">
                Zona de perigo
              </h2>

              <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-red-400">
                Atenção
              </span>
            </div>

            <p className="system-description mt-1 text-sm leading-relaxed text-white/40">
              Ações nesta área podem afetar permanentemente sua conta e
              os dados associados a ela.
            </p>
          </div>
        </div>

        {/* ALERTA */}
        <div className="relative mb-5 flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4">
          <div className="mt-0.5 shrink-0">
            <ShieldAlert className="h-5 w-5 text-red-400" />
          </div>

          <div>
            <p className="text-sm font-semibold text-red-300">
              Esta ação é permanente
            </p>

            <p className="mt-1 text-xs leading-relaxed text-red-200/60">
              A exclusão da conta não poderá ser desfeita. Todos os seus
              dados, configurações, clientes, produtos, pedidos,
              orçamentos e demais informações associadas serão
              permanentemente removidos.
            </p>
          </div>
        </div>

        {/* EXCLUIR CONTA */}
        <div className="danger-content relative rounded-2xl border border-white/10 bg-black/10 p-4 sm:p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 shrink-0 text-red-400" />

                <p className="system-title text-sm font-semibold text-white">
                  Excluir minha conta
                </p>
              </div>

              <p className="danger-description mt-2 max-w-2xl text-xs leading-relaxed text-white/40">
                Ao continuar, sua conta e todos os dados associados serão
                excluídos permanentemente. Não será possível recuperar
                essas informações posteriormente.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setDeleteConfirmation("");
                setDeleteModalOpen(true);
              }}
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-400 transition-all duration-200 hover:border-red-500/50 hover:bg-red-500/20 hover:text-red-300 hover:shadow-[0_0_25px_rgba(239,68,68,0.15)] sm:w-auto"
            >
              <Trash2 className="h-4 w-4" />
              Excluir conta
            </button>
          </div>
        </div>

        {/* MODAL DE EXCLUSÃO */}
        {deleteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
            {/* BACKDROP */}
            <div
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
              onClick={() => setDeleteModalOpen(false)}
            />

            {/* MODAL */}
            <div className="delete-modal relative flex w-full max-w-lg max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-[28px] border border-red-500/20 bg-[#08111f] shadow-[0_30px_100px_rgba(0,0,0,0.75)] animate-in fade-in zoom-in-95 duration-200 sm:max-h-[85vh]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-red-500/[0.08] to-transparent" />

              {/* HEADER */}
              <div className="relative shrink-0 border-b border-white/10 px-5 pb-5 pt-6 sm:px-6">
                <div className="flex items-start gap-4">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
                    <div className="absolute inset-0 rounded-2xl bg-red-500/10 blur-md" />
                    <ShieldAlert className="relative h-6 w-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="delete-modal-title text-lg font-semibold tracking-tight text-white">
                        Excluir sua conta?
                      </h3>

                      <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-400">
                        Irreversível
                      </span>
                    </div>

                    <p className="delete-modal-description mt-1.5 text-sm leading-relaxed text-white/40">
                      Essa ação removerá permanentemente sua conta e todos
                      os dados associados.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(false)}
                    className="delete-modal-close shrink-0 rounded-xl p-2 text-white/30 transition hover:bg-white/5 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* CONTEÚDO */}
              <div className="relative flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                {/* ALERTA PRINCIPAL */}
                <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-4">
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                      <ShieldAlert className="h-4 w-4 text-red-400" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-red-300">
                        Você não poderá desfazer esta ação
                      </p>

                      <p className="mt-1.5 text-xs leading-relaxed text-red-200/50">
                        Depois da confirmação, seus dados serão removidos
                        permanentemente e não poderão ser recuperados.
                      </p>
                    </div>
                  </div>
                </div>

                {/* O QUE SERÁ EXCLUÍDO */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="delete-modal-muted text-[11px] font-semibold uppercase tracking-[0.15em] text-white/30">
                      Dados que serão excluídos
                    </p>

                    <span className="delete-modal-muted text-[10px] text-white/20">
                      Permanentemente
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Perfil",
                      "Clientes",
                      "Produtos",
                      "Pedidos",
                      "Orçamentos",
                      "Impressoras",
                      "Filamentos",
                      "Configurações",
                    ].map((item) => (
                      <div
                        key={item}
                        className="delete-modal-item flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.025] px-3 py-2.5 transition hover:bg-white/[0.04]"
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500/60" />
                        <span className="text-xs text-white/45">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                {/* CONFIRMAÇÃO */}
                <div>
                  <div className="mb-2">
                    <p className="delete-modal-title text-sm font-medium text-white">
                      Confirme sua decisão
                    </p>

                    <p className="delete-modal-description mt-1 text-xs text-white/35">
                      Digite{" "}
                      <span className="font-semibold text-red-400">
                        EXCLUIR
                      </span>{" "}
                      abaixo para continuar.
                    </p>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="Digite EXCLUIR"
                      autoComplete="off"
                      className={`delete-modal-input w-full rounded-xl border bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 ${
                        deleteConfirmation === "EXCLUIR"
                          ? "border-red-500/40 ring-1 ring-red-500/20"
                          : "border-white/10 focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20"
                      }`}
                    />

                    {deleteConfirmation === "EXCLUIR" && (
                      <div className="pointer-events-none absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                        ✓
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="delete-modal-footer flex shrink-0 flex-col-reverse gap-3 border-t border-white/10 bg-black/10 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="delete-modal-cancel w-full rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white/50 transition hover:bg-white/[0.06] hover:text-white sm:w-auto"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={
                    deleteConfirmation !== "EXCLUIR" || deletingAccount
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-400 transition-all disabled:cursor-not-allowed disabled:opacity-25 enabled:hover:border-red-500/50 enabled:hover:bg-red-500/20 enabled:hover:text-red-300 enabled:hover:shadow-[0_0_30px_rgba(239,68,68,0.18)] sm:w-auto"
                >
                  {deletingAccount ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Excluir permanentemente
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <style jsx global>{`
        /* SEÇÕES */
        html[data-theme="light"] .system-settings-page .system-section {
          background: var(--surface);
          border-color: var(--border);
        }

        /* TÍTULOS */
        html[data-theme="light"] .system-settings-page .system-title,
        html[data-theme="light"] .system-settings-page .delete-modal-title {
          color: var(--app-foreground) !important;
        }

        /* DESCRIÇÕES */
        html[data-theme="light"] .system-settings-page .system-description,
        html[data-theme="light"] .system-settings-page .delete-modal-description,
        html[data-theme="light"] .system-settings-page .delete-modal-muted {
          color: var(--muted) !important;
        }

        /* ÍCONES */
        html[data-theme="light"] .system-settings-page .system-icon {
          background: var(--surface-light);
          color: var(--muted);
        }

        /* DIVISORES */
        html[data-theme="light"] .system-settings-page .border-white\\/5 {
          border-color: var(--border);
        }

        /* SELECTS */
        html[data-theme="light"] .system-settings-page .system-select {
          background: var(--surface-light);
          color: var(--app-foreground);
          border-color: var(--border);
        }

        html[data-theme="light"] .system-settings-page .system-select option {
          background: var(--surface);
          color: var(--app-foreground);
        }

        /* INPUTS */
        html[data-theme="light"] .system-settings-page .system-input,
        html[data-theme="light"] .system-settings-page .delete-modal-input {
          background: var(--surface-light);
          color: var(--app-foreground);
          border-color: var(--border);
        }

        html[data-theme="light"] .system-settings-page .system-input::placeholder,
        html[data-theme="light"] .system-settings-page .delete-modal-input::placeholder {
          color: var(--muted);
        }

        /* SWITCH DESLIGADO */
        html[data-theme="light"] .system-settings-page .system-toggle-off {
          background: var(--border);
        }

        /* ZONA DE PERIGO */
        html[data-theme="light"] .system-settings-page .danger-content {
          background: var(--surface-light);
          border-color: var(--border);
        }

        html[data-theme="light"] .system-settings-page .danger-description {
          color: var(--muted);
        }

        /* MODAL */
        html[data-theme="light"] .system-settings-page .delete-modal {
          background: var(--surface);
          border-color: var(--border);
        }

        html[data-theme="light"] .system-settings-page .delete-modal-item {
          background: var(--surface-light);
          border-color: var(--border);
        }

        html[data-theme="light"] .system-settings-page .delete-modal-item span:last-child {
          color: var(--muted);
        }

        html[data-theme="light"] .system-settings-page .delete-modal-footer {
          background: var(--surface-light);
          border-color: var(--border);
        }

        html[data-theme="light"] .system-settings-page .delete-modal-cancel {
          background: var(--surface);
          color: var(--app-foreground);
          border-color: var(--border);
        }

        html[data-theme="light"] .system-settings-page .delete-modal-close {
          color: var(--muted);
        }
      `}</style>
    </div>
  );
}
