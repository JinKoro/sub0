CREATE TABLE "mail_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid,
	"template" varchar(64) NOT NULL,
	"locale_id" integer NOT NULL,
	"to_email" varchar(320) NOT NULL,
	"context" jsonb NOT NULL,
	"sent_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"failure_reason" text,
	"retries" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mail_outbox" ADD CONSTRAINT "mail_outbox_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_mail_outbox_pending" ON "mail_outbox" USING btree ("created_at") WHERE "mail_outbox"."sent_at" IS NULL AND "mail_outbox"."failed_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_mail_outbox_customer" ON "mail_outbox" USING btree ("customer_id") WHERE "mail_outbox"."customer_id" IS NOT NULL;