"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/", label: "Accueil", icon: "🏠" },
  { href: "/mois", label: "Saisie", icon: "📅" },
  { href: "/recapitulatif", label: "Récap", icon: "📊" },
  { href: "/parametres", label: "Paramètres", icon: "⚙️" },
];

export function Navigation() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:flex-col md:w-56 md:fixed md:inset-y-0 bg-white border-r border-gray-200 shadow-sm">
        <div className="p-4 border-b">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-assmatpaie.svg"
              alt="AssMatPaie"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="font-bold text-purple-900">AssMatPaie</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? "bg-purple-100 text-purple-900 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t text-xs text-gray-400">
          PROASSMAT&ASSFAM
        </div>
      </aside>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 text-xs ${
                pathname === item.href
                  ? "text-purple-700 font-medium"
                  : "text-gray-500"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
