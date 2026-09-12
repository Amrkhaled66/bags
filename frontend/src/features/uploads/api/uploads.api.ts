import { request } from "@/shared/api/client";
import type { UploadedImage } from "../types/upload";

export const uploadsApi = {
  uploadImage(file: File, signal?: AbortSignal) {
    const form = new FormData();
    form.append("file", file);
    return request<UploadedImage>("/uploads/images", {
      method: "POST",
      body: form,
      signal,
    });
  },
  deleteImage(filename: string, signal?: AbortSignal) {
    return request<void>(`/uploads/images/${encodeURIComponent(filename)}`, {
      method: "DELETE",
      signal,
    });
  },
};
