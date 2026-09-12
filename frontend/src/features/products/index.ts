export { productsApi } from "./api/products.api";
export { default as ProductDetailPage } from "./pages/product-detail-page";
export { default as ProductsPage } from "./pages/products-page";
export {
  productQueryKeys,
  useAdminProduct,
  useAdminProducts,
  useCreateProduct,
  useCreateProductVariant,
  useDeleteProduct,
  useDeleteProductVariant,
  useUpdateProduct,
  useProductVariants,
  useReplaceVariantImages,
  useUpdateProductInventory,
  useUpdateProductVariant,
} from "./hooks/use-products";
export {
  productFormSchema,
  slugifyProductName,
} from "./schemas/product.schema";
export type {
  Product,
  ProductListParams,
  ProductMutationPayload,
  ProductInventoryPayload,
  ProductStatus,
  ProductVariant,
  ProductVariantImage,
  ProductVariantMutationPayload,
} from "./types/product";
