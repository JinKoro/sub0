CREATE TABLE "customer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" text,
	"name" varchar(255),
	"avatar_url" text,
	"timezone" varchar(64) NOT NULL,
	"locale_id" integer DEFAULT 1 NOT NULL,
	"currency_id" integer DEFAULT 1 NOT NULL,
	"plan_id" integer DEFAULT 1 NOT NULL,
	"plan_expires_at" timestamp with time zone,
	"state_id" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "customer_email_key" ON "customer" USING btree ("email") WHERE "customer"."deleted_at" IS NULL;