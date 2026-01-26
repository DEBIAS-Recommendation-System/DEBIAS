import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";
import Hydration from "@/provider/MainHydration";
import { ToastContainer, ToastProvider } from "@/hooks/useToast";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import Store from "@/provider/QCStore";
import Script from "next/script";

const lato = Lato({
  weight: ["100", "300", "400", "700", "900"],
  subsets: ["latin"],
  style: ["normal"],
});

export const metadata: Metadata = {
  title: "DEBIAS Shop - Your Trusted Online Marketplace",
  description:
    "Discover thousands of products across all categories at DEBIAS Shop. From electronics to clothing, home goods to computers - shop with confidence and get the best deals online.",
  generator: "Next.js",
  manifest: "/manifest.json",
  keywords: [
    "online shopping",
    "ecommerce",
    "marketplace",
    "electronics",
    "clothing",
    "computers",
    "appliances",
    "best deals",
    "online store",
    "shopping online",
  ],
  authors: [
    {
      name: "DEBIAS Shop",
      url: "https://debias-shop.com",
    },
  ],
  icons: {
    icon: "/logo/logo-2.png",
    apple: "/logo/logo-2.png",
  },
  openGraph: {
    title: "DEBIAS Shop - Your Trusted Online Marketplace",
    description:
      "Shop thousands of products with confidence. Electronics, clothing, home goods, and more at competitive prices.",
    url: "https://debias-shop.com",
    siteName: "DEBIAS Shop",
    images: [
      {
        url: "/logo/logo-2.png",
        width: 1200,
        height: 630,
        alt: "DEBIAS Shop - Online Marketplace",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  alternates: {
    canonical: "https://debias-shop.com",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* GA4 Script Loader */}
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=G-QKZC2GB76E`}
        />

        {/* GA4 Config */}
        <Script id="ga4-init">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-QKZC2GB76E');
          `}
        </Script>
      </head>

      <body className={lato.className + " min-h-screen"}>
        <Analytics />
        <SpeedInsights />
        <Store>
          <Hydration>
            <ToastProvider>
              <ToastContainer />
              {children}
            </ToastProvider>
          </Hydration>
        </Store>
      </body>
    </html>
  );
}
