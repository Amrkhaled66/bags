import type { ListParams } from "@/shared/types/api";

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandListParams extends ListParams {
  limit?: number;
  isActive?: boolean;
  sortBy?: "createdAt" | "name";
}

export interface BrandMutationPayload {
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  isActive?: boolean;
}

export interface BrandSelectorOption {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}
