"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Home, CalendarDays, BarChart3, Settings } from "lucide-react";

const navItems = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/mois", label: "Planning", icon: CalendarDays },
  { href: "/recapitulatif", label: "Récap", icon: BarChart3 },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 border-t shadow-[0_-2px_12px_rgba(0,0,0,0.1)] print:hidden"
      style={{ background: "#F5E6D0", borderColor: "#E8D4BC" }}
    >
      <div className="flex items-center justify-around h-[62px] max-w-2xl mx-auto px-2">
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors"
              style={{ color: isActive ? "#C97B4A" : "#9A8878" }}
            >
              <div
                className="p-1 rounded-lg"
                style={{ background: isActive ? "#FFF0E6" : "transparent" }}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}

        {/* Logo center */}
        <Link href="/" className="flex flex-col items-center gap-0.5 px-3 py-1">
          <Image
            src="/logo-assmatpaie.png"
            alt="AssMatPaie"
            width={30}
            height={30}
            className="rounded-lg"
          />
          <span className="text-[9px] font-semibold" style={{ color: "#C97B4A" }}>
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
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors"
              style={{ color: isActive ? "#C97B4A" : "#9A8878" }}
            >
              <div
                className="p-1 rounded-lg"
                style={{ background: isActive ? "#FFF0E6" : "transparent" }}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
