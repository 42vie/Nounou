// Calculs de rémunération — Lignes 15 à 26

export interface RemunerationInput {
  // Mensualisation
  heures_mensualisees: number; // N12 = H15
  heures_sup_mensualisees: number; // N13 = H16
  taux_horaire: number; // I15

  // Majorations
  majoration_sup_mens: number; // F17 — ex: 0.25 (25%)
  heures_comp_base: number; // H18
  majoration_comp: number; // F18
  heures_sup_base: number; // H19
  majoration_sup: number; // F19

  // Absences
  absence_enfant_heures: number; // H20
  absence_salarie_heures: number; // H21

  // Taux déduction absence (calculé selon méthode choisie)
  taux_deduction_absence_enfant: number; // I20
  taux_deduction_absence_salarie: number; // I21

  // Autres
  indemnite_cp: number; // J22
  regularisation: number; // J23
  iccp: number; // J24
  prime_precarite_base: number; // H25
}

export interface LigneRemuneration {
  label: string;
  base?: number; // Colonne H
  taux?: number; // Colonne I
  montant: number; // Colonne J
  majoration_pct?: number; // Colonne F (pour lignes 17-19)
  is_negative?: boolean;
}

export interface RemunerationResult {
  lignes: LigneRemuneration[];
  salaire_brut: number; // J26
  // Détail pour cotisations
  j15: number;
  j16: number;
  j17: number;
  j18: number;
  j19: number;
  j20: number;
  j21: number;
  j22: number;
  j23: number;
  j24: number;
  j25: number;
}

export function calculerRemuneration(
  input: RemunerationInput
): RemunerationResult {
  const {
    heures_mensualisees,
    heures_sup_mensualisees,
    taux_horaire,
    majoration_sup_mens,
    heures_comp_base,
    majoration_comp,
    heures_sup_base,
    majoration_sup,
    absence_enfant_heures,
    absence_salarie_heures,
    taux_deduction_absence_enfant,
    taux_deduction_absence_salarie,
    indemnite_cp,
    regularisation,
    iccp,
    prime_precarite_base,
  } = input;

  // Ligne 15: Salaire brut de base
  const j15 = Math.round(heures_mensualisees * taux_horaire * 100) / 100;

  // Ligne 16: H.sup mensualisées (au-delà 45h)
  const j16 =
    Math.round(heures_sup_mensualisees * taux_horaire * 100) / 100;

  // Ligne 17: Majoration H.sup mensualisées
  const i17 = taux_horaire * majoration_sup_mens;
  const j17 =
    Math.round(heures_sup_mensualisees * i17 * 100) / 100;

  // Ligne 18: Heures complémentaires
  const i18 = taux_horaire * (1 + majoration_comp);
  const j18 = Math.round(heures_comp_base * i18 * 100) / 100;

  // Ligne 19: Heures supplémentaires non mensualisées
  const i19 = taux_horaire * (1 + majoration_sup);
  const j19 = Math.round(heures_sup_base * i19 * 100) / 100;

  // Ligne 20: Absence enfant (négatif)
  const j20 =
    absence_enfant_heures > 0
      ? -Math.round(absence_enfant_heures * taux_deduction_absence_enfant * 100) / 100
      : 0;

  // Ligne 21: Absence salarié (négatif)
  const j21 =
    absence_salarie_heures > 0
      ? -Math.round(absence_salarie_heures * taux_deduction_absence_salarie * 100) / 100
      : 0;

  // Ligne 22: ICP pendant contrat
  const j22 = Math.round(indemnite_cp * 100) / 100;

  // Ligne 23: Régularisation
  const j23 = Math.round(regularisation * 100) / 100;

  // Ligne 24: ICCP (rupture)
  const j24 = Math.round(iccp * 100) / 100;

  // Ligne 25: Prime précarité CDD
  const j25 = Math.round(prime_precarite_base * 0.1 * 100) / 100;

  // Ligne 26: Salaire brut = somme algébrique
  const salaire_brut =
    Math.round(
      (j15 + j16 + j17 + j18 + j19 + j20 + j21 + j22 + j23 + j24 + j25) * 100
    ) / 100;

  const lignes: LigneRemuneration[] = [
    { label: "Salaire brut de base", base: heures_mensualisees, taux: taux_horaire, montant: j15 },
    { label: "H.sup au-delà 45h, mensualisées", base: heures_sup_mensualisees, taux: taux_horaire, montant: j16 },
    { label: "Majoration H.sup mensualisées", majoration_pct: majoration_sup_mens, base: heures_sup_mensualisees, taux: i17, montant: j17 },
    { label: "Heures complémentaires", majoration_pct: majoration_comp, base: heures_comp_base, taux: i18, montant: j18 },
    { label: "Heures supplémentaires", majoration_pct: majoration_sup, base: heures_sup_base, taux: i19, montant: j19 },
    { label: "Absence de l'enfant", base: absence_enfant_heures, taux: taux_deduction_absence_enfant, montant: j20, is_negative: true },
    { label: "Absence du salarié", base: absence_salarie_heures, taux: taux_deduction_absence_salarie, montant: j21, is_negative: true },
    { label: "Indemnité de congés payés pendant le contrat", base: undefined, taux: undefined, montant: j22 },
    { label: "Régularisation", montant: j23 },
    { label: "ICCP — Uniquement à la rupture du contrat", montant: j24 },
    { label: "Prime de précarité CDD", base: prime_precarite_base, taux: 0.1, montant: j25 },
  ];

  return {
    lignes,
    salaire_brut,
    j15, j16, j17, j18, j19, j20, j21, j22, j23, j24, j25,
  };
}
