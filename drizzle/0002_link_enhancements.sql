CREATE TABLE "link_device_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"os" text NOT NULL,
	"url" text NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "short_links" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "short_links" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "short_links" ADD COLUMN "tags" text[];--> statement-breakpoint
ALTER TABLE "short_links" ADD COLUMN "starts_at" timestamp;--> statement-breakpoint
ALTER TABLE "short_links" ADD COLUMN "max_clicks" integer;--> statement-breakpoint
ALTER TABLE "link_device_rules" ADD CONSTRAINT "link_device_rules_link_id_short_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."short_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "link_device_rules_link_idx" ON "link_device_rules" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX "link_device_rules_os_idx" ON "link_device_rules" USING btree ("os");