import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "marketing_settings" ADD COLUMN IF NOT EXISTS "site_brand_name" varchar DEFAULT 'Ginny Nana';
    ALTER TABLE "marketing_settings" ADD COLUMN IF NOT EXISTS "site_customer_email" varchar DEFAULT 'ginnynana@hotmail.com';
    ALTER TABLE "marketing_settings" ADD COLUMN IF NOT EXISTS "site_social_links" jsonb DEFAULT '[]'::jsonb;
    ALTER TABLE "marketing_settings" ADD COLUMN IF NOT EXISTS "site_default_seo_title" varchar DEFAULT 'Ginny Nana | Handmade Press-On Nails';
    ALTER TABLE "marketing_settings" ADD COLUMN IF NOT EXISTS "site_default_seo_description" varchar DEFAULT 'Natural-looking, reusable press-on nails designed for everyday elegance.';
    ALTER TABLE "marketing_settings" ADD COLUMN IF NOT EXISTS "homepage_hero_eyebrow" varchar;
    ALTER TABLE "marketing_settings" ADD COLUMN IF NOT EXISTS "homepage_hero_title" varchar;
    ALTER TABLE "marketing_settings" ADD COLUMN IF NOT EXISTS "homepage_hero_description" varchar;
    ALTER TABLE "marketing_settings" ADD COLUMN IF NOT EXISTS "homepage_hero_button_label" varchar;
    ALTER TABLE "marketing_settings" ADD COLUMN IF NOT EXISTS "homepage_hero_button_href" varchar;
    ALTER TABLE "marketing_settings" ADD COLUMN IF NOT EXISTS "homepage_hero_badge" varchar;
    ALTER TABLE "marketing_settings" ADD COLUMN IF NOT EXISTS "homepage_mystery_box_enabled" boolean DEFAULT false;
    ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "handling_minimum_business_days" integer DEFAULT 5;
    ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "handling_maximum_business_days" integer DEFAULT 10;
    ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "transit_minimum_business_days" integer DEFAULT 7;
    ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "transit_maximum_business_days" integer DEFAULT 15;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Keep added settings during rollback so switching versions cannot erase Admin values.
    SELECT 1;
  `)
}
