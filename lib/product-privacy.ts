export function hideSupplierDetails(product: Record<string, any>): Record<string, any> {
  const { supplierSKU, purchaseURL, studioRequestID, variants, ...publicProduct } = product
  return {
    ...publicProduct,
    ...(Array.isArray(variants) ? { variants: variants.map(({ supplierSKU: _sku, purchaseURL: _url, ...variant }) => variant) } : {}),
  }
}
