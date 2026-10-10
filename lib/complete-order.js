export async function markOrderPaid(payload, orderId, paymentReference) {
  const order = await payload.findByID({ collection: 'orders', id: orderId, overrideAccess: true })
  if (order.paymentStatus === 'paid') return order

  const updated = await payload.update({
    collection: 'orders',
    id: orderId,
    data: { paymentStatus: 'paid', ...(paymentReference ? { paymentReference } : {}) },
    overrideAccess: true,
  })

  if (order.promoCode) {
    const discounts = await payload.find({
      collection: 'discounts',
      where: { code: { equals: order.promoCode } },
      limit: 1,
      overrideAccess: true,
    })
    const discount = discounts.docs[0]
    if (discount) {
      await payload.update({
        collection: 'discounts',
        id: discount.id,
        data: { usageCount: Number(discount.usageCount || 0) + 1 },
        overrideAccess: true,
      })
    }
  }

  for (const line of order.items || []) {
    if (!line.variantId || !line.product) continue
    const productId = typeof line.product === 'object' ? line.product.id : line.product
    const product = await payload.findByID({ collection: 'products', id: productId, overrideAccess: true })
    const variants = Array.isArray(product.variants) ? product.variants : []
    const variant = variants.find((item) => String(item.id) === String(line.variantId))
    if (!variant?.trackStock) continue
    const remaining = Math.max(0, Number(variant.stock || 0) - Number(line.quantity || 0))
    await payload.update({
      collection: 'products',
      id: product.id,
      data: { variants: variants.map((item) => String(item.id) === String(line.variantId) ? { ...item, stock: remaining } : item) },
      overrideAccess: true,
    })
  }

  return updated
}
