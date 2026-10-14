'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PinterestPublishing } from '../(payload)/components/PinterestPublishing'
import { MarketingHub } from '../(payload)/components/MarketingHub'

export const marketingStudioTabs = [
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'seo', label: 'SEO' },
  { id: 'feeds', label: 'Feeds' },
] as const

type MarketingTab = typeof marketingStudioTabs[number]['id']

type PublishingPost = {
  id: string
  productTitle: string
  title: string
  imageURL: string
  scheduledAt: string
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  publishedAt: string | null
  pinId: string | null
  lastError: string | null
}

const statusLabels: Record<PublishingPost['status'], string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  published: 'Published',
  failed: 'Failed',
}

const cardStyle = { border: '1px solid #e7ddd8', borderRadius: 16, background: 'white' }

export default function MarketingStudio() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<MarketingTab>('pinterest')
  const [posts, setPosts] = useState<PublishingPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyID, setBusyID] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/marketing/pinterest-posts', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not load publishing posts.')
      setPosts(data.posts || [])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load publishing posts.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const requested = searchParams.get('tab')
    if (marketingStudioTabs.some(({ id }) => id === requested)) setTab(requested as MarketingTab)
  }, [searchParams])

  useEffect(() => { if (tab === 'pinterest') void refresh() }, [refresh, tab])

  const selectTab = (next: MarketingTab) => {
    setTab(next)
    router.replace(`/admin/collections/marketing/studio?tab=${next}`, { scroll: false })
  }

  async function updatePost(post: PublishingPost, action: 'retry' | 'cancel') {
    setBusyID(post.id)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/marketing/pinterest-posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id, action }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not update publishing post.')
      await refresh()
      setNotice(action === 'retry' ? 'Retry queued for the next automatic publishing run.' : 'Post moved to drafts.')
      setBusyID('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update publishing post.')
      setBusyID('')
    }
  }

  const counts = posts.reduce<Record<PublishingPost['status'], number>>((result, post) => {
    result[post.status] += 1
    return result
  }, { draft: 0, scheduled: 0, published: 0, failed: 0 })

  return <main className="marketing-studio mx-auto min-h-screen max-w-6xl px-5 py-10 font-sans text-base antialiased text-[#302522] md:px-8">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Marketing Studio</h1>
        <p className="mt-2 text-sm text-[#766966]">Schedule Pinterest posts and track publishing status.</p>
      </div>
    </header>

    <div role="tablist" aria-label="Marketing Studio sections" className="mb-8 flex gap-2 border-b border-[#e7ddd8]">
      {marketingStudioTabs.map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => selectTab(item.id)} className="border-0 border-b-2 bg-transparent px-4 py-3 text-sm" style={{ borderBottomColor: tab === item.id ? 'var(--accent)' : 'transparent', color: tab === item.id ? 'var(--theme-text)' : 'var(--theme-elevation-700)', fontWeight: tab === item.id ? 600 : 400 }}>{item.label}</button>)}
    </div>

    {tab === 'pinterest' && <>
    <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
      {(['scheduled', 'published', 'failed', 'draft'] as const).map((status) => <div key={status} className="p-4" style={cardStyle}>
        <div className="text-sm text-[#766966]">{statusLabels[status]}</div><div className="mt-1 text-2xl font-semibold">{counts[status]}</div>
      </div>)}
    </section>

    <section className="marketing-studio-publisher mb-8 overflow-hidden p-5 md:p-6" style={cardStyle}>
      <PinterestPublishing />
    </section>

    <section className="overflow-hidden" style={cardStyle}>
      <div className="flex items-center justify-between border-b border-[#eee6e2] px-5 py-4">
        <div><h2 className="font-semibold">Publishing queue</h2><p className="mt-1 text-sm text-[#766966]">Latest 100 posts across drafts, scheduled items, and history.</p></div>
        <button type="button" onClick={() => void refresh()} disabled={loading} className="rounded-lg border border-[#e7ddd8] px-3 py-2 text-sm disabled:opacity-50">Refresh</button>
      </div>
      {error && <p role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="m-4 rounded-lg bg-green-50 p-3 text-sm text-green-900">{notice}</p>}
      {loading ? <p className="p-5 text-sm text-[#766966]">Loading publishing queue…</p> : posts.length ? <div className="divide-y divide-[#eee6e2]">
        {posts.map((post) => <article key={post.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
          {post.imageURL ? <img src={post.imageURL} alt="" className="h-14 w-12 rounded-md object-cover" /> : <div className="h-14 w-12 rounded-md bg-[#f5efec]" />}
          <div className="min-w-[180px] flex-1">
            <div className="font-medium">{post.title || post.productTitle || 'Untitled post'}</div>
            <div className="mt-1 text-xs text-[#766966]">{post.productTitle}{post.productTitle ? ' · ' : ''}{post.status === 'published' && post.publishedAt ? `Published ${new Date(post.publishedAt).toLocaleString()}` : `Scheduled ${new Date(post.scheduledAt).toLocaleString()}`}</div>
            {post.lastError && <div className="mt-1 text-xs text-red-700">{post.lastError}</div>}
            {post.pinId && <div className="mt-1 text-xs text-[#766966]">Pinterest ID: {post.pinId}</div>}
          </div>
          <span className={`rounded-full px-3 py-1 text-xs ${post.status === 'failed' ? 'bg-red-50 text-red-800' : post.status === 'published' ? 'bg-green-50 text-green-800' : 'bg-[#f5efec] text-[#604a45]'}`}>{statusLabels[post.status]}</span>
          {post.status === 'failed' && <button type="button" disabled={busyID === post.id} onClick={() => void updatePost(post, 'retry')} className="rounded-lg bg-[#604a45] px-3 py-2 text-sm text-white disabled:opacity-50">{busyID === post.id ? 'Retrying…' : 'Queue retry'}</button>}
          {post.status === 'scheduled' && <button type="button" disabled={busyID === post.id} onClick={() => void updatePost(post, 'cancel')} className="rounded-lg border border-[#e7ddd8] px-3 py-2 text-sm disabled:opacity-50">Cancel</button>}
        </article>)}
      </div> : <p className="p-5 text-sm text-[#766966]">No publishing posts yet.</p>}
    </section>
    </>}

    {tab === 'seo' && <MarketingHub section="seo" />}
    {tab === 'feeds' && <MarketingHub section="feeds" />}
  </main>
}
