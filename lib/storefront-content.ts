import contentSources from '@/config/content-sources.json'
import defaultHomepage from '@/config/homepage.json'
import defaultSite from '@/config/site.json'

const mediaURL = (value: any) => value && typeof value === 'object' ? String(value.url || '') : ''

export async function getAdminHomepageSettings(payload: { findGlobal: Function }) {
  if (contentSources.homepage !== 'admin') return defaultHomepage
  const settings = await payload.findGlobal({ slug: 'marketing-settings', depth: 1, overrideAccess: true })
  const heroImage = mediaURL(settings.homepageHeroImage)
  const mysteryImage = mediaURL(settings.homepageMysteryBoxImage)
  return {
    ...defaultHomepage,
    hero: {
      ...defaultHomepage.hero,
      image: heroImage || null,
      alt: String(settings.homepageHeroImageAlt || settings.homepageHeroImage?.altText || defaultHomepage.hero.alt),
      eyebrow: String(settings.homepageHeroEyebrow || defaultHomepage.hero.eyebrow),
      title: String(settings.homepageHeroTitle || defaultHomepage.hero.title),
      description: String(settings.homepageHeroDescription || defaultHomepage.hero.description),
      buttonLabel: String(settings.homepageHeroButtonLabel || defaultHomepage.hero.buttonLabel),
      buttonHref: String(settings.homepageHeroButtonHref || defaultHomepage.hero.buttonHref),
      badge: String(settings.homepageHeroBadge || defaultHomepage.hero.badge),
    },
    mysteryBox: {
      ...defaultHomepage.mysteryBox,
      enabled: Boolean(settings.homepageMysteryBoxEnabled && mysteryImage),
      image: mysteryImage || null,
      alt: String(settings.homepageMysteryBoxImageAlt || settings.homepageMysteryBoxImage?.altText || ''),
      eyebrow: String(settings.homepageMysteryBoxEyebrow || defaultHomepage.mysteryBox.eyebrow),
      title: String(settings.homepageMysteryBoxTitle || defaultHomepage.mysteryBox.title),
      description: String(settings.homepageMysteryBoxDescription || defaultHomepage.mysteryBox.description),
    },
  }
}

export async function getAdminSiteSettings(payload: { findGlobal: Function }) {
  if (contentSources.site !== 'admin') return defaultSite
  const settings = await payload.findGlobal({ slug: 'marketing-settings', depth: 0, overrideAccess: true })
  return {
    ...defaultSite,
    brandName: String(settings.siteBrandName || defaultSite.brandName),
    customerEmail: String(settings.siteCustomerEmail || defaultSite.customerEmail),
    socialLinks: Array.isArray(settings.siteSocialLinks) ? settings.siteSocialLinks : defaultSite.socialLinks,
    defaultSeo: {
      title: String(settings.siteDefaultSeoTitle || defaultSite.defaultSeo.title),
      description: String(settings.siteDefaultSeoDescription || defaultSite.defaultSeo.description),
    },
  }
}
