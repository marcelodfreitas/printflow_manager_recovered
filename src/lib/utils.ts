import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ADMIN_EMAIL = "marcelo.lempek@gmail.com";

export function isAdmin(email?: string | null): boolean {
  return email?.toLowerCase() === ADMIN_EMAIL;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: string): string {
  if (!date) return "";

  const datePart = date.split("T")[0];

  const [year, month, day] = datePart.split("-");

  if (!year || !month || !day) {
    return date;
  }

  return `${day}/${month}/${year}`;
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function translateStatus(status: string): string {
  const map: Record<string, string> = {
    pending: "Pendente",
    approved: "Aprovado",
    printing: "Imprimindo",
    paused: "Pausado",
    completed: "Concluído",
    delivered: "Entregue",
    cancelled: "Cancelado",
    draft: "Rascunho",
    sent: "Enviado",
    rejected: "Rejeitado",
    converted: "Convertido",
    active: "Ativo",
    maintenance: "Manutenção",
    idle: "Ociosa",
    offline: "Offline",
  };
  return map[status] || status;
}
