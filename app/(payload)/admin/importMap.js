import { ProductSlugField as ProductSlugField_36c2d55279d64603ec421ede181e93e5 } from '../components/ProductSlugField'
import { ProductVariantsSpreadsheetField as ProductVariantsSpreadsheetField_015914b26101ff96ca7d79a4e662231d } from '../components/ProductVariantsSpreadsheetField'
import { ProductThumbnailCell as ProductThumbnailCell_015e3ee3fe2420321a28a2b2804f215a } from '../components/ProductThumbnailCell'
import { ProductMediaField as ProductMediaField_cdaea869f08f65dad3f2f4ac3ec67b7e } from '../components/ProductMediaField'
import { GoogleProductCategoryField as GoogleProductCategoryField_5125fd73abe0827af1f5c7a04f2fa7ef } from '../components/GoogleProductCategoryField'
import { ProductActionCell as ProductActionCell_086ca6d8b8da5793fc741493d722bdba } from '../components/ProductActionCell'
import { ProductWorkspaceTabs as ProductWorkspaceTabs_fa95963d5356c9b1a1929c27b3255d14 } from '../components/ProductWorkspaceTabs'
import { ProductListActions as ProductListActions_17ac1f03dc2d74ea060fad049215d136 } from '../components/ProductListActions'
import { ProductMediaAudit as ProductMediaAudit_9420406cae87749115868821fce0f84f } from '../components/ProductBulkEditor'
import { ProductDeleteControl as ProductDeleteControl_b55a099709b09a611cd7f9c84729a21e } from '../components/ProductDeleteControl'
import { ProductStudioView as ProductStudioView_10c85732f2eea616635ce8b94f8ee3fc } from '../components/ProductStudioView'
import { ProductSpreadsheetView as ProductSpreadsheetView_b326187171f517a2b22b0af78924b398 } from '../components/ProductSpreadsheetView'
import { ProductCategoriesView as ProductCategoriesView_4d74db79c1c650fb8f1844efc9af8c99 } from '../components/ProductCategoriesView'
import { MediaWorkspaceTabs as MediaWorkspaceTabs_717e75be1c7a9aaed3eecabad6cedf62 } from '../components/MediaWorkspaceTabs'
import { MediaBulkUpload as MediaBulkUpload_5ec60b1d534fd4534df5b0b063d9786f } from '../components/MediaBulkUpload'
import { MediaReprocessButton as MediaReprocessButton_521a9006c5bc2641f160b5e0e25aabc7 } from '../components/MediaReprocessButton'
import { MediaCompressionView as MediaCompressionView_525be5d54a45056cab8bc779174c2e8c } from '../components/MediaToolsView'
import { MediaMetadataView as MediaMetadataView_525be5d54a45056cab8bc779174c2e8c } from '../components/MediaToolsView'
import { OriginalsCleanup as OriginalsCleanup_8ee34e0bbdf97614b2a688b17b57f836 } from '../components/OriginalsCleanup'
import { MarketingStudioView as MarketingStudioView_2329a0d776bbd604a5e1c7768b8228f5 } from '../components/MarketingStudioView'
import { PinterestPublishing as PinterestPublishing_27a57dad575eb919d00754f09cec5d83 } from '../components/PinterestPublishing'
import { StorefrontHomeAction as StorefrontHomeAction_cbc9200bb77880a9b4ebe1053d304c39 } from '../components/StorefrontHomeAction'
import { StudioNavLink as StudioNavLink_82da4bf386bde16554597b0aa0981201 } from '../components/StudioNavLink'
import { AdminDashboard as AdminDashboard_23ec33776346719f737fb9ed0745e7e8 } from '../components/AdminDashboard'
import { CollectionCards as CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1 } from '@payloadcms/next/rsc'
import { S3ClientUploadHandler as S3ClientUploadHandler_f97aa6c64367fa259c5bc0567239ef24 } from '@payloadcms/storage-s3/client'

/** @type import('payload').ImportMap */
export const importMap = {
  "/components/ProductSlugField#ProductSlugField": ProductSlugField_36c2d55279d64603ec421ede181e93e5,
  "/components/ProductVariantsSpreadsheetField#ProductVariantsSpreadsheetField": ProductVariantsSpreadsheetField_015914b26101ff96ca7d79a4e662231d,
  "/components/ProductThumbnailCell#ProductThumbnailCell": ProductThumbnailCell_015e3ee3fe2420321a28a2b2804f215a,
  "/components/ProductMediaField#ProductMediaField": ProductMediaField_cdaea869f08f65dad3f2f4ac3ec67b7e,
  "/components/GoogleProductCategoryField#GoogleProductCategoryField": GoogleProductCategoryField_5125fd73abe0827af1f5c7a04f2fa7ef,
  "/components/ProductActionCell#ProductActionCell": ProductActionCell_086ca6d8b8da5793fc741493d722bdba,
  "/components/ProductWorkspaceTabs#ProductWorkspaceTabs": ProductWorkspaceTabs_fa95963d5356c9b1a1929c27b3255d14,
  "/components/ProductListActions#ProductListActions": ProductListActions_17ac1f03dc2d74ea060fad049215d136,
  "/components/ProductBulkEditor#ProductMediaAudit": ProductMediaAudit_9420406cae87749115868821fce0f84f,
  "/components/ProductDeleteControl#ProductDeleteControl": ProductDeleteControl_b55a099709b09a611cd7f9c84729a21e,
  "/components/ProductStudioView#ProductStudioView": ProductStudioView_10c85732f2eea616635ce8b94f8ee3fc,
  "/components/ProductSpreadsheetView#ProductSpreadsheetView": ProductSpreadsheetView_b326187171f517a2b22b0af78924b398,
  "/components/ProductCategoriesView#ProductCategoriesView": ProductCategoriesView_4d74db79c1c650fb8f1844efc9af8c99,
  "/components/MediaWorkspaceTabs#MediaWorkspaceTabs": MediaWorkspaceTabs_717e75be1c7a9aaed3eecabad6cedf62,
  "/components/MediaBulkUpload#MediaBulkUpload": MediaBulkUpload_5ec60b1d534fd4534df5b0b063d9786f,
  "/components/MediaReprocessButton#MediaReprocessButton": MediaReprocessButton_521a9006c5bc2641f160b5e0e25aabc7,
  "/components/MediaToolsView#MediaCompressionView": MediaCompressionView_525be5d54a45056cab8bc779174c2e8c,
  "/components/MediaToolsView#MediaMetadataView": MediaMetadataView_525be5d54a45056cab8bc779174c2e8c,
  "/components/OriginalsCleanup#OriginalsCleanup": OriginalsCleanup_8ee34e0bbdf97614b2a688b17b57f836,
  "/components/MarketingStudioView#MarketingStudioView": MarketingStudioView_2329a0d776bbd604a5e1c7768b8228f5,
  "/components/PinterestPublishing#PinterestPublishing": PinterestPublishing_27a57dad575eb919d00754f09cec5d83,
  "/components/StorefrontHomeAction#StorefrontHomeAction": StorefrontHomeAction_cbc9200bb77880a9b4ebe1053d304c39,
  "/components/StudioNavLink#StudioNavLink": StudioNavLink_82da4bf386bde16554597b0aa0981201,
  "/components/AdminDashboard#AdminDashboard": AdminDashboard_23ec33776346719f737fb9ed0745e7e8,
  "@payloadcms/next/rsc#CollectionCards": CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1,
  "@payloadcms/storage-s3/client#S3ClientUploadHandler": S3ClientUploadHandler_f97aa6c64367fa259c5bc0567239ef24
}
