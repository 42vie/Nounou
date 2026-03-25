// Calculs de rupture — 1/80ème, ICCP, préavis, régularisation

export interface RuptureInput {
  total_salaires_bruts: number; // Somme de tous les bruts du contrat
  mois_accueil: number; // Durée d'accueil en mois
  cp_acquis_non_pris: number; // Jours CP restants
  salaire_mensuel_brut: number; // Pour maintien
  total_brut_periode_ref: number; // Pour 1/10ème
  // Régularisation (≤46 sem)
  heures_reellement_effectuees?: number;
  heures_mensualisees_payees?: number;
  taux_horaire?: number;
  annee_complete: boolean;
}

export interface RuptureResult {
  indemnite_rupture: number; // 1/80ème
  eligible_indemnite: boolean;
  iccp: number;
  iccp_maintien: number;
  iccp_dixieme: number;
  duree_preavis: string;
  regularisation: number;
}

export function calculerRupture(input: RuptureInput): RuptureResult {
  const {
    total_salaires_bruts,
    mois_accueil,
    cp_acquis_non_pris,
    salaire_mensuel_brut,
    total_brut_periode_ref,
    heures_reellement_effectuees,
    heures_mensualisees_payees,
    taux_horaire,
    annee_complete,
  } = input;

  // Indemnité de rupture: 1/80ème si ≥ 9 mois
  const eligible_indemnite = mois_accueil >= 9;
  const indemnite_rupture = eligible_indemnite
    ? Math.round((total_salaires_bruts / 80) * 100) / 100
    : 0;

  // ICCP
  const iccp_maintien = salaire_mensuel_brut;
  const iccp_dixieme =
    cp_acquis_non_pris > 0
      ? Math.round(
          ((total_brut_periode_ref / 10) * cp_acquis_non_pris) / 30 * 100
        ) / 100
      : 0;
  const iccp = Math.round(Math.max(iccp_maintien, iccp_dixieme) * 100) / 100;

  // Préavis
  let duree_preavis: string;
  if (mois_accueil < 3) {
    duree_preavis = "8 jours calendaires";
  } else if (mois_accueil < 12) {
    duree_preavis = "15 jours calendaires";
  } else {
    duree_preavis = "1 mois calendaire";
  }

  // Régularisation (≤46 sem uniquement)
  let regularisation = 0;
  if (
    !annee_complete &&
    heures_reellement_effectuees !== undefined &&
    heures_mensualisees_payees !== undefined &&
    taux_horaire !== undefined
  ) {
    const diff = heures_reellement_effectuees - heures_mensualisees_payees;
    if (diff > 0) {
      regularisation = Math.round(diff * taux_horaire * 100) / 100;
    }
  }

  return {
    indemnite_rupture,
    eligible_indemnite,
    iccp,
    iccp_maintien: Math.round(iccp_maintien * 100) / 100,
    iccp_dixieme,
    duree_preavis,
    regularisation,
  };
}
