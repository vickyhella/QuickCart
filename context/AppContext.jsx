'use client'
import { userDummyData } from "@/assets/assets";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

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

    useEffect(() => {
        try {
            const saved = window.localStorage.getItem('ginnynana-cart')
            if (saved) {
                const parsed = JSON.parse(saved)
                const migrated = Object.fromEntries(Object.entries(parsed).map(([key, value]) => {
                    if (typeof value === 'number') {
                        return [`${key}:`, { productId: String(key), variantId: '', length: '', shape: '', quantity: value }]
                    }
                    return [key, value]
                }))
                setCartItems(migrated)
            }
        } catch (error) {
            console.error('Cart restore failed:', error)
        }
    }, [])

    useEffect(() => {
        window.localStorage.setItem('ginnynana-cart', JSON.stringify(cartItems))
    }, [cartItems])

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

    const addToCart = async (itemId, variant) => {
        const line = {
            productId: String(itemId),
            variantId: variant?.id ? String(variant.id) : '',
            length: variant?.length || '',
            shape: variant?.shape || '',
            size: variant?.size || '',
            quantity: 1,
        }
        const lineKey = `${line.productId}:${line.variantId || `${line.length}-${line.shape}-${line.size}`}`
        setCartItems((current) => ({
            ...current,
            [lineKey]: {
                ...line,
                quantity: (current[lineKey]?.quantity || 0) + 1,
            },
        }))
    const productName = products.find((product) => product._id === line.productId)?.name || 'Product'
    toast.success(`${productName} added to cart`)
    }

    const updateCartQuantity = async (lineKey, quantity) => {
        setCartItems((current) => {
            const next = { ...current }
            if (quantity <= 0) delete next[lineKey]
            else if (next[lineKey]) next[lineKey] = { ...next[lineKey], quantity }
            return next
        })
    }

    const getCartCount = () => {
        let totalCount = 0;
        for (const lineKey in cartItems) {
            if (cartItems[lineKey]?.quantity > 0) {
                totalCount += cartItems[lineKey].quantity;
            }
        }
        return totalCount;
    }

    const getCartAmount = () => {
        let totalAmount = 0;
        for (const lineKey in cartItems) {
            const line = cartItems[lineKey]
            const product = products.find((item) => item._id === line?.productId)
            const variant = product?.variants?.find((item) => String(item.id) === line?.variantId)
            const price = Number(variant?.price ?? product?.offerPrice ?? 0)
            if (product && line?.quantity > 0) totalAmount += price * line.quantity
        }
        return Math.round(totalAmount * 100) / 100;
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
