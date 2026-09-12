export { shippingRatesApi } from "./api/shipping-rates.api";
export { default as ShippingRatesPage } from "./pages/shipping-rates-page";
export {
  shippingRateQueryKeys,
  useAdminShippingRate,
  useAdminShippingRates,
  useCreateShippingRate,
  useDeleteShippingRate,
  useUpdateShippingRate,
} from "./hooks/use-shipping-rates";
export { shippingRateFormSchema } from "./schemas/shipping-rate.schema";
export type {
  ShippingRate,
  ShippingRateListParams,
  ShippingRateMutationPayload,
} from "./types/shipping-rate";
