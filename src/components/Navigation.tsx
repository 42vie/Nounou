"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Home, CalendarDays, BarChart3, Settings } from "lucide-react";

const navItems = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/mois", label: "Saisie", icon: CalendarDays },
  { href: "/recapitulatif", label: "Récap", icon: BarChart3 },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 backdrop-blur-xl bg-white/70 border-t border-white/20 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around h-[60px] max-w-2xl mx-auto px-2">
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                isActive
                  ? "text-purple-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div
                className={`p-1 rounded-lg ${
                  isActive ? "bg-purple-100" : ""
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Logo center */}
        <Link
          href="/"
          className="flex flex-col items-center gap-0.5 px-3 py-1"
        >
          <Image
            src="/logo-assmatpaie.png"
            alt="AssMatPaie"
            width={30}
            height={30}
            className="rounded-lg"
          />
          <span className="text-[9px] font-semibold text-purple-900">
            AssMatPaie
          </span>
        </Link>

        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                isActive
                  ? "text-purple-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div
                className={`p-1 rounded-lg ${
                  isActive ? "bg-purple-100" : ""
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
