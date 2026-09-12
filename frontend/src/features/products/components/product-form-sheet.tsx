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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import { getImageFilename } from "@/shared/utils/image-url";
import {
  productFormSchema,
  slugifyProductName,
  type ProductFormValues,
} from "../schemas/product.schema";
import type { Product, ProductMutationPayload } from "../types/product";
import { BrandSelect, CategoryChecklist } from "./product-selectors";

function getDefaults(product?: Product | null): ProductFormValues {
  return {
    brandId: product?.brandId ?? "none",
    sku: product?.sku ?? "",
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    imageUrl: product?.imageUrl ?? null,
    sellerPrice: product?.sellerPrice ?? "",
    originalPrice: product?.originalPrice ?? "",
    discountedPrice: product?.discountedPrice ?? "",
    lengthCm: product?.lengthCm ?? "",
    widthCm: product?.widthCm ?? "",
    status: product?.status ?? "draft",
    isFeatured: product?.isFeatured ?? false,
    isNewArrival: product?.isNewArrival ?? false,
    categoryIds: product?.categories?.map((category) => category.id) ?? [],
  };
}

function nullableText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizePayload(
  values: ProductFormValues,
  imageUrl: string | null,
): ProductMutationPayload {
  return {
    brandId: values.brandId === "none" ? null : values.brandId,
    sku: values.sku.trim(),
    name: values.name.trim(),
    slug: values.slug.trim(),
    description: nullableText(values.description),
    imageUrl,
    sellerPrice: Number(values.sellerPrice).toFixed(2),
    originalPrice: nullableText(values.originalPrice),
    discountedPrice: nullableText(values.discountedPrice),
    lengthCm: nullableText(values.lengthCm),
    widthCm: nullableText(values.widthCm),
    status: values.status,
    isFeatured: values.isFeatured,
    isNewArrival: values.isNewArrival,
    categoryIds: values.categoryIds,
  };
}

function ProductFormSheetInner({
  open,
  product,
  loadingProduct,
  onOpenChange,
  onSubmitProduct,
  onCleanupWarning,
}: {
  open: boolean;
  product?: Product | null;
  loadingProduct?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitProduct: (payload: ProductMutationPayload) => Promise<Product>;
  onCleanupWarning: (message: string) => void;
}) {
  const [slugEdited, setSlugEdited] = useState(() => !!product);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [imageError, setImageError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: getDefaults(product),
  });
  const name = useWatch({ control: form.control, name: "name" }) ?? "";
  const isDirty = form.formState.isDirty || !!selectedFile || imageRemoved;
  const mode = product ? "edit" : "create";

  useEffect(() => {
    if (!open || slugEdited || mode !== "create") return;
    form.setValue("slug", slugifyProductName(name), {
      shouldDirty: !!name,
      shouldValidate: false,
    });
  }, [form, mode, name, open, slugEdited]);

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
        "Product saved, but the replaced image file could not be deleted.",
      );
    }
  }

  async function submit(values: ProductFormValues) {
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
      const saved = await onSubmitProduct(normalizePayload(values, imageUrl));
      const oldFilename = getImageFilename(product?.imageUrl);
      if ((selectedFile || imageRemoved) && oldFilename && oldFilename !== uploadedFilename) {
        await cleanupUploadedImage(oldFilename);
      }
      form.reset(getDefaults(saved));
      setSelectedFile(null);
      setImageRemoved(false);
      onOpenChange(false);
    } catch (error) {
      if (uploadedFilename) {
        await uploadsApi.deleteImage(uploadedFilename).catch(() => undefined);
      }
      if (error instanceof ApiError && error.status === 409) {
        const field = /sku/i.test(error.message) ? "sku" : "slug";
        form.setError(field, {
          type: "server",
          message:
            field === "sku"
              ? "This SKU is already used by another product."
              : "This slug is already used by another product.",
        });
      } else {
        setApiError(
          error instanceof Error ? error.message : "Product could not be saved.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  const slugRegistration = form.register("slug");
  const disabled = submitting || loadingProduct;

  return (
    <>
      <Sheet open={open} onOpenChange={requestClose}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle>{product ? "Edit product" : "Create product"}</SheetTitle>
            <SheetDescription>
              Manage product identity, pricing, catalog placement, and flags.
            </SheetDescription>
          </SheetHeader>
          {loadingProduct ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 9 }).map((_, index) => (
                <Skeleton key={index} className="h-11 w-full" />
              ))}
            </div>
          ) : (
            <form
              className="flex flex-1 flex-col"
              onSubmit={form.handleSubmit((values) => void submit(values))}
            >
              <div className="flex-1 space-y-5 px-5 py-5">
                {apiError && (
                  <Alert variant="destructive">
                    <AlertCircle />
                    <AlertTitle>Could not save product</AlertTitle>
                    <AlertDescription>{apiError}</AlertDescription>
                  </Alert>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="product-name">Name</Label>
                    <Input
                      id="product-name"
                      disabled={disabled}
                      aria-invalid={!!form.formState.errors.name}
                      {...form.register("name")}
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-sku">SKU</Label>
                    <Input
                      id="product-sku"
                      disabled={disabled}
                      aria-invalid={!!form.formState.errors.sku}
                      {...form.register("sku")}
                    />
                    {form.formState.errors.sku && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.sku.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-slug">Slug</Label>
                  <Input
                    id="product-slug"
                    disabled={disabled}
                    aria-invalid={!!form.formState.errors.slug}
                    {...slugRegistration}
                    onChange={(event) => {
                      setSlugEdited(true);
                      slugRegistration.onChange(event);
                    }}
                  />
                  {form.formState.errors.slug && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.slug.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-description">Description</Label>
                  <Textarea
                    id="product-description"
                    rows={5}
                    disabled={disabled}
                    {...form.register("description")}
                  />
                </div>
                <ImageField
                  id="product-image"
                  label="Product image"
                  currentUrl={product?.imageUrl}
                  selectedFile={selectedFile}
                  removed={imageRemoved}
                  disabled={disabled}
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
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="product-seller-price">Seller price</Label>
                    <Input
                      id="product-seller-price"
                      inputMode="decimal"
                      disabled={disabled}
                      aria-invalid={!!form.formState.errors.sellerPrice}
                      {...form.register("sellerPrice")}
                    />
                    {form.formState.errors.sellerPrice && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.sellerPrice.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-original-price">Original price</Label>
                    <Input
                      id="product-original-price"
                      inputMode="decimal"
                      disabled={disabled}
                      {...form.register("originalPrice")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-discount-price">Discounted price</Label>
                    <Input
                      id="product-discount-price"
                      inputMode="decimal"
                      disabled={disabled}
                      {...form.register("discountedPrice")}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="product-length">Length cm</Label>
                    <Input
                      id="product-length"
                      inputMode="decimal"
                      disabled={disabled}
                      {...form.register("lengthCm")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-width">Width cm</Label>
                    <Input
                      id="product-width"
                      inputMode="decimal"
                      disabled={disabled}
                      {...form.register("widthCm")}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={field.value}
                          disabled={disabled}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="brandId"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label>Brand</Label>
                        <BrandSelect
                          value={field.value}
                          disabled={disabled}
                          onChange={field.onChange}
                        />
                      </div>
                    )}
                  />
                </div>
                <Controller
                  control={form.control}
                  name="categoryIds"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Categories</Label>
                      <CategoryChecklist
                        value={field.value}
                        disabled={disabled}
                        onChange={field.onChange}
                      />
                    </div>
                  )}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Controller
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                        <div>
                          <Label htmlFor="product-featured">Featured</Label>
                          <p className="text-sm text-muted-foreground">
                            Highlight in featured catalog areas.
                          </p>
                        </div>
                        <Switch
                          id="product-featured"
                          checked={field.value}
                          disabled={disabled}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="isNewArrival"
                    render={({ field }) => (
                      <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                        <div>
                          <Label htmlFor="product-new-arrival">New arrival</Label>
                          <p className="text-sm text-muted-foreground">
                            Mark as a recent catalog addition.
                          </p>
                        </div>
                        <Switch
                          id="product-new-arrival"
                          checked={field.value}
                          disabled={disabled}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                    )}
                  />
                </div>
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
                  {product ? "Save changes" : "Create product"}
                </Button>
              </SheetFooter>
            </form>
          )}
        </SheetContent>
      </Sheet>
      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              The current product form has unsaved changes.
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

export function ProductFormSheet(props: {
  open: boolean;
  product?: Product | null;
  loadingProduct?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitProduct: (payload: ProductMutationPayload) => Promise<Product>;
  onCleanupWarning: (message: string) => void;
}) {
  const key = props.open ? props.product?.id ?? "create" : "closed";
  return <ProductFormSheetInner key={key} {...props} />;
}
