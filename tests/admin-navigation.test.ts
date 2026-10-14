import assert from 'node:assert/strict'
import test from 'node:test'
import { ContactMessages } from '../collections/ContactMessages'
import { Discounts } from '../collections/Discounts'
import { Media } from '../collections/Media'
import { MediaOriginals } from '../collections/MediaOriginals'
import { MarketingWorkspace } from '../collections/MarketingWorkspace'
import { Orders } from '../collections/Orders'
import { Pages } from '../collections/Pages'
import { PinterestPosts } from '../collections/PinterestPosts'
import { Products } from '../collections/Products'
import { Users } from '../collections/Users'
import { MarketingSettings } from '../globals/MarketingSettings'
import { StoreSettings } from '../globals/StoreSettings'
import { adminDashboardSections, adminHomeLink, isMediaNavigationActive, mediaWorkspaceTabs, studioLinks } from '../lib/admin-navigation'

test('admin dashboard groups and shortcuts follow the unified sidebar order', () => {
  assert.deepEqual(adminDashboardSections.map(({ title }) => title), ['Studio', 'Store', 'Catalog', 'Website', 'Commerce'])
  assert.deepEqual(adminDashboardSections.map(({ links }) => links.map(({ label }) => label)), [
    ['Product Studio', 'Marketing Studio', 'Spreadsheet Editor'],
    ['Users', 'Contact forms'],
    ['Products', 'Media'],
    ['Pages'],
    ['Orders', 'Discounts', 'Store settings'],
  ])
  assert.deepEqual(studioLinks.map(({ href }) => href), [
    '/admin/collections/products/studio',
    '/admin/collections/marketing/studio',
    '/admin/collections/products/spreadsheet',
  ])
  assert.deepEqual(adminHomeLink, { label: 'Admin home', href: '/admin' })

  const productViews = Products.admin?.components?.views as Record<string, { path: string }>
  const marketingViews = MarketingWorkspace.admin?.components?.views as unknown as Record<string, { path: string; Component: string }>
  const mediaViews = Media.admin?.components?.views as unknown as Record<string, { path: string; Component: string }>
  assert.equal(`/admin/collections/products${productViews.studio.path}`, studioLinks[0].href)
  assert.equal(`/admin/collections/marketing${marketingViews.studio.path}`, studioLinks[1].href)
  assert.equal(`/admin/collections/products${productViews.spreadsheet.path}`, studioLinks[2].href)
  assert.deepEqual(mediaWorkspaceTabs.slice(2).map(({ href }) => href), [
    `/admin/collections/media${mediaViews.compression.path}`,
    `/admin/collections/media${mediaViews.metadata.path}`,
  ])
  assert.equal(mediaViews.compression.Component, '/components/MediaToolsView#MediaCompressionView')
  assert.equal(mediaViews.metadata.Component, '/components/MediaToolsView#MediaMetadataView')
  assert.ok(MediaOriginals.admin?.components?.beforeList?.includes('/components/MediaWorkspaceTabs#MediaWorkspaceTabs'))
  assert.equal(isMediaNavigationActive('/admin/collections/media-originals'), true)
  assert.equal(isMediaNavigationActive('/admin/collections/media/compression'), true)
  assert.equal(isMediaNavigationActive('/admin/collections/products'), false)
  assert.deepEqual([Users.admin?.group, ContactMessages.admin?.group], ['Store', 'Store'])
  assert.deepEqual([Products.admin?.group, Media.admin?.group], ['Catalog', 'Catalog'])
  assert.equal(Pages.admin?.group, 'Website')
  assert.deepEqual([Orders.admin?.group, Discounts.admin?.group, StoreSettings.admin?.group], ['Commerce', 'Commerce', 'Commerce'])
  assert.equal(MediaOriginals.admin?.group, false)
  assert.equal(PinterestPosts.admin?.group, false)
  assert.equal(MarketingWorkspace.admin?.group, false)
  assert.equal(MarketingSettings.admin?.group, false)
})
