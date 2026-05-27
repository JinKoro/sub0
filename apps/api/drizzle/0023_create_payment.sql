CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" varchar(12) NOT NULL,
	"customer_id" uuid NOT NULL,
	"provider_id" integer NOT NULL,
	"provider_payment_id" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency_id" integer NOT NULL,
	"status_id" integer NOT NULL,
	"paid_plan_id" integer NOT NULL,
	"paid_until" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_sku_key" ON "payment" USING btree ("sku");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_provider_payment_key" ON "payment" USING btree ("provider_id","provider_payment_id");--> statement-breakpoint
CREATE INDEX "idx_payment_customer" ON "payment" USING btree ("customer_id") WHERE "payment"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_payment_paid_until" ON "payment" USING btree ("customer_id","paid_until") WHERE "payment"."deleted_at" IS NULL;
