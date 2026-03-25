import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Navigation } from "@/components/Navigation";
import { NotificationChecker } from "@/components/NotificationChecker";

export const metadata: Metadata = {
  title: "AssMatPaie",
  description: "Gestion des bulletins de paie pour assistantes maternelles agréées",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AssMatPaie",
  },
  icons: {
    apple: "/apple-touch-icon.png",
    icon: "/icon-192.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#C97B4A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased" style={{ background: "#FAF0E6" }}>
        <AuthProvider>
          <main className="pb-20">
            <div className="max-w-7xl mx-auto p-4">{children}</div>
          </main>
          <Navigation />
          <NotificationChecker />
        </AuthProvider>
      </body>
    </html>
  );
}
