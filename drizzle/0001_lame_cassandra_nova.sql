CREATE TABLE "custom_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"domain" text NOT NULL,
	"verification_token" text NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "custom_domains_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "link_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"ip" text,
	"country" text,
	"city" text,
	"region" text,
	"user_agent" text,
	"device" text,
	"browser" text,
	"os" text,
	"referrer" text,
	"clicked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "short_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"original_url" text NOT NULL,
	"slug" text NOT NULL,
	"custom_slug" boolean DEFAULT false NOT NULL,
	"domain" text DEFAULT '' NOT NULL,
	"password" text,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "short_links_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "custom_domains" ADD CONSTRAINT "custom_domains_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_clicks" ADD CONSTRAINT "link_clicks_link_id_short_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."short_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "short_links" ADD CONSTRAINT "short_links_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "custom_domains_user_idx" ON "custom_domains" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "custom_domains_domain_idx" ON "custom_domains" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "link_clicks_link_idx" ON "link_clicks" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX "link_clicks_clicked_at_idx" ON "link_clicks" USING btree ("clicked_at");--> statement-breakpoint
CREATE INDEX "link_clicks_country_idx" ON "link_clicks" USING btree ("country");--> statement-breakpoint
CREATE INDEX "short_links_slug_idx" ON "short_links" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "short_links_user_idx" ON "short_links" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "short_links_domain_idx" ON "short_links" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "short_links_active_idx" ON "short_links" USING btree ("is_active");