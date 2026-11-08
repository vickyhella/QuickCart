import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mediaTemplatePreview } from '../lib/media-template-preview'

const product = { title: 'Rose / Quartz', brand: 'Ginny Nana', category: 'press-on-nails', length: 'short', shape: 'oval' }

test('metadata previews substitute product variables and generate a safe WebP filename', () => {
  const preview = mediaTemplatePreview({}, product, 'original.png')
  assert.equal(preview.filename, 'ginny-nana-press-on-nails-rose-quartz-short-oval-01.webp')
  assert.equal(preview.title, 'Ginny Nana Rose / Quartz short oval press-on nails')
  assert.equal(preview.altText, 'Ginny Nana Rose / Quartz press-on nails in short length and oval shape')
  assert.equal(preview.caption, 'Rose / Quartz press-on nails by Ginny Nana')
})

test('custom patterns use the entered template without modifying source image metadata', () => {
  const source = { ...product, filename: 'saved.webp', altText: 'Hand-written alt' }
  const preview = mediaTemplatePreview({ imageFilenameTemplate: '{productName}', imageAltTemplate: '{brand}: {productName}' }, source)
  assert.equal(preview.filename, 'rose-quartz-01.webp')
  assert.equal(preview.altText, 'Ginny Nana: Rose / Quartz')
  assert.equal(source.filename, 'saved.webp')
  assert.equal(source.altText, 'Hand-written alt')
})

test('size-only products leave unavailable variables empty and GIF/SVG formats are preserved', () => {
  const templates = { imageTitleTemplate: '{brand} {productName} {length} {shape} {size}' }
  const preview = mediaTemplatePreview(templates, { title: 'Mystery box' }, 'animation.GIF')
  assert.equal(preview.title, 'Ginny Nana Mystery box')
  assert.ok(preview.filename.endsWith('.gif'))
  assert.ok(mediaTemplatePreview({}, product, 'drawing.svg').filename.endsWith('.svg'))
})
