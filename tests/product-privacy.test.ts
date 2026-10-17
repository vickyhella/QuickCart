import assert from 'node:assert/strict'
import { test } from 'node:test'
import { hideSupplierDetails } from '../lib/product-privacy.js'

test('removes supplier references from products and variants while preserving storefront fields', () => {
  const result = hideSupplierDetails({
    id: 1,
    title: 'Rosewater',
    chineseName: '玫瑰水',
    supplierSKU: 'SUP-1',
    suppliers: [{ id: 1, name: 'Hidden Supplier' }],
    purchaseURL: 'https://supplier.example/rosewater',
    studioRequestID: '00000000-0000-0000-0000-000000000000',
    variants: [{ id: 'v1', size: 's', supplierSKU: 'SUP-V1', suppliers: [{ id: 1, name: 'Hidden Supplier' }], purchaseURL: 'https://supplier.example/variant' }],
  })

  assert.deepEqual(result, { id: 1, title: 'Rosewater', variants: [{ id: 'v1', size: 's' }] })
})
