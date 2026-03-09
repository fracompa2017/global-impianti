import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "@/app/globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Global Impianti",
  description: "Gestionale SaaS per impianti elettrici e idraulici",
  applicationName: "Global Impianti",
  manifest: "/manifest.json",
  icons: [
    { rel: "icon", url: "/icons/icon-192.png" },
    { rel: "apple-touch-icon", url: "/icons/icon-192.png" },
  ],
};

export const viewport: Viewport = {
  themeColor: "#2B5CE6",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={`${plusJakarta.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
