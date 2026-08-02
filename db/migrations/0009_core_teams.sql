CREATE TABLE "core_teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(160) NOT NULL,
	"type" varchar(60) DEFAULT 'Pengurus Inti' NOT NULL,
	"description" text,
	"image_url" text,
	"work_programs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"period_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	CONSTRAINT "core_teams_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "core_team_id" uuid;--> statement-breakpoint
ALTER TABLE "core_teams" ADD CONSTRAINT "core_teams_period_id_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."periods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_teams" ADD CONSTRAINT "core_teams_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;