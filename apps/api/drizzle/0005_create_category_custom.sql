CREATE TABLE "category_custom" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" varchar(12) NOT NULL,
	"customer_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"color" varchar(7),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "category_custom" ADD CONSTRAINT "category_custom_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_custom" ADD CONSTRAINT "category_custom_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "category_custom_sku_key" ON "category_custom" USING btree ("sku");--> statement-breakpoint
CREATE UNIQUE INDEX "category_custom_customer_project_name_key" ON "category_custom" USING btree ("customer_id","project_id","name");--> statement-breakpoint
CREATE INDEX "idx_category_custom_customer_project" ON "category_custom" USING btree ("customer_id","project_id");