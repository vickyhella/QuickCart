import React from 'react'
import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
import { useAppContext } from '@/context/AppContext';
import { formatDimension } from '@/lib/format-dimension'
import { productCardDimensions } from '@/lib/product-dimensions'
import { getPriceDetails } from '@/lib/product-pricing'

const ProductCard = ({ product }) => {

    const { currency } = useAppContext()
    const pricing = getPriceDetails(product)

    return (
        <Link
            href={'/product/' + (product.slug || product._id)}
            className="store-product-card group w-full"
        >
            <div className="store-product-card__media">
                <SafeImage
                    unoptimized
                    src={product.image?.[0] || '/media/ginny-nana-press-on-nails-test1-01.webp'}
                    alt={product.imageAlt?.[0] || product.name}
                    className="store-product-card__image"
                    width={720}
                    height={900}
                />
                <div className="store-product-card__badge-stack">
                    {product.isNew && <span className="store-product-card__badge">Just dropped</span>}
                    <span className="store-product-card__badge">Handmade set</span>
                </div>
                {pricing.onSale && <span className="store-product-card__badge store-product-card__badge--sale">On sale</span>}
            </div>

            <div className="store-product-card__details">
                <div className="store-product-card__copy">
                    <h2 className="store-product-card__name">{product.name}</h2>
                    <p className="store-product-card__meta">{productCardDimensions(product).map(formatDimension).join(' · ') || 'Handmade press-on set'}</p>
                </div>
                <div className="store-product-card__price">{currency || '$'}{Number(pricing.currentPrice).toFixed(2)}{pricing.onSale && <s>{currency || '$'}{Number(pricing.price).toFixed(2)}</s>}</div>
            </div>
        </Link>
    )
}

export default ProductCard
