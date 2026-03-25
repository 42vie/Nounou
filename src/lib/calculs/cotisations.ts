// Calculs de cotisations sociales — Lignes 28 à 46

import { CotisationsConfig } from "../constants/cotisations-2026";

export interface CotisationsInput {
  salaire_brut: number; // J26
  somme_hc_hs: number; // SUM(J16:J19) — base réduction HC/HM
  alsace_moselle: boolean;
  config: CotisationsConfig;
}

export interface LigneCotisation {
  label: string;
  base: number;
  taux_salarial?: number;
  montant_salarial?: number;
  taux_patronal?: number;
  montant_patronal?: number;
  is_reduction?: boolean;
}

export interface CotisationsResult {
  lignes: LigneCotisation[];
  total_salarial: number; // F46
  total_patronal: number; // I46
  // Pour D70 (net imposable)
  h42: number; // CSG+CRDS non déductible
  h37: number; // Montant réduction HC/HM
  f37: number; // Base réduction HC/HM = SUM(J16:J19)
}

export function calculerCotisations(
  input: CotisationsInput
): CotisationsResult {
  const { salaire_brut, somme_hc_hs, alsace_moselle, config } = input;

  const brut = salaire_brut;

  // Ligne 31: Sécurité sociale
  const taux_sal_31 = alsace_moselle
    ? config.securite_sociale_salariale_alsace
    : config.securite_sociale_salariale;
  const h31 = brut * taux_sal_31;
  const j31 = brut * config.securite_sociale_patronale;

  // Ligne 32: FNAL
  const j32 = brut * config.fnal_patronale;

  // Ligne 33: CSA
  const j33 = brut * config.csa_patronale;

  // Ligne 34: Formation professionnelle
  const j34 = brut * config.formation_patronale;

  // Ligne 35: Retraite complémentaire
  const h35 = brut * config.retraite_salariale;
  const j35 = brut * config.retraite_patronale;

  // Ligne 36: Ircem prévoyance
  const h36 = brut * config.ircem_salariale;
  const j36 = brut * config.ircem_patronale;

  // Ligne 37: Réduction HC/HM (NÉGATIF côté salarial)
  const f37 = somme_hc_hs; // Base = somme J16:J19
  const h37 = -(f37 * config.reduction_hchm); // Négatif

  // Ligne 38: Assurance chômage
  const h38 = brut * config.chomage_salariale; // = 0 depuis 2018
  const j38 = brut * config.chomage_patronale;

  // Ligne 39: Dialogue social
  const j39 = brut * config.dialogue_social_patronale;

  // Ligne 40: CST — plafonnée à 5€
  const j40 = Math.min(brut * config.cst_patronale, config.cst_plafond);

  // Ligne 42: CSG+CRDS non déductible (base 98.25%)
  const base_csg = brut * config.base_csg_crds;
  const h42 = base_csg * config.csg_crds_non_deductible;

  // Ligne 43: CSG déductible
  const h43 = base_csg * config.csg_deductible;

  // Totaux
  const total_salarial =
    Math.round((h31 + h35 + h36 + h37 + h38 + h42 + h43) * 100) / 100;
  const total_patronal =
    Math.round(
      (j31 + j32 + j33 + j34 + j35 + j36 + j38 + j39 + j40) * 100
    ) / 100;

  const lignes: LigneCotisation[] = [
    {
      label: "Sécurité sociale (maladie, maternité, invalidité, décès, vieillesse, AF, AT)",
      base: brut,
      taux_salarial: taux_sal_31,
      montant_salarial: Math.round(h31 * 100) / 100,
      taux_patronal: config.securite_sociale_patronale,
      montant_patronal: Math.round(j31 * 100) / 100,
    },
    {
      label: "FNAL (Fond national d'aide au logement)",
      base: brut,
      taux_patronal: config.fnal_patronale,
      montant_patronal: Math.round(j32 * 100) / 100,
    },
    {
      label: "Contribution Solidarité Autonomie",
      base: brut,
      taux_patronal: config.csa_patronale,
      montant_patronal: Math.round(j33 * 100) / 100,
    },
    {
      label: "Formation professionnelle",
      base: brut,
      taux_patronal: config.formation_patronale,
      montant_patronal: Math.round(j34 * 100) / 100,
    },
    {
      label: "Retraite complémentaire",
      base: brut,
      taux_salarial: config.retraite_salariale,
      montant_salarial: Math.round(h35 * 100) / 100,
      taux_patronal: config.retraite_patronale,
      montant_patronal: Math.round(j35 * 100) / 100,
    },
    {
      label: "Ircem prévoyance + DS + IDV Retraite + Fived",
      base: brut,
      taux_salarial: config.ircem_salariale,
      montant_salarial: Math.round(h36 * 100) / 100,
      taux_patronal: config.ircem_patronale,
      montant_patronal: Math.round(j36 * 100) / 100,
    },
    {
      label: "Réduction sur cotisations HC/HM",
      base: f37,
      taux_salarial: config.reduction_hchm,
      montant_salarial: Math.round(h37 * 100) / 100,
      is_reduction: true,
    },
    {
      label: "Assurance chômage",
      base: brut,
      taux_salarial: config.chomage_salariale,
      montant_salarial: Math.round(h38 * 100) / 100,
      taux_patronal: config.chomage_patronale,
      montant_patronal: Math.round(j38 * 100) / 100,
    },
    {
      label: "Contribution au dialogue social",
      base: brut,
      taux_patronal: config.dialogue_social_patronale,
      montant_patronal: Math.round(j39 * 100) / 100,
    },
    {
      label: "Contribution Santé au Travail (CST)",
      base: brut,
      taux_patronal: config.cst_patronale,
      montant_patronal: Math.round(j40 * 100) / 100,
    },
  ];

  const lignes_csg: LigneCotisation[] = [
    {
      label: "CSG + CRDS non déductible sur le salaire de base",
      base: Math.round(base_csg * 100) / 100,
      taux_salarial: config.csg_crds_non_deductible,
      montant_salarial: Math.round(h42 * 100) / 100,
    },
    {
      label: "CSG déductible sur le salaire de base",
      base: Math.round(base_csg * 100) / 100,
      taux_salarial: config.csg_deductible,
      montant_salarial: Math.round(h43 * 100) / 100,
    },
  ];

  return {
    lignes: [...lignes, ...lignes_csg],
    total_salarial,
    total_patronal,
    h42: Math.round(h42 * 100) / 100,
    h37: Math.round(h37 * 100) / 100,
    f37,
  };
}
