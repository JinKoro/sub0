CREATE TABLE "oauth_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"provider_id" integer NOT NULL,
	"provider_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "oauth_account" ADD CONSTRAINT "oauth_account_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_account_provider_key" ON "oauth_account" USING btree ("provider_id","provider_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_account_customer_provider_key" ON "oauth_account" USING btree ("customer_id","provider_id");--> statement-breakpoint
CREATE INDEX "idx_oauth_account_customer" ON "oauth_account" USING btree ("customer_id");