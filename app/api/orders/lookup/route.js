import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function POST(request) {
  try {
    const { orderNumber = '', email = '' } = await request.json()
    const normalizedOrder = String(orderNumber).trim().toUpperCase()
    const normalizedEmail = String(email).trim().toLowerCase()
    if (!/^GN-[A-F0-9]{24}$/.test(normalizedOrder) || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: '请填写有效的订单号和下单邮箱。' }, { status: 400 })
    }

    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'orders',
      where: {
        and: [
          { orderNumber: { equals: normalizedOrder } },
          { customerEmail: { equals: normalizedEmail } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    })
    const order = result.docs[0]
    if (!order) return NextResponse.json({ error: '未找到匹配的订单，请检查订单号和邮箱。' }, { status: 404 })

    return NextResponse.json({
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      trackingNumber: order.trackingNumber || '',
      items: (order.items || []).map((item) => ({ title: item.title, variant: item.variant, quantity: item.quantity })),
    })
  } catch (error) {
    console.error('Order lookup failed:', error)
    return NextResponse.json({ error: '暂时无法查询订单，请稍后重试。' }, { status: 500 })
  }
}
