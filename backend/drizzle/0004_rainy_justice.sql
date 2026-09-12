CREATE TABLE "product_variant_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_variant_images" ADD CONSTRAINT "product_variant_images_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "variant_images_position_unique" ON "product_variant_images" USING btree ("variant_id","sort_order");
--> statement-breakpoint
INSERT INTO "product_variant_images" ("variant_id", "image_url", "sort_order")
SELECT "id", "image_url", 0 FROM "product_variants" WHERE "image_url" IS NOT NULL;
