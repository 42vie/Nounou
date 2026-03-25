// Calculs d'indemnités — Lignes 52 à 59

export interface IndemnitesInput {
  ie_base: number; // E52
  ie_nombre: number; // F52
  ie_comp_base: number; // E53
  ie_comp_nombre: number; // F53
  repas_base: number; // E54
  repas_nombre: number; // F54
  repas_parents_base: number; // E55
  repas_parents_nombre: number; // F55
  km_base: number; // E56
  km_nombre: number; // F56
  indemnite_rupture: number; // G57
  autres_non_imposable: number; // G58
}

export interface LigneIndemnite {
  label: string;
  base?: number;
  nombre?: number;
  montant: number;
}

export interface IndemnitesResult {
  lignes: LigneIndemnite[];
  g52: number;
  g53: number;
  g54: number;
  g55: number; // Repas parents (à soustraire)
  g56: number;
  g57: number;
  g58: number;
  total_indemnites: number; // G59
  total_ie_in_ik: number; // G70 = SUM(G52:G56)
}

export function calculerIndemnites(
  input: IndemnitesInput
): IndemnitesResult {
  const g52 = Math.round(input.ie_nombre * input.ie_base * 100) / 100;
  const g53 = Math.round(input.ie_comp_nombre * input.ie_comp_base * 100) / 100;
  const g54 = Math.round(input.repas_nombre * input.repas_base * 100) / 100;
  const g55 = Math.round(input.repas_parents_nombre * input.repas_parents_base * 100) / 100;
  const g56 = Math.round(input.km_nombre * input.km_base * 100) / 100;
  const g57 = Math.round(input.indemnite_rupture * 100) / 100;
  const g58 = Math.round(input.autres_non_imposable * 100) / 100;

  // Total = somme - G55 (repas parents = avantage en nature)
  const total_indemnites =
    Math.round((g52 + g53 + g54 + g56 + g57 + g58 - g55) * 100) / 100;

  // IE+IN+IK pour net imposable (G70) = SUM(G52:G56)
  const total_ie_in_ik =
    Math.round((g52 + g53 + g54 + g55 + g56) * 100) / 100;

  return {
    lignes: [
      { label: "IE — Indemnité d'entretien négociée au contrat (par jour)", base: input.ie_base, nombre: input.ie_nombre, montant: g52 },
      { label: "Indemnité entretien des hrs cpl et sup non mensualisées", base: input.ie_comp_base, nombre: input.ie_comp_nombre, montant: g53 },
      { label: "IN — Indemnité de repas", base: input.repas_base, nombre: input.repas_nombre, montant: g54 },
      { label: "IN — Indemnité de repas fourni par les parents", base: input.repas_parents_base, nombre: input.repas_parents_nombre, montant: g55 },
      { label: "IK — Indemnité kilométrique", base: input.km_base, nombre: input.km_nombre, montant: g56 },
      { label: "Indemnité de rupture", montant: g57 },
      { label: "Autres (non imposable)", montant: g58 },
    ],
    g52, g53, g54, g55, g56, g57, g58,
    total_indemnites,
    total_ie_in_ik,
  };
}
