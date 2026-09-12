import type { ListParams } from "@/shared/types/api";

export type ReturnStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "received"
  | "completed";

export interface ReturnRequest {
  id: string;
  orderId: string;
  orderNumber: string | null;
  customerId: string | null;
  status: ReturnStatus;
  reason: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ReturnItem {
  id: string;
  returnId: string;
  orderItemId: string;
  quantity: number;
  productId: string | null;
  variantId: string | null;
  productName: string | null;
  sku: string | null;
  colorName: string | null;
  finalUnitPrice: string | null;
  orderedQuantity: number | null;
}

export interface Refund {
  id: string;
  returnId: string;
  amount: string;
  isRefunded: boolean;
  refundedAt: string | null;
  notes: string | null;
  createdAt: string | null;
}

export interface ReturnDetail extends ReturnRequest {
  items: ReturnItem[];
  refunds: Refund[];
}

export interface ReturnListParams extends ListParams {
  limit?: number;
  sortBy?: "createdAt" | "status";
  status?: ReturnStatus;
  orderId?: string;
  customerId?: string;
}

export interface UpdateReturnStatusPayload {
  status: "approved" | "rejected" | "received";
}

export interface CompleteRefundPayload {
  notes?: string | null;
}
