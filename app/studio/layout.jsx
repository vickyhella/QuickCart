import '../globals.css'

export const metadata = {
  title: 'Product Studio | Ginny Nana',
  description: 'Manage the Ginny Nana product catalog.',
}

export default function StudioLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-[#302522]">{children}</body>
    </html>
  )
}
