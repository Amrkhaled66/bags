ALTER TABLE "orders" ADD COLUMN "idempotency_key" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "access_token_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "reservation_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_idempotency_key_unique" UNIQUE("idempotency_key");