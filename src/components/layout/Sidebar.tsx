"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Printer,
  Pentagon,
  Package,
  Calculator,
  Boxes,
  Layers,
  ClipboardList,
  ShieldCheck,
  LogOut,
  X,
  BarChart3,
  CircleHelp,
  AlertTriangle,
  ChevronLeft,
  FileText,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMobileNav } from "@/contexts/MobileNavContext";
import { isAdmin } from "@/lib/utils";
import logo from "@/assets/apple-touch-icon.png";

const navSections = [
  {
    title: "GERAL",
    items: [
      {
        href: "/",
        label: "Dashboard",
        icon: LayoutDashboard,
      },
    ],
  },

  {
    title: "GESTÃO",
    items: [
      {
        href: "/filamentos",
        label: "Filamentos",
        icon: Layers,
      },
      {
        href: "/calculos",
        label: "Cálculos",
        icon: Calculator,
      },
      {
        href: "/pedidos",
        label: "Pedidos",
        icon: ClipboardList,
      },
      {
        href: "/produtos",
        label: "Produtos",
        icon: Boxes,
      },
      {
  href: "/orcamentos",
  label: "Orçamentos",
  icon: FileText,
},
      {
        href: "/clientes",
        label: "Clientes",
        icon: Users,
      },
      {
        href: "/perdas",
        label: "Perdas",
        icon: AlertTriangle,
      },
    ],
  },

  {
    title: "PRODUÇÃO",
    items: [
      {
        href: "/impressoras",
        label: "Impressoras",
        icon: Printer,
      },
    ],
  },

  {
    title: "ANÁLISES",
    items: [
      {
        href: "/relatorios",
        label: "Relatórios",
        icon: BarChart3,
      },
    ],
  },

  {
    title: "SUPORTE",
    items: [
      {
        href: "/ajuda",
        label: "Central de Ajuda",
        icon: CircleHelp,
      },
    ],
  },
];

function isNavItemActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function LogoBlock({
  mobile = false,
  expanded = false,
  onToggle,
  onClose,
}: {
  mobile?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="relative border-b border-white/10 px-3 py-3">
      <div className="flex items-center">
        {/* LOGO */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center">
          <Image
            src={logo}
            alt="PrintFlow"
            width={36}
            height={36}
            className="object-contain"
          />
        </div>

        {/* IDENTIDADE */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300",
            mobile
              ? "ml-3 flex-1 opacity-100"
              : expanded
                ? "ml-3 flex-1 opacity-100"
                : "ml-0 w-0 opacity-0",
          )}
        >
          <h1 className="whitespace-nowrap text-sm font-bold text-white">
            PrintFlow
          </h1>

          <p className="whitespace-nowrap text-[10px] uppercase tracking-[0.25em] text-white/35">
            MANAGER 3D
          </p>
        </div>

        {/* BOTÃO DESKTOP */}
        {!mobile && onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={expanded ? "Recolher menu" : "Expandir menu"}
            className={cn(
              "absolute top-1/2 flex h-7 w-7 -translate-y-1/2",
              "items-center justify-center rounded-lg",
              "border border-white/10 bg-[#0a1120]",
              "text-white/50 transition-all duration-200",
              "hover:border-white/20 hover:bg-white/10 hover:text-white",
              expanded ? "right-2" : "left-[48px]",
            )}
          >
            {expanded ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}

        {/* BOTÃO MOBILE */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="ml-auto rounded-lg p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function NavSections({
  mobile = false,
  expanded = false,
  onNavigate,
}: {
  mobile?: boolean;
  expanded?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  const adminSection = {
    title: "ADMINISTRAÇÃO",
    items: [
      {
        href: "/admin",
        label: "Usuários",
        icon: ShieldCheck,
      },
    ],
  };

  const sections = isAdmin(user?.email)
    ? [...navSections, adminSection]
    : navSections;

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-4">
      {sections.map((section) => (
        <div key={section.title} className="mb-5">
          {/* TÍTULO DA SEÇÃO */}
          <p
            className={cn(
              "mb-2 overflow-hidden whitespace-nowrap px-2",
              "text-[9px] font-semibold uppercase tracking-[0.28em]",
              "text-white/25 transition-all duration-300",
              mobile || expanded
                ? "h-auto opacity-100"
                : "h-0 opacity-0",
            )}
          >
            {section.title}
          </p>

          {/* ITENS */}
          <div className="space-y-1">
            {section.items.map((item) => {
              const active = isNavItemActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  title={!mobile && !expanded ? item.label : undefined}
                  className={cn(
                    "group/item relative flex items-center rounded-xl",
                    "transition-all duration-200",

                    mobile
                      ? "h-11 gap-3 px-3"
                      : expanded
                        ? "h-10 gap-3 px-2"
                        : "h-10 justify-center px-1",

                    active
                      ? "bg-[var(--accent)] text-white shadow-[0_8px_24px_rgba(var(--accent-rgb),0.18)]"
                      : "text-white/55 hover:bg-white/[0.06] hover:text-white",
                  )}
                >
                  {/* INDICADOR LATERAL */}
                  {active && (mobile || expanded) && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-white" />
                  )}

                  {/* ÍCONE */}
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      "transition-all duration-200",
                      active
                        ? "text-white"
                        : "text-white/55 group-hover/item:text-white",
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                  </div>

                  {/* TEXTO */}
                  <span
                    className={cn(
                      "overflow-hidden whitespace-nowrap text-sm font-medium",
                      "transition-all duration-300",
                      mobile || expanded
                        ? "w-auto opacity-100"
                        : "w-0 opacity-0",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function LogoutButton({
  mobile = false,
  expanded = false,
}: {
  mobile?: boolean;
  expanded?: boolean;
}) {
  const { logout } = useAuth();

  return (
    <div className="border-t border-white/10 p-2">
      <button
        type="button"
        onClick={logout}
        title={!mobile && !expanded ? "Sair" : undefined}
        className={cn(
          "group/logout flex w-full items-center rounded-xl",
          "text-white/45 transition-all duration-200",
          "hover:bg-white/[0.06] hover:text-white",

          mobile
            ? "h-11 gap-3 px-3"
            : expanded
              ? "h-10 gap-3 px-2"
              : "h-10 justify-center px-1",
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
          <LogOut className="h-[18px] w-[18px]" />
        </div>

        <span
          className={cn(
            "overflow-hidden whitespace-nowrap text-sm font-medium",
            "transition-all duration-300",
            mobile || expanded
              ? "w-auto opacity-100"
              : "w-0 opacity-0",
          )}
        >
          Sair
        </span>
      </button>
    </div>
  );
}

export function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const { open, setOpen } = useMobileNav();

  return (
    <>
      {/* =========================================================
          DESKTOP SIDEBAR
      ========================================================= */}
      <aside
        className={cn(
          "relative hidden h-screen shrink-0 flex-col",
          "border-r border-white/10 bg-[#050914]",
          "transition-[width] duration-300 ease-in-out",
          "lg:flex",
          expanded ? "w-[260px]" : "w-[64px]",
        )}
      >
        <LogoBlock
          expanded={expanded}
          onToggle={() => setExpanded((value) => !value)}
        />

        <NavSections expanded={expanded} />

        <LogoutButton expanded={expanded} />
      </aside>

      {/* =========================================================
          MOBILE SIDEBAR
      ========================================================= */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* OVERLAY */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* DRAWER */}
          <aside className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col border-r border-white/10 bg-[#050914] shadow-2xl">
            <LogoBlock
              mobile
              onClose={() => setOpen(false)}
            />

            <NavSections
              mobile
              onNavigate={() => setOpen(false)}
            />

            <LogoutButton mobile />
          </aside>
        </div>
      )}
    </>
  );
}

