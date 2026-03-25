import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEuro(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatPct(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}

export function formatHours(n: number): string {
  return `${n.toFixed(2)} hrs`;
}

export const MOIS_NOMS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export const JOURS_SEMAINE = [
  "Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi",
];

export const JOURS_SEMAINE_COURT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export function getDaysInMonth(annee: number, mois: number): number {
  return new Date(annee, mois + 1, 0).getDate();
}

export function getDayOfWeek(annee: number, mois: number, jour: number): number {
  return new Date(annee, mois, jour).getDay();
}
