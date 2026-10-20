import React from "react";
import ProductCard from "./ProductCard";
import { useAppContext } from "@/context/AppContext";

const HomeProducts = () => {

  const { products, productsStatus, fetchProductData, router } = useAppContext()

  return (
    <div className="flex flex-col items-center pt-14">
      <p className="text-2xl font-medium text-left w-full">Popular products</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 flex-col items-center gap-6 mt-6 pb-14 w-full">
        {productsStatus === 'loading' ? <p className="col-span-full py-10 text-center text-sm text-[#786963]" role="status">Loading designs…</p> : null}
        {productsStatus === 'error' ? <div className="col-span-full py-10 text-center text-sm text-[#786963]" role="alert"><p>We couldn’t load the collection.</p><button type="button" onClick={fetchProductData} className="mt-3 underline">Try again</button></div> : null}
        {products.map((product) => <ProductCard key={product._id} product={product} />)}
      </div>
      <button onClick={() => { router.push('/all-products') }} className="px-12 py-2.5 border rounded text-gray-500/70 hover:bg-slate-50/90 transition">
        See more
      </button>
    </div>
  );
};

export default HomeProducts;
