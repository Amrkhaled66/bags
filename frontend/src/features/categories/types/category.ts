import type { ListParams } from "@/shared/types/api";

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryListParams extends ListParams {
  limit?: number;
  sortBy?: "createdAt" | "name";
}

export interface CategoryMutationPayload {
  name: string;
  slug: string;
  imageUrl?: string | null;
}

export interface CategorySelectorOption {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}
