// Calculs Pajemploi — O53, O54, O57

export interface JourHeures {
  heures: number;
  heures_comp: number;
  heures_sup: number;
}

export interface PajemploiResult {
  jours_8h_plus: number; // O53 — nombre de jours ≥ 8h
  cumul_heures_moins_8h: number; // O54 — cumul heures des jours < 8h
}

export function calculerPajemploi(
  jours: Record<string, JourHeures>
): PajemploiResult {
  let jours_8h_plus = 0;
  let cumul_heures_moins_8h = 0;

  Object.values(jours).forEach((jour) => {
    const total = jour.heures + jour.heures_comp + jour.heures_sup;
    if (total >= 8) {
      jours_8h_plus++;
    } else if (total > 0) {
      cumul_heures_moins_8h += total;
    }
  });

  return {
    jours_8h_plus,
    cumul_heures_moins_8h: Math.round(cumul_heures_moins_8h * 100) / 100,
  };
}
