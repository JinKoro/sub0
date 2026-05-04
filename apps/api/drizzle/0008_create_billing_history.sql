CREATE TABLE "billing_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" varchar(12) NOT NULL,
	"subscription_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency_id" integer NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"billed_at" timestamp with time zone NOT NULL,
	"is_promo" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "billing_history_sku_key" ON "billing_history" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "idx_billing_history_subscription_billed" ON "billing_history" USING btree ("subscription_id","billed_at") WHERE "billing_history"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_billing_history_customer_billed" ON "billing_history" USING btree ("customer_id","billed_at") WHERE "billing_history"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_billing_history_project_billed" ON "billing_history" USING btree ("project_id","billed_at") WHERE "billing_history"."deleted_at" IS NULL;