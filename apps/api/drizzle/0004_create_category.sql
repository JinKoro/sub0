CREATE TABLE "category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" varchar(12) NOT NULL,
	"name_ru" varchar(50) NOT NULL,
	"name_en" varchar(50) NOT NULL,
	"color" varchar(7)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "category_sku_key" ON "category" USING btree ("sku");--> statement-breakpoint
CREATE UNIQUE INDEX "category_name_ru_key" ON "category" USING btree ("name_ru");--> statement-breakpoint
CREATE UNIQUE INDEX "category_name_en_key" ON "category" USING btree ("name_en");