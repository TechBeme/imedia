ALTER TABLE "automations" DROP CONSTRAINT "automations_social_account_id_social_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "automations" ALTER COLUMN "social_account_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "automations" ADD CONSTRAINT "automations_social_account_id_social_accounts_id_fk" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE set null ON UPDATE no action;