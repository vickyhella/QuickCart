'use client'
import { userDummyData } from "@/assets/assets";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

export const AppContext = createContext();

export const useAppContext = () => {
    return useContext(AppContext)
}

export const AppContextProvider = (props) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY
    const router = useRouter()

    const [products, setProducts] = useState([])
    const [userData, setUserData] = useState(false)
    const [isSeller, setIsSeller] = useState(true)
    const [cartItems, setCartItems] = useState({})

    const fetchProductData = async () => {
        try {
            const response = await fetch('/api/products?limit=100&depth=1&sort=-createdAt&where[status][equals]=published', { cache: 'no-store' })
            if (!response.ok) throw new Error('Could not load products')
            const { docs = [] } = await response.json()
            setProducts(docs.map((product) => {
                const featured = product.featuredImage && typeof product.featuredImage === 'object'
                    ? product.featuredImage.url
                    : null
                const gallery = Array.isArray(product.gallery)
                    ? product.gallery.map((image) => typeof image === 'object' ? image?.url : null)
                    : []
                const images = [featured, ...gallery].filter(Boolean)
                const currentPrice = Number(product.price || 0)
                return {
                    ...product,
                    _id: String(product.id),
                    name: product.title,
                    image: images.length ? images : ['/nail-placeholder.svg'],
                    offerPrice: currentPrice,
                    price: Number(product.compareAtPrice || currentPrice),
                }
            }))
        } catch (error) {
            console.error('Product loading failed:', error)
            setProducts([])
        }
    }

    const fetchUserData = async () => {
        setUserData(userDummyData)
    }

    const addToCart = async (itemId) => {

        let cartData = structuredClone(cartItems);
        if (cartData[itemId]) {
            cartData[itemId] += 1;
        }
        else {
            cartData[itemId] = 1;
        }
        setCartItems(cartData);

    }

    const updateCartQuantity = async (itemId, quantity) => {

        let cartData = structuredClone(cartItems);
        if (quantity === 0) {
            delete cartData[itemId];
        } else {
            cartData[itemId] = quantity;
        }
        setCartItems(cartData)

    }

    const getCartCount = () => {
        let totalCount = 0;
        for (const items in cartItems) {
            if (cartItems[items] > 0) {
                totalCount += cartItems[items];
            }
        }
        return totalCount;
    }

    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            let itemInfo = products.find((product) => product._id === items);
            if (cartItems[items] > 0) {
                totalAmount += itemInfo.offerPrice * cartItems[items];
            }
        }
        return Math.floor(totalAmount * 100) / 100;
    }

    useEffect(() => {
        fetchProductData()
    }, [])

    useEffect(() => {
        fetchUserData()
    }, [])

    const value = {
        currency, router,
        isSeller, setIsSeller,
        userData, fetchUserData,
        products, fetchProductData,
        cartItems, setCartItems,
        addToCart, updateCartQuantity,
        getCartCount, getCartAmount
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}
