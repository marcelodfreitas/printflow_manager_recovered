
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UserRound,
  Building2,
  Printer,
  Bell,
  Palette,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  {
    title: "Conta",
    href: "/settings/profile",
    icon: UserRound,
  },
  {
    title: "Empresa",
    href: "/settings/company",
    icon: Building2,
  },
  {
    title: "Impressoras",
    href: "/settings/printers",
    icon: Printer,
  },
  {
    title: "Notificações",
    href: "/settings/notifications",
    icon: Bell,
  },
  {
    title: "Aparência",
    href: "/settings/appearance",
    icon: Palette,
  },
  {
    title: "Sistema",
    href: "/settings/system",
    icon: Settings,
  },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <div className="settings-sidebar">
      <style jsx global>{`
        /* LIGHT: MENU MOBILE E DESKTOP */
        html[data-theme="light"] .settings-sidebar .settings-nav-link:not(.settings-active) {
          color: var(--app-foreground) !important;
          background-color: var(--surface) !important;
          border-color: var(--border) !important;
        }

        html[data-theme="light"] .settings-sidebar .settings-nav-link:not(.settings-active):hover {
          background-color: var(--surface-light) !important;
          color: var(--app-foreground) !important;
        }

        /* ITEM SELECIONADO */
        html[data-theme="light"] .settings-sidebar .settings-active {
          background-color: var(--accent) !important;
          border-color: var(--accent) !important;
          color: #ffffff !important;
        }

        html[data-theme="light"] .settings-sidebar .settings-active * {
          color: #ffffff !important;
        }

        /* CARD DA SIDEBAR DESKTOP */
        html[data-theme="light"] .settings-sidebar .settings-desktop-card {
          background-color: var(--surface) !important;
          border-color: var(--border) !important;
          box-shadow: none !important;
        }
      `}</style>

      {/* MOBILE */}
      <div className="lg:hidden">
        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-max gap-2">
            {items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "settings-nav-link flex items-center gap-2 rounded-xl border px-3.5 py-2.5",
                    "text-sm font-medium whitespace-nowrap transition-all duration-200",
                    active
                      ? "settings-active border-[var(--accent)]/40 accent-bg text-white shadow-lg shadow-[var(--accent)]/20"
                      : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* DESKTOP */}
      <aside className="hidden w-72 shrink-0 lg:block">
        <div className="settings-desktop-card rounded-3xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-2xl shadow-2xl shadow-black/30">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "settings-nav-link mb-1 flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200",
                  active
                    ? "settings-active accent-bg text-white shadow-lg shadow-accent/20"
                    : "text-white/60 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="h-5 w-5" />

                <span className="text-sm font-medium">
                  {item.title}
                </span>
              </Link>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
