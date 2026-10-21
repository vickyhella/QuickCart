import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import pg from 'pg'
import { PgDialect } from '@payloadcms/db-postgres/drizzle/pg-core'
import type { SQL } from '@payloadcms/db-postgres/drizzle'
import type { MigrateUpArgs } from '@payloadcms/db-postgres'
import * as tracking from '../migrations/20261020_150000_add_order_tracking_url'
import * as variants from '../migrations/20261020_170400_allow_size_only_variants'

test('latest schema snapshot includes tracking URL and optional Length / Shape', () => {
  const snapshot = JSON.parse(readFileSync(new URL('../migrations/20261020_170400_allow_size_only_variants.json', import.meta.url), 'utf8'))
  assert.equal(snapshot.tables['public.orders'].columns.tracking_url.notNull, false)
  assert.equal(snapshot.tables['public.products_variants'].columns.length.notNull, false)
  assert.equal(snapshot.tables['public.products_variants'].columns.shape.notNull, false)
})

test('Postgres migrations preserve old data, allow size-only variants, and safely refuse invalid rollback', {
  skip: !process.env.MIGRATION_TEST_DATABASE_URL,
}, async () => {
  const client = new pg.Client({ connectionString: process.env.MIGRATION_TEST_DATABASE_URL })
  await client.connect()
  try {
    await client.query('BEGIN')
    const schema = `migration_test_${randomUUID().replaceAll('-', '')}`
    await client.query(`CREATE SCHEMA "${schema}"`)
    await client.query(`SET LOCAL search_path TO "${schema}"`)
    await client.query(`
      CREATE TABLE orders (id integer PRIMARY KEY, tracking_number varchar);
      CREATE TABLE products_variants (id integer PRIMARY KEY, length varchar NOT NULL, shape varchar NOT NULL, size varchar, stock integer);
      INSERT INTO orders VALUES (1, 'TEST-TRACKING');
      INSERT INTO products_variants VALUES (1, 'short', 'round', 's', 7);
    `)
    const dialect = new PgDialect()
    const args = { db: { execute: (query: SQL) => {
      const compiled = dialect.sqlToQuery(query)
      return client.query(compiled.sql, compiled.params)
    } } } as unknown as MigrateUpArgs

    // Exercise real ALTER statements against the constraints that exist before upgrade.
    await tracking.up(args)
    await variants.up(args)
    await tracking.up(args)
    await variants.up(args)
    assert.deepEqual((await client.query('SELECT * FROM products_variants WHERE id=1')).rows[0], {
      id: 1, length: 'short', shape: 'round', size: 's', stock: 7,
    })
    assert.deepEqual((await client.query('SELECT * FROM orders WHERE id=1')).rows[0], {
      id: 1, tracking_number: 'TEST-TRACKING', tracking_url: null,
    })
    await client.query("INSERT INTO products_variants VALUES (2, NULL, NULL, 'm', 10)")
    await client.query("UPDATE orders SET tracking_url='https://tracking.example/TEST' WHERE id=1")
    assert.equal((await client.query('SELECT tracking_url FROM orders WHERE id=1')).rows[0].tracking_url, 'https://tracking.example/TEST')

    await client.query('SAVEPOINT rollback_check')
    await assert.rejects(variants.down(args), /contains null values/)
    await client.query('ROLLBACK TO SAVEPOINT rollback_check')
    assert.equal((await client.query('SELECT count(*) FROM products_variants')).rows[0].count, '2')
    await client.query('DELETE FROM products_variants WHERE id=2')
    await variants.down(args)
    await tracking.down(args)
    assert.equal((await client.query('SELECT tracking_number FROM orders WHERE id=1')).rows[0].tracking_number, 'TEST-TRACKING')
  } finally {
    // Includes every test row, table, and schema; public business tables are never touched.
    await client.query('ROLLBACK')
    await client.end()
  }
})
