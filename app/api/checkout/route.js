import { NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { isPayPalConfigured, paypalRequest } from '@/lib/paypal'
import { shippingCountryCodes } from '@/lib/countries'

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100
const amountText = (value) => roundMoney(value).toFixed(2)

function isInRange(value, minimum, maximum) {
  return value >= (minimum == null ? 0 : Number(minimum)) && (maximum == null || maximum === '' || value <= Number(maximum))
}

export async function POST(request) {
  if (!isPayPalConfigured()) {
    return NextResponse.json({ error: 'PayPal 尚未配置。请先在 .env.local 中填写 PayPal Sandbox 凭据。' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const email = String(body.email || '').trim().toLowerCase()
    const address = body.address || {}
    const countryCode = String(address.country || '').trim().toUpperCase()
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: '请输入有效的电子邮箱。' }, { status: 400 })
    if (!address.fullName || !address.address1 || !address.city || !address.postalCode || !/^[A-Z]{2}$/.test(countryCode)) {
      return NextResponse.json({ error: '请填写收件人、街道、城市、邮编和两位国家代码。' }, { status: 400 })
    }
    if (!shippingCountryCodes.has(countryCode)) return NextResponse.json({ error: '暂不支持配送到该国家。' }, { status: 400 })
    if (!Array.isArray(body.items) || body.items.length === 0) return NextResponse.json({ error: '购物车为空。' }, { status: 400 })
    if (body.items.length > 40) return NextResponse.json({ error: '购物车商品种类过多。' }, { status: 400 })

    const payload = await getPayload({ config })
    const settings = await payload.findGlobal({ slug: 'store-settings', overrideAccess: true })
    const currency = settings.currency || 'USD'
    const lines = []

    for (const submitted of body.items) {
      const quantity = Math.floor(Number(submitted.quantity))
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error('商品数量必须介于 1 和 99 之间。')
      const product = await payload.findByID({ collection: 'products', id: submitted.productId, overrideAccess: true })
      if (product.status !== 'published') throw new Error(`${product.title} 目前不可购买。`)
      const variants = Array.isArray(product.variants) ? product.variants : []
      let variant = null
      if (variants.length) {
        variant = variants.find((item) => String(item.id) === String(submitted.variantId) && item.enabled !== false)
        if (!variant) throw new Error(`${product.title} 的规格已不可用，请返回商品页重新选择。`)
        if (variant.trackStock && Number(variant.stock || 0) < quantity) throw new Error(`${product.title} 的所选规格库存不足。`)
      }
      const unitPrice = roundMoney(variant?.price ?? product.price)
      lines.push({
        product,
        variant,
        quantity,
        unitPrice,
        lineTotal: roundMoney(unitPrice * quantity),
      })
    }

    const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.lineTotal, 0))
    const promoCode = String(body.promoCode || '').trim().toUpperCase()
    let discountTotal = 0
    if (promoCode) {
      const matches = await payload.find({
        collection: 'discounts',
        where: { code: { equals: promoCode }, active: { equals: true } },
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
    const shippingTier = (settings.shippingTiers || []).find((tier) =>
      isInRange(discountedSubtotal, tier.minimumSubtotal, tier.maximumSubtotal)
      && isInRange(lines.reduce((sum, line) => sum + line.quantity, 0), tier.minimumItems, tier.maximumItems),
    )
    const freeShippingThreshold = Number(settings.freeShippingThreshold ?? 50)
    const shippingTotal = discountedSubtotal >= freeShippingThreshold
      ? 0
      : roundMoney(shippingTier?.fee ?? settings.flatShippingRate ?? 0)
    const taxTotal = 0 // Product prices are tax-inclusive per store settings.
    const total = roundMoney(discountedSubtotal + shippingTotal)
    if (total <= 0) throw new Error('订单金额必须大于 $0。')

    const orderNumber = `GN-${randomBytes(12).toString('hex').toUpperCase()}`
    const order = await payload.create({
      collection: 'orders',
      overrideAccess: true,
      data: {
        orderNumber,
        customerEmail: email,
        currency,
        items: lines.map(({ product, variant, quantity, unitPrice }) => ({
          product: product.id,
          title: product.title,
          sku: variant?.sku || product.sku || '',
          variant: variant ? [variant.shape, variant.length, variant.size?.toUpperCase()].filter(Boolean).join(' / ') : '',
          variantId: variant ? String(variant.id) : '',
          quantity,
          unitPrice,
        })),
        shippingAddress: {
          fullName: String(address.fullName).trim(),
          phone: String(address.phone || '').trim(),
          address1: String(address.address1).trim(),
          address2: String(address.address2 || '').trim(),
          city: String(address.city).trim(),
          state: String(address.state || '').trim(),
          postalCode: String(address.postalCode).trim(),
          country: countryCode,
        },
        subtotal,
        shippingTotal,
        taxTotal,
        discountTotal,
        total,
        promoCode,
        paymentProvider: 'paypal',
        paymentStatus: 'pending',
        fulfillmentStatus: 'unfulfilled',
      },
    })

    const origin = new URL(request.url).origin
    try {
      const paypalOrder = await paypalRequest('/v2/checkout/orders', {
        method: 'POST',
        requestId: `create-${orderNumber}`,
        body: {
          intent: 'CAPTURE',
          purchase_units: [{
            reference_id: orderNumber,
            custom_id: String(order.id),
            invoice_id: orderNumber,
            amount: {
              currency_code: currency,
              value: amountText(total),
              breakdown: {
                item_total: { currency_code: currency, value: amountText(subtotal) },
                shipping: { currency_code: currency, value: amountText(shippingTotal) },
                discount: { currency_code: currency, value: amountText(discountTotal) },
              },
            },
            items: lines.map(({ product, variant, quantity, unitPrice }) => ({
              name: `${product.title}${variant ? ` - ${[variant.shape, variant.length, variant.size?.toUpperCase()].filter(Boolean).join(' ')}` : ''}`.slice(0, 127),
              ...(variant?.sku || product.sku ? { sku: String(variant?.sku || product.sku).slice(0, 127) } : {}),
              quantity: String(quantity),
              category: 'PHYSICAL_GOODS',
              unit_amount: { currency_code: currency, value: amountText(unitPrice) },
            })),
            shipping: {
              name: { full_name: String(address.fullName).trim() },
              address: {
                address_line_1: String(address.address1).trim(),
                ...(address.address2 ? { address_line_2: String(address.address2).trim() } : {}),
                admin_area_2: String(address.city).trim(),
                ...(address.state ? { admin_area_1: String(address.state).trim() } : {}),
                postal_code: String(address.postalCode).trim(),
                country_code: countryCode,
              },
            },
          }],
          application_context: {
            brand_name: 'Ginny Nana',
            user_action: 'PAY_NOW',
            return_url: `${origin}/api/checkout/paypal-return`,
            cancel_url: `${origin}/cart?payment=cancelled`,
          },
        },
      })
      await payload.update({
        collection: 'orders',
        id: order.id,
        data: { paymentReference: paypalOrder.id },
        overrideAccess: true,
      })
      const approvalURL = paypalOrder.links?.find((link) => link.rel === 'approve')?.href
      if (!approvalURL) throw new Error('PayPal 没有返回付款链接。')
      return NextResponse.json({ approvalURL })
    } catch (error) {
      await payload.update({ collection: 'orders', id: order.id, data: { paymentStatus: 'failed' }, overrideAccess: true })
      throw error
    }
  } catch (error) {
    console.error('Checkout creation failed:', error)
    return NextResponse.json({ error: error.message || '无法创建结账订单。' }, { status: error.status || 400 })
  }
}
