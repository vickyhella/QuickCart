import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "marketing" (
      "id" serial PRIMARY KEY NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "marketing_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_marketing_fk"
      FOREIGN KEY ("marketing_id") REFERENCES "public"."marketing"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "marketing_updated_at_idx" ON "marketing" USING btree ("updated_at");
    CREATE INDEX "marketing_created_at_idx" ON "marketing" USING btree ("created_at");
    CREATE INDEX "payload_locked_documents_rels_marketing_id_idx" ON "payload_locked_documents_rels" USING btree ("marketing_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_marketing_fk";
    DROP INDEX "payload_locked_documents_rels_marketing_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "marketing_id";
    DROP TABLE "marketing";
  `)
}
