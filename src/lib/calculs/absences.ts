// Calcul des absences — Convention collective 15 mars 2021 + Pajemploi
// Méthode 1 : par JOURS (année incomplète ≤46 sem)
// Méthode 2 : par HEURES (année complète 52 sem)

import type { JourData } from "@/lib/firestore";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ============ Potentiel du mois ============

const JOURS_SEMAINE_KEYS = [
  "dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi",
] as const;

export interface PotentielMois {
  joursPotentiel: number;
  heuresPotentiel: number;
}

/**
 * Calcule le potentiel du mois = nombre de jours/heures où l'enfant
 * AURAIT ÉTÉ ACCUEILLI si le salarié n'avait pas été absent.
 *
 * INCLUT les jours fériés chômés qui tombent sur un jour habituellement travaillé.
 * EXCLUT les week-ends (sauf si travaillés habituellement).
 */
export function calculerPotentielMois(
  annee: number,
  mois: number, // 0-11
  planningType: Record<string, number>
): PotentielMois {
  let joursPotentiel = 0;
  let heuresPotentiel = 0;

  const nbJoursMois = new Date(annee, mois + 1, 0).getDate();

  for (let j = 1; j <= nbJoursMois; j++) {
    const date = new Date(annee, mois, j);
    const jourSemaine = JOURS_SEMAINE_KEYS[date.getDay()];
    const heuresPrevues = planningType[jourSemaine] || 0;

    if (heuresPrevues > 0) {
      joursPotentiel++;
      heuresPotentiel += heuresPrevues;
    }
    // Les jours fériés sur un jour habituellement travaillé COMPTENT
    // (on ne les soustrait PAS — c'est comme si l'enfant avait été accueilli)
  }

  return { joursPotentiel, heuresPotentiel: round2(heuresPotentiel) };
}

/**
 * Récupère les heures contractuelles du planning type pour un jour donné.
 */
export function getHeuresPlanningType(
  jour: number,
  annee: number,
  mois: number,
  planningType: Record<string, number>
): number {
  const date = new Date(annee, mois, jour);
  const jourSemaine = JOURS_SEMAINE_KEYS[date.getDay()];
  return planningType[jourSemaine] || 0;
}

// ============ Résultat absence ============

export interface ResultatAbsence {
  methode: "jours" | "heures";
  base: number;                // Salaire mensualisé
  unites_absentes: number;     // Jours ou heures absents
  unites_potentiel: number;    // Jours ou heures potentiel du mois
  deduction: number;           // Montant déduit (positif)
  salaire_du: number;          // Salaire après déduction

  // Détail par type
  heures_abs_enfant: number;   // H20 — somme col.O des ANJE
  heures_abs_salarie: number;  // H21 — somme col.O des ABS + heures planning des CSS

  // Pour Pajemploi
  heures_normales_pajemploi: number;
  jours_activite_pajemploi: number;
}

/**
 * Calcul complet des absences du mois.
 *
 * Codes qui génèrent une déduction :
 * - ABS (absence salarié) → ligne 21
 * - CSS (congé sans solde) → ligne 21 (même traitement, le salarié ne travaille pas)
 *
 * Codes qui NE génèrent PAS de déduction :
 * - ANJE (absence enfant) → pas de déduction (mensualisé, le parent paie)
 *   Col. O remplie uniquement pour la régularisation annuelle
 *
 * Pour CSS : pas de col. O visible dans le popup, mais on utilise
 * le planning type pour calculer les heures de déduction en arrière-plan.
 */
export function calculerAbsencesMois(
  contrat: {
    annee_complete: boolean;
    salaire_mensualise: number;
    taux_horaire: number;
    planning_type: Record<string, number>;
  },
  annee: number,
  mois: number,
  jours: Record<string, JourData>
): ResultatAbsence {
  const potentiel = calculerPotentielMois(annee, mois, contrat.planning_type);

  let heuresAbsEnfant = 0; // Pour info uniquement — ANJE ne déduit pas
  let joursAbsSalarie = 0;
  let heuresAbsSalarie = 0;
  let heuresAbsPartielleSalarie = 0; // abs_salarie_h sur les jours WORK (au taux horaire)
  let joursReellementTravailles = 0;

  for (const [jourStr, data] of Object.entries(jours)) {
    const jour = parseInt(jourStr);
    const code = data.commentaire || data.type; // Le code est stocké dans commentaire

    if (code === "ANJE") {
      // ANJE = absence enfant → PAS de déduction (mensualisé, le parent paie)
      // On stocke juste les heures pour info (col. O) mais ça ne déduit rien
      heuresAbsEnfant += data.heures_contrac > 0
        ? data.heures_contrac
        : getHeuresPlanningType(jour, annee, mois, contrat.planning_type);
      // NB: joursAbsEnfant++ volontairement absent — ANJE ne compte pas dans la déduction
    } else if (code === "ABS") {
      joursAbsSalarie++;
      heuresAbsSalarie += data.heures_contrac > 0
        ? data.heures_contrac
        : getHeuresPlanningType(jour, annee, mois, contrat.planning_type);
    } else if (code === "CSS") {
      joursAbsSalarie++;
      // CSS : pas de col. O dans le popup, mais on prend les heures du planning type
      heuresAbsSalarie += getHeuresPlanningType(jour, annee, mois, contrat.planning_type);
    } else if (code === "WORK" || code === "work") {
      if ((data.heures || 0) > 0) {
        joursReellementTravailles++;
      }
      // Absences partielles saisies sur un jour travaillé
      heuresAbsPartielleSalarie += data.abs_salarie_h || 0;
    }
  }

  // Seuls ABS + CSS génèrent une déduction. ANJE = pas de déduction.
  const totalJoursAbsents = joursAbsSalarie;
  // Absences partielles : toujours déduites au taux horaire de base
  const deductionPartielle = round2(heuresAbsPartielleSalarie * contrat.taux_horaire);
  // Total affiché sur la ligne 21 = jours entiers + absences partielles
  const totalHeuresAbsSalarie = heuresAbsSalarie + heuresAbsPartielleSalarie;

  let deduction: number;
  let methode: "jours" | "heures";

  if (contrat.annee_complete) {
    // Année complète (52 sem) → méthode par HEURES (simple : heures × taux)
    // La fiche utilise heures_abs_salarie × taux, pas absences.deduction
    methode = "heures";
    deduction = potentiel.heuresPotentiel > 0
      ? round2(contrat.salaire_mensualise * heuresAbsSalarie / potentiel.heuresPotentiel) + deductionPartielle
      : deductionPartielle;
  } else {
    // Année incomplète (≤46 sem) → méthode par JOURS pour ABS entiers
    // + déduction horaire pour les absences partielles
    methode = "jours";
    deduction = potentiel.joursPotentiel > 0
      ? round2(contrat.salaire_mensualise * totalJoursAbsents / potentiel.joursPotentiel) + deductionPartielle
      : deductionPartielle;
  }

  const salaireDu = round2(contrat.salaire_mensualise - deduction);

  return {
    methode,
    base: contrat.salaire_mensualise,
    unites_absentes: methode === "heures" ? totalHeuresAbsSalarie : totalJoursAbsents,
    unites_potentiel: methode === "heures" ? potentiel.heuresPotentiel : potentiel.joursPotentiel,
    deduction,
    salaire_du: salaireDu,
    heures_abs_enfant: heuresAbsEnfant,
    heures_abs_salarie: totalHeuresAbsSalarie,
    heures_normales_pajemploi: contrat.taux_horaire > 0
      ? Math.round(salaireDu / contrat.taux_horaire)
      : 0,
    jours_activite_pajemploi: joursReellementTravailles,
  };
}

// ============ Fonctions simples (pour usage direct) ============

/**
 * Déduction par heures (année complète 52 sem)
 */
export function deductionAbsenceHeures(
  salaireMensualise: number,
  heuresAbsentes: number,
  heuresPotentielMois: number
): { deduction: number; salaireDu: number } {
  if (heuresPotentielMois === 0) return { deduction: 0, salaireDu: salaireMensualise };
  const deduction = round2(salaireMensualise * heuresAbsentes / heuresPotentielMois);
  return { deduction, salaireDu: round2(salaireMensualise - deduction) };
}

/**
 * Déduction par jours (année incomplète ≤46 sem)
 */
export function deductionAbsenceJours(
  salaireMensualise: number,
  joursAbsents: number,
  joursPotentielMois: number
): { deduction: number; salaireDu: number } {
  if (joursPotentielMois === 0) return { deduction: 0, salaireDu: salaireMensualise };
  const deduction = round2(salaireMensualise * joursAbsents / joursPotentielMois);
  return { deduction, salaireDu: round2(salaireMensualise - deduction) };
}

/**
 * Déduction simple (heures × taux)
 */
export function deductionAbsenceSimple(
  heuresAbsentes: number,
  tauxHoraire: number
): number {
  return round2(heuresAbsentes * tauxHoraire);
}
