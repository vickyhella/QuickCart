import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-[#eee5df] bg-[#fffdfa] text-[#6e5c55]">
      <div className="grid gap-10 md:grid-cols-3 px-5 md:px-12 lg:px-20 py-12">
        <div>
          <Link href="/" className="font-serif text-2xl text-[#302522]">ginny nana</Link>
          <p className="text-sm leading-6 mt-4 max-w-sm">Natural-looking, reusable press-on nails designed for everyday elegance.</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-[#302522]">Explore</h2>
          <div className="text-sm flex flex-col gap-3 mt-4">
            <Link href="/all-products">All products</Link>
            <Link href="/all-products?isNew=true">New arrivals</Link>
            <Link href="/all-products?sale=true">On sale</Link>
            <Link href="/about-us/">About us</Link>
            <Link href="/contact-us/">Contact us</Link>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-medium text-[#302522]">Customer care</h2>
          <div className="text-sm flex flex-col gap-3 mt-4">
            <Link href="/privacy-policy/">Privacy policy</Link>
            <Link href="/terms-conditions/">Terms of service</Link>
            <Link href="/refunds-returns/">Refunds & returns</Link>
            <Link href="/shipping-policy/">Shipping policy</Link>
            <a href="mailto:ginnynana@hotmail.com">ginnynana@hotmail.com</a>
          </div>
        </div>
      </div>
      <p className="border-t border-[#eee5df] px-5 py-4 text-center text-xs">© {new Date().getFullYear()} Ginny Nana</p>
    </footer>
  )
}
