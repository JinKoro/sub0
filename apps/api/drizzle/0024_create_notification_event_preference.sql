CREATE TABLE "notification_event_preference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"event_id" integer NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"channel_type_ids" integer[] DEFAULT '{}'::integer[] NOT NULL,
	"days_before" integer[] DEFAULT '{}'::integer[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_event_preference" ADD CONSTRAINT "notification_event_preference_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_event_preference_customer_event_key" ON "notification_event_preference" USING btree ("customer_id","event_id");
