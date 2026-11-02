"use client";

import {
  Bell,
  Mail,
  Package,
  Printer,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";

import { useUserSettings } from "@/hooks/useUserSettings";

interface NotificationItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  onChange: () => void;
}

function NotificationItem({
  icon,
  title,
  description,
  enabled,
  disabled = false,
  onChange,
}: NotificationItemProps) {
  return (
    <div className="notification-item flex items-center justify-between gap-4 border-b border-white/5 py-5 last:border-b-0">
      <div className="flex min-w-0 items-center gap-4">
        <div className="notification-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/50">
          {icon}
        </div>

        <div className="min-w-0">
          <h3 className="notification-title text-sm font-medium text-white">
            {title}
          </h3>

          <p className="notification-description mt-1 text-xs leading-relaxed text-white/40">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        aria-pressed={enabled}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          enabled ? "accent-bg" : "bg-white/10"
        } ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer"
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

export default function NotificationsSettingsPage() {
  const {
    settings,
    loading,
    updateSettings,
  } = useUserSettings();

  async function toggleNotification(
    key:
      | "notificationsSystem"
      | "notificationsNewOrder"
      | "notificationsOrderUpdate"
      | "notificationsPrinterOffline"
      | "notificationsPrintFailed"
      | "notificationsPrintCompleted"
      | "notificationsLowStock"
      | "notificationsEmail",
    databaseKey: string
  ) {
    if (!settings) return;

    const currentValue = settings[key];

    if (typeof currentValue !== "boolean") return;

    await updateSettings({
      [databaseKey]: !currentValue,
    });
  }

  if (loading || !settings) {
    return (
      <div className="notifications-page mx-auto w-full max-w-4xl space-y-6 pt-8">
        <div className="notification-section rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="h-5 w-40 animate-pulse rounded bg-white/10" />

          <div className="mt-3 h-4 w-72 animate-pulse rounded bg-white/5" />

          <div className="mt-6 space-y-5">
            <div className="notification-skeleton h-16 animate-pulse rounded-2xl bg-white/[0.03]" />
            <div className="notification-skeleton h-16 animate-pulse rounded-2xl bg-white/[0.03]" />
            <div className="notification-skeleton h-16 animate-pulse rounded-2xl bg-white/[0.03]" />
          </div>
        </div>

        <style jsx global>{`
          html[data-theme="light"] .notifications-page .notification-section {
            background: var(--surface);
            border-color: var(--border);
          }

          html[data-theme="light"] .notifications-page .notification-skeleton {
            background: var(--surface-light);
          }

          html[data-theme="light"] .notifications-page h2,
html[data-theme="light"] .notifications-page h3 {
  color: var(--app-foreground) !important;
}

html[data-theme="light"] .notifications-page p {
  color: var(--muted) !important;
}

html[data-theme="light"] .notifications-page .text-white,
html[data-theme="light"] .notifications-page [class*="text-white/"] {
  color: var(--app-foreground) !important;
}

/* Textos secundários */
html[data-theme="light"] .notifications-page .notification-description {
  color: var(--muted) !important;
}

/* Ícones */
html[data-theme="light"] .notifications-page .notification-icon {
  color: var(--muted) !important;
}

/* Switch desligado */
html[data-theme="light"] .notifications-page button.bg-white\/10 {
  background: var(--border) !important;
}
        `}</style>
      </div>
    );
  }

  return (
    <div className="notifications-page mx-auto w-full max-w-4xl space-y-6 pt-8 pb-8">
      <style jsx global>{`
        html[data-theme="light"] .notifications-page .notification-section {
          background: var(--surface);
          border-color: var(--border);
        }

        html[data-theme="light"] .notifications-page .notification-item {
          border-color: var(--border);
        }

        html[data-theme="light"] .notifications-page .notification-title {
          color: var(--app-foreground);
        }

        html[data-theme="light"] .notifications-page .notification-description {
          color: var(--muted);
        }

        html[data-theme="light"] .notifications-page .notification-icon {
          background: var(--surface-light);
          color: var(--muted);
        }

        html[data-theme="light"] .notifications-page .notification-item button:not(:disabled):not([class*="accent-bg"]) {
          background: var(--border);
        }

        html[data-theme="light"] .notifications-page .notification-heading {
  color: var(--app-foreground) !important;
}
      `}</style>

      {/* SISTEMA */}
      <section className="notification-section rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="mb-2">
          <h2
  className="text-base font-semibold text-white"
  style={{ color: "var(--app-foreground)" }}
>
  Sistema
</h2>

          <p className="mt-1 text-sm text-white/40" style={{ color: "var(--app-foreground)" }}>
            Notificações gerais e avisos importantes do PrintFlow.
          </p>
        </div>

        <NotificationItem
          icon={<Bell className="h-5 w-5" />}
          title="Notificações do sistema"
          description="Receba avisos importantes sobre sua conta e o funcionamento do sistema."
          enabled={settings.notificationsSystem}
          onChange={() =>
            toggleNotification(
              "notificationsSystem",
              "notifications_system"
            )
          }
        />
      </section>

      {/* PEDIDOS */}
      <section className="notification-section rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="mb-2">
          <h2 className="text-base font-semibold text-white" style={{ color: "var(--app-foreground)" }} >
            Pedidos
          </h2>

          <p className="mt-1 text-sm text-white/40" style={{ color: "var(--app-foreground)" }}>
            Acompanhe alterações e eventos relacionados aos seus pedidos.
          </p>
        </div>

        <NotificationItem
          icon={<Package className="h-5 w-5" />}
          title="Novo pedido"
          description="Receba uma notificação quando um novo pedido for criado."
          enabled={settings.notificationsNewOrder}
          onChange={() =>
            toggleNotification(
              "notificationsNewOrder",
              "notifications_new_order"
            )
          }
        />

        <NotificationItem
          icon={<Package className="h-5 w-5" />}
          title="Pedido atualizado"
          description="Seja avisado quando o status de um pedido for alterado."
          enabled={settings.notificationsOrderUpdate}
          onChange={() =>
            toggleNotification(
              "notificationsOrderUpdate",
              "notifications_order_update"
            )
          }
        />
      </section>

      {/* IMPRESSORAS */}
      <section className="notification-section rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="mb-2">
          <h2 className="text-base font-semibold text-white" style={{ color: "var(--app-foreground)" }}>
            Impressoras
          </h2>

          <p className="mt-1 text-sm text-white/40" style={{ color: "var(--app-foreground)" }}>
            Receba alertas relacionados às suas impressoras 3D.
          </p>
        </div>

        <NotificationItem
          icon={<Printer className="h-5 w-5" />}
          title="Impressora offline"
          description="Receba um alerta quando uma impressora ficar indisponível."
          enabled={settings.notificationsPrinterOffline}
          onChange={() =>
            toggleNotification(
              "notificationsPrinterOffline",
              "notifications_printer_offline"
            )
          }
        />

        <NotificationItem
          icon={<AlertTriangle className="h-5 w-5" />}
          title="Falha de impressão"
          description="Seja avisado quando uma impressão apresentar uma falha."
          enabled={settings.notificationsPrintFailed}
          onChange={() =>
            toggleNotification(
              "notificationsPrintFailed",
              "notifications_print_failed"
            )
          }
        />

        <NotificationItem
          icon={<Printer className="h-5 w-5" />}
          title="Impressão concluída"
          description="Receba uma notificação quando uma impressão terminar."
          enabled={settings.notificationsPrintCompleted}
          onChange={() =>
            toggleNotification(
              "notificationsPrintCompleted",
              "notifications_print_completed"
            )
          }
        />
      </section>

      {/* ESTOQUE */}
      <section className="notification-section rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="mb-2">
          <h2 className="text-base font-semibold text-white" style={{ color: "var(--app-foreground)" }}>
            Estoque
          </h2>

          <p className="mt-1 text-sm text-white/40" style={{ color: "var(--app-foreground)" }}>
            Controle alertas relacionados aos seus materiais.
          </p>
        </div>

        <NotificationItem
          icon={<Package className="h-5 w-5" />}
          title="Estoque baixo"
          description="Receba um alerta quando um material estiver próximo de acabar."
          enabled={settings.notificationsLowStock}
          onChange={() =>
            toggleNotification(
              "notificationsLowStock",
              "notifications_low_stock"
            )
          }
        />
      </section>

      {/* CANAIS */}
      <section className="notification-section rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <div className="mb-2">
          <h2 className="text-base font-semibold text-white" style={{ color: "var(--app-foreground)" }}>
            Canais de comunicação
          </h2>

          <p className="mt-1 text-sm text-white/40" style={{ color: "var(--app-foreground)" }}>
            Escolha por onde deseja receber suas notificações.
          </p>
        </div>

        <NotificationItem
          icon={<Mail className="h-5 w-5" />}
          title="Notificações por e-mail"
          description="Receba notificações importantes também no seu endereço de e-mail."
          enabled={settings.notificationsEmail}
          onChange={() =>
            toggleNotification(
              "notificationsEmail",
              "notifications_email"
            )
          }
        />

        <NotificationItem
          icon={<MessageSquare className="h-5 w-5" />}
          title="Notificações dentro do sistema"
          description="Veja seus alertas diretamente no PrintFlow Manager."
          enabled={settings.notificationsSystem}
          onChange={() =>
            toggleNotification(
              "notificationsSystem",
              "notifications_system"
            )
          }
        />
      </section>
    </div>
  );
}