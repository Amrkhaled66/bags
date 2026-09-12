import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
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
import { getImageFilename } from "@/shared/utils/image-url";
import {
  categoryFormSchema,
  slugifyCategoryName,
  type CategoryFormValues,
} from "../schemas/category.schema";
import type { Category, CategoryMutationPayload } from "../types/category";

function getDefaults(category?: Category | null): CategoryFormValues {
  return {
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    imageUrl: category?.imageUrl ?? null,
  };
}

function normalizePayload(
  values: CategoryFormValues,
  imageUrl: string | null,
): CategoryMutationPayload {
  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
    imageUrl,
  };
}

function CategoryFormSheetInner({
  open,
  category,
  onOpenChange,
  onSubmitCategory,
  onCleanupWarning,
}: {
  open: boolean;
  category?: Category | null;
  onOpenChange: (open: boolean) => void;
  onSubmitCategory: (payload: CategoryMutationPayload) => Promise<Category>;
  onCleanupWarning: (message: string) => void;
}) {
  const [slugEdited, setSlugEdited] = useState(() => !!category);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [imageError, setImageError] = useState<string | undefined>();
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: getDefaults(category),
  });
  const name = useWatch({ control: form.control, name: "name" }) ?? "";
  const isDirty = form.formState.isDirty || !!selectedFile || imageRemoved;
  const mode = category ? "edit" : "create";

  useEffect(() => {
    if (!open || slugEdited || mode !== "create") return;
    form.setValue("slug", slugifyCategoryName(name), {
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
        "Category saved, but the replaced image file could not be deleted.",
      );
    }
  }

  async function submit(values: CategoryFormValues) {
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
      const saved = await onSubmitCategory(normalizePayload(values, imageUrl));
      const oldFilename = getImageFilename(category?.imageUrl);
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
        form.setError("slug", {
          type: "server",
          message: "This slug is already used by another category.",
        });
      } else {
        setApiError(
          error instanceof Error ? error.message : "Category could not be saved.",
        );
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
            <SheetTitle>{category ? "Edit category" : "Create category"}</SheetTitle>
            <SheetDescription>
              Manage the category name, slug, and catalog image.
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
                  <AlertTitle>Could not save category</AlertTitle>
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="category-name">Name</Label>
                <Input
                  id="category-name"
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
                <Label htmlFor="category-slug">Slug</Label>
                <Input
                  id="category-slug"
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
              <ImageField
                id="category-image"
                label="Image"
                currentUrl={category?.imageUrl}
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
                {category ? "Save changes" : "Create category"}
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
              The current category form has unsaved changes.
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

export function CategoryFormSheet(props: {
  open: boolean;
  category?: Category | null;
  onOpenChange: (open: boolean) => void;
  onSubmitCategory: (payload: CategoryMutationPayload) => Promise<Category>;
  onCleanupWarning: (message: string) => void;
}) {
  const key = props.open ? props.category?.id ?? "create" : "closed";
  return <CategoryFormSheetInner key={key} {...props} />;
}
