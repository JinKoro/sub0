CREATE TABLE "project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" varchar(12) NOT NULL,
	"customer_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"color" varchar(7),
	"state_id" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_sku_key" ON "project" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "idx_project_customer" ON "project" USING btree ("customer_id") WHERE "project"."deleted_at" IS NULL;