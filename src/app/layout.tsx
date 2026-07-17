import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#131b2e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${hanken.variable} ${jetbrains.variable} font-sans bg-background text-on-background antialiased`}>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
