'use client'

import { useState } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { uniqueLengthShapePairs } from '@/lib/product-dimensions'
import { DEFAULT_PRODUCT_SEO_TITLE, DEFAULT_PRODUCT_SEO_DESCRIPTION } from '@/lib/product-seo-templates'
import { DEFAULT_STUDIO_DESCRIPTION_TEMPLATE, renderStudioDescription } from '@/lib/studio-description-template'
import styles from './MarketingTemplateEditor.module.css'

type Product = Record<string, any>
type Templates = Record<string, any>
const sample = { title: 'Rose Quartz', brand: 'Ginny Nana', category: 'press-on-nails', variants: [{ length: 'short', shape: 'oval', size: 's' }, { length: 'short', shape: 'oval', size: 'm' }] }
const tokens = ['brand', 'productType', 'productName', 'length', 'shape', 'size', 'availableLengthShapeCombinations', 'availableSizes']

function valuesFor(product: Product) {
  const variants = (Array.isArray(product.variants) ? product.variants : []).filter((variant: any) => variant.enabled !== false)
  const pairs = uniqueLengthShapePairs(variants)
  const sizes = [...new Set(variants.map((variant: any) => String(variant.size || '').toUpperCase()).filter(Boolean))].join(', ')
  return {
    brand: String(product.brand || 'Ginny Nana'), productType: String(product.category || 'press-on-nails').replaceAll('-', ' '), productName: String(product.title || ''),
    length: [...new Set(pairs.map((pair) => pair.length))].join(', '), shape: [...new Set(pairs.map((pair) => pair.shape))].join(', '), size: sizes,
    availableLengthShapeCombinations: pairs.map((pair) => `${pair.length} ${pair.shape}`).join(', '), availableSizes: sizes,
  }
}
const renderSEO = (template: string, product: Product) => {
  const values: Record<string, string> = valuesFor(product)
  return template.replace(/\{([^}]+)\}/g, (_, key: string) => values[key] || '').replace(/\s+/g, ' ').trim()
}

export function MarketingSeoEditor({ templates, products, update }: { templates: Templates; products: Product[]; update: (key: string, value: string) => void }) {
  const [previewID, setPreviewID] = useState('')
  const product = products.find((item) => String(item.id) === previewID) || sample
  const title = templates.productTitleTemplate || DEFAULT_PRODUCT_SEO_TITLE
  const description = templates.productDescriptionTemplate || DEFAULT_PRODUCT_SEO_DESCRIPTION
  return <div className={styles.editor}>
    <div className={styles.toolbar}>
      <p>Update your templates and check the result before saving. Custom product content stays unchanged.</p>
      <label>Preview with<select value={previewID} onChange={(event) => setPreviewID(event.target.value)}><option value="">Example: Rose Quartz</option>{products.map((item) => <option key={item.id} value={String(item.id)}>{item.title}</option>)}</select></label>
    </div>
    <section className={styles.panel} aria-labelledby="description-template-heading">
      <header><h2 id="description-template-heading">Product description</h2><p>Used when the product’s Description is set to Auto. Markdown is supported.</p></header>
      <div className={styles.columns}>
        <label className={styles.field}>Description template<textarea rows={11} value={templates.studioDescriptionTemplate || DEFAULT_STUDIO_DESCRIPTION_TEMPLATE} onChange={(event) => update('studioDescriptionTemplate', event.target.value)} /><span>Use headings, bold text, lists, links or tables.</span></label>
        <div className={styles.preview}><h3>Live description preview</h3><div className={styles.markdown} aria-label="Description template preview"><ReactMarkdown remarkPlugins={[remarkGfm]}>{renderStudioDescription(templates.studioDescriptionTemplate || DEFAULT_STUDIO_DESCRIPTION_TEMPLATE, valuesFor(product))}</ReactMarkdown></div></div>
      </div>
    </section>
    <section className={styles.panel} aria-labelledby="seo-template-heading">
      <header><h2 id="seo-template-heading">Search engine listing</h2><p>Patterns for Auto SEO titles and descriptions. The preview uses your current edits.</p></header>
      <div className={styles.columns}>
        <div className={styles.fields}>
          <label className={styles.field}>SEO title pattern<textarea rows={2} value={title} onChange={(event) => update('productTitleTemplate', event.target.value)} /></label>
          <label className={styles.field}>SEO description pattern<textarea rows={4} value={description} onChange={(event) => update('productDescriptionTemplate', event.target.value)} /></label>
        </div>
        <div className={styles.preview}><h3>Live search preview</h3><div className={styles.searchPreview} aria-label="Search engine listing preview"><p className={styles.domain}>Ginny Nana · /product/…</p><p className={styles.searchTitle}>{renderSEO(title, product)}</p><p>{renderSEO(description, product)}</p></div><p className={styles.help}>Illustrative preview. Search engines may display different text.</p></div>
      </div>
    </section>
    <details className={styles.tokens}><summary>Available template variables</summary><p>Copy a variable into either template. Values come from each product.</p><div>{tokens.map((token) => <code key={token}>{'{' + token + '}'}</code>)}</div></details>
  </div>
}

export function MarketingSeoAudit({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('')
  const matching = products.filter((product) => String(product.title || '').toLowerCase().includes(query.trim().toLowerCase()))
  return <section className={`${styles.panel} ${styles.audit}`}>
    <header><h2>Saved product SEO</h2><p>Existing saved content. Open a product to change its Auto / Custom settings.</p></header>
    <label className={styles.filter}>Find a product<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search loaded products" /></label>
    <div className={styles.tableScroll} role="region" aria-label="Saved product SEO" tabIndex={0}><table><thead><tr><th scope="col">Product</th><th scope="col">SEO title</th><th scope="col">SEO description</th></tr></thead><tbody>{matching.map((product) => <tr key={product.id}><th scope="row"><Link href={`/admin/collections/products/${product.id}`}>{product.title}</Link></th><td>{product.seoTitle || 'Not set'}</td><td>{product.seoDescription || 'Not set'}</td></tr>)}</tbody></table></div>
    {!matching.length && <p>No matching products.</p>}
    <p className={styles.help}>{matching.length} matching of {products.length} loaded products (up to 100).</p>
  </section>
}
