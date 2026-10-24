import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "marketing_settings" ADD COLUMN IF NOT EXISTS "homepage_hero_image_id" integer;
    ALTER TABLE "marketing_settings" ADD COLUMN IF NOT EXISTS "homepage_hero_image_alt" varchar;
    ALTER TABLE "marketing_settings" ADD COLUMN IF NOT EXISTS "homepage_hero_product_id" integer;
    ALTER TABLE "marketing_settings" ADD COLUMN IF NOT EXISTS "homepage_mystery_box_image_id" integer;
    ALTER TABLE "marketing_settings" ADD COLUMN IF NOT EXISTS "homepage_mystery_box_image_alt" varchar;
    ALTER TABLE "marketing_settings" ADD COLUMN IF NOT EXISTS "homepage_mystery_box_product_id" integer;
    ALTER TABLE "marketing_settings" ADD COLUMN IF NOT EXISTS "homepage_mystery_box_eyebrow" varchar DEFAULT 'A little surprise, just for you';
    ALTER TABLE "marketing_settings" ADD COLUMN IF NOT EXISTS "homepage_mystery_box_title" varchar DEFAULT 'Meet your mystery box.';
    ALTER TABLE "marketing_settings" ADD COLUMN IF NOT EXISTS "homepage_mystery_box_description" varchar DEFAULT 'A curated set, a little unexpected, and always made to feel like you.';

    DO $$ BEGIN
      ALTER TABLE "marketing_settings" ADD CONSTRAINT "marketing_settings_homepage_hero_image_id_media_id_fk"
        FOREIGN KEY ("homepage_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      ALTER TABLE "marketing_settings" ADD CONSTRAINT "marketing_settings_homepage_hero_product_id_products_id_fk"
        FOREIGN KEY ("homepage_hero_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      ALTER TABLE "marketing_settings" ADD CONSTRAINT "marketing_settings_homepage_mystery_box_image_id_media_id_fk"
        FOREIGN KEY ("homepage_mystery_box_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      ALTER TABLE "marketing_settings" ADD CONSTRAINT "marketing_settings_homepage_mystery_box_product_id_products_id_fk"
        FOREIGN KEY ("homepage_mystery_box_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "marketing_settings_homepage_hero_image_id_idx" ON "marketing_settings" USING btree ("homepage_hero_image_id");
    CREATE INDEX IF NOT EXISTS "marketing_settings_homepage_hero_product_id_idx" ON "marketing_settings" USING btree ("homepage_hero_product_id");
    CREATE INDEX IF NOT EXISTS "marketing_settings_homepage_mystery_box_image_id_idx" ON "marketing_settings" USING btree ("homepage_mystery_box_image_id");
    CREATE INDEX IF NOT EXISTS "marketing_settings_homepage_mystery_box_product_id_idx" ON "marketing_settings" USING btree ("homepage_mystery_box_product_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "marketing_settings" DROP CONSTRAINT IF EXISTS "marketing_settings_homepage_hero_image_id_media_id_fk";
    ALTER TABLE "marketing_settings" DROP CONSTRAINT IF EXISTS "marketing_settings_homepage_hero_product_id_products_id_fk";
    ALTER TABLE "marketing_settings" DROP CONSTRAINT IF EXISTS "marketing_settings_homepage_mystery_box_image_id_media_id_fk";
    ALTER TABLE "marketing_settings" DROP CONSTRAINT IF EXISTS "marketing_settings_homepage_mystery_box_product_id_products_id_fk";
    DROP INDEX IF EXISTS "marketing_settings_homepage_hero_image_id_idx";
    DROP INDEX IF EXISTS "marketing_settings_homepage_hero_product_id_idx";
    DROP INDEX IF EXISTS "marketing_settings_homepage_mystery_box_image_id_idx";
    DROP INDEX IF EXISTS "marketing_settings_homepage_mystery_box_product_id_idx";
    ALTER TABLE "marketing_settings" DROP COLUMN IF EXISTS "homepage_hero_image_id";
    ALTER TABLE "marketing_settings" DROP COLUMN IF EXISTS "homepage_hero_image_alt";
    ALTER TABLE "marketing_settings" DROP COLUMN IF EXISTS "homepage_hero_product_id";
    ALTER TABLE "marketing_settings" DROP COLUMN IF EXISTS "homepage_mystery_box_image_id";
    ALTER TABLE "marketing_settings" DROP COLUMN IF EXISTS "homepage_mystery_box_image_alt";
    ALTER TABLE "marketing_settings" DROP COLUMN IF EXISTS "homepage_mystery_box_product_id";
    ALTER TABLE "marketing_settings" DROP COLUMN IF EXISTS "homepage_mystery_box_eyebrow";
    ALTER TABLE "marketing_settings" DROP COLUMN IF EXISTS "homepage_mystery_box_title";
    ALTER TABLE "marketing_settings" DROP COLUMN IF EXISTS "homepage_mystery_box_description";
  `)
}
