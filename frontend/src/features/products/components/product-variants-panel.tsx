import { useState } from "react";
import {
  AlertCircle,
  Images,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState, LoadingState } from "@/shared/components/request-state";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { ActionErrorAlert } from "@/shared/components/action-error-alert";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { toApiImageUrl } from "@/shared/utils/image-url";
import {
  useCreateProductVariant,
  useDeleteProductVariant,
  useProductVariants,
  useReplaceVariantImages,
  useUpdateProductInventory,
  useUpdateProductVariant,
} from "../hooks/use-products";
import type {
  ProductInventoryPayload,
  ProductVariant,
  ProductVariantMutationPayload,
} from "../types/product";
import { ProductVariantFormSheet } from "./product-variant-form-sheet";
import { VariantGalleryEditor } from "./variant-gallery-editor";

function availableStock(variant: ProductVariant) {
  return (variant.stockQuantity ?? 0) - (variant.reservedQuantity ?? 0);
}

export function ProductVariantsPanel({
  productId,
  productSku,
}: {
  productId: string;
  productSku: string;
}) {
  const variantsQuery = useProductVariants(productId);
  const createVariant = useCreateProductVariant(productId);
  const updateVariant = useUpdateProductVariant(productId);
  const updateInventory = useUpdateProductInventory(productId);
  const replaceImages = useReplaceVariantImages(productId);
  const removeVariant = useDeleteProductVariant(productId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [deleteVariant, setDeleteVariant] = useState<ProductVariant | null>(null);
  const [selectedGalleryVariantId, setSelectedGalleryVariantId] = useState<
    string | null
  >(null);
  const [pendingVariantId, setPendingVariantId] = useState<string | null>(null);
  const [cleanupWarning, setCleanupWarning] = useState<string | null>(null);
  const variants = variantsQuery.data ?? [];
  const selectedGalleryVariant =
    variants.find((variant) => variant.id === selectedGalleryVariantId) ??
    variants[0] ??
    null;
  const mutationError =
    createVariant.error ??
    updateVariant.error ??
    updateInventory.error ??
    replaceImages.error ??
    removeVariant.error ??
    null;

  async function submitVariant(
    payload: ProductVariantMutationPayload,
    inventoryPayload: ProductInventoryPayload | null,
  ) {
    if (!editingVariant) {
      return createVariant.mutateAsync(payload);
    }
    const saved = await updateVariant.mutateAsync({
      variantId: editingVariant.id,
      payload: {
        colorName: payload.colorName,
        sku: payload.sku,
        imageUrl: payload.imageUrl,
        isActive: payload.isActive,
      },
    });
    if (inventoryPayload) {
      await updateInventory.mutateAsync({
        variantId: editingVariant.id,
        payload: inventoryPayload,
      });
    }
    return saved;
  }

  async function confirmDelete() {
    if (!deleteVariant) return;
    setPendingVariantId(deleteVariant.id);
    try {
      await removeVariant.mutateAsync(deleteVariant.id);
      if (selectedGalleryVariantId === deleteVariant.id)
        setSelectedGalleryVariantId(null);
      setDeleteVariant(null);
    } finally {
      setPendingVariantId(null);
    }
  }

  if (variantsQuery.isPending) {
    return <LoadingState label="Loading variants..." />;
  }

  if (variantsQuery.isError) {
    return (
      <ErrorState
        error={variantsQuery.error}
        retry={() => void variantsQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-medium">Variants and inventory</h2>
          <p className="text-sm text-muted-foreground">
            Manage sellable color variants, available stock, and ordered images.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditingVariant(null);
            setSheetOpen(true);
          }}
        >
          <Plus />
          Create variant
        </Button>
      </div>

      {cleanupWarning && (
        <Alert>
          <AlertCircle />
          <AlertTitle>Image cleanup needs attention</AlertTitle>
          <AlertDescription>{cleanupWarning}</AlertDescription>
        </Alert>
      )}

      <ActionErrorAlert error={mutationError} />

      {variants.length === 0 ? (
        <EmptyState
          title="No variants yet"
          description="Create the first variant before this product can hold inventory."
          action={
            <Button
              type="button"
              onClick={() => {
                setEditingVariant(null);
                setSheetOpen(true);
              }}
            >
              <Plus />
              Create variant
            </Button>
          }
        />
      ) : (
        <section className="overflow-hidden rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Reserved</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Images</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant) => {
                const imageUrl = toApiImageUrl(variant.imageUrl);
                return (
                  <TableRow key={variant.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-11 items-center justify-center overflow-hidden rounded-md border bg-muted">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt=""
                              className="size-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <Images className="size-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{variant.colorName}</p>
                          <p className="text-xs text-muted-foreground">
                            {variant.sku}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={variant.isActive ? "secondary" : "outline"}>
                        {variant.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{variant.stockQuantity ?? 0}</TableCell>
                    <TableCell>{variant.reservedQuantity ?? 0}</TableCell>
                    <TableCell>{availableStock(variant)}</TableCell>
                    <TableCell>{variant.images.length}</TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${variant.colorName}`}
                              disabled={pendingVariantId === variant.id}
                            >
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() =>
                                setSelectedGalleryVariantId(variant.id)
                              }
                            >
                              <Images />
                              Gallery
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => {
                                setEditingVariant(variant);
                                setSheetOpen(true);
                              }}
                            >
                              <Pencil />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => setDeleteVariant(variant)}
                            >
                              <Trash2 />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </section>
      )}

      {selectedGalleryVariant && (
        <VariantGalleryEditor
          key={selectedGalleryVariant.id}
          variant={selectedGalleryVariant}
          disabled={replaceImages.isPending}
          onCleanupWarning={setCleanupWarning}
          onSave={(variantId, imageUrls) =>
            replaceImages.mutateAsync({ variantId, imageUrls })
          }
        />
      )}

      <ProductVariantFormSheet
        open={sheetOpen}
        variant={editingVariant}
        productSku={productSku}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingVariant(null);
        }}
        onSubmitVariant={submitVariant}
        onCleanupWarning={setCleanupWarning}
      />

      <AlertDialog
        open={!!deleteVariant}
        onOpenChange={(open) => !open && setDeleteVariant(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete variant?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the variant and its inventory record. Existing orders
              keep their historical snapshot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()}>
              Delete variant
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
