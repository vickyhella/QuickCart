'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

const fallback = '/nail-placeholder.svg'

export default function SafeImage({ src, alt = '', ...props }) {
  const [currentSrc, setCurrentSrc] = useState(src || fallback)
  useEffect(() => setCurrentSrc(src || fallback), [src])
  return <Image {...props} src={currentSrc} alt={alt} onError={() => { if (currentSrc !== fallback) setCurrentSrc(fallback) }} />
}
