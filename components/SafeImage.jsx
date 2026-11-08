'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { normalizeStorefrontImageSource } from '@/lib/storefront-image'

const remoteImageBases = JSON.parse(process.env.NEXT_PUBLIC_MEDIA_IMAGE_BASES || '[]')
const supportedRemote = (src) => remoteImageBases.some((base) => src.startsWith(base)) || /^https:\/\/(res\.cloudinary\.com|raw\.githubusercontent\.com)\//.test(src)

const fallback = '/nail-placeholder.svg'

export default function SafeImage({ src, alt = '', unoptimized = undefined, ...props }) {
  const imageSrc = normalizeStorefrontImageSource(src) || fallback
  const [currentSrc, setCurrentSrc] = useState(imageSrc)
  useEffect(() => setCurrentSrc(imageSrc), [imageSrc])
  return <Image {...props} unoptimized={unoptimized ?? (typeof currentSrc === 'string' && /^https?:/.test(currentSrc) && !supportedRemote(currentSrc))} src={currentSrc} alt={alt} onError={() => { if (currentSrc !== fallback) setCurrentSrc(fallback) }} />
}
