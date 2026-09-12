import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/shared/components/ui/sheet";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import { ImageField, uploadsApi } from "@/features/uploads";
import { getImageFilename } from "@/shared/utils/image-url";
import { brandFormSchema, slugifyBrandName, type BrandFormValues } from "../schemas/brand.schema";
import type { Brand, BrandMutationPayload } from "../types/brand";

function getDefaults(brand?: Brand | null): BrandFormValues {
  return {
    name: brand?.name ?? "",
    slug: brand?.slug ?? "",
    description: brand?.description ?? "",
    logoUrl: brand?.logoUrl ?? null,
    isActive: brand?.isActive ?? true,
  };
}

function normalizePayload(values: BrandFormValues, logoUrl: string | null): BrandMutationPayload {
  const description = values.description?.trim();
  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
    description: description ? description : null,
    logoUrl,
    isActive: values.isActive,
  };
}

function BrandFormSheetInner({
  open,
  brand,
  onOpenChange,
  onSubmitBrand,
  onCleanupWarning,
}: {
  open: boolean;
  brand?: Brand | null;
  onOpenChange: (open: boolean) => void;
  onSubmitBrand: (payload: BrandMutationPayload) => Promise<Brand>;
  onCleanupWarning: (message: string) => void;
}) {
  const [slugEdited, setSlugEdited] = useState(() => !!brand);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [imageError, setImageError] = useState<string | undefined>();
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: getDefaults(brand),
  });
  const name = useWatch({ control: form.control, name: "name" }) ?? "";
  const isDirty = form.formState.isDirty || !!selectedFile || logoRemoved;
  const mode = brand ? "edit" : "create";

  useEffect(() => {
    if (!open || slugEdited || mode !== "create") return;
    form.setValue("slug", slugifyBrandName(name), {
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
      onCleanupWarning("Brand saved, but the replaced logo file could not be deleted.");
    }
  }

  async function submit(values: BrandFormValues) {
    if (imageError) return;
    setSubmitting(true);
    setApiError(null);
    let uploadedFilename: string | null = null;
    try {
      let logoUrl = logoRemoved ? null : values.logoUrl ?? null;
      if (selectedFile) {
        const uploaded = await uploadsApi.uploadImage(selectedFile);
        uploadedFilename = uploaded.filename;
        logoUrl = uploaded.imageUrl;
      }
      const saved = await onSubmitBrand(normalizePayload(values, logoUrl));
      const oldFilename = getImageFilename(brand?.logoUrl);
      if ((selectedFile || logoRemoved) && oldFilename && oldFilename !== uploadedFilename) {
        await cleanupUploadedImage(oldFilename);
      }
      form.reset(getDefaults(saved));
      setSelectedFile(null);
      setLogoRemoved(false);
      onOpenChange(false);
    } catch (error) {
      if (uploadedFilename) {
        await uploadsApi.deleteImage(uploadedFilename).catch(() => undefined);
      }
      if (error instanceof ApiError && error.status === 409) {
        form.setError("slug", {
          type: "server",
          message: "This slug is already used by another brand.",
        });
      } else {
        setApiError(error instanceof Error ? error.message : "Brand could not be saved.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const slugRegistration = form.register("slug");

  return (
    <>
      <Sheet open={open} onOpenChange={requestClose}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle>{brand ? "Edit brand" : "Create brand"}</SheetTitle>
            <SheetDescription>
              Manage brand visibility and the logo used across catalog screens.
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
                  <AlertTitle>Could not save brand</AlertTitle>
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="brand-name">Name</Label>
                <Input
                  id="brand-name"
                  disabled={submitting}
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
                <Label htmlFor="brand-slug">Slug</Label>
                <Input
                  id="brand-slug"
                  disabled={submitting}
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
                <Label htmlFor="brand-description">Description</Label>
                <Textarea
                  id="brand-description"
                  rows={5}
                  disabled={submitting}
                  aria-invalid={!!form.formState.errors.description}
                  {...form.register("description")}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>
              <ImageField
                id="brand-logo"
                label="Logo"
                currentUrl={brand?.logoUrl}
                selectedFile={selectedFile}
                removed={logoRemoved}
                disabled={submitting}
                error={imageError}
                onSelect={(file, validationError) => {
                  setImageError(validationError);
                  setSelectedFile(file);
                  if (file) setLogoRemoved(false);
                }}
                onRemove={() => {
                  setSelectedFile(null);
                  setLogoRemoved(true);
                  setImageError(undefined);
                }}
              />
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                    <div>
                      <Label htmlFor="brand-active">Active</Label>
                      <p className="text-sm text-muted-foreground">
                        Active brands appear in public brand listings.
                      </p>
                    </div>
                    <Switch
                      id="brand-active"
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
                {brand ? "Save changes" : "Create brand"}
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
              The current brand form has unsaved changes.
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

export function BrandFormSheet(
  props: {
    open: boolean;
    brand?: Brand | null;
    onOpenChange: (open: boolean) => void;
    onSubmitBrand: (payload: BrandMutationPayload) => Promise<Brand>;
    onCleanupWarning: (message: string) => void;
  },
) {
  const key = props.open ? props.brand?.id ?? "create" : "closed";
  return <BrandFormSheetInner key={key} {...props} />;
}
