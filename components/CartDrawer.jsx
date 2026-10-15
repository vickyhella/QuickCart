"use client";

import { useEffect } from "react";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import { useAppContext } from "@/context/AppContext";
import { formatDimension } from "@/lib/format-dimension";
import useCartShippingQuote from "@/hooks/useCartShippingQuote";

export default function CartDrawer({ open, onClose }) {
  const {
    products,
    cartItems,
    currency,
    updateCartQuantity,
    getCartAmount,
    getCartCount,
  } = useAppContext();
  const { quote, error } = useCartShippingQuote();
  const symbol = currency || "$";
  const lines = Object.entries(cartItems).flatMap(([key, line]) => {
    const product = products.find((item) => item._id === line?.productId);
    if (!product || line?.quantity <= 0) return [];
    const variant = product.variants?.find(
      (item) => String(item.id) === line.variantId,
    );
    const price = Number(variant?.price ?? product.offerPrice ?? 0);
    return [{ key, line, product, variant, price }];
  });

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" aria-label="Shopping cart">
      <button
        type="button"
        aria-label="Close cart"
        onClick={onClose}
        className="absolute inset-0 bg-[#261a22]/40"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#fffdfa] text-[#302522] shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-[#eadfdb] px-5 py-4">
          <h2 id="cart-drawer-title" className="font-serif text-2xl">
            Your bag{" "}
            <span className="font-sans text-sm text-[#786963]">
              ({getCartCount()})
            </span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="rounded-full px-3 py-2 text-xl hover:bg-[#f8f3ef]"
          >
            ×
          </button>
        </header>
        {lines.length ? (
          <>
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {lines.map(({ key, line, product, variant, price }) => (
                <article key={key} className="flex gap-4">
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-[#f8f3ef]">
                    <SafeImage
                      unoptimized
                      src={variant?.image?.url || product.image?.[0]}
                      alt={product.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="mt-1 text-xs text-[#786963]">
                      {[
                        formatDimension(line.length),
                        formatDimension(line.shape),
                        line.size?.toUpperCase(),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="mt-2 text-sm">
                      {symbol}
                      {price.toFixed(2)}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-sm">
                      <button
                        type="button"
                        aria-label={`Decrease ${product.name} quantity`}
                        onClick={() =>
                          updateCartQuantity(key, line.quantity - 1)
                        }
                        className="h-7 w-7 rounded-full border border-[#d8c9c1]"
                      >
                        −
                      </button>
                      <span>{line.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Increase ${product.name} quantity`}
                        onClick={() =>
                          updateCartQuantity(key, line.quantity + 1)
                        }
                        className="h-7 w-7 rounded-full border border-[#d8c9c1]"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(key, 0)}
                        className="ml-auto text-xs underline underline-offset-2"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <footer className="border-t border-[#eadfdb] bg-[#fffdfa] px-5 py-5">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>
                  {symbol}
                  {getCartAmount().toFixed(2)}
                </span>
              </div>
              <div className="mt-3 flex justify-between gap-3 text-sm">
                <span>
                  Shipping{" "}
                  <span className="text-xs text-[#786963]">
                    (estimated 7-15 business days)
                  </span>
                </span>
                <span className="shrink-0">
                  {quote
                    ? quote.shippingTotal
                      ? `${symbol}${quote.shippingTotal.toFixed(2)}`
                      : "Free"
                    : error
                      ? "Calculated at checkout"
                      : "Calculating…"}
                </span>
              </div>
              {error && <p className="mt-2 text-xs text-[#786963]">{error}</p>}
              <p className="mt-3 text-xs text-[#786963]">
                Final shipping is confirmed at checkout.
              </p>
              <Link
                href="/checkout"
                onClick={onClose}
                className="mt-4 block rounded-full bg-[#754b43] py-3 text-center text-sm text-white hover:bg-[#5e3c36]"
              >
                Continue to checkout
              </Link>
              <Link
                href="/cart"
                onClick={onClose}
                className="mt-3 block text-center text-sm underline underline-offset-2"
              >
                View full cart
              </Link>
            </footer>
          </>
        ) : (
          <div className="grid flex-1 place-items-center p-8 text-center">
            <div>
              <p className="font-serif text-xl">Your bag is empty</p>
              <Link
                href="/all-products"
                onClick={onClose}
                className="mt-4 inline-block underline underline-offset-2"
              >
                Browse products
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
