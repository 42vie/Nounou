// Définition des 12 codes officiels UNSA PROASSMAT

export interface CodeJour {
  code: string;
  label: string;
  tooltip: string;
  couleur: string;
  categorie: "travail" | "ferie" | "absence" | "conge" | "autre";
  affecteColL: boolean;
  affecteColO: boolean;
  autoRemplirColO: boolean;
  affecteColMN: boolean;
  compteRegularisation: boolean;
}

export const CODES: CodeJour[] = [
  {
    code: "WORK",
    label: "Travaillé",
    tooltip: "Jour normalement travaillé. Saisir les heures d'accueil.",
    couleur: "emerald",
    categorie: "travail",
    affecteColL: true,
    affecteColO: false,
    autoRemplirColO: false,
    affecteColMN: true,
    compteRegularisation: false,
  },
  {
    code: "FERIE",
    label: "Férié",
    tooltip: "Jour férié chômé. Mettre les heures contractuelles en col. O pour la régularisation annuelle.",
    couleur: "blue",
    categorie: "ferie",
    affecteColL: false,
    affecteColO: true,
    autoRemplirColO: true,
    affecteColMN: false,
    compteRegularisation: true,
  },
  {
    code: "FCP",
    label: "FCP",
    tooltip: "Férié chômé payé. Mettre les heures contractuelles en col. O pour la régularisation.",
    couleur: "blue",
    categorie: "ferie",
    affecteColL: false,
    affecteColO: true,
    autoRemplirColO: true,
    affecteColMN: false,
    compteRegularisation: true,
  },
  {
    code: "ANJE",
    label: "ANJE",
    tooltip: "Absence non justifiée de l'enfant. PAS de déduction (mensualisé, le parent paie). Col. O remplie pour la régularisation annuelle.",
    couleur: "orange",
    categorie: "autre",
    affecteColL: false,
    affecteColO: true,
    autoRemplirColO: true,
    affecteColMN: false,
    compteRegularisation: true,
  },
  {
    code: "ABS",
    label: "ABS",
    tooltip: "Absence du salarié (maladie, etc). Déduction sur le salaire. Mettre les heures contractuelles en col. O.",
    couleur: "red",
    categorie: "absence",
    affecteColL: false,
    affecteColO: true,
    autoRemplirColO: true,
    affecteColMN: false,
    compteRegularisation: true,
  },
  {
    code: "CSS",
    label: "CSS",
    tooltip: "Congé sans solde. Déduction sur le salaire mensualisé (ligne 21). Col. O vide : les heures de déduction sont calculées depuis le planning type en arrière-plan.",
    couleur: "amber",
    categorie: "conge",
    affecteColL: false,
    affecteColO: false,    // Pas de col. O visible dans le popup
    autoRemplirColO: false,
    affecteColMN: false,
    compteRegularisation: false, // CSS ne compte PAS pour la régularisation
  },
  {
    code: "CPC",
    label: "CPc",
    tooltip: "Congé payé en année complète (52 sem). Les heures contractuelles en col. O comptent pour la régularisation.",
    couleur: "violet",
    categorie: "conge",
    affecteColL: false,
    affecteColO: true,
    autoRemplirColO: true,
    affecteColMN: false,
    compteRegularisation: true,
  },
  {
    code: "CPI",
    label: "CPi",
    tooltip: "Congé payé en année incomplète (≤46 sem). Col. O vide : les CP sont payés en plus de la mensualisation, hors régularisation.",
    couleur: "violet",
    categorie: "conge",
    affecteColL: false,
    affecteColO: false,
    autoRemplirColO: false,
    affecteColMN: false,
    compteRegularisation: false,
  },
  {
    code: "CEF",
    label: "CEF",
    tooltip: "Congé exceptionnel familial (mariage, décès, naissance...). Mettre les heures contractuelles en col. O.",
    couleur: "teal",
    categorie: "autre",
    affecteColL: false,
    affecteColO: true,
    autoRemplirColO: true,
    affecteColMN: false,
    compteRegularisation: true,
  },
  {
    code: "FRAC",
    label: "FRAC",
    tooltip: "Jour de fractionnement des congés payés. Mettre les heures contractuelles en col. O.",
    couleur: "teal",
    categorie: "autre",
    affecteColL: false,
    affecteColO: true,
    autoRemplirColO: true,
    affecteColMN: false,
    compteRegularisation: true,
  },
  {
    code: "FO",
    label: "FO",
    tooltip: "Jour de formation professionnelle. Assimilé à du travail pour l'acquisition des congés payés.",
    couleur: "teal",
    categorie: "autre",
    affecteColL: false,
    affecteColO: true,
    autoRemplirColO: true,
    affecteColMN: false,
    compteRegularisation: true,
  },
  {
    code: "DIV",
    label: "DIV",
    tooltip: "Divers — jour particulier à préciser en commentaire. Mettre les heures contractuelles en col. O si applicable.",
    couleur: "teal",
    categorie: "autre",
    affecteColL: false,
    affecteColO: true,
    autoRemplirColO: true,
    affecteColMN: false,
    compteRegularisation: true,
  },
];

export function getCode(code: string): CodeJour | undefined {
  return CODES.find((c) => c.code === code);
}

// Couleurs Tailwind par code couleur
export const CODE_COLORS: Record<string, { bg: string; border: string; text: string; bgActive: string }> = {
  emerald: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-800", bgActive: "bg-emerald-100" },
  blue: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-800", bgActive: "bg-blue-100" },
  red: { bg: "bg-red-50", border: "border-red-300", text: "text-red-800", bgActive: "bg-red-100" },
  amber: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-800", bgActive: "bg-amber-100" },
  violet: { bg: "bg-violet-50", border: "border-violet-300", text: "text-violet-800", bgActive: "bg-violet-100" },
  teal: { bg: "bg-teal-50", border: "border-teal-300", text: "text-teal-800", bgActive: "bg-teal-100" },
  orange: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-800", bgActive: "bg-orange-100" },
};
