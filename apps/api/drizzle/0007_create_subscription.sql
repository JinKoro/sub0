CREATE TABLE "subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" varchar(12) NOT NULL,
	"customer_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"service_id" uuid,
	"category_id" uuid,
	"category_custom_id" uuid,
	"name_custom" varchar(255),
	"icon_custom" text,
	"amount" numeric(12, 2) NOT NULL,
	"currency_id" integer DEFAULT 1 NOT NULL,
	"billing_period_id" integer DEFAULT 1 NOT NULL,
	"first_billing_date" timestamp with time zone NOT NULL,
	"next_billing_date" timestamp with time zone NOT NULL,
	"is_trial" boolean DEFAULT false NOT NULL,
	"promo_amount" numeric(12, 2),
	"promo_ends_at" timestamp with time zone,
	"comment" varchar(255),
	"state_id" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_category_custom_id_category_custom_id_fk" FOREIGN KEY ("category_custom_id") REFERENCES "public"."category_custom"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_sku_key" ON "subscription" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "idx_subscription_customer_project_state" ON "subscription" USING btree ("customer_id","project_id","state_id") WHERE "subscription"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_subscription_next_billing" ON "subscription" USING btree ("customer_id","next_billing_date") WHERE "subscription"."deleted_at" IS NULL AND "subscription"."state_id" = 1;--> statement-breakpoint
CREATE INDEX "idx_subscription_promo_ends" ON "subscription" USING btree ("customer_id","promo_ends_at") WHERE "subscription"."promo_ends_at" IS NOT NULL AND "subscription"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_subscription_service" ON "subscription" USING btree ("service_id") WHERE "subscription"."service_id" IS NOT NULL AND "subscription"."deleted_at" IS NULL;