CREATE TABLE "notification_channel" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"type_id" integer NOT NULL,
	"address" varchar(255) NOT NULL,
	"verified_at" timestamp with time zone,
	"enabled" boolean DEFAULT true NOT NULL,
	"connect_nonce" varchar(64),
	"connect_nonce_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_channel" ADD CONSTRAINT "notification_channel_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_channel_customer_type_key" ON "notification_channel" USING btree ("customer_id","type_id");--> statement-breakpoint
CREATE INDEX "notification_channel_active_idx" ON "notification_channel" USING btree ("customer_id") WHERE "notification_channel"."enabled" = true AND "notification_channel"."verified_at" IS NOT NULL;--> statement-breakpoint
-- Backfill: каждому ACTIVE-customer'у заводим verified EMAIL-канал (email
-- подтверждён до первой оплаты). type_id=1 (NotificationChannelType.EMAIL),
-- state_id=2 (CustomerState.ACTIVE). Новым customer'ам канал создаётся в
-- completeRegistration. ON CONFLICT — идемпотентность повторного прогона.
INSERT INTO "notification_channel" ("customer_id", "type_id", "address", "verified_at")
SELECT "id", 1, "email", now()
FROM "customer"
WHERE "state_id" = 2 AND "deleted_at" IS NULL
ON CONFLICT ("customer_id", "type_id") DO NOTHING;