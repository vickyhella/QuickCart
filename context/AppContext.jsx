'use client'
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getPriceDetails } from '@/lib/product-pricing'
import { toStorefrontProduct } from '@/lib/storefront-product'

export const AppContext = createContext();

export const useAppContext = () => {
    return useContext(AppContext)
}

export const AppContextProvider = (props) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY
    const router = useRouter()

    const [products, setProducts] = useState([])
    const [storefrontNavigation, setStorefrontNavigation] = useState({ lengths: [], shapes: [], pages: [] })
    const [storefrontNavigationStatus, setStorefrontNavigationStatus] = useState('loading')
    const [productsStatus, setProductsStatus] = useState('loading')
    const [cartItems, setCartItems] = useState({})
    const [cartLoaded, setCartLoaded] = useState(false)

    useEffect(() => {
        try {
            const saved = window.localStorage.getItem('ginnynana-cart')
            if (saved) {
                const parsed = JSON.parse(saved)
                const migrated = Object.fromEntries(Object.entries(parsed).map(([key, value]) => {
                    if (typeof value === 'number') {
                        return [`${key}:`, { productId: String(key), variantId: '', length: '', shape: '', size: '', quantity: Math.max(0, Math.floor(Number(value) || 0)) }]
                    }
                    return [key, { ...value, quantity: Math.max(0, Math.floor(Number(value?.quantity) || 0)) }]
                }))
                setCartItems(migrated)
            }
        } catch (error) {
            console.error('Cart restore failed:', error)
        } finally {
            setCartLoaded(true)
        }
    }, [])

    useEffect(() => {
        if (!cartLoaded) return
        window.localStorage.setItem('ginnynana-cart', JSON.stringify(cartItems))
    }, [cartItems, cartLoaded])

    const fetchProductData = async () => {
        setProductsStatus('loading')
        try {
            const response = await fetch('/api/storefront/products', { cache: 'no-store' })
            if (!response.ok) throw new Error('Could not load products')
            const { docs = [] } = await response.json()
            setProducts(docs.map(toStorefrontProduct))
            setProductsStatus('loaded')
        } catch (error) {
            console.error('Product loading failed:', error)
            setProducts([])
            setProductsStatus('error')
        }
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
                quantity: Math.max(0, Math.floor(Number(current[lineKey]?.quantity) || 0)) + 1,
            },
        }))
    const productName = products.find((product) => product._id === line.productId)?.name || 'Product'
    toast.custom((toastState) => (
        <div style={{ width: 'min(360px, calc(100vw - 32px))', display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px', borderRadius: 16, background: '#fffdfa', color: '#302522', border: '1px solid #eadfdb', boxShadow: '0 18px 50px rgba(48,27,38,.18)', opacity: toastState.visible ? 1 : 0, transform: toastState.visible ? 'translateY(0)' : 'translateY(8px)', transition: 'all .2s ease' }}>
            <span style={{ display: 'grid', placeItems: 'center', flex: '0 0 38px', height: 38, borderRadius: 99, background: '#edf3ec', color: '#47734d', fontSize: 18 }}>✓</span>
            <div style={{ flex: 1, minWidth: 0 }}><strong style={{ display: 'block', fontSize: 14 }}>Added to your bag</strong><span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 3, color: '#786963', fontSize: 12 }}>{productName}</span></div>
            <button type="button" onClick={() => { toast.dismiss(toastState.id); router.push('/cart') }} style={{ border: 0, background: 'none', color: '#8b5e70', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>View bag</button>
        </div>
    ), { position: 'bottom-right', duration: 3600 })
    }

    const updateCartQuantity = async (lineKey, quantity) => {
        setCartItems((current) => {
            const next = { ...current }
            const normalizedQuantity = Math.floor(Number(quantity) || 0)
            if (normalizedQuantity <= 0) delete next[lineKey]
            else if (next[lineKey]) next[lineKey] = { ...next[lineKey], quantity: normalizedQuantity }
            return next
        })
    }

    const getCartCount = () => {
        if (!cartLoaded || productsStatus !== 'loaded') return 0
        return Object.values(cartItems).reduce((total, line) => {
            if (!products.some((product) => String(product._id) === String(line?.productId))) return total
            const quantity = Math.floor(Number(line?.quantity) || 0)
            return total + Math.max(0, quantity)
        }, 0)
    }

    const getCartAmount = () => {
        let totalAmount = 0;
        for (const lineKey in cartItems) {
            const line = cartItems[lineKey]
            const product = products.find((item) => item._id === line?.productId)
            const variant = product?.variants?.find((item) => String(item.id) === line?.variantId)
            const price = getPriceDetails(product || {}, variant).currentPrice || 0
            if (product && line?.quantity > 0) totalAmount += price * line.quantity
        }
        return Math.round(totalAmount * 100) / 100;
    }

    useEffect(() => {
        fetchProductData()
        let lastNavigationFetch = 0
        const fetchNavigation = () => {
            lastNavigationFetch = Date.now()
            fetch('/api/storefront/navigation', { cache: 'no-store' })
            .then((response) => {
                if (!response.ok) throw new Error('Could not load storefront navigation')
                return response.json()
            })
            .then((data) => {
                setStorefrontNavigation(data)
                setStorefrontNavigationStatus('loaded')
            })
            .catch(() => {
                setStorefrontNavigationStatus('error')
            })
        }
        const refreshNavigationOnFocus = () => {
            if (Date.now() - lastNavigationFetch >= 5 * 60 * 1000) fetchNavigation()
        }
        fetchNavigation()
        window.addEventListener('focus', refreshNavigationOnFocus)
        return () => window.removeEventListener('focus', refreshNavigationOnFocus)
    }, [])

    const value = {
        currency, router,
        products, productsStatus, fetchProductData, storefrontNavigation, storefrontNavigationStatus,
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
