"use client";

// Système de notifications quotidiennes pour la saisie des heures
// Utilise l'API Notification du navigateur + Service Worker

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export function getNotificationPermission(): string {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

// Planifier une notification quotidienne (via localStorage + check au chargement)
export function scheduleDaily(hour: number = 19, minute: number = 0) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    "assmatpaie_notif_time",
    JSON.stringify({ hour, minute })
  );
  localStorage.setItem("assmatpaie_notif_enabled", "true");
}

export function disableDaily() {
  if (typeof window === "undefined") return;
  localStorage.setItem("assmatpaie_notif_enabled", "false");
}

export function isDailyEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("assmatpaie_notif_enabled") === "true";
}

export function getNotifTime(): { hour: number; minute: number } {
  if (typeof window === "undefined") return { hour: 19, minute: 0 };
  try {
    const stored = localStorage.getItem("assmatpaie_notif_time");
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return { hour: 19, minute: 0 };
}

// Vérifie si on doit afficher la notification aujourd'hui
export function shouldNotifyToday(): boolean {
  if (typeof window === "undefined") return false;
  if (!isDailyEnabled()) return false;

  const today = new Date().toISOString().split("T")[0];
  const lastNotif = localStorage.getItem("assmatpaie_last_notif");
  if (lastNotif === today) return false;

  const now = new Date();
  const { hour, minute } = getNotifTime();
  if (now.getHours() < hour || (now.getHours() === hour && now.getMinutes() < minute)) {
    return false;
  }

  // Pas le week-end par défaut
  const day = now.getDay();
  if (day === 0 || day === 6) return false;

  return true;
}

export function markNotifiedToday() {
  if (typeof window === "undefined") return;
  const today = new Date().toISOString().split("T")[0];
  localStorage.setItem("assmatpaie_last_notif", today);
}

export function sendNotification(title: string, body: string, onClick?: () => void) {
  if (!isNotificationSupported() || Notification.permission !== "granted") return;

  const notif = new Notification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "assmatpaie-heures",
    requireInteraction: true,
  });

  if (onClick) {
    notif.onclick = () => {
      window.focus();
      onClick();
      notif.close();
    };
  }
}

// Vérifie au chargement si on doit envoyer la notif quotidienne
export function checkDailyNotification(onNavigate?: () => void) {
  if (shouldNotifyToday()) {
    sendNotification(
      "AssMatPaie — Saisie des heures",
      "N'oubliez pas de saisir vos heures d'accueil du jour !",
      onNavigate
    );
    markNotifiedToday();
  }
}

// Vérifier si les heures du jour ont été saisies pour un enfant
export function hasEnteredHoursToday(
  jours: Record<string, { heures: number }>,
  jour: number
): boolean {
  const key = String(jour);
  return !!(jours[key] && jours[key].heures > 0);
}

// Notification de fin de mois (autour du 25) pour éditer les fiches de paie
export function shouldNotifyPayslip(): boolean {
  if (typeof window === "undefined") return false;
  if (!isDailyEnabled()) return false;

  const now = new Date();
  const day = now.getDate();

  // Notification entre le 24 et le 28 du mois
  if (day < 24 || day > 28) return false;

  const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
  const lastPayslipNotif = localStorage.getItem("assmatpaie_last_payslip_notif");
  if (lastPayslipNotif === monthKey) return false;

  return true;
}

export function markPayslipNotified() {
  if (typeof window === "undefined") return;
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
  localStorage.setItem("assmatpaie_last_payslip_notif", monthKey);
}

export function checkPayslipNotification(onNavigate?: () => void) {
  if (shouldNotifyPayslip()) {
    sendNotification(
      "AssMatPaie — Fiches de paie",
      "C'est bientôt la fin du mois ! Pensez à éditer vos fiches de paie.",
      onNavigate
    );
    markPayslipNotified();
  }
}
