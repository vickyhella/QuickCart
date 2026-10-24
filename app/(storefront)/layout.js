import "../globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Ginny Nana | Handmade Press-On Nails",
  description: "Natural-looking, reusable press-on nails designed for everyday elegance.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({ children }) {
  return (
      <html lang="en" data-scroll-behavior="smooth">
        <body className="storefront-theme font-sans antialiased">
          <Toaster position="bottom-right" toastOptions={{ duration: 3600 }} />
          <AppContextProvider>
            {children}
          </AppContextProvider>
        </body>
      </html>
  );
}
