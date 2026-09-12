import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { ImageField, uploadsApi } from "@/features/uploads";
import { ApiError } from "@/shared/api/client";
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
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { Switch } from "@/shared/components/ui/switch";
import { getImageFilename } from "@/shared/utils/image-url";
import {
  productVariantFormSchema,
  type ProductVariantFormValues,
} from "../schemas/product.schema";
import type {
  ProductInventoryPayload,
  ProductVariant,
  ProductVariantMutationPayload,
} from "../types/product";

function getDefaults(variant?: ProductVariant | null): ProductVariantFormValues {
  return {
    colorName: variant?.colorName ?? "",
    sku: variant?.sku ?? "",
    imageUrl: variant?.imageUrl ?? null,
    isActive: variant?.isActive ?? true,
    stockQuantity: variant?.stockQuantity ?? 0,
    reservedQuantity: variant?.reservedQuantity ?? 0,
  };
}

function slugifyColor(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function getDefaultVariantSku(productSku: string, colorName: string) {
  const colorSlug = slugifyColor(colorName);
  return colorSlug ? `${productSku.trim()}-${colorSlug}` : productSku.trim();
}

function normalizeVariantPayload(
  values: ProductVariantFormValues,
  imageUrl: string | null,
): ProductVariantMutationPayload {
  return {
    colorName: values.colorName.trim(),
    sku: values.sku.trim(),
    imageUrl,
    isActive: values.isActive,
    stockQuantity: values.stockQuantity,
    reservedQuantity: values.reservedQuantity,
  };
}

function getInventoryPayload(
  variant: ProductVariant | null | undefined,
  values: ProductVariantFormValues,
): ProductInventoryPayload | null {
  if (!variant) return null;
  const payload: ProductInventoryPayload = {};
  if (values.stockQuantity !== (variant.stockQuantity ?? 0)) {
    payload.stockQuantity = values.stockQuantity;
  }
  if (values.reservedQuantity !== (variant.reservedQuantity ?? 0)) {
    payload.reservedQuantity = values.reservedQuantity;
  }
  return Object.keys(payload).length > 0 ? payload : null;
}

function ProductVariantFormSheetInner({
  open,
  variant,
  productSku,
  onOpenChange,
  onSubmitVariant,
  onCleanupWarning,
}: {
  open: boolean;
  variant?: ProductVariant | null;
  productSku: string;
  onOpenChange: (open: boolean) => void;
  onSubmitVariant: (
    payload: ProductVariantMutationPayload,
    inventoryPayload: ProductInventoryPayload | null,
  ) => Promise<ProductVariant | unknown>;
  onCleanupWarning: (message: string) => void;
}) {
  const [skuEdited, setSkuEdited] = useState(() => !!variant);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [imageError, setImageError] = useState<string | undefined>();
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<ProductVariantFormValues>({
    resolver: zodResolver(productVariantFormSchema),
    defaultValues: getDefaults(variant),
  });
  const colorName = useWatch({ control: form.control, name: "colorName" }) ?? "";
  const isDirty = form.formState.isDirty || !!selectedFile || imageRemoved;
  const mode = variant ? "edit" : "create";

  useEffect(() => {
    if (!open || skuEdited || mode !== "create") return;
    form.setValue("sku", getDefaultVariantSku(productSku, colorName), {
      shouldDirty: !!colorName,
      shouldValidate: false,
    });
  }, [colorName, form, mode, open, productSku, skuEdited]);

  function requestClose(nextOpen: boolean) {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }
    if (submitting) return;
    if (isDirty) {
      setDiscardOpen(true);
      return;
    }
    onOpenChange(false);
  }

  async function cleanupUploadedImage(filename: string) {
    try {
      await uploadsApi.deleteImage(filename);
    } catch {
      onCleanupWarning(
        "Variant saved, but the replaced image file could not be deleted.",
      );
    }
  }

  async function submit(values: ProductVariantFormValues) {
    if (imageError) return;
    setSubmitting(true);
    setApiError(null);
    let uploadedFilename: string | null = null;
    try {
      let imageUrl = imageRemoved ? null : values.imageUrl ?? null;
      if (selectedFile) {
        const uploaded = await uploadsApi.uploadImage(selectedFile);
        uploadedFilename = uploaded.filename;
        imageUrl = uploaded.imageUrl;
      }
      const payload = normalizeVariantPayload(values, imageUrl);
      const saved = await onSubmitVariant(
        payload,
        getInventoryPayload(variant, values),
      );
      const oldFilename = getImageFilename(variant?.imageUrl);
      if ((selectedFile || imageRemoved) && oldFilename && oldFilename !== uploadedFilename) {
        await cleanupUploadedImage(oldFilename);
      }
      form.reset(getDefaults(saved as ProductVariant));
      setSelectedFile(null);
      setImageRemoved(false);
      onOpenChange(false);
    } catch (error) {
      if (uploadedFilename) {
        await uploadsApi.deleteImage(uploadedFilename).catch(() => undefined);
      }
      if (error instanceof ApiError && error.status === 409) {
        form.setError("sku", {
          type: "server",
          message: "This variant SKU is already used.",
        });
      } else {
        setApiError(
          error instanceof Error ? error.message : "Variant could not be saved.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  const skuRegistration = form.register("sku");

  return (
    <>
      <Sheet open={open} onOpenChange={requestClose}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle>{variant ? "Edit variant" : "Create variant"}</SheetTitle>
            <SheetDescription>
              Manage color, variant SKU, image, active state, and inventory.
            </SheetDescription>
          </SheetHeader>
          <form
            className="flex flex-1 flex-col"
            onSubmit={form.handleSubmit((values) => void submit(values))}
          >
            <div className="flex-1 space-y-5 px-5 py-5">
              {apiError && (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertTitle>Could not save variant</AlertTitle>
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="variant-color">Color name</Label>
                  <Input
                    id="variant-color"
                    disabled={submitting}
                    aria-invalid={!!form.formState.errors.colorName}
                    {...form.register("colorName")}
                  />
                  {form.formState.errors.colorName && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.colorName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variant-sku">SKU</Label>
                  <Input
                    id="variant-sku"
                    disabled={submitting}
                    aria-invalid={!!form.formState.errors.sku}
                    {...skuRegistration}
                    onChange={(event) => {
                      setSkuEdited(true);
                      skuRegistration.onChange(event);
                    }}
                  />
                  {form.formState.errors.sku && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.sku.message}
                    </p>
                  )}
                </div>
              </div>
              <ImageField
                id="variant-image"
                label="Main variant image"
                currentUrl={variant?.imageUrl}
                selectedFile={selectedFile}
                removed={imageRemoved}
                disabled={submitting}
                error={imageError}
                onSelect={(file, validationError) => {
                  setImageError(validationError);
                  setSelectedFile(file);
                  if (file) setImageRemoved(false);
                }}
                onRemove={() => {
                  setSelectedFile(null);
                  setImageRemoved(true);
                  setImageError(undefined);
                }}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="variant-stock">Stock quantity</Label>
                  <Input
                    id="variant-stock"
                    type="number"
                    min={0}
                    disabled={submitting}
                    aria-invalid={!!form.formState.errors.stockQuantity}
                    {...form.register("stockQuantity", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variant-reserved">Reserved quantity</Label>
                  <Input
                    id="variant-reserved"
                    type="number"
                    min={0}
                    disabled={submitting}
                    aria-invalid={!!form.formState.errors.reservedQuantity}
                    {...form.register("reservedQuantity", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </div>
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                    <div>
                      <Label htmlFor="variant-active">Active</Label>
                      <p className="text-sm text-muted-foreground">
                        Active variants can appear in public product pages.
                      </p>
                    </div>
                    <Switch
                      id="variant-active"
                      checked={field.value}
                      disabled={submitting}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />
            </div>
            <SheetFooter className="border-t px-5 py-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => requestClose(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !!imageError}>
                {submitting && <LoaderCircle className="animate-spin" />}
                {variant ? "Save changes" : "Create variant"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              The current variant form has unsaved changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDiscardOpen(false);
                onOpenChange(false);
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function ProductVariantFormSheet(props: {
  open: boolean;
  variant?: ProductVariant | null;
  productSku: string;
  onOpenChange: (open: boolean) => void;
  onSubmitVariant: (
    payload: ProductVariantMutationPayload,
    inventoryPayload: ProductInventoryPayload | null,
  ) => Promise<ProductVariant | unknown>;
  onCleanupWarning: (message: string) => void;
}) {
  const key = props.open ? props.variant?.id ?? "create" : "closed";
  return <ProductVariantFormSheetInner key={key} {...props} />;
}
