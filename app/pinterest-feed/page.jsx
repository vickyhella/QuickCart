'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function PinterestFeedPreviewPage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch('/api/pinterest/feed.xml', { cache: 'no-store' }).then(async (response) => {
      if (!response.ok) throw new Error('Could not load the Pinterest catalog feed.')
      const xml = new DOMParser().parseFromString(await response.text(), 'application/xml')
      if (xml.querySelector('parsererror')) throw new Error('The Pinterest feed returned invalid XML.')
      const tag = (node, name) => node.getElementsByTagNameNS('http://base.google.com/ns/1.0', name)[0]?.textContent || ''
      setItems([...xml.querySelectorAll('item')].map((item) => ({ id: tag(item, 'id'), title: tag(item, 'title'), link: tag(item, 'link'), image: tag(item, 'image_link'), price: tag(item, 'price'), availability: tag(item, 'availability'), description: tag(item, 'description'), brand: tag(item, 'brand'), color: tag(item, 'color'), size: tag(item, 'size'), additionalImages: [...item.getElementsByTagNameNS('http://base.google.com/ns/1.0', 'additional_image_link')].map((node) => node.textContent) })))
    }).catch((reason) => setError(reason.message || 'Feed could not be loaded.')).finally(() => setLoading(false))
  }, [])
  return <main style={{ padding: '32px clamp(16px, 4vw, 56px)', color: '#172033', background: '#f8fafc', minHeight: '100vh' }}>
    <h1>Pinterest catalog feed</h1><p>Live preview of published products and their enabled variants. <a href="/api/pinterest/feed.xml" style={{ color: '#1d4ed8', textDecoration: 'underline' }}>Open XML feed</a> · <Link href="/merchant-feed" style={{ color: '#1d4ed8', textDecoration: 'underline' }}>Google feed preview</Link></p>
    {loading ? <p>Loading feed…</p> : error ? <p role="alert" style={{ color: '#b91c1c' }}>{error}</p> : <>
      <p>{items.length} item(s) in feed</p><div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 1050 }}><thead><tr>{['Image', 'ID', 'Product / variant', 'Price', 'Availability', 'Brand', 'Color', 'Size', 'Additional images', 'Link'].map((label) => <th key={label} style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #cbd5e1', background: '#f1f5f9' }}>{label}</th>)}</tr></thead>
          <tbody>{items.map((item) => <tr key={item.id}><td style={{ padding: 10 }}><img src={item.image} alt="" style={{ width: 64, height: 64, objectFit: 'cover' }} /></td><td>{item.id}</td><td>{item.title}<small style={{ display: 'block', maxWidth: 280, color: '#64748b' }}>{item.description.slice(0, 180)}</small></td><td>{item.price}</td><td>{item.availability}</td><td>{item.brand}</td><td>{item.color}</td><td>{item.size}</td><td>{item.additionalImages.length}</td><td><a href={item.link} target="_blank" rel="noreferrer" style={{ color: '#1d4ed8' }}>View product</a></td></tr>)}</tbody>
        </table>{!items.length && <p style={{ padding: 20, color: '#64748b' }}>No feed rows yet. Products need to be published with a valid price and an image.</p>}
      </div>
    </>}
  </main>
}
