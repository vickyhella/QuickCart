import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_orders_payment_status" ADD VALUE IF NOT EXISTS 'cancelled';

    ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "billing_address_company" varchar;
    ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "billing_address_address1" varchar;
    ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "billing_address_address2" varchar;
    ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "billing_address_city" varchar;
    ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "billing_address_state" varchar;
    ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "billing_address_postal_code" varchar;
    ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "billing_address_country" varchar;
    ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "billing_address_phone" varchar;
    ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "shipping_address_company" varchar;
    ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "shipping_address_address1" varchar;
    ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "shipping_address_address2" varchar;
    ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "shipping_address_city" varchar;
    ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "shipping_address_state" varchar;
    ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "shipping_address_postal_code" varchar;
    ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "shipping_address_country" varchar;
    ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "shipping_address_phone" varchar;

    ALTER TABLE "orders_items" ALTER COLUMN "product_id" DROP NOT NULL;
    ALTER TABLE "orders_items" ADD COLUMN IF NOT EXISTS "legacy_product_i_d" varchar;
    ALTER TABLE "orders_items" ADD COLUMN IF NOT EXISTS "line_subtotal" numeric;
    ALTER TABLE "orders_items" ADD COLUMN IF NOT EXISTS "line_total" numeric;

    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "legacy_woo_commerce_i_d" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "legacy_woo_commerce_date" timestamp(3) with time zone;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_id" integer;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "legacy_payment_method" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "legacy_payment_method_title" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "billing_address_full_name" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "billing_address_company" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "billing_address_phone" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "billing_address_address1" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "billing_address_address2" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "billing_address_city" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "billing_address_state" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "billing_address_postal_code" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "billing_address_country" varchar;

    DO $$ BEGIN
      ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk"
        FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "orders_legacy_woo_commerce_i_d_idx" ON "orders" USING btree ("legacy_woo_commerce_i_d");
    CREATE INDEX IF NOT EXISTS "orders_legacy_woo_commerce_date_idx" ON "orders" USING btree ("legacy_woo_commerce_date");
    CREATE INDEX IF NOT EXISTS "orders_customer_idx" ON "orders" USING btree ("customer_id");
  `)
}

export async function down({}: MigrateDownArgs): Promise<void> {
  // Keep added columns and imported history when application code is rolled back.
}
