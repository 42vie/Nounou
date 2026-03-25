import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Navigation } from "@/components/Navigation";
import { NotificationChecker } from "@/components/NotificationChecker";

export const metadata: Metadata = {
  title: "AssMatPaie — Bulletins de paie Assistante Maternelle",
  description:
    "Outil de gestion des bulletins de paie pour assistantes maternelles agréées",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50 antialiased">
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
