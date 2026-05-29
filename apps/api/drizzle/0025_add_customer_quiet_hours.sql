ALTER TABLE "customer" ADD COLUMN "quiet_hours_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "customer" ADD COLUMN "quiet_hours_from" time;--> statement-breakpoint
ALTER TABLE "customer" ADD COLUMN "quiet_hours_to" time;
