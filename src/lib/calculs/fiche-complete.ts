// Orchestrateur — calcul complet d'un bulletin de paie

import { calculerMensualisation, MensualisationInput } from "./mensualisation";
import { calculerRemuneration, RemunerationInput } from "./remuneration";
import { calculerCotisations } from "./cotisations";
import { calculerIndemnites, IndemnitesInput } from "./indemnites";
import { calculerNet } from "./net";
import { calculerPajemploi, JourHeures } from "./pajemploi";
import { calculerConges, CongesInput } from "./conges";
import { CotisationsConfig } from "../constants/cotisations-2026";

export interface BulletinInput {
  // Mensualisation
  mensualisation: MensualisationInput;

  // Rémunération
  taux_horaire: number;
  majoration_sup_mens: number;
  heures_comp_base: number;
  majoration_comp: number;
  heures_sup_base: number;
  majoration_sup: number;
  absence_enfant_heures: number;
  absence_salarie_heures: number;
  taux_deduction_absence_enfant: number;
  taux_deduction_absence_salarie: number;
  indemnite_cp: number;
  regularisation: number;
  iccp: number;
  prime_precarite_base: number;

  // Cotisations
  alsace_moselle: boolean;
  cotisations_config: CotisationsConfig;

  // Indemnités
  indemnites: IndemnitesInput;

  // PAS
  taux_pas: number;

  // Jours du mois
  jours: Record<string, JourHeures>;

  // Congés
  conges_n: CongesInput;
  conges_n1: CongesInput;
}

export function calculerBulletinComplet(input: BulletinInput) {
  // 1. Mensualisation
  const mens = calculerMensualisation(input.mensualisation);

  // 2. Rémunération
  const remuInput: RemunerationInput = {
    heures_mensualisees: mens.heures_mensualisees,
    heures_sup_mensualisees: mens.heures_sup_mensualisees,
    taux_horaire: input.taux_horaire,
    majoration_sup_mens: input.majoration_sup_mens,
    heures_comp_base: input.heures_comp_base,
    majoration_comp: input.majoration_comp,
    heures_sup_base: input.heures_sup_base,
    majoration_sup: input.majoration_sup,
    absence_enfant_heures: input.absence_enfant_heures,
    absence_salarie_heures: input.absence_salarie_heures,
    taux_deduction_absence_enfant: input.taux_deduction_absence_enfant,
    taux_deduction_absence_salarie: input.taux_deduction_absence_salarie,
    indemnite_cp: input.indemnite_cp,
    regularisation: input.regularisation,
    iccp: input.iccp,
    prime_precarite_base: input.prime_precarite_base,
  };
  const remu = calculerRemuneration(remuInput);

  // 3. Cotisations
  const somme_hc_hs = remu.j16 + remu.j17 + remu.j18 + remu.j19;
  const cotis = calculerCotisations({
    salaire_brut: remu.salaire_brut,
    somme_hc_hs,
    alsace_moselle: input.alsace_moselle,
    config: input.cotisations_config,
  });

  // 4. Indemnités
  const indem = calculerIndemnites(input.indemnites);

  // 5. Net
  const net = calculerNet({
    salaire_brut: remu.salaire_brut,
    total_cotisations_salariales: cotis.total_salarial,
    total_indemnites: indem.total_indemnites,
    total_ie_in_ik: indem.total_ie_in_ik,
    taux_pas: input.taux_pas,
    h42: cotis.h42,
    f37: cotis.f37,
  });

  // 6. Pajemploi
  const pajemploi = calculerPajemploi(input.jours);

  // 7. Congés
  const congesN = calculerConges(input.conges_n);
  const congesN1 = calculerConges(input.conges_n1);

  // 8. Résumé heures
  let total_heures = 0;
  let total_heures_comp = 0;
  let total_heures_sup = 0;
  Object.values(input.jours).forEach((j) => {
    total_heures += j.heures;
    total_heures_comp += j.heures_comp;
    total_heures_sup += j.heures_sup;
  });

  return {
    mensualisation: mens,
    remuneration: remu,
    cotisations: cotis,
    indemnites: indem,
    net,
    pajemploi,
    conges_n: congesN,
    conges_n1: congesN1,
    resume_heures: {
      total_heures: Math.round(total_heures * 100) / 100,
      total_heures_comp: Math.round(total_heures_comp * 100) / 100,
      total_heures_sup: Math.round(total_heures_sup * 100) / 100,
    },
  };
}
