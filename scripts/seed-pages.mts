import nextEnv from '@next/env'
import { getPayload } from 'payload'

nextEnv.loadEnvConfig(process.cwd())
const environment = process.env as Record<string, string | undefined>
environment.NODE_ENV ??= 'development'

const { default: config } = await import('../payload.config')
const payload = await getPayload({ config })

const pages = [
  {
    title: 'About Us',
    slug: 'about-us',
    placement: 'footer-explore',
    status: 'published',
    seoTitle: 'About Us | Ginny Nana',
    body: `Welcome to Ginny Nana!\n\nAt Ginny Nana, we create stylish press-on nails that combine convenience, elegance, and affordability. Our aim is to make salon-quality nails easy to enjoy at home.\n\n## Our Story\n\nGinny Nana began with a love of nail design and a wish to make beautiful sets easy to wear for everyday moments and special occasions.\n\n## Why Choose Us?\n\n- **Handmade:** Each design is prepared with care.\n- **Reusable:** Enjoy your sets again with proper care.\n- **Easy to apply:** A polished look at home in about ten minutes.\n\n## Get in Touch\n\nQuestions? Email [ginnynana@hotmail.com](mailto:ginnynana@hotmail.com).`,
  },
  {
    title: 'Contact Us',
    slug: 'contact-us',
    placement: 'footer-explore',
    status: 'published',
    seoTitle: 'Contact Us | Ginny Nana',
    body: 'For questions about products, orders, or policies, email [ginnynana@hotmail.com](mailto:ginnynana@hotmail.com).',
  },
  { title: 'Privacy Policy', slug: 'privacy-policy', placement: 'footer-customer-care', status: 'published', seoTitle: 'Privacy Policy | Ginny Nana', body: '' },
  { title: 'Terms of Service', slug: 'terms-conditions', placement: 'footer-customer-care', status: 'published', seoTitle: 'Terms of Service | Ginny Nana', body: '' },
  { title: 'Refunds & Returns', slug: 'refunds-returns', placement: 'footer-customer-care', status: 'published', seoTitle: 'Refunds & Returns | Ginny Nana', body: '' },
  { title: 'Shipping Policy', slug: 'shipping-policy', placement: 'footer-customer-care', status: 'published', seoTitle: 'Shipping Policy | Ginny Nana', body: '' },
]

try {
  for (const page of pages) {
    const existing = await payload.find({
      collection: 'pages',
      where: { slug: { equals: page.slug } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs.length) {
      payload.logger.info(`Already exists: /${page.slug}/`)
      continue
    }
    await payload.create({ collection: 'pages', data: page, overrideAccess: true })
    payload.logger.info(`Created: /${page.slug}/`)
  }
} finally {
  await payload.destroy()
}
