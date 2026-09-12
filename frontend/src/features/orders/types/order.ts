import type { ListParams } from "@/shared/types/api";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "partially_refunded"
  | "refunded";

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  governorate: string | null;
  cityArea: string | null;
  streetAddress: string | null;
  status: OrderStatus | null;
  subtotal: string | null;
  couponDiscount: string | null;
  shippingPrice: string | null;
  total: string | null;
  couponId: string | null;
  reservationExpiresAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface OrderItem {
  id: string;
  orderId: string | null;
  productId: string | null;
  variantId: string | null;
  productName: string | null;
  sku: string | null;
  colorName: string | null;
  sellerPrice: string | null;
  originalPrice: string | null;
  discountedPrice: string | null;
  finalUnitPrice: string | null;
  quantity: number | null;
  total: string | null;
}

export interface OrderPayment {
  id: string;
  orderId: string | null;
  method: string | null;
  status: PaymentStatus | null;
  amount: string | null;
  createdAt: string | null;
}

export interface OrderShipment {
  id: string;
  orderId: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string | null;
}

export interface OrderStatusHistoryItem {
  id: string;
  orderId: string | null;
  status: OrderStatus | null;
  createdAt: string | null;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
  payment: OrderPayment | null;
  shipment: OrderShipment | null;
  statusHistory: OrderStatusHistoryItem[];
}

export interface OrderListParams extends ListParams {
  limit?: number;
  sortBy?: "createdAt" | "total" | "orderNumber";
  status?: OrderStatus;
  customerId?: string;
  governorate?: string;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
}

export interface UpdatePaymentStatusPayload {
  status: PaymentStatus;
}

export interface UpdateShipmentPayload {
  trackingNumber: string;
}
