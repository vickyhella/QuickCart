import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
     IF EXISTS (SELECT 1 FROM orders WHERE payment_status::text = 'cancelled') THEN
       RAISE EXCEPTION 'Normalize cancelled orders to existing payment/fulfillment statuses before cleanup.';
     END IF;
     IF EXISTS (
       SELECT 1 FROM orders o WHERE o.legacy_woo_commerce_i_d IS NOT NULL AND (
         o.order_number !~ '^GN-[A-F0-9]{24}$'
         OR o.created_at IS DISTINCT FROM o.legacy_woo_commerce_date
         OR abs(o.subtotal + o.shipping_total + o.tax_total - o.discount_total - o.total) >= 0.02
         OR abs(o.subtotal - (SELECT coalesce(sum(i.quantity * i.unit_price), 0) FROM orders_items i WHERE i._parent_id = o.id)) >= 0.02
         OR EXISTS (
           SELECT 1 FROM orders_items i WHERE i._parent_id = o.id AND coalesce(i.variant_id, '') <> ''
           AND NOT EXISTS (SELECT 1 FROM products_variants v WHERE v.id::text = i.variant_id AND v._parent_id = i.product_id)
         )
       )
     ) THEN
       RAISE EXCEPTION 'Normalize imported order numbers, dates, amounts and product variants before cleanup.';
     END IF;
   END $$;
   ALTER TABLE "orders" DROP CONSTRAINT "orders_customer_id_customers_id_fk";
  
  ALTER TABLE "orders" ALTER COLUMN "payment_status" DROP DEFAULT;
  ALTER TABLE "orders" ALTER COLUMN "payment_status" SET DATA TYPE text;
  ALTER TABLE "orders" ALTER COLUMN "payment_status" SET DEFAULT 'pending'::text;
  DROP TYPE "public"."enum_orders_payment_status";
  CREATE TYPE "public"."enum_orders_payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded');
  ALTER TABLE "orders" ALTER COLUMN "payment_status" SET DEFAULT 'pending'::"public"."enum_orders_payment_status";
  ALTER TABLE "orders" ALTER COLUMN "payment_status" SET DATA TYPE "public"."enum_orders_payment_status" USING "payment_status"::"public"."enum_orders_payment_status";
  DROP INDEX "customers_legacy_wordpress_i_d_idx";
  DROP INDEX "orders_legacy_woo_commerce_i_d_idx";
  DROP INDEX "orders_legacy_woo_commerce_date_idx";
  DROP INDEX "orders_customer_idx";
  ALTER TABLE "customers" DROP COLUMN "legacy_wordpress_i_d";
  ALTER TABLE "customers" DROP COLUMN "billing_address_company";
  ALTER TABLE "customers" DROP COLUMN "billing_address_address1";
  ALTER TABLE "customers" DROP COLUMN "billing_address_address2";
  ALTER TABLE "customers" DROP COLUMN "billing_address_city";
  ALTER TABLE "customers" DROP COLUMN "billing_address_state";
  ALTER TABLE "customers" DROP COLUMN "billing_address_postal_code";
  ALTER TABLE "customers" DROP COLUMN "billing_address_country";
  ALTER TABLE "customers" DROP COLUMN "billing_address_phone";
  ALTER TABLE "customers" DROP COLUMN "shipping_address_company";
  ALTER TABLE "customers" DROP COLUMN "shipping_address_address1";
  ALTER TABLE "customers" DROP COLUMN "shipping_address_address2";
  ALTER TABLE "customers" DROP COLUMN "shipping_address_city";
  ALTER TABLE "customers" DROP COLUMN "shipping_address_state";
  ALTER TABLE "customers" DROP COLUMN "shipping_address_postal_code";
  ALTER TABLE "customers" DROP COLUMN "shipping_address_country";
  ALTER TABLE "customers" DROP COLUMN "shipping_address_phone";
  ALTER TABLE "orders_items" DROP COLUMN "legacy_product_i_d";
  ALTER TABLE "orders_items" DROP COLUMN "line_subtotal";
  ALTER TABLE "orders_items" DROP COLUMN "line_total";
  ALTER TABLE "orders" DROP COLUMN "legacy_woo_commerce_i_d";
  ALTER TABLE "orders" DROP COLUMN "legacy_woo_commerce_date";
  ALTER TABLE "orders" DROP COLUMN "customer_id";
  ALTER TABLE "orders" DROP COLUMN "legacy_payment_method";
  ALTER TABLE "orders" DROP COLUMN "legacy_payment_method_title";
  ALTER TABLE "orders" DROP COLUMN "billing_address_full_name";
  ALTER TABLE "orders" DROP COLUMN "billing_address_company";
  ALTER TABLE "orders" DROP COLUMN "billing_address_phone";
  ALTER TABLE "orders" DROP COLUMN "billing_address_address1";
  ALTER TABLE "orders" DROP COLUMN "billing_address_address2";
  ALTER TABLE "orders" DROP COLUMN "billing_address_city";
  ALTER TABLE "orders" DROP COLUMN "billing_address_state";
  ALTER TABLE "orders" DROP COLUMN "billing_address_postal_code";
  ALTER TABLE "orders" DROP COLUMN "billing_address_country";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Recreates the schema only; removed optional source metadata remains in the WPress backup.
  await db.execute(sql`
   ALTER TYPE "public"."enum_orders_payment_status" ADD VALUE 'cancelled';
  ALTER TABLE "customers" ADD COLUMN "legacy_wordpress_i_d" varchar;
  ALTER TABLE "customers" ADD COLUMN "billing_address_company" varchar;
  ALTER TABLE "customers" ADD COLUMN "billing_address_address1" varchar;
  ALTER TABLE "customers" ADD COLUMN "billing_address_address2" varchar;
  ALTER TABLE "customers" ADD COLUMN "billing_address_city" varchar;
  ALTER TABLE "customers" ADD COLUMN "billing_address_state" varchar;
  ALTER TABLE "customers" ADD COLUMN "billing_address_postal_code" varchar;
  ALTER TABLE "customers" ADD COLUMN "billing_address_country" varchar;
  ALTER TABLE "customers" ADD COLUMN "billing_address_phone" varchar;
  ALTER TABLE "customers" ADD COLUMN "shipping_address_company" varchar;
  ALTER TABLE "customers" ADD COLUMN "shipping_address_address1" varchar;
  ALTER TABLE "customers" ADD COLUMN "shipping_address_address2" varchar;
  ALTER TABLE "customers" ADD COLUMN "shipping_address_city" varchar;
  ALTER TABLE "customers" ADD COLUMN "shipping_address_state" varchar;
  ALTER TABLE "customers" ADD COLUMN "shipping_address_postal_code" varchar;
  ALTER TABLE "customers" ADD COLUMN "shipping_address_country" varchar;
  ALTER TABLE "customers" ADD COLUMN "shipping_address_phone" varchar;
  ALTER TABLE "orders_items" ADD COLUMN "legacy_product_i_d" varchar;
  ALTER TABLE "orders_items" ADD COLUMN "line_subtotal" numeric;
  ALTER TABLE "orders_items" ADD COLUMN "line_total" numeric;
  ALTER TABLE "orders" ADD COLUMN "legacy_woo_commerce_i_d" varchar;
  ALTER TABLE "orders" ADD COLUMN "legacy_woo_commerce_date" timestamp(3) with time zone;
  ALTER TABLE "orders" ADD COLUMN "customer_id" integer;
  ALTER TABLE "orders" ADD COLUMN "legacy_payment_method" varchar;
  ALTER TABLE "orders" ADD COLUMN "legacy_payment_method_title" varchar;
  ALTER TABLE "orders" ADD COLUMN "billing_address_full_name" varchar;
  ALTER TABLE "orders" ADD COLUMN "billing_address_company" varchar;
  ALTER TABLE "orders" ADD COLUMN "billing_address_phone" varchar;
  ALTER TABLE "orders" ADD COLUMN "billing_address_address1" varchar;
  ALTER TABLE "orders" ADD COLUMN "billing_address_address2" varchar;
  ALTER TABLE "orders" ADD COLUMN "billing_address_city" varchar;
  ALTER TABLE "orders" ADD COLUMN "billing_address_state" varchar;
  ALTER TABLE "orders" ADD COLUMN "billing_address_postal_code" varchar;
  ALTER TABLE "orders" ADD COLUMN "billing_address_country" varchar;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "customers_legacy_wordpress_i_d_idx" ON "customers" USING btree ("legacy_wordpress_i_d");
  CREATE UNIQUE INDEX "orders_legacy_woo_commerce_i_d_idx" ON "orders" USING btree ("legacy_woo_commerce_i_d");
  CREATE INDEX "orders_legacy_woo_commerce_date_idx" ON "orders" USING btree ("legacy_woo_commerce_date");
  CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");`)
}
