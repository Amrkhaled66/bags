import { useEffect, useMemo, useRef } from "react";
import { ImageIcon, Trash2, Upload } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { toApiImageUrl } from "@/shared/utils/image-url";

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxBytes = 5 * 1024 * 1024;

function validateImageFile(file: File) {
  if (!acceptedTypes.includes(file.type))
    return "Logo must be a JPEG, PNG, or WebP image.";
  if (file.size > maxBytes) return "Logo must be 5 MB or smaller.";
  return null;
}

export function ImageField({
  id,
  label,
  currentUrl,
  selectedFile,
  removed,
  disabled,
  error,
  onSelect,
  onRemove,
}: {
  id: string;
  label: string;
  currentUrl?: string | null;
  selectedFile?: File | null;
  removed?: boolean;
  disabled?: boolean;
  error?: string;
  onSelect: (file: File | null, validationError?: string) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile],
  );
  const displayUrl = useMemo(() => {
    if (previewUrl) return previewUrl;
    if (removed) return null;
    return toApiImageUrl(currentUrl);
  }, [currentUrl, previewUrl, removed]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-start gap-3">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
          {displayUrl ? (
            <img
              src={displayUrl}
              alt=""
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={inputRef}
            id={id}
            type="file"
            className="sr-only"
            accept="image/jpeg,image/png,image/webp"
            disabled={disabled}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              if (!file) return;
              const validationError = validateImageFile(file);
              onSelect(validationError ? null : file, validationError ?? undefined);
              event.target.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              <Upload />
              {displayUrl ? "Replace" : "Upload"}
            </Button>
            {displayUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={onRemove}
              >
                <Trash2 />
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP. Max 5 MB.</p>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
}
