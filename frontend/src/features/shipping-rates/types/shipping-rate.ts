import type { ListParams } from "@/shared/types/api";

export interface ShippingRate {
  id: string;
  governorate: string;
  shippingPrice: string;
  freeShippingThreshold: string | null;
  isActive: boolean;
}

export interface ShippingRateListParams extends ListParams {
  isActive?: boolean;
  sortBy?: "governorate" | "shippingPrice";
}

export interface ShippingRateMutationPayload {
  governorate: string;
  shippingPrice: string;
  freeShippingThreshold?: string | null;
  isActive: boolean;
}
