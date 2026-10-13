import '../globals.css'
import './marketing-studio.css'

export const metadata = {
  title: 'Marketing Studio | Ginny Nana',
  description: 'Schedule and review social publishing for Ginny Nana.',
}

export default function MarketingStudioLayout({ children }) {
  return <html lang="en"><body className="font-sans antialiased text-[#302522]">{children}</body></html>
}
