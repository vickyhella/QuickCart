'use client'

import { useAppContext } from '@/context/AppContext'

export default function OrderSummary() {
  const { currency, router, getCartCount, getCartAmount } = useAppContext()
  const symbol = currency || '$'
  const subtotal = getCartAmount()

  return (
    <aside className="w-full md:w-96 bg-[#f8f3ef] p-5 rounded-xl h-fit">
      <h2 className="font-serif text-2xl text-[#302522]">Order summary</h2>
      <div className="space-y-4 mt-6 text-sm">
        <div className="flex justify-between"><span className="text-[#6e5c55]">Items ({getCartCount()})</span><span>{symbol}{subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-[#6e5c55]">Shipping</span><span>Calculated at checkout</span></div>
        <div className="flex justify-between"><span className="text-[#6e5c55]">Tax</span><span>Included in prices</span></div>
        <div className="flex justify-between border-t border-[#d8c9c1] pt-4 text-base font-medium"><span>Subtotal</span><span>{symbol}{subtotal.toFixed(2)}</span></div>
      </div>
      <button
        disabled={!getCartCount()}
        onClick={() => router.push('/checkout')}
        className="w-full mt-6 rounded-full bg-[#754b43] text-white py-3 hover:bg-[#5e3c36] disabled:opacity-50"
      >
        Continue to checkout
      </button>
    </aside>
  )
}
