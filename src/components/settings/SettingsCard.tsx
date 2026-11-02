
"use client";

import Link from "next/link";
import { LucideIcon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  disabled?: boolean;
}

export function SettingsCard({
  title,
  description,
  icon: Icon,
  href,
  disabled = false,
}: SettingsCardProps) {
  const content = (
    <div
      className={cn(
        "settings-card group h-full rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300",
        !disabled &&
          "cursor-pointer hover:-translate-y-1 hover:border-[var(--accent)]/40 hover:bg-white/[0.05] hover:shadow-xl hover:shadow-[var(--accent)]/10",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl accent-bg/10 accent-text ring-1 ring-[var(--accent)]/20">
        <Icon className="h-7 w-7" />
      </div>

      <h3 className="text-lg font-semibold text-white">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-white/45">
        {description}
      </p>

      <div className="mt-8 flex justify-end">
        <ChevronRight className="h-5 w-5 text-white/30 transition-all group-hover:translate-x-1 group-hover:accent-text" />
      </div>

      <style jsx global>{`
        html[data-theme="light"] .settings-card {
          background-color: var(--surface) !important;
          border-color: var(--border) !important;
        }

        html[data-theme="light"] .settings-card h3 {
          color: var(--app-foreground) !important;
        }

        html[data-theme="light"] .settings-card p {
          color: var(--muted) !important;
        }

        html[data-theme="light"] .settings-card > div:last-child svg {
          color: var(--muted) !important;
        }

        html[data-theme="light"] .settings-card:not([class*="cursor-not-allowed"]):hover {
          background-color: var(--surface-light) !important;
          border-color: var(--accent) !important;
        }

        html[data-theme="light"] .settings-card .accent-text {
          color: var(--accent) !important;
        }
      `}</style>
    </div>
  );

  if (disabled) return content;

  return <Link href={href}>{content}</Link>;
}
