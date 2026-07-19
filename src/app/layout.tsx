import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: "VibeFitAI",
  description: "Registra y analiza tus entrenamientos con inteligencia artificial",
  applicationName: "VibeFitAI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VibeFitAI",
  },
  icons: {
    icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#131b2e",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${hanken.variable} ${jetbrains.variable} font-sans bg-background text-on-background antialiased`}>
        <NextIntlClientProvider>
          <ServiceWorkerRegister />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
