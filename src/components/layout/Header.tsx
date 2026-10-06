"use client";

import { useState } from "react";
import {
  Bell,
  CheckCheck,
  FileText,
  Menu,
  Package,
  Wrench,
  ChevronDown,
  Settings,
  LogOut,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { useMobileNav } from "@/contexts/MobileNavContext";
import { useNotifications } from "@/hooks/useNotifications";
import type { AppNotification } from "@/types";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title?: string;
  className?: string;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);

  if (minutes < 1) return "agora mesmo";

  if (minutes < 60) {
    return `há ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `há ${hours} hora${hours > 1 ? "s" : ""}`;
  }

  const days = Math.floor(hours / 24);

  if (days < 30) {
    return `há ${days} dia${days > 1 ? "s" : ""}`;
  }

  return new Date(iso).toLocaleDateString("pt-BR");
}

function NotificationIcon({
  type,
}: {
  type: AppNotification["type"];
}) {
  const iconMap = {
    order: Package,
    maintenance: Wrench,
    system: FileText,
  };

  const Icon = iconMap[type] ?? FileText;

  return <Icon className="h-4 w-4" />;
}

export function Header({ title, className }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const { profile, logout } = useAuth();
  const { toggle } = useMobileNav();

  const {
    notifications,
    unreadCount,
    refresh,
    markAllRead,
  } = useNotifications();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const pageTitles: Record<string, string> = {
    "/": "Dashboard",
    "/clientes": "Clientes",
    "/produtos": "Produtos",
    "/pedidos": "Pedidos",
    "/orcamentos": "Orçamentos",
    "/calculadora": "Calculadora de Custos",
    "/impressoras": "Impressoras",
    "/filamentos": "Filamentos",
    "/settings": "Configurações",
    "/settings/profile": "Conta",
    "/settings/notifications": "Notificações",
    "/settings/appearance": "Aparência",
    "/settings/system": "Sistema",
    "/settings/printers": "Impressoras",
    "/admin": "Administração",
  };

  const currentTitle =
    title ||
    pageTitles[pathname] ||
    Object.entries(pageTitles).find(
      ([path]) =>
        path !== "/" && pathname.startsWith(`${path}/`),
    )?.[1] ||
    "PrintFlow";

  return (
    <header
      className={cn(
        `
        sticky top-0 z-30
        flex h-16 shrink-0 items-center
        border-b border-white/[0.07]
        bg-[#050914]/90
        px-3
        backdrop-blur-2xl
        sm:px-5
        lg:px-6
        `,
        className,
      )}
    >
      {/* MOBILE MENU */}
      <button
        onClick={toggle}
        aria-label="Abrir menu"
        className="
          mr-2 flex h-9 w-9 items-center justify-center
          rounded-xl
          text-white/50
          transition-all
          hover:bg-white/[0.06]
          hover:text-white
          lg:hidden
        "
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* PAGE TITLE */}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[15px] font-semibold tracking-tight text-white sm:text-base">
          {currentTitle}
        </h1>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* NOTIFICATIONS */}
        <div className="relative">
          <button
            onClick={() => {
              refresh();
              setNotificationsOpen((current) => !current);
              setUserMenuOpen(false);
            }}
            aria-label="Notificações"
            className="
              relative flex h-9 w-9
              items-center justify-center
              rounded-xl
              text-white/45
              transition-all
              hover:bg-white/[0.06]
              hover:text-white
            "
          >
            <Bell className="h-[18px] w-[18px]" />

            {unreadCount > 0 && (
              <span
                className="
                  absolute right-0.5 top-0.5
                  flex h-4 min-w-4
                  items-center justify-center
                  rounded-full
                  accent-bg
                  px-1
                  text-[9px]
                  font-bold
                  leading-none
                  text-white
                  ring-2 ring-[#050914]
                "
              >
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotificationsOpen(false)}
              />

              <div
                className="
                  fixed left-1/2 top-[68px] z-50
                  w-[calc(100vw-1.5rem)]
                  max-w-[360px]
                  -translate-x-1/2
                  overflow-hidden
                  rounded-2xl
                  border border-white/10
                  bg-[#0a1120]/95
                  shadow-2xl
                  shadow-black/50
                  backdrop-blur-2xl
                  sm:absolute
                  sm:left-auto
                  sm:right-0
                  sm:top-full
                  sm:mt-2
                  sm:w-[360px]
                  sm:max-w-none
                  sm:translate-x-0
                "
              >
                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3.5">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Notificações
                    </h3>

                    {unreadCount > 0 && (
                      <p className="mt-0.5 text-[11px] text-white/35">
                        {unreadCount} não lida
                        {unreadCount > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={markAllRead}
                    className="
                      flex items-center gap-1.5
                      rounded-lg
                      px-2 py-1.5
                      text-xs font-medium
                      accent-text
                      transition
                      hover:bg-white/5
                    "
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Marcar todas
                  </button>
                </div>

                {/* NOTIFICATIONS LIST */}
                <div className="max-h-[320px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-12 text-center">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-white/25">
                        <Bell className="h-5 w-5" />
                      </div>

                      <p className="mt-3 text-sm text-white/40">
                        Nenhuma notificação
                      </p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="
                          flex items-start gap-3
                          border-b border-white/[0.05]
                          px-4 py-3.5
                          transition
                          hover:bg-white/[0.035]
                        "
                      >
                        <div
                          className="
                            flex h-9 w-9 shrink-0
                            items-center justify-center
                            rounded-xl
                            bg-white/[0.04]
                            accent-text
                            ring-1 ring-white/[0.07]
                          "
                        >
                          <NotificationIcon
                            type={notification.type}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white">
                            {notification.title}
                          </p>

                          <p className="mt-0.5 text-xs leading-5 text-white/40">
                            {notification.description}
                          </p>

                          <p className="mt-1.5 text-[10px] text-white/25">
                            {formatRelativeTime(
                              notification.createdAt,
                            )}
                          </p>
                        </div>

                        {!notification.read && (
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full accent-bg" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* FOOTER */}
                <div className="border-t border-white/[0.07] p-2">
                  <button
                    className="
                      w-full rounded-xl
                      px-3 py-2
                      text-xs font-medium
                      text-white/45
                      transition
                      hover:bg-white/[0.05]
                      hover:text-white
                    "
                  >
                    Ver todas
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* DIVIDER */}
        <div className="mx-1 hidden h-7 w-px bg-white/[0.07] sm:block" />

        {/* USER */}
        <div className="relative">
          <button
            onClick={() => {
              setUserMenuOpen((prev) => !prev);
              setNotificationsOpen(false);
            }}
            className="
              flex h-10
              items-center gap-2
              rounded-xl
              px-1.5
              transition
              hover:bg-white/[0.04]
              sm:gap-2.5
              sm:px-2
            "
          >
            {/* AVATAR */}
            <div
              className="
                flex h-8 w-8 shrink-0
                items-center justify-center
                overflow-hidden
                rounded-xl
                bg-gradient-to-br
                from-[#152342]
                to-[#071124]
                text-xs font-semibold
                accent-text
                ring-1 ring-white/10
              "
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                profile?.full_name
                  ?.charAt(0)
                  ?.toUpperCase()
              )}
            </div>

            {/* USER INFO */}
            <div className="hidden min-w-0 text-left md:block">
              <p className="max-w-[145px] truncate text-xs font-semibold text-white/90">
                {profile?.company_name ?? "Minha empresa"}
              </p>

              <p className="max-w-[145px] truncate text-[11px] text-white/35">
                {profile?.full_name}
              </p>
            </div>

            <ChevronDown
              className={cn(
                "hidden h-3.5 w-3.5 text-white/30 transition-transform sm:block",
                userMenuOpen && "rotate-180",
              )}
            />
          </button>

          {/* USER DROPDOWN */}
          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />

              <div
                className="
                  fixed left-4 right-4 top-[68px] z-50
                  overflow-hidden
                  rounded-2xl
                  border border-white/10
                  bg-[#0a1120]/95
                  shadow-2xl
                  shadow-black/50
                  backdrop-blur-2xl
                  sm:absolute
                  sm:left-auto
                  sm:right-0
                  sm:top-full
                  sm:mt-2
                  sm:w-64
                "
              >
                {/* PROFILE */}
                <div className="border-b border-white/[0.07] px-4 py-4">
                  <p className="truncate text-sm font-semibold text-white">
                    {profile?.company_name ?? "Minha empresa"}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-white/35">
                    {profile?.full_name}
                  </p>
                </div>

                {/* SETTINGS */}
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    router.push("/settings");
                  }}
                  className="
                    flex w-full items-center gap-3
                    px-4 py-3
                    text-sm text-white/65
                    transition
                    hover:bg-white/[0.05]
                    hover:text-white
                  "
                >
                  <Settings className="h-4 w-4 text-white/45" />
                  Configurações
                </button>

                <div className="border-t border-white/[0.07]" />

                {/* LOGOUT */}
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="
                    flex w-full items-center gap-3
                    px-4 py-3
                    text-sm text-red-400
                    transition
                    hover:bg-red-500/[0.08]
                  "
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}