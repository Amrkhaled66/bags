# Variant galleries

Upload each image through POST /uploads/images, then save its imageUrl using:

PUT /admin/products/:id/variants/:variantId/images (admin Bearer token required)

```json
{ "imageUrls": ["https://example.com/front.webp", "https://example.com/back.webp"] }
```

The list replaces the gallery atomically. Maximum 20 unique URLs. Reorder the list to reorder images; omit a URL to remove it; send an empty list to clear the gallery. The first image is the cover and is mirrored in the variant imageUrl for existing cart consumers. Image record IDs are recreated on each replacement.

GET /products/:id/variants/:variantId/images returns ordered image records. Variant detail and variant list responses also include images. Each image has id, variantId, imageUrl and zero-based sortOrder.

Legacy create/update variant imageUrl writes set a single-image gallery (null clears it). Use the gallery endpoint for all dashboard gallery edits, and omit imageUrl when editing other variant properties.

Removing an image from a gallery does not delete its file. After saving, unused uploads can be deleted through DELETE /uploads/images/:filename. Gallery references participate in deletion checks. Categories retain one image.

Migration 0004 creates the gallery table and copies existing cover images into it. The db:migrate script uses drizzle-kit push, which does not execute SQL data backfills; deployments using push must also run the INSERT backfill from migration 0004 once.
