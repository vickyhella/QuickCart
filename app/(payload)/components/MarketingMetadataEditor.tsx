'use client'

import { useState } from 'react'
import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
import { DEFAULT_IMAGE_TEMPLATES, mediaTemplatePreview } from '@/lib/media-template-preview'
import styles from './MarketingTemplateEditor.module.css'

type Row = Record<string, any>
const sampleProduct = { title: 'Rose Quartz', brand: 'Ginny Nana', category: 'press-on-nails', length: 'short', shape: 'oval' }
const fields = [
  ['imageFilenameTemplate', 'Filename pattern', 2],
  ['imageTitleTemplate', 'Image title pattern', 2],
  ['imageAltTemplate', 'Alt text pattern', 3],
  ['imageCaptionTemplate', 'Caption pattern', 2],
] as const

export function MarketingMetadataEditor({ templates, products, media, update }: { templates: Row; products: Row[]; media: Row[]; update: (key: string, value: string) => void }) {
  const [productID, setProductID] = useState('')
  const [imageID, setImageID] = useState('')
  const [query, setQuery] = useState('')
  const product = products.find((item) => String(item.id) === productID) || sampleProduct
  const image = media.find((item) => String(item.id) === imageID) || media[0]
  const preview = mediaTemplatePreview(templates, product, image?.filename)
  const matching = media.filter((item) => [item.filename, item.title, item.altText, item.caption].some((value) => String(value || '').toLowerCase().includes(query.trim().toLowerCase())))

  return <div className={styles.editor}>
    <div className={styles.toolbar}>
      <p>Preview new upload defaults before saving. Existing image names and metadata stay unchanged.</p>
      <label>Preview product<select value={productID} onChange={(event) => setProductID(event.target.value)}><option value="">Example: Rose Quartz</option>{products.map((item) => <option key={item.id} value={String(item.id)}>{item.title}</option>)}</select></label>
      <label>Preview image<select value={String(image?.id || '')} onChange={(event) => setImageID(event.target.value)}>{!media.length && <option value="">No images available</option>}{media.map((item) => <option key={item.id} value={String(item.id)}>{item.filename || item.title || item.id}</option>)}</select></label>
    </div>
    <section className={styles.panel} aria-labelledby="image-template-heading">
      <header><h2 id="image-template-heading">Image names & metadata</h2><p>Templates apply to new uploads when the corresponding field is blank. Choose a product above to fill the variables.</p></header>
      <div className={styles.columns}>
        <div className={styles.fields}>{fields.map(([key, label, rows]) => <label className={styles.field} key={key}>{label}<textarea rows={rows} value={templates[key] || DEFAULT_IMAGE_TEMPLATES[key]} onChange={(event) => update(key, event.target.value)} /></label>)}</div>
        <div className={styles.preview}>
          <h3>Live image metadata preview</h3>
          <div className={styles.metadataPreview} aria-label="Image metadata template preview">
            {image?.url ? <SafeImage src={image.url} alt="Selected image for template preview" width={640} height={480} sizes="(max-width: 800px) 90vw, 500px" className={styles.imagePreview} /> : <p>No preview image. Template text can still be reviewed.</p>}
            {image && <p className={styles.help}>Selected image: {image.filename}</p>}
            <dl>{([['Filename', preview.filename], ['Image title', preview.title], ['Alt text', preview.altText], ['Caption', preview.caption]]).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Empty'}</dd></div>)}</dl>
          </div>
          <p className={styles.help}>Example output for a new upload, not a rewrite of this image. Uploads choose the next available number. Static images use WebP; GIF/SVG keep their format.</p>
        </div>
      </div>
    </section>
    <details className={styles.tokens}><summary>Available template variables</summary><p>Variables use product information. {'{number}'} is for filenames; {'{size}'} is currently empty for product-level uploads.</p><div>{['brand', 'productType', 'productName', 'length', 'shape', 'size', 'number'].map((token) => <code key={token}>{'{' + token + '}'}</code>)}</div></details>
    <section className={`${styles.panel} ${styles.audit}`}>
      <header><h2>Saved image metadata</h2><p>Current saved values. Open an image to edit its individual metadata.</p></header>
      <label className={styles.filter}>Find an image<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search filename, title, alt text or caption" /></label>
      <div className={styles.tableScroll} role="region" aria-label="Saved image metadata" tabIndex={0}><table><thead><tr><th scope="col">File</th><th scope="col">Title</th><th scope="col">Alt text</th><th scope="col">Caption</th></tr></thead><tbody>{matching.map((item) => <tr key={item.id}><th scope="row"><Link href={`/admin/collections/media/${item.id}`}>{item.filename}</Link></th><td>{item.title || 'Not set'}</td><td>{item.altText || 'Not set'}</td><td>{item.caption || 'Not set'}</td></tr>)}</tbody></table></div>
      {!matching.length && <p>No matching images.</p>}<p className={styles.help}>{matching.length} matching of {media.length} loaded images (up to 1000).</p>
    </section>
  </div>
}
