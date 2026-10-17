export function hideSupplierDetails(product: Record<string, any>): Record<string, any> {
  const { supplierSKU, suppliers, purchaseURL, chineseName, studioRequestID, variants, ...publicProduct } = product
  return {
    ...publicProduct,
    ...(Array.isArray(variants) ? { variants: variants.map(({ supplierSKU: _sku, suppliers: _suppliers, purchaseURL: _url, ...variant }) => variant) } : {}),
  }
}
