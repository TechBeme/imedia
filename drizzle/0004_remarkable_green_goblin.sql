CREATE TABLE "automation_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"automation_id" uuid NOT NULL,
	"type" text NOT NULL,
	"config" jsonb NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"automation_id" uuid NOT NULL,
	"trigger_event" jsonb NOT NULL,
	"action_results" jsonb NOT NULL,
	"status" text NOT NULL,
	"executed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"social_account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"platform" text NOT NULL,
	"trigger_type" text DEFAULT 'comment_keyword' NOT NULL,
	"trigger_config" jsonb NOT NULL,
	"scope" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment_watch_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"social_account_id" uuid NOT NULL,
	"post_id" text NOT NULL,
	"last_checked_at" timestamp DEFAULT now() NOT NULL,
	"last_comment_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "automation_actions" ADD CONSTRAINT "automation_actions_automation_id_automations_id_fk" FOREIGN KEY ("automation_id") REFERENCES "public"."automations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_logs" ADD CONSTRAINT "automation_logs_automation_id_automations_id_fk" FOREIGN KEY ("automation_id") REFERENCES "public"."automations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automations" ADD CONSTRAINT "automations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automations" ADD CONSTRAINT "automations_social_account_id_social_accounts_id_fk" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_watch_state" ADD CONSTRAINT "comment_watch_state_social_account_id_social_accounts_id_fk" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "automation_actions_automation_idx" ON "automation_actions" USING btree ("automation_id");--> statement-breakpoint
CREATE INDEX "automation_logs_automation_idx" ON "automation_logs" USING btree ("automation_id");--> statement-breakpoint
CREATE INDEX "automation_logs_status_idx" ON "automation_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "automation_logs_executed_at_idx" ON "automation_logs" USING btree ("executed_at");--> statement-breakpoint
CREATE INDEX "automations_user_idx" ON "automations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "automations_social_account_idx" ON "automations" USING btree ("social_account_id");--> statement-breakpoint
CREATE INDEX "automations_platform_idx" ON "automations" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "automations_is_active_idx" ON "automations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "comment_watch_state_social_account_idx" ON "comment_watch_state" USING btree ("social_account_id");--> statement-breakpoint
CREATE INDEX "comment_watch_state_post_idx" ON "comment_watch_state" USING btree ("post_id");