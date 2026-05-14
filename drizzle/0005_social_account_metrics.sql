CREATE TABLE "social_account_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"social_account_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"caption" text,
	"media_type" text NOT NULL,
	"media_url" text NOT NULL,
	"thumbnail_url" text,
	"permalink" text NOT NULL,
	"timestamp" timestamp,
	"like_count" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"view_count" integer,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "social_accounts" ADD COLUMN "followers_count" integer;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD COLUMN "follows_count" integer;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD COLUMN "media_count" integer;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD COLUMN "biography" text;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD COLUMN "metrics_fetched_at" timestamp;--> statement-breakpoint
ALTER TABLE "social_account_media" ADD CONSTRAINT "social_account_media_social_account_id_social_accounts_id_fk" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "social_account_media_account_idx" ON "social_account_media" USING btree ("social_account_id");--> statement-breakpoint
CREATE INDEX "social_account_media_external_idx" ON "social_account_media" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "social_account_media_fetched_idx" ON "social_account_media" USING btree ("fetched_at");