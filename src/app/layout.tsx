import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vet Klinika - İdarəetmə Sistemi",
  description: "Müasir Baytarlıq Klinikası İdarəetmə Sistemi (PWA)",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        {/* Sol Menyu (Sidebar) və Üst Menyu gələcəkdə bura əlavə ediləcək */}
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
