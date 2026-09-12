ALTER TYPE "public"."payment_status" ADD VALUE 'partially_refunded' BEFORE 'refunded';--> statement-breakpoint
ALTER TABLE "refunds" ALTER COLUMN "return_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "refunds" ALTER COLUMN "amount" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "refunds" ALTER COLUMN "is_refunded" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "refunds" ALTER COLUMN "is_refunded" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "return_items" ALTER COLUMN "return_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "return_items" ALTER COLUMN "order_item_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "return_items" ALTER COLUMN "quantity" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "returns" ALTER COLUMN "order_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "returns" ALTER COLUMN "status" SET DEFAULT 'requested';--> statement-breakpoint
ALTER TABLE "returns" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "returns" ALTER COLUMN "reason" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "return_items_return_id_order_item_id_unique" ON "return_items" USING btree ("return_id","order_item_id");--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_return_id_unique" UNIQUE("return_id");