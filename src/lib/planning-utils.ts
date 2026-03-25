// Utilitaire pour déterminer le planning applicable selon la semaine paire/impaire

import type { Enfant } from "./firestore";

type PlanningType = {
  lundi: number;
  mardi: number;
  mercredi: number;
  jeudi: number;
  vendredi: number;
  samedi: number;
};

/**
 * Retourne le numéro de semaine ISO d'une date.
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Retourne true si la semaine contenant la date est paire.
 */
export function isSemainePaire(date: Date): boolean {
  return getWeekNumber(date) % 2 === 0;
}

/**
 * Retourne le planning applicable pour une date donnée.
 * - Si planning_alterne = false → toujours planning_type
 * - Si planning_alterne = true → planning_type pour semaines paires, planning_type_impaire pour impaires
 */
export function getPlanningPourDate(enfant: Enfant, date: Date): PlanningType {
  if (!enfant.planning_alterne || !enfant.planning_type_impaire) {
    return enfant.planning_type || { lundi: 0, mardi: 0, mercredi: 0, jeudi: 0, vendredi: 0, samedi: 0 };
  }

  if (isSemainePaire(date)) {
    return enfant.planning_type;
  } else {
    return enfant.planning_type_impaire;
  }
}

/**
 * Retourne les heures contractuelles pour un jour donné.
 */
export function getHeuresContratJour(enfant: Enfant, annee: number, mois: number, jour: number): number {
  const date = new Date(annee, mois, jour);
  const joursSemaine = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"] as const;
  const jourKey = joursSemaine[date.getDay()];
  if (jourKey === "dimanche") return 0;

  const planning = getPlanningPourDate(enfant, date);
  return planning[jourKey as keyof PlanningType] || 0;
}

/**
 * Retourne le planning "moyen" pour le calcul de mensualisation.
 * Si alterné : moyenne des 2 plannings.
 */
export function getPlanningMoyen(enfant: Enfant): PlanningType {
  if (!enfant.planning_alterne || !enfant.planning_type_impaire) {
    return enfant.planning_type || { lundi: 0, mardi: 0, mercredi: 0, jeudi: 0, vendredi: 0, samedi: 0 };
  }

  const p = enfant.planning_type;
  const i = enfant.planning_type_impaire;
  return {
    lundi: (p.lundi + i.lundi) / 2,
    mardi: (p.mardi + i.mardi) / 2,
    mercredi: (p.mercredi + i.mercredi) / 2,
    jeudi: (p.jeudi + i.jeudi) / 2,
    vendredi: (p.vendredi + i.vendredi) / 2,
    samedi: (p.samedi + i.samedi) / 2,
  };
}
