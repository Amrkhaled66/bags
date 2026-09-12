import type { BrandSelectorOption } from "@/features/brands";
import type { CategorySelectorOption } from "@/features/categories";
import type { ListParams } from "@/shared/types/api";

export type ProductStatus = "draft" | "active" | "archived";

export interface Product {
  id: string;
  brandId: string | null;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sellerPrice: string;
  originalPrice: string | null;
  discountedPrice: string | null;
  lengthCm: string | null;
  widthCm: string | null;
  status: ProductStatus;
  isFeatured: boolean;
  isNewArrival: boolean;
  createdAt: string;
  updatedAt: string;
  brand: BrandSelectorOption | null;
  categories?: CategorySelectorOption[];
}

export interface ProductListParams extends ListParams {
  limit?: number;
  sortBy?: "createdAt" | "name" | "sellerPrice";
  status?: ProductStatus;
  brandId?: string;
  categoryId?: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
}

export interface ProductMutationPayload {
  brandId?: string | null;
  sku: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  sellerPrice: string;
  originalPrice?: string | null;
  discountedPrice?: string | null;
  lengthCm?: string | null;
  widthCm?: string | null;
  status: ProductStatus;
  isFeatured: boolean;
  isNewArrival: boolean;
  categoryIds: string[];
}

export interface ProductVariantImage {
  id: string;
  variantId: string;
  imageUrl: string;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  colorName: string;
  sku: string;
  imageUrl: string | null;
  isActive: boolean;
  stockQuantity: number | null;
  reservedQuantity: number | null;
  createdAt: string;
  updatedAt: string;
  images: ProductVariantImage[];
}

export interface ProductVariantMutationPayload {
  colorName: string;
  sku: string;
  imageUrl?: string | null;
  isActive: boolean;
  stockQuantity?: number;
  reservedQuantity?: number;
}

export interface ProductInventoryPayload {
  stockQuantity?: number;
  reservedQuantity?: number;
}
