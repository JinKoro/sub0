CREATE TABLE "subscription_promo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" varchar(12) NOT NULL,
	"subscription_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscription_promo" ADD CONSTRAINT "subscription_promo_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_promo_sku_key" ON "subscription_promo" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "idx_subscription_promo_sub_active" ON "subscription_promo" USING btree ("subscription_id","ends_at") WHERE "subscription_promo"."deleted_at" IS NULL;