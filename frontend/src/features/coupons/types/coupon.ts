import type { ListParams } from "@/shared/types/api";

export interface Coupon {
  id: string;
  code: string;
  percentage: string;
  minimumOrder: string;
  usageLimit: number | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CouponListParams extends ListParams {
  limit?: number;
  isActive?: boolean;
  code?: string;
  sortBy?: "createdAt" | "code" | "expiresAt";
}

export interface CouponMutationPayload {
  code: string;
  percentage: string;
  minimumOrder: string;
  usageLimit?: number | null;
  expiresAt?: string | null;
  isActive: boolean;
}
