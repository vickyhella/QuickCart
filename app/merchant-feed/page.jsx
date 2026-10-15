'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function MerchantFeedPreviewPage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [availableCountries, setAvailableCountries] = useState([])

  useEffect(() => {
    Promise.all([
      fetch('/api/merchant/feed.xml', { cache: 'no-store' }),
      fetch('/api/merchant/feed-preview', { cache: 'no-store' }),
      fetch('/api/marketing/countries', { cache: 'no-store' }),
    ]).then(async ([feedResponse, statsResponse, countriesResponse]) => {
      if (!feedResponse.ok) throw new Error('Could not load the Merchant Center feed.')
      const [feedText, statsResult] = await Promise.all([feedResponse.text(), statsResponse.ok ? statsResponse.json() : Promise.resolve(null)])
      setStats(statsResult)
      if (countriesResponse.ok) setAvailableCountries((await countriesResponse.json()).countries || [])
      const xml = new DOMParser().parseFromString(feedText, 'application/xml')
      const parseError = xml.querySelector('parsererror')
      if (parseError) throw new Error('The feed returned invalid XML.')
      const text = (element, name) => element.getElementsByTagNameNS('http://base.google.com/ns/1.0', name)[0]?.textContent || ''
      setItems([...xml.querySelectorAll('item')].map((item) => ({
        id: text(item, 'id'), title: text(item, 'title'), link: text(item, 'link'), image: text(item, 'image_link'),
        price: text(item, 'price'), availability: text(item, 'availability'), category: text(item, 'google_product_category'),
        brand: text(item, 'brand'), material: text(item, 'material'), color: text(item, 'color'), size: text(item, 'size'),
        ageGroup: text(item, 'age_group'), adult: text(item, 'adult'), gender: text(item, 'gender'), condition: text(item, 'condition'),
        gtin: text(item, 'gtin'), mpn: text(item, 'mpn'), multipack: text(item, 'multipack'), identifier: text(item, 'identifier_exists') || 'yes',
      })))
    }).catch((reason) => setError(reason.message || 'Feed could not be loaded.')).finally(() => setLoading(false))
  }, [])

  return <main style={{ padding: '32px clamp(16px, 4vw, 56px)', color: '#172033', background: '#f8fafc', minHeight: '100vh' }}>
    <h1 style={{ marginBottom: 8 }}>Google Merchant Center feed</h1>
    <p style={{ marginTop: 0, color: '#475569' }}>Preview of published products and variants. Feed URLs: <a href="/api/merchant/feed.xml" style={{ color: '#1d4ed8', textDecoration: 'underline' }}>Google Merchant Center XML</a> · <a href="/api/pinterest/feed.xml" style={{ color: '#1d4ed8', textDecoration: 'underline' }}>Pinterest catalog XML</a> · <Link href="/pinterest-feed" style={{ color: '#1d4ed8', textDecoration: 'underline' }}>Pinterest visual preview</Link></p>
    <section style={{ marginBlock: 20, padding: 16, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, color: '#1e3a8a' }}>
      <strong>Country targeting</strong>
      <p style={{ marginBlock: 6 }}>The site checkout accepts the countries below. In Merchant Center, add these as target countries on the product data source and configure shipping services separately. You can mirror the site’s subtotal, item-count, and total-weight ranges and shipping fees; these account settings do not sync automatically from the site.</p>
      <p style={{ margin: 0 }}>{availableCountries.map(([code, name]) => `${name} (${code})`).join(' · ') || 'No available countries configured.'}</p>
    </section>
    {loading ? <p>Loading feed…</p> : error ? <p role="alert" style={{ color: '#b91c1c' }}>{error}</p> : <>
      {stats && <section style={{ marginBlock: 18, padding: 16, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8 }}>
        <strong>Live catalog status</strong>
        <p style={{ marginBlock: 6 }}>Products: {stats.totalProducts} · Published: {stats.publishedProducts} · Draft: {stats.draftProducts} · Feed items: {stats.feedItems}</p>
        {stats.feedItems === 0 && <p style={{ marginBottom: 0 }}>A product appears in the feed only after it is published and has an image (a variant image can be used when the product image is empty). <Link href="/admin/collections/products" style={{ color: '#1d4ed8', textDecoration: 'underline' }}>Open products</Link></p>}
        {stats.skippedPublishedProducts?.length > 0 && <ul style={{ marginBottom: 0 }}>{stats.skippedPublishedProducts.map((product) => <li key={product.slug}>{product.title} ({product.slug}): {product.reason}</li>)}</ul>}
      </section>}
      <p>{items.length} item(s) in feed</p>
      <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 1900 }}>
          <thead><tr>{['ID', 'Product / variant', 'Price', 'Availability', 'Google category', 'Product type', 'Brand', 'Material', 'Color', 'Size', 'Age group', 'Adult', 'Gender', 'Condition', 'GTIN', 'MPN', 'Multipack', 'Identifier exists', 'Image'].map((label) => <th key={label} style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #cbd5e1', background: '#f1f5f9' }}>{label}</th>)}</tr></thead>
          <tbody>{items.map((item) => <tr key={item.id}>{[
            <code key="id">{item.id}</code>, <Link key="title" href={item.link} target="_blank" rel="noreferrer" style={{ color: '#1d4ed8' }}>{item.title}</Link>, item.price, item.availability, item.category, 'Press-on Nails', item.brand, item.material, item.color, item.size, item.ageGroup, item.adult, item.gender, item.condition, item.gtin, item.mpn, item.multipack, item.identifier,
            <img key="image" src={item.image} alt="" style={{ width: 56, height: 56, objectFit: 'cover' }} />,
          ].map((value, index) => <td key={index} style={{ padding: 10, borderBottom: '1px solid #e2e8f0', verticalAlign: 'middle' }}>{value}</td>)}</tr>)}</tbody>
        </table>
        {!items.length && <p style={{ padding: 20, color: '#64748b' }}>No feed rows yet. See the live catalog status above for what needs to be published.</p>}
      </div>
    </>}
  </main>
}
