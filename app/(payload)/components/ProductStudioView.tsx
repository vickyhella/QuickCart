import ProductStudio from '../../studio/product-studio'
import { Toaster } from 'react-hot-toast'

export function ProductStudioView() {
  return <>
    <Toaster position="bottom-right" toastOptions={{ duration: 3600 }} />
    <ProductStudio />
  </>
}
