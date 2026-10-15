import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getCheckoutFailure } from '@/lib/checkout-error'
import { calculateShippingCharge } from '@/lib/shipping-tiers'

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100
export async function POST(request) {
  try {
    const { items = [], promoCode = '' } = await request.json()
    if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: '购物车为空。' }, { status: 400 })
    if (items.length > 40) return NextResponse.json({ error: '购物车商品种类过多。' }, { status: 400 })
    const payload = await getPayload({ config })
    const settings = await payload.findGlobal({ slug: 'store-settings', overrideAccess: true })
    let subtotal = 0
    let quantity = 0
    const lines = []
    for (const item of items) {
      const product = await payload.findByID({ collection: 'products', id: item.productId, overrideAccess: true })
      if (product.status !== 'published') throw new Error(`${product.title} 目前不可购买。`)
      const variants = Array.isArray(product.variants) ? product.variants : []
      const variant = variants.length ? variants.find((entry) => String(entry.id) === String(item.variantId) && entry.enabled !== false) : null
      if (variants.length && !variant) throw new Error(`${product.title} 的规格已不可用。`)
      const count = Math.floor(Number(item.quantity))
      if (!Number.isInteger(count) || count < 1 || count > 99) throw new Error('商品数量必须介于 1 和 99 之间。')
      if (variant?.trackStock && Number(variant.stock || 0) < count) throw new Error(`${product.title} 的所选规格库存不足。`)
      subtotal += roundMoney(variant?.price ?? product.price) * count
      quantity += count
      lines.push({ product, quantity: count })
    }
    subtotal = roundMoney(subtotal)

    let discountTotal = 0
    const code = String(promoCode).trim().toUpperCase()
    if (code) {
      const matches = await payload.find({
        collection: 'discounts',
        where: { code: { equals: code }, active: { equals: true } },
        limit: 1,
        overrideAccess: true,
      })
      const discount = matches.docs[0]
      if (!discount) throw new Error('优惠码无效或已停用。')
      if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) throw new Error('优惠码已过期。')
      if (discount.usageLimit && Number(discount.usageCount || 0) >= Number(discount.usageLimit)) throw new Error('优惠码已达到使用次数上限。')
      if (discount.minimumSubtotal && subtotal < Number(discount.minimumSubtotal)) throw new Error(`订单满 $${Number(discount.minimumSubtotal).toFixed(2)} 才能使用此优惠码。`)
      discountTotal = discount.kind === 'percentage'
        ? roundMoney(subtotal * Math.min(100, Number(discount.value)) / 100)
        : Math.min(subtotal, roundMoney(discount.value))
    }

    const discountedSubtotal = roundMoney(subtotal - discountTotal)
    const shipping = calculateShippingCharge(settings, { subtotal: discountedSubtotal, quantity, lines })
    if (shipping.unavailable) {
      const error = shipping.reason === 'minimum-order-value'
        ? `订单金额需达到 $${Number(settings.minimumOrderValue).toFixed(2)} 才能配送。`
        : '当前购物车未匹配到配送费率，请联系客服。'
      throw new Error(error)
    }
    const shippingTotal = roundMoney(shipping.shippingTotal)
    const freeShippingThreshold = settings.freeShippingThreshold == null || settings.freeShippingThreshold === ''
      ? null
      : Number(settings.freeShippingThreshold)
    return NextResponse.json({
      currency: settings.currency || 'USD',
      subtotal,
      discountTotal,
      shippingTotal,
      taxTotal: 0,
      total: roundMoney(discountedSubtotal + shippingTotal),
      freeShippingThreshold,
      minimumOrderValue: settings.minimumOrderValue == null || settings.minimumOrderValue === '' ? null : Number(settings.minimumOrderValue),
      itemCount: quantity,
    })
  } catch (error) {
    const failure = getCheckoutFailure(error, '无法计算订单金额。')
    if (failure.internal) console.error('Checkout quote failed:', error)
    return NextResponse.json({ error: failure.message }, { status: failure.status })
  }
}
