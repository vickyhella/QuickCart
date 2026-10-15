"use client";

import { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";

export default function useCartShippingQuote() {
  const { cartItems } = useAppContext();
  const [result, setResult] = useState({
    signature: "",
    quote: null,
    error: "",
  });
  const signature = JSON.stringify(
    Object.values(cartItems).filter((line) => line?.quantity > 0),
  );

  useEffect(() => {
    const items = JSON.parse(signature);
    if (!items.length) return;
    let active = true;
    fetch("/api/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Unable to estimate shipping.");
        if (active) setResult({ signature, quote: result, error: "" });
      })
      .catch((requestError) => {
        if (active)
          setResult({ signature, quote: null, error: requestError.message });
      });
    return () => {
      active = false;
    };
  }, [signature]);

  return result.signature === signature
    ? { quote: result.quote, error: result.error }
    : { quote: null, error: "" };
}
