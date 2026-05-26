ALTER TABLE "customer" ADD COLUMN "notifications_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "customer" ADD COLUMN "notification_lead_days" integer[] DEFAULT '{3}'::int[] NOT NULL;--> statement-breakpoint
ALTER TABLE "mail_outbox" ADD COLUMN "dedup_key" varchar(128);--> statement-breakpoint
CREATE UNIQUE INDEX "mail_outbox_dedup_key_uidx" ON "mail_outbox" USING btree ("dedup_key");