import "../globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";
import siteSettings from "@/config/site.json";
import contentSources from "@/config/content-sources.json";
import shippingConfig from "@/config/shipping.json";
import { getPayload } from 'payload';
import config from '@/payload.config';
import { getShippingSettings } from '@/lib/shipping-config';
import { connection } from 'next/server';
import homepageConfig from '@/config/homepage.json';
import { getAdminHomepageSettings, getAdminSiteSettings } from '@/lib/storefront-content';

export async function generateMetadata() {
  let activeSiteSettings = siteSettings;
  if (contentSources.site === 'admin') {
    await connection();
    activeSiteSettings = await getAdminSiteSettings(await getPayload({ config }));
  }
  return {
  title: activeSiteSettings.defaultSeo.title,
  description: activeSiteSettings.defaultSeo.description,
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  };
}

export default async function RootLayout({ children }) {
  let shippingSettings = shippingConfig;
  let homepageSettings = homepageConfig;
  let activeSiteSettings = siteSettings;
  if (contentSources.shipping === 'admin' || contentSources.homepage === 'admin' || contentSources.site === 'admin') {
    await connection();
    const payload = await getPayload({ config });
    if (contentSources.shipping === 'admin') shippingSettings = await getShippingSettings(payload);
    if (contentSources.homepage === 'admin') homepageSettings = await getAdminHomepageSettings(payload);
    if (contentSources.site === 'admin') activeSiteSettings = await getAdminSiteSettings(payload);
  }
  return (
      <html lang="en" data-scroll-behavior="smooth">
        <body className="storefront-theme font-sans antialiased">
          <Toaster position="bottom-right" toastOptions={{ duration: 3600 }} />
          <AppContextProvider initialShippingSettings={shippingSettings} initialHomepageSettings={homepageSettings} initialSiteSettings={activeSiteSettings}>
            {children}
          </AppContextProvider>
        </body>
      </html>
  );
}
