import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum_store_settings_shipping_cost_type" AS ENUM ('free', 'flat', 'price', 'weight', 'items', 'advanced');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "enum_store_settings_shipping_advanced_dimension1" AS ENUM ('price', 'weight', 'items');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "enum_store_settings_shipping_advanced_dimension2" AS ENUM ('price', 'weight', 'items');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    ALTER TABLE "store_settings"
      ADD COLUMN IF NOT EXISTS "minimum_order_value" numeric,
      ADD COLUMN IF NOT EXISTS "shipping_cost_type" "enum_store_settings_shipping_cost_type",
      ADD COLUMN IF NOT EXISTS "shipping_advanced_dimension1" "enum_store_settings_shipping_advanced_dimension1",
      ADD COLUMN IF NOT EXISTS "shipping_advanced_dimension2" "enum_store_settings_shipping_advanced_dimension2";

    ALTER TABLE "store_settings_shipping_tiers"
      ADD COLUMN IF NOT EXISTS "minimum_weight_kg" numeric,
      ADD COLUMN IF NOT EXISTS "maximum_weight_kg" numeric;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings_shipping_tiers' AND column_name = 'minimum_weight_grams') THEN
        EXECUTE 'UPDATE "store_settings_shipping_tiers" SET "minimum_weight_kg" = "minimum_weight_grams" / 1000 WHERE "minimum_weight_kg" IS NULL AND "minimum_weight_grams" IS NOT NULL';
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings_shipping_tiers' AND column_name = 'maximum_weight_grams') THEN
        EXECUTE 'UPDATE "store_settings_shipping_tiers" SET "maximum_weight_kg" = "maximum_weight_grams" / 1000 WHERE "maximum_weight_kg" IS NULL AND "maximum_weight_grams" IS NOT NULL';
      END IF;
    END $$;

    UPDATE "store_settings" AS settings
      SET "shipping_cost_type" = 'advanced',
          "shipping_advanced_dimension1" = 'price',
          "shipping_advanced_dimension2" = 'items'
      WHERE settings."shipping_cost_type" IS NULL
        AND EXISTS (
        SELECT 1 FROM "store_settings_shipping_tiers" AS tiers
        WHERE tiers."_parent_id" = settings."id"
      );

    UPDATE "store_settings" SET "shipping_cost_type" = 'flat' WHERE "shipping_cost_type" IS NULL;
    ALTER TABLE "store_settings"
      ALTER COLUMN "shipping_cost_type" SET DEFAULT 'flat',
      ALTER COLUMN "shipping_cost_type" SET NOT NULL;

    ALTER TABLE "store_settings"
      ALTER COLUMN "free_shipping_threshold" DROP NOT NULL,
      ALTER COLUMN "free_shipping_threshold" DROP DEFAULT;
  `)
}

export async function down({}: MigrateDownArgs): Promise<void> {
  // Keep configured shipping policies when rolling back this migration.
}
