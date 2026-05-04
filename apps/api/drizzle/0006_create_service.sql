CREATE TABLE "service" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" varchar(12) NOT NULL,
	"name" varchar(255) NOT NULL,
	"icon" text,
	"category_id" uuid NOT NULL,
	"cancel_url" text,
	"pricing_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "service" ADD CONSTRAINT "service_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "service_sku_key" ON "service" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "idx_service_category" ON "service" USING btree ("category_id") WHERE "service"."is_active" = true;