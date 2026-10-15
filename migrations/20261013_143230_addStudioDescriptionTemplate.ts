import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marketing_settings" ALTER COLUMN "product_title_template" SET DEFAULT '{brand} {productName} — {availableLengthShapeCombinations}';
  ALTER TABLE "marketing_settings" ALTER COLUMN "product_description_template" SET DEFAULT '{productName} press-on nails by {brand}, available in {availableLengthShapeCombinations} and sizes {availableSizes}.';
  ALTER TABLE "marketing_settings" ADD COLUMN IF NOT EXISTS "studio_description_template" varchar DEFAULT '**{productName}**
  
  Discover {productName} by {brand}, a press-on nail style for your everyday look.
  
  Available Length & Shape combinations: {availableLengthShapeCombinations}
  
  Available sizes: {availableSizes}
  
  Choose your preferred style and size before adding the product to your cart.';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marketing_settings" ALTER COLUMN "product_title_template" SET DEFAULT '{brand} {productType} {productName} {length} {shape}';
  ALTER TABLE "marketing_settings" ALTER COLUMN "product_description_template" SET DEFAULT '{productName} press-on nails by {brand}.';
  ALTER TABLE "marketing_settings" DROP COLUMN "studio_description_template";`)
}
