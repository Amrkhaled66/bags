import { useMutation } from "@tanstack/react-query";
import { uploadsApi } from "../api/uploads.api";

export function useUploadImage() {
  return useMutation({
    mutationFn: (file: File) => uploadsApi.uploadImage(file),
  });
}

export function useDeleteImage() {
  return useMutation({
    mutationFn: (filename: string) => uploadsApi.deleteImage(filename),
  });
}
