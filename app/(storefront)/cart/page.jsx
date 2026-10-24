'use client'
import React from "react";
import OrderSummary from "@/components/OrderSummary";
import SafeImage from "@/components/SafeImage";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAppContext } from "@/context/AppContext";
import { formatDimension } from "@/lib/format-dimension";
import { getPriceDetails } from '@/lib/product-pricing'

const Cart = () => {

  const { products, router, cartItems, updateCartQuantity, getCartCount } = useAppContext();

  return (
    <main>
      <Navbar />
      <div className="flex flex-col md:flex-row gap-10 px-6 md:px-16 lg:px-32 pt-14 mb-20">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-8 border-b border-[var(--gn-border)] pb-6">
            <h1 className="font-serif text-4xl">Your cart</h1>
            <p className="text-sm text-[var(--gn-muted)]">{getCartCount()} {getCartCount() === 1 ? 'item' : 'items'}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="text-left">
                <tr>
                  <th className="text-nowrap pb-6 md:px-4 px-1 text-[var(--gn-muted)] font-medium">
                    Product Details
                  </th>
                  <th className="pb-6 md:px-4 px-1 text-[var(--gn-muted)] font-medium">
                    Price
                  </th>
                  <th className="pb-6 md:px-4 px-1 text-[var(--gn-muted)] font-medium">
                    Quantity
                  </th>
                  <th className="pb-6 md:px-4 px-1 text-[var(--gn-muted)] font-medium">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(cartItems).map((lineKey) => {
                  const line = cartItems[lineKey];
                  const product = products.find(product => product._id === line?.productId);
                  const variant = product?.variants?.find(item => String(item.id) === line?.variantId);
                  const unitPrice = getPriceDetails(product || {}, variant).currentPrice || 0;

                  if (!product || line?.quantity <= 0) return null;

                  return (
                    <tr key={lineKey}>
                      <td className="flex items-center gap-4 py-4 md:px-4 px-1">
                        <div>
                          <div className="rounded-xl overflow-hidden bg-[var(--gn-lavender-soft)] p-2">
                            <SafeImage
                              unoptimized
                              src={variant?.image?.url || product.image[0]}
                              alt=""
                              className="w-16 h-auto object-cover"
                              width={1280}
                              height={720}
                            />
                          </div>
                          <button
                            className="ui-text-action ui-text-action--danger md:hidden mt-1"
                              onClick={() => updateCartQuantity(lineKey, 0)}
                          >
                            Remove
                          </button>
                        </div>
                        <div className="text-sm hidden md:block">
                            <p className="font-serif text-xl text-[var(--gn-ink)]">{product.name}</p>
                            {(line.length || line.shape || line.size) && <p className="text-xs text-[var(--gn-muted)] mt-1">{[formatDimension(line.shape), formatDimension(line.length), line.size?.toUpperCase()].filter(Boolean).join(' · ')}</p>}
                            <button
                            className="ui-text-action ui-text-action--danger mt-1"
                              onClick={() => updateCartQuantity(lineKey, 0)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                      <td className="py-4 md:px-4 px-1 text-[var(--gn-muted)]">${unitPrice.toFixed(2)}</td>
                      <td className="py-4 md:px-4 px-1">
                        <div className="flex items-center md:gap-2 gap-1">
                          <button aria-label={`Decrease ${product.name} quantity`} className="ui-quantity-control" onClick={() => updateCartQuantity(lineKey, line.quantity - 1)}>−</button>
                          <input aria-label={`${product.name} quantity`} onChange={e => updateCartQuantity(lineKey, Number(e.target.value))} type="number" min="1" value={line.quantity} className="w-12 border text-center appearance-none" />
                          <button aria-label={`Increase ${product.name} quantity`} className="ui-quantity-control" onClick={() => updateCartQuantity(lineKey, line.quantity + 1)}>+</button>
                        </div>
                      </td>
                      <td className="py-4 md:px-4 px-1 text-[var(--gn-muted)]">${(unitPrice * line.quantity).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button onClick={()=> router.push('/all-products')} className="ui-button ui-button--secondary mt-6">
            Continue shopping
          </button>
        </div>
        <OrderSummary />
      </div>
      <Footer />
    </main>
  );
};

export default Cart;
