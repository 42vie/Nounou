// Calculs de mensualisation — N12 et N13

export interface MensualisationInput {
  type_contrat: "CDI" | "CDD_terme_precis" | "CDD_terme_imprecis";
  annee_complete: boolean;
  semaines_programmees: number; // D12
  heures_normales_semaine: number; // H12
  heures_sup_semaine: number; // H13 (au-delà de 45h)
  mois_prevus: number;
}

export interface MensualisationResult {
  heures_mensualisees: number; // N12
  heures_sup_mensualisees: number; // N13
}

export function calculerMensualisation(
  input: MensualisationInput
): MensualisationResult {
  const {
    type_contrat,
    annee_complete,
    semaines_programmees,
    heures_normales_semaine,
    heures_sup_semaine,
    mois_prevus,
  } = input;

  let heures_mensualisees: number;
  let heures_sup_mensualisees: number;

  if (type_contrat === "CDD_terme_imprecis") {
    if (annee_complete) {
      const h = heures_normales_semaine < 45 ? heures_normales_semaine : 45;
      heures_mensualisees = (semaines_programmees * h) / mois_prevus;
      heures_sup_mensualisees =
        (semaines_programmees * heures_sup_semaine) / mois_prevus;
    } else {
      heures_mensualisees = 0;
      heures_sup_mensualisees = 0;
    }
  } else {
    // CDI ou CDD à terme précis
    const h = heures_normales_semaine < 45 ? heures_normales_semaine : 45;
    heures_mensualisees = (semaines_programmees * h) / 12;
    heures_sup_mensualisees = (semaines_programmees * heures_sup_semaine) / 12;
  }

  return {
    heures_mensualisees: Math.round(heures_mensualisees * 100) / 100,
    heures_sup_mensualisees: Math.round(heures_sup_mensualisees * 100) / 100,
  };
}
