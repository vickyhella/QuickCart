import React from 'react'
import SafeImage from '@/components/SafeImage'
import { useAppContext } from '@/context/AppContext';
import { formatDimension } from '@/lib/format-dimension'
import { productCardDimensions } from '@/lib/product-dimensions'
import { getPriceDetails } from '@/lib/product-pricing'

const ProductCard = ({ product }) => {

    const { currency, router } = useAppContext()
    const pricing = getPriceDetails(product)

    return (
        <div
            onClick={() => { router.push('/product/' + (product.slug || product._id)); scrollTo(0, 0) }}
            className="group flex w-full cursor-pointer flex-col items-start gap-2.5"
        >
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#f0e8e5]">
                <SafeImage
                    unoptimized
                    src={product.image[0]}
                    alt={product.imageAlt?.[0] || product.name}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                    width={720}
                    height={900}
                />
                {product.isNew && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[9px] uppercase tracking-[.16em] text-[#392631] backdrop-blur">New</span>}
                {pricing.onSale && <span className="absolute right-3 top-3 rounded-full bg-[#985c70] px-3 py-1.5 text-[9px] uppercase tracking-[.16em] text-white">Sale</span>}
            </div>

            <div className="w-full pt-1">
                <p className="font-medium text-[#302522] truncate">{product.name}</p>
                <p className="text-xs text-[#827873] mt-1">{productCardDimensions(product).map(formatDimension).join(' · ') || 'Handmade press-on nails'}</p>
                <div className="flex items-center gap-2 mt-2 text-sm">
                    <p className="font-medium">{currency || '$'}{Number(pricing.currentPrice).toFixed(2)}</p>
                    {pricing.onSale && <p className="text-[#998f89] line-through">{currency || '$'}{Number(pricing.price).toFixed(2)}</p>}
                </div>
            </div>
        </div>
    )
}

export default ProductCard
