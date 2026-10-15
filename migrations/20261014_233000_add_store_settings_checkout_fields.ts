import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum_store_settings_available_countries" AS ENUM (
        'US', 'AU', 'AT', 'BH', 'BE', 'CA', 'CL', 'DK', 'FR', 'DE', 'GR', 'HK', 'HU',
        'IE', 'IL', 'IT', 'JP', 'KW', 'MX', 'NL', 'NZ', 'NO', 'PL', 'RO', 'SA', 'SG',
        'SK', 'ZA', 'ES', 'SE', 'CH', 'TH', 'GB'
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'US';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'AU';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'AT';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'BH';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'BE';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'CA';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'CL';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'DK';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'FR';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'DE';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'GR';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'HK';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'HU';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'IE';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'IL';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'IT';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'JP';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'KW';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'MX';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'NL';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'NZ';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'NO';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'PL';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'RO';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'SA';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'SG';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'SK';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'ZA';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'ES';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'SE';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'CH';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'TH';
    ALTER TYPE "enum_store_settings_available_countries" ADD VALUE IF NOT EXISTS 'GB';

    CREATE TABLE IF NOT EXISTS "store_settings_shipping_tiers" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "minimum_subtotal" numeric,
      "maximum_subtotal" numeric,
      "minimum_items" numeric,
      "maximum_items" numeric,
      "fee" numeric NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "store_settings_shipping_tiers_order_idx" ON "store_settings_shipping_tiers" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "store_settings_shipping_tiers_parent_id_idx" ON "store_settings_shipping_tiers" USING btree ("_parent_id");

    CREATE TABLE IF NOT EXISTS "store_settings_available_countries" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_store_settings_available_countries",
      "id" serial PRIMARY KEY NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "store_settings_available_countries_order_idx" ON "store_settings_available_countries" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "store_settings_available_countries_parent_idx" ON "store_settings_available_countries" USING btree ("parent_id");

    DO $$ BEGIN
      ALTER TABLE "store_settings_shipping_tiers"
        ADD CONSTRAINT "store_settings_shipping_tiers_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."store_settings"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      ALTER TABLE "store_settings_available_countries"
        ADD CONSTRAINT "store_settings_available_countries_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."store_settings"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `)
}

export async function down({}: MigrateDownArgs): Promise<void> {
  // Keep shipping settings and country selections if this migration is rolled back.
}
