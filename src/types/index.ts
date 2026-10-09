export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  address: string;
  cep?: string;
  createdAt: string;
}


export interface Printer {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  type: "FDM" | "SLA" | "SLS" | "DLP";
  status: "active" | "maintenance" | "idle" | "offline";
  nozzleSize?: number;
  buildVolume: string;
  lastMaintenance: string;
  imageUrl?: string;
  isPrimary?: boolean;
  powerConsumption?: number;
  costPerHour: number;
  purchasePrice?: number;
  usefulLifeHours?: number;
  maintenanceCostPerHour?: number;

  // Localização e custo de energia
  cep?: string;
  energyRate?: number;
  energyRateSource?: "automatic" | "manual";
}


export interface Filament {
  id: string;
  name: string;
  type: "PLA" | "ABS" | "PETG" | "TPU" | "Nylon" | "Polycarbonate" | "Outro";
  color: string;
  colorHex: string;
  manufacturer: string;
  diameter: number;
  weight: number;
  quantity: number;
  costPerKg: number;
  remainingWeight?: number;
  purchaseDate?: string,
  purchaseStore?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  printTimeMinutes: number;
  filamentGrams: number;
  productUrl?: string;
  createdAt: string;
}

export type OrderStatus =
  | "pending"
  | "approved"
  | "printing"
  | "paused"
  | "completed"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  orderNumber?: number;
  productId?: string;
  productName?: string;
  clientId: string;
  clientName: string;
  printerId: string;
  printerName: string;
  filamentId: string;
  filamentName: string;
  filamentColor: string;
  status: OrderStatus;
  quantity: number;
  totalHours: number;
  filamentGrams: number;
  cost: number;
  price: number;
  notes?: string;
  createdAt: string;
  deadline?: string;
}

export type QuoteStatus = "draft" | "sent" | "approved" | "rejected" | "converted";

export interface Quote {
  id: string;
  quoteNumber?: number;
  productId?: string;
  productName?: string;
  clientId: string;
  clientName: string;
  status: QuoteStatus;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  discountPercent: number;
  notes?: string;
  validUntil: string;
  createdAt: string;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface DashboardStats {
  totalClients: number;
  totalPrinters: number;
  activePrinters: number;
  totalOrders: number;
  pendingOrders: number;
  monthlyRevenue: number;
  filamentStock: number;
}

export type NotificationType = "order" | "maintenance" | "system";

export interface AppNotification {
  id: string;
  type: NotificationType;
  referenceId?: string;
  title: string;
  description?: string;
  read: boolean;
  createdAt: string;
}
