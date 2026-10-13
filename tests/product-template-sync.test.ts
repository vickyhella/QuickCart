import assert from 'node:assert/strict'
import test from 'node:test'
import { productTemplateRefreshFields } from '../lib/product-template-sync'
import { DEFAULT_STUDIO_DESCRIPTION_TEMPLATE } from '../lib/studio-description-template'

const previous = {
  studioDescriptionTemplate: DEFAULT_STUDIO_DESCRIPTION_TEMPLATE,
  productTitleTemplate: '{brand} {productType} {productName} {availableLengthShapeCombinations}',
  productDescriptionTemplate: '{productName} press-on nails by {brand}.',
}
const next = {
  studioDescriptionTemplate: '**{productName}**\n\nNew copy for {shape}.',
  productTitleTemplate: '{productName} | {shape}',
  productDescriptionTemplate: '{productName}: {availableSizes}',
}
const product = {
  title: 'Summer Bloom', brand: 'Ginny Nana', category: 'press-on-nails',
  variants: [{ length: 'short', shape: 'square', size: 'm', enabled: true }],
}

test('refreshes automatic fields and legacy values that exactly match the old templates', () => {
  assert.deepEqual(productTemplateRefreshFields({
    ...product,
    descriptionMode: 'auto',
    seoTitleMode: 'custom',
    seoTitle: 'My hand-written title',
    seoDescription: 'Summer Bloom press-on nails by Ginny Nana.',
  }, previous, next), {
    descriptionMode: 'auto',
    seoDescriptionMode: 'auto',
  })
})

test('preserves custom and unmarked legacy content that differs from the old template', () => {
  assert.deepEqual(productTemplateRefreshFields({
    ...product,
    descriptionMode: 'custom',
    description: 'Hand-written description',
    seoTitle: 'Hand-written title',
    seoDescriptionMode: 'custom',
    seoDescription: 'Hand-written SEO description',
  }, previous, next), {})
})
