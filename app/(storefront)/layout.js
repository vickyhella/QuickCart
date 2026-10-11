import "../globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Ginny Nana | Handmade Press-On Nails",
  description: "Natural-looking, reusable press-on nails designed for everyday elegance.",
};

export default function RootLayout({ children }) {
  return (
      <html lang="en">
        <body className="font-sans antialiased text-gray-700">
          <Toaster position="bottom-right" toastOptions={{ duration: 3600 }} />
          <AppContextProvider>
            {children}
          </AppContextProvider>
        </body>
      </html>
  );
}
