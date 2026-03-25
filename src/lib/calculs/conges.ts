// Calculs de congés payés — J73, O73, J76, O76

export interface CongesInput {
  mois_travailles: number; // E73 ou E76
  semaines_travaillees: number; // E74 ou E77
  jours_enfant: number; // G73 ou G76
  jours_pris: number; // L73 ou L76
}

export interface CongesResult {
  jours_acquis: number; // J73 ou J76
  solde: number; // O73 ou O76
}

export function calculerConges(input: CongesInput): CongesResult {
  const { mois_travailles, semaines_travaillees, jours_enfant, jours_pris } =
    input;

  // Convention collective : 2.5 jours ouvrables par mois de travail effectif
  // OU par période de 4 semaines. On prend le plus avantageux.
  const parSemaines = Math.ceil(semaines_travaillees / 4) * 2.5;
  const parMois = mois_travailles * 2.5;
  const calcul = Math.round(Math.max(parSemaines, parMois) * 100) / 100 + jours_enfant;

  // Plafonné à 30 jours ouvrables
  const jours_acquis = Math.min(calcul, 30);

  return {
    jours_acquis,
    solde: jours_acquis - jours_pris,
  };
}

// Comparatif maintien vs 1/10ème
export interface ComparatifCPInput {
  salaire_mensuel_brut: number; // Maintien = salaire comme si travail normal
  total_brut_periode_ref: number; // Total bruts de la période de référence
  jours_cp_pris: number;
}

export interface ComparatifCPResult {
  maintien: number;
  dixieme: number;
  plus_avantageux: "maintien" | "dixieme";
  montant: number;
}

export function comparatifCP(input: ComparatifCPInput): ComparatifCPResult {
  const maintien = input.salaire_mensuel_brut;
  const dixieme = (input.total_brut_periode_ref * input.jours_cp_pris) / (30 * 10);
  const plus_avantageux = maintien >= dixieme ? "maintien" : "dixieme";

  return {
    maintien: Math.round(maintien * 100) / 100,
    dixieme: Math.round(dixieme * 100) / 100,
    plus_avantageux,
    montant: Math.round(Math.max(maintien, dixieme) * 100) / 100,
  };
}
