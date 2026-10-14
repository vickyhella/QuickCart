import '../globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: 'Product Studio | Ginny Nana',
  description: 'Manage the Ginny Nana product catalog.',
}

export default function StudioLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-[#302522]">
        <Toaster position="bottom-right" toastOptions={{ duration: 3600 }} />
        {children}
      </body>
    </html>
  )
}
