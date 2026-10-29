"use client";

import { useAppContext } from "@/context/AppContext";
import PaymentMethods from "@/components/PaymentMethods";
import useCartShippingQuote from "@/hooks/useCartShippingQuote";

export default function OrderSummary() {
    const { currency, router, getCartCount, getCartAmount, shippingSettings } = useAppContext();
    const handling = shippingSettings.handlingBusinessDays
    const transit = shippingSettings.transitBusinessDays
    const shippingEstimate = `estimated ${handling.minimum + transit.minimum}–${handling.maximum + transit.maximum} business days including preparation`
    const symbol = currency || "$";
    const subtotal = getCartAmount();
    const { quote, error } = useCartShippingQuote();
    const shipping = quote ? (quote.shippingTotal ? `${symbol}${quote.shippingTotal.toFixed(2)}` : "Free") : error ? "Calculated at checkout" : "Calculating…";

    return (
        <aside className="w-full md:w-96 bg-[#f8f3ef] p-5 rounded-xl h-fit">
            <h2 className="font-serif text-2xl text-[#302522]">
                Order summary
            </h2>
            <div className="space-y-4 mt-6 text-sm">
                <div className="flex justify-between">
                    <span className="text-[#6e5c55]">
                        Items ({getCartCount()})
                    </span>
                    <span>
                        {symbol}
                        {subtotal.toFixed(2)}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-[#6e5c55]">Shipping <span className="text-xs text-[#786963]">({shippingEstimate})</span></span>
                    <span>{shipping}</span>
                </div>
                {error && <p className="-mt-2 text-xs text-[#786963]">{error}</p>}
                <div className="flex justify-between">
                    <span className="text-[#6e5c55]">Tax</span>
                    <span>Included in prices</span>
                </div>
                <div className="flex justify-between border-t border-[#d8c9c1] pt-4 text-base font-medium">
                    <span>Subtotal</span>
                    <span>
                        {symbol}
                        {subtotal.toFixed(2)}
                    </span>
                </div>
            </div>
            <button
                disabled={!getCartCount()}
                onClick={() => router.push("/checkout")}
                className="ui-button ui-button--primary w-full mt-6"
            >
                Continue to checkout
            </button>
            <PaymentMethods className="justify-center mt-3" />
        </aside>
    );
}
