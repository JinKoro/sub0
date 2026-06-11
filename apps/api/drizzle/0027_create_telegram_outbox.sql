CREATE TABLE "telegram_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid,
	"template" varchar(64) NOT NULL,
	"locale_id" integer NOT NULL,
	"chat_id" varchar(64) NOT NULL,
	"context" jsonb NOT NULL,
	"sent_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"failure_reason" text,
	"retries" integer DEFAULT 0 NOT NULL,
	"dedup_key" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "telegram_outbox" ADD CONSTRAINT "telegram_outbox_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_telegram_outbox_pending" ON "telegram_outbox" USING btree ("created_at") WHERE "telegram_outbox"."sent_at" IS NULL AND "telegram_outbox"."failed_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_telegram_outbox_customer" ON "telegram_outbox" USING btree ("customer_id") WHERE "telegram_outbox"."customer_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "telegram_outbox_dedup_key_uidx" ON "telegram_outbox" USING btree ("dedup_key");