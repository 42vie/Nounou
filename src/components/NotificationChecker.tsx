"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  checkDailyNotification,
  checkPayslipNotification,
} from "@/lib/notifications";

export function NotificationChecker() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    // Vérifier au chargement
    // 1. Notification quotidienne de saisie des heures
    checkDailyNotification(() => router.push("/mois"));
    // 2. Notification fin de mois (autour du 25) pour éditer les fiches de paie
    checkPayslipNotification(() => router.push("/mois"));

    // Revérifier toutes les 30 minutes
    const interval = setInterval(() => {
      checkDailyNotification(() => router.push("/mois"));
      checkPayslipNotification(() => router.push("/mois"));
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, router]);

  return null;
}
