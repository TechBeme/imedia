CREATE TABLE "link_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#3b82f6' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "link_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#8b5cf6' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "short_link_tags" (
	"link_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"default_expired_redirect_url" text,
	"not_found_redirect_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "link_clicks" ADD COLUMN "device_model" text;--> statement-breakpoint
ALTER TABLE "link_clicks" ADD COLUMN "browser_version" text;--> statement-breakpoint
ALTER TABLE "link_clicks" ADD COLUMN "os_version" text;--> statement-breakpoint
ALTER TABLE "link_clicks" ADD COLUMN "language" text;--> statement-breakpoint
ALTER TABLE "link_clicks" ADD COLUMN "timezone" text;--> statement-breakpoint
ALTER TABLE "link_clicks" ADD COLUMN "fingerprint" text;--> statement-breakpoint
ALTER TABLE "short_links" ADD COLUMN "og_title" text;--> statement-breakpoint
ALTER TABLE "short_links" ADD COLUMN "og_description" text;--> statement-breakpoint
ALTER TABLE "short_links" ADD COLUMN "og_image_url" text;--> statement-breakpoint
ALTER TABLE "short_links" ADD COLUMN "folder_id" uuid;--> statement-breakpoint
ALTER TABLE "short_links" ADD COLUMN "expired_redirect_url" text;--> statement-breakpoint
ALTER TABLE "link_folders" ADD CONSTRAINT "link_folders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_tags" ADD CONSTRAINT "link_tags_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "short_link_tags" ADD CONSTRAINT "short_link_tags_link_id_short_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."short_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "short_link_tags" ADD CONSTRAINT "short_link_tags_tag_id_link_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."link_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "link_folders_user_idx" ON "link_folders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "link_tags_user_idx" ON "link_tags" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "link_tags_name_idx" ON "link_tags" USING btree ("name");--> statement-breakpoint
CREATE INDEX "short_link_tags_link_idx" ON "short_link_tags" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX "short_link_tags_tag_idx" ON "short_link_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "user_settings_user_idx" ON "user_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "link_clicks_fingerprint_idx" ON "link_clicks" USING btree ("fingerprint");--> statement-breakpoint
CREATE INDEX "short_links_folder_idx" ON "short_links" USING btree ("folder_id");