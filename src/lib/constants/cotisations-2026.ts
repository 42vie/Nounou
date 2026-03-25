// Taux de cotisations sociales 2026
// Ces taux sont configurables et changent au 1er janvier

export interface CotisationsConfig {
  // Sécurité sociale
  securite_sociale_salariale: number;
  securite_sociale_salariale_alsace: number;
  securite_sociale_patronale: number;

  // FNAL
  fnal_patronale: number;

  // Contribution Solidarité Autonomie
  csa_patronale: number;

  // Formation professionnelle
  formation_patronale: number;

  // Retraite complémentaire
  retraite_salariale: number;
  retraite_patronale: number;

  // Ircem prévoyance + DS + IDV + Fived
  ircem_salariale: number;
  ircem_patronale: number;

  // Réduction HC/HM
  reduction_hchm: number;

  // Assurance chômage
  chomage_salariale: number;
  chomage_patronale: number;

  // Contribution dialogue social
  dialogue_social_patronale: number;

  // CST (Santé au Travail)
  cst_patronale: number;
  cst_plafond: number;

  // CSG/CRDS
  base_csg_crds: number; // 0.9825
  csg_crds_non_deductible: number;
  csg_deductible: number;
}

export const COTISATIONS_2026: CotisationsConfig = {
  securite_sociale_salariale: 0.073,
  securite_sociale_salariale_alsace: 0.086,
  securite_sociale_patronale: 0.2982,

  fnal_patronale: 0.001,
  csa_patronale: 0.003,
  formation_patronale: 0.0085,

  retraite_salariale: 0.0401,
  retraite_patronale: 0.0601,

  ircem_salariale: 0.0104,
  ircem_patronale: 0.0245,

  reduction_hchm: 0.1131,

  chomage_salariale: 0,
  chomage_patronale: 0.04,

  dialogue_social_patronale: 0.00016,

  cst_patronale: 0.027,
  cst_plafond: 5,

  base_csg_crds: 0.9825,
  csg_crds_non_deductible: 0.029,
  csg_deductible: 0.068,
};
