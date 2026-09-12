import { apiUrl } from "@/shared/api/config";

export function toApiImageUrl(value?: string | null) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${apiUrl}${value.startsWith("/") ? value : `/${value}`}`;
}

export function getImageFilename(value?: string | null) {
  if (!value) return null;
  const pathname = /^https?:\/\//i.test(value)
    ? new URL(value).pathname
    : value;
  const marker = "/uploads/images/";
  const index = pathname.indexOf(marker);
  return index >= 0
    ? decodeURIComponent(pathname.slice(index + marker.length))
    : null;
}
