// Calculs du net — F49, D70, G60, F62

export interface NetInput {
  salaire_brut: number; // J26
  total_cotisations_salariales: number; // F46
  total_indemnites: number; // G59
  total_ie_in_ik: number; // SUM(G52:G56) pour D70
  taux_pas: number; // D61
  h42: number; // CSG+CRDS non déductible
  f37: number; // Base réduction HC/HM = SUM(J16:J19)
}

export interface NetResult {
  salaire_net_social: number; // F49
  net_imposable: number; // D70
  montant_pas: number; // G60
  net_a_payer: number; // F62
}

export function calculerNet(input: NetInput): NetResult {
  const {
    salaire_brut,
    total_cotisations_salariales,
    total_indemnites,
    total_ie_in_ik,
    taux_pas,
    h42,
    f37,
  } = input;

  // F49 = Brut - Cotisations salariales
  const salaire_net_social =
    Math.round((salaire_brut - total_cotisations_salariales) * 100) / 100;

  // D70 = J26 - F37 - F46 + H42 + SUM(G52:G56)
  const net_imposable =
    Math.round(
      (salaire_brut - f37 - total_cotisations_salariales + h42 + total_ie_in_ik) *
        100
    ) / 100;

  // G60 = D70 × taux PAS
  const montant_pas = Math.round(net_imposable * taux_pas * 100) / 100;

  // F62 = F49 + G59 - G60
  const net_a_payer =
    Math.round(
      (salaire_net_social + total_indemnites - montant_pas) * 100
    ) / 100;

  return {
    salaire_net_social,
    net_imposable,
    montant_pas,
    net_a_payer,
  };
}
