import type { ReactNode } from "react";
import { useParams } from "react-router";
import { AdminPageHeader } from "@/shared/components/admin-page-header";
import { Badge } from "@/shared/components/ui/badge";
import { ErrorState, LoadingState } from "@/shared/components/request-state";
import { Separator } from "@/shared/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { formatMoney } from "@/shared/utils/format";
import { toApiImageUrl } from "@/shared/utils/image-url";
import { ProductStatusBadge } from "../components/product-status-badge";
import { ProductVariantsPanel } from "../components/product-variants-panel";
import { useAdminProduct } from "../hooks/use-products";

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs uppercase text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const query = useAdminProduct(id);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={query.data?.name ?? "Product details"}
        description="Review catalog metadata before managing variants and inventory."
        isRefreshing={query.isFetching}
        onRefresh={() => void query.refetch()}
        backTo="/admin/products"
        backLabel="Products"
      />

      {query.isPending ? (
        <LoadingState label="Loading product..." />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : (
        <Tabs defaultValue="details" className="gap-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="variants">Variants</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <section className="rounded-md border bg-background p-5">
              {toApiImageUrl(query.data.imageUrl) && (
                <div className="mb-5 aspect-[5/2] overflow-hidden rounded-md border bg-muted">
                  <img
                    src={toApiImageUrl(query.data.imageUrl) ?? undefined}
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <ProductStatusBadge status={query.data.status} />
                {query.data.isFeatured && <Badge variant="outline">Featured</Badge>}
                {query.data.isNewArrival && (
                  <Badge variant="outline">New arrival</Badge>
                )}
              </div>
              <Separator className="my-5" />
              <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <DetailRow label="SKU" value={query.data.sku} />
                <DetailRow label="Slug" value={query.data.slug} />
                <DetailRow
                  label="Brand"
                  value={query.data.brand?.name ?? "No brand"}
                />
                <DetailRow
                  label="Seller price"
                  value={formatMoney(query.data.sellerPrice)}
                />
                <DetailRow
                  label="Original price"
                  value={formatMoney(query.data.originalPrice)}
                />
                <DetailRow
                  label="Discounted price"
                  value={formatMoney(query.data.discountedPrice)}
                />
                <DetailRow label="Length" value={query.data.lengthCm ?? "-"} />
                <DetailRow label="Width" value={query.data.widthCm ?? "-"} />
                <DetailRow
                  label="Categories"
                  value={
                    query.data.categories?.length
                      ? query.data.categories
                          .map((category) => category.name)
                          .join(", ")
                      : "No categories"
                  }
                />
              </dl>
              {query.data.description && (
                <>
                  <Separator className="my-5" />
                  <p className="text-sm leading-6 text-muted-foreground">
                    {query.data.description}
                  </p>
                </>
              )}
            </section>
          </TabsContent>
          <TabsContent value="variants">
            <ProductVariantsPanel
              productId={query.data.id}
              productSku={query.data.sku}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
