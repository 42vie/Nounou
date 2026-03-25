// 3 méthodes de déduction des absences

export type MethodeAbsence = "heures" | "jours" | "minoration_cassation";

export interface AbsenceInput {
  methode: MethodeAbsence;
  salaire_mensualise: number; // Brut mensualisé (J15 + J16)
  heures_mensualisees: number;
  taux_horaire: number;

  // Méthode heures
  heures_absence?: number;
  heures_potentiel_mois?: number;

  // Méthode jours
  jours_absence?: number;
  jours_potentiel_mois?: number;

  // Méthode minoration Cassation
  heures_reelles_absence?: number;
  potentiel_heures_mois?: number;
}

export interface AbsenceResult {
  montant_deduction: number; // Montant à déduire (positif)
  taux_deduction: number; // Pour affichage I20/I21
  heures_deduction: number; // Pour H20/H21
}

export function calculerAbsence(input: AbsenceInput): AbsenceResult {
  const { methode, salaire_mensualise, heures_mensualisees, taux_horaire } =
    input;

  switch (methode) {
    case "heures": {
      const h = input.heures_absence || 0;
      const pot = input.heures_potentiel_mois || 1;
      const deduction = salaire_mensualise * (h / pot);
      return {
        montant_deduction: Math.round(deduction * 100) / 100,
        taux_deduction: Math.round((salaire_mensualise / pot) * 10000) / 10000,
        heures_deduction: h,
      };
    }

    case "jours": {
      const j = input.jours_absence || 0;
      const pot = input.jours_potentiel_mois || 1;
      const deduction = salaire_mensualise * (j / pot);
      return {
        montant_deduction: Math.round(deduction * 100) / 100,
        taux_deduction: Math.round((salaire_mensualise / pot) * 10000) / 10000,
        heures_deduction: j, // En jours dans ce cas
      };
    }

    case "minoration_cassation": {
      const habs = input.heures_reelles_absence || 0;
      const pot = input.potentiel_heures_mois || 1;
      const heures_a_minorer = (habs / pot) * heures_mensualisees;
      const heures_dues = pot - heures_a_minorer;
      const salaire_du = heures_dues * taux_horaire;
      const deduction = salaire_mensualise - salaire_du;
      return {
        montant_deduction: Math.round(Math.max(0, deduction) * 100) / 100,
        taux_deduction: taux_horaire,
        heures_deduction: Math.round(heures_a_minorer * 100) / 100,
      };
    }
  }
}
