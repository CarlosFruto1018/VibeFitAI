ALTER TABLE "user_profiles" ADD COLUMN "birth_date" date;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "height_cm" real;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "weekly_goal" integer DEFAULT 5;