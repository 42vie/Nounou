// Jours fériés français — Algorithme de Pâques + fériés fixes

function getPaques(annee: number): Date {
  // Algorithme de Meeus/Jones/Butcher
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31);
  const jour = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(annee, mois - 1, jour);
}

export function getJoursFeries(annee: number): Date[] {
  const paques = getPaques(annee);
  const lundiPaques = new Date(paques);
  lundiPaques.setDate(paques.getDate() + 1);
  const ascension = new Date(paques);
  ascension.setDate(paques.getDate() + 39);
  const lundiPentecote = new Date(paques);
  lundiPentecote.setDate(paques.getDate() + 50);

  return [
    new Date(annee, 0, 1),   // Jour de l'An
    lundiPaques,              // Lundi de Pâques
    new Date(annee, 4, 1),   // Fête du Travail
    new Date(annee, 4, 8),   // Victoire 1945
    ascension,                // Ascension
    lundiPentecote,           // Lundi de Pentecôte
    new Date(annee, 6, 14),  // Fête nationale
    new Date(annee, 7, 15),  // Assomption
    new Date(annee, 10, 1),  // Toussaint
    new Date(annee, 10, 11), // Armistice
    new Date(annee, 11, 25), // Noël
  ];
}

export function isJourFerie(date: Date, annee?: number): boolean {
  const a = annee ?? date.getFullYear();
  const feries = getJoursFeries(a);
  return feries.some(
    (f) => f.getDate() === date.getDate() && f.getMonth() === date.getMonth()
  );
}

export function getJoursFeriesMap(annee: number): Map<string, string> {
  const feries = getJoursFeries(annee);
  const noms = [
    "Jour de l'An", "Lundi de Pâques", "Fête du Travail",
    "Victoire 1945", "Ascension", "Lundi de Pentecôte",
    "Fête nationale", "Assomption", "Toussaint", "Armistice", "Noël",
  ];
  const map = new Map<string, string>();
  feries.forEach((d, i) => {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    map.set(key, noms[i]);
  });
  return map;
}
