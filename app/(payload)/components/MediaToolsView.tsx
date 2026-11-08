'use client'

import { MarketingHub } from './MarketingHub'
import { MediaWorkspaceTabs } from './MediaWorkspaceTabs'

function MediaToolsLayout({ section }: { section: 'compression' | 'metadata' }) {
  return <div style={{ padding: '24px clamp(20px, 4vw, 56px)', maxWidth: 1320, margin: '0 auto' }}>
    <header style={{ marginBottom: 24 }}>
      <h1 style={{ margin: '0 0 8px', fontSize: 36, fontWeight: 600 }}>{section === 'compression' ? 'Image compression' : 'Image names & metadata'}</h1>
      <p style={{ margin: 0, color: 'var(--brand-text-secondary)', fontSize: 14 }}>{section === 'compression' ? 'Manage image quality and rebuild delivery images from preserved originals.' : 'Manage image naming templates and accessibility descriptions.'}</p>
    </header>
    <MediaWorkspaceTabs />
    <MarketingHub section={section} />
  </div>
}

export function MediaCompressionView() {
  return <MediaToolsLayout section="compression" />
}

export function MediaMetadataView() {
  return <MediaToolsLayout section="metadata" />
}
