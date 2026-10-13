import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_PRODUCT_SEO_DESCRIPTION, DEFAULT_PRODUCT_SEO_TITLE, resolveProductSeoTemplates } from '../lib/product-seo-templates'

test('upgrades the old built-in SEO templates to include variant dimensions and enabled sizes', () => {
  assert.deepEqual(resolveProductSeoTemplates({
    productTitleTemplate: '{brand} {productType} {productName} {length} {shape}',
    productDescriptionTemplate: '{productName} press-on nails by {brand}.',
  }), { title: DEFAULT_PRODUCT_SEO_TITLE, description: DEFAULT_PRODUCT_SEO_DESCRIPTION })
})

test('keeps custom SEO templates unchanged', () => {
  assert.deepEqual(resolveProductSeoTemplates({
    productTitleTemplate: '{productName}: {length} {shape} handmade nails',
    productDescriptionTemplate: 'Shop {productName} from {brand}.',
  }), { title: '{productName}: {length} {shape} handmade nails', description: 'Shop {productName} from {brand}.' })
})
