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
  title: "Sfari Jouets | Jeux Éducatifs تونس - ألعاب تعليمية للأطفال",
  description:
    "اكتشفوا مجموعة واسعة من الألعاب التعليمية في تونس مع Sfari Jouets. Jouets éducatifs pour enfants en Tunisie, qualité, apprentissage et développement garanti.",
  generator: "Next.js",
  manifest: "/manifest.json",
  keywords: [
    "jeux éducatifs Tunisie",
    "jouets éducatifs Tunisie",
    "jouets enfants Tunisie",
    "magasin jouets Tunisie",
    "Montessori Tunisie",
    "ألعاب تعليمية تونس",
    "ألعاب أطفال تونس",
    "ألعاب تعليمية للأطفال",
    "متجر ألعاب تعليمية تونس",
  ],
  authors: [
    {
      name: "Sfari Jouets",
      url: "https://sfari-jouets.com",
    },
  ],
  openGraph: {
    title: "Sfari Jouets | Jeux Éducatifs تونس - ألعاب تعليمية للأطفال",
    description:
      "Sfari Jouets يقدم ألعاب تعليمية للأطفال في تونس بجودة عالية وأسعار مناسبة. Jouets éducatifs pour enfants en Tunisie.",
    url: "https://sfari-jouets.com",
    siteName: "Sfari Jouets",
    images: [
      {
        url: "https://sfari-jouets.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sfari Jouets - Jeux éducatifs et ألعاب تعليمية في تونس",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  alternates: {
    canonical: "https://sfari-jouets.com",
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
