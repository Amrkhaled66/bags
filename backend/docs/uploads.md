# Image uploads

POST /uploads/images requires an admin Bearer token and multipart/form-data with one field named `file`.
Accepts non-animated JPEG, PNG, WebP up to 5 MB and 25 megapixels. Images are decoded, oriented, stripped of metadata and encoded as WebP.
Response: `{ filename, imageUrl, mimeType, size, width, height }`.

The returned imageUrl is relative to the backend origin. Use it unchanged in the existing category or product-variant imageUrl field. For browser display, resolve it against the API origin.

Replacement: upload a new image, PATCH the category or variant using its existing endpoint, then DELETE /uploads/images/:filename for the old image. Delete requires admin authorization and returns 409 while a category or variant references the file. Do not reattach an old image while deleting it. Failed record updates leave the new upload available for retry or explicit deletion.

GET /uploads/images/:filename serves images publicly. Uploads live in backend/uploads/images relative to the backend working directory and are ignored by Git. Deploy with a persistent volume and include uploads in backups. Multiple application instances must share that volume.

No database migration is required.
