import React from 'react'
import Image from 'next/image';
import { useAppContext } from '@/context/AppContext';

const ProductCard = ({ product }) => {

    const { currency, router } = useAppContext()

    return (
        <div
            onClick={() => { router.push('/product/' + product._id); scrollTo(0, 0) }}
            className="flex flex-col items-start gap-2 w-full cursor-pointer group"
        >
            <div className="relative bg-[#f5f0ec] rounded-xl w-full aspect-[4/5] overflow-hidden">
                <Image
                    src={product.image[0]}
                    alt={product.name}
                    className="group-hover:scale-105 transition duration-500 object-cover w-full h-full"
                    width={720}
                    height={900}
                />
                {product.isNew && <span className="absolute top-3 left-3 bg-white px-3 py-1 text-[10px] uppercase tracking-widest">New</span>}
                {product.price > product.offerPrice && <span className="absolute top-3 right-3 bg-[#8b4c4c] text-white px-3 py-1 text-[10px] uppercase tracking-widest">Sale</span>}
            </div>

            <div className="w-full pt-1">
                <p className="font-medium text-[#302522] truncate">{product.name}</p>
                <p className="text-xs text-[#827873] mt-1">{[product.length, product.shape].filter(Boolean).map((value) => value.replace('-', ' ')).join(' · ') || 'Handmade press-on nails'}</p>
                <div className="flex items-center gap-2 mt-2 text-sm">
                    <p className="font-medium">{currency || '$'}{Number(product.offerPrice).toFixed(2)}</p>
                    {product.price > product.offerPrice && <p className="text-[#998f89] line-through">{currency || '$'}{Number(product.price).toFixed(2)}</p>}
                </div>
            </div>
        </div>
    )
}

export default ProductCard
