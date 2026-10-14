'use client'

import { MarketingHub } from './MarketingHub'
import { MediaWorkspaceTabs } from './MediaWorkspaceTabs'

function MediaToolsLayout({ section }: { section: 'compression' | 'metadata' }) {
  return <div style={{ padding: '24px clamp(20px, 4vw, 56px)', maxWidth: 1320, margin: '0 auto' }}>
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
