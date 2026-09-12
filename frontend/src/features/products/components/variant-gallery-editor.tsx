import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ImagePlus,
  LoaderCircle,
  Trash2,
} from "lucide-react";
import { uploadsApi } from "@/features/uploads";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { EmptyState } from "@/shared/components/empty-state";
import { getImageFilename, toApiImageUrl } from "@/shared/utils/image-url";
import type { ProductVariant } from "../types/product";

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxBytes = 5 * 1024 * 1024;
const maxImages = 20;

function validateGalleryFiles(files: File[], currentCount: number) {
  if (currentCount + files.length > maxImages)
    return `A variant can have up to ${maxImages} images.`;
  const invalid = files.find((file) => !acceptedTypes.includes(file.type));
  if (invalid) return "Images must be JPEG, PNG, or WebP.";
  const tooLarge = files.find((file) => file.size > maxBytes);
  if (tooLarge) return "Each image must be 5 MB or smaller.";
  return null;
}

function isFilename(value: string | null): value is string {
  return typeof value === "string";
}

export function VariantGalleryEditor({
  variant,
  disabled,
  onSave,
  onCleanupWarning,
}: {
  variant: ProductVariant;
  disabled?: boolean;
  onSave: (variantId: string, imageUrls: string[]) => Promise<unknown>;
  onCleanupWarning: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const originalUrls = useMemo(
    () => variant.images.map((image) => image.imageUrl),
    [variant.images],
  );
  const [imageUrls, setImageUrls] = useState(originalUrls);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isDirty = imageUrls.join("|") !== originalUrls.join("|");

  async function uploadFiles(files: File[]) {
    const validationError = validateGalleryFiles(files, imageUrls.length);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    const uploadedUrls: string[] = [];
    try {
      for (const file of files) {
        const uploaded = await uploadsApi.uploadImage(file);
        uploadedUrls.push(uploaded.imageUrl);
      }
      setImageUrls((current) => [...current, ...uploadedUrls]);
    } catch (uploadError) {
      await Promise.all(
        uploadedUrls
          .map(getImageFilename)
          .filter(isFilename)
          .map((filename) => uploadsApi.deleteImage(filename).catch(() => undefined)),
      );
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Images could not be uploaded.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveGallery() {
    setSaving(true);
    setError(null);
    try {
      await onSave(variant.id, imageUrls);
      const next = new Set(imageUrls);
      await Promise.all(
        originalUrls
          .filter((url) => !next.has(url))
          .map(getImageFilename)
          .filter(isFilename)
          .map((filename) =>
            uploadsApi.deleteImage(filename).catch(() =>
              onCleanupWarning(
                "Gallery saved, but one removed image file could not be deleted.",
              ),
            ),
          ),
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Gallery could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  function move(index: number, direction: -1 | 1) {
    setImageUrls((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <section className="space-y-4 rounded-md border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-medium">{variant.colorName} gallery</h2>
          <p className="text-sm text-muted-foreground">
            First image becomes the variant main image.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            disabled={disabled || saving}
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              if (files.length > 0) void uploadFiles(files);
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || saving || imageUrls.length >= maxImages}
          >
            <ImagePlus />
            Add images
          </Button>
          <Button
            type="button"
            onClick={() => void saveGallery()}
            disabled={disabled || saving || !isDirty}
          >
            {saving && <LoaderCircle className="animate-spin" />}
            Save gallery
          </Button>
        </div>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Gallery action failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {imageUrls.length === 0 ? (
        <EmptyState
          title="No gallery images"
          description="Upload images to build this variant gallery."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {imageUrls.map((imageUrl, index) => (
            <div key={`${imageUrl}-${index}`} className="rounded-md border bg-background">
              <div className="aspect-square overflow-hidden border-b bg-muted">
                <img
                  src={toApiImageUrl(imageUrl) ?? undefined}
                  alt=""
                  className="size-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                <span className="text-xs text-muted-foreground">
                  Position {index + 1}
                </span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Move image up"
                    disabled={disabled || saving || index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Move image down"
                    disabled={disabled || saving || index === imageUrls.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Remove image"
                    disabled={disabled || saving}
                    onClick={() =>
                      setImageUrls((current) =>
                        current.filter((_, currentIndex) => currentIndex !== index),
                      )
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
