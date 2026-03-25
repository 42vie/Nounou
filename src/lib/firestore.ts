"use client";

import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ============ Types ============

export interface UserData {
  nom: string;
  adresse: string;
  complement: string;
  cp_ville: string;
  num_ss: string;
  num_pajemploi: string;
  date_embauche: Timestamp;
  qualification: string;
  age_plus_65: boolean;
  alsace_moselle: boolean;
}

export interface Enfant {
  id?: string;
  nom: string;
  emp_nom: string;
  emp_adresse: string;
  emp_complement: string;
  emp_cp_ville: string;
  emp_num: string;
  type_contrat: "CDI" | "CDD_terme_precis" | "CDD_terme_imprecis";
  date_embauche: Timestamp;
  date_fin_cdd: Timestamp | null;
  heures_normales_semaine: number;
  heures_sup_semaine: number;
  semaines_programmees: number;
  mois_prevus: number;
  annee_complete: boolean;
  taux_horaire: number;
  indemnite_entretien_jour: number;
  indemnite_repas: number;
  indemnite_km: number;
  planning_type: {
    lundi: number;
    mardi: number;
    mercredi: number;
    jeudi: number;
    vendredi: number;
    samedi: number;
  };
  planning_alterne: boolean; // true = planning paire/impaire
  planning_type_impaire: {  // Planning semaine impaire (si alterne)
    lundi: number;
    mardi: number;
    mercredi: number;
    jeudi: number;
    vendredi: number;
    samedi: number;
  } | null;
  methode_absence: "heures" | "jours" | "minoration_cassation";
  jours_pajemploi_contrat: number; // Nb jours à déclarer à Pajemploi (variable du contrat)
  cp_solde_initial: number;        // Solde CP au démarrage (ex: 10 jours au 1er janvier 2026)
  cp_solde_initial_date: string;   // Date de référence du solde initial (ex: "2026-01-01")
}

// Tableau CP mensuel — stocké dans une collection dédiée
export interface CPMoisEntry {
  annee: number;
  mois: number; // 0-11
  cpc_pris: number; // Jours CPc pris ce mois
  cpi_pris: number; // Jours CPi pris ce mois
  acquis: number;   // Jours acquis ce mois (auto-calculé)
  manuel: boolean;  // true si modifié manuellement (pour les mois avant l'app)
}

export async function getCPTableau(
  uid: string,
  enfantId: string
): Promise<CPMoisEntry[]> {
  const snap = await getDocs(collection(db, "users", uid, "enfants", enfantId, "cp"));
  return snap.docs.map((d) => d.data() as CPMoisEntry);
}

export async function saveCPMois(
  uid: string,
  enfantId: string,
  annee: number,
  mois: number,
  data: Partial<CPMoisEntry>
) {
  const id = `${annee}_${String(mois).padStart(2, "0")}`;
  await setDoc(
    doc(db, "users", uid, "enfants", enfantId, "cp", id),
    { ...data, annee, mois },
    { merge: true }
  );
}

// Poser des congés sur une période (du jour X au jour Y)
// Remplit automatiquement les jours ouvrés en CPC ou CPI
export async function poserCongesPeriode(
  uid: string,
  enfantId: string,
  annee: number,
  mois: number,
  jourDebut: number,
  jourFin: number,
  code: "CPC" | "CPI" | "CSS",
  planningType: Record<string, number>
) {
  const joursSemaine = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const joursToSave: Record<string, JourData> = {};
  let count = 0;

  for (let j = jourDebut; j <= jourFin; j++) {
    const date = new Date(annee, mois, j);
    const dow = date.getDay();
    // Skip week-ends
    if (dow === 0 || dow === 6) continue;

    const jourKey = joursSemaine[dow];
    const heuresContrat = planningType[jourKey] || 0;
    // Skip jours non travaillés selon le planning
    if (heuresContrat === 0) continue;

    const jourType: JourType = code === "CSS" ? "abs_salarie" : "conge";
    joursToSave[String(j)] = {
      type: jourType,
      heures: 0,
      heures_comp: 0,
      heures_sup: 0,
      heures_contrac: code === "CPC" ? heuresContrat : 0, // CPc = col.O, CPi et CSS = vide
      repas: false,
      commentaire: code,
    };
    count++;
  }

  // Sauvegarder tous les jours d'un coup
  if (Object.keys(joursToSave).length > 0) {
    const id = moisDocId(enfantId, annee, mois);
    await setDoc(
      doc(db, "users", uid, "mois", id),
      { enfant_id: enfantId, annee, mois, jours: joursToSave },
      { merge: true }
    );
  }

  // Mettre à jour le tableau CP
  await saveCPMois(uid, enfantId, annee, mois, {
    [code === "CPC" ? "cpc_pris" : "cpi_pris"]: count,
  } as Partial<CPMoisEntry>);

  return count;
}

export type JourType =
  | "work"
  | "abs_enfant"
  | "abs_salarie"
  | "conge"
  | "ferie_travaille"
  | "repos";

export interface JourData {
  type: JourType;
  heures: number;
  heures_comp: number;
  heures_sup: number;
  heures_contrac: number;
  repas: boolean;
  commentaire: string;
}

export interface MoisData {
  enfant_id: string;
  annee: number;
  mois: number;
  jours: Record<string, JourData>;

  taux_horaire_mois: number;
  majoration_sup_mens: number;
  heures_comp_base: number;
  majoration_comp: number;
  heures_sup_base: number;
  majoration_sup: number;
  absence_enfant_heures: number;
  absence_salarie_heures: number;
  indemnite_cp: number;
  regularisation: number;
  iccp: number;
  prime_precarite_base: number;

  ie_base: number;
  ie_nombre: number;
  ie_comp_base: number;
  ie_comp_nombre: number;
  repas_base: number;
  repas_nombre: number;
  repas_parents_base: number;
  repas_parents_nombre: number;
  km_base: number;
  km_nombre: number;
  indemnite_rupture: number;
  autres_non_imposable: number;

  taux_pas: number;
  jours_pajemploi: number;

  date_paiement: string;
  banque: string;
  num_cheque_virement: string;

  cp_n_mois_travailles: number;
  cp_n_semaines_travaillees: number;
  cp_n_jours_enfant: number;
  cp_n_jours_pris: number;
  cp_n1_mois_travailles: number;
  cp_n1_semaines_travaillees: number;
  cp_n1_jours_enfant: number;
  cp_n1_jours_pris: number;

  commentaire_mois: string;
}

// ============ User ============

export async function getUserData(uid: string): Promise<UserData | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserData) : null;
}

export async function saveUserData(uid: string, data: Partial<UserData>) {
  await setDoc(doc(db, "users", uid), data, { merge: true });
}

// ============ Enfants ============

export async function getEnfants(uid: string): Promise<Enfant[]> {
  const snap = await getDocs(collection(db, "users", uid, "enfants"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Enfant));
}

export async function getEnfant(
  uid: string,
  enfantId: string
): Promise<Enfant | null> {
  const snap = await getDoc(doc(db, "users", uid, "enfants", enfantId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Enfant) : null;
}

export async function saveEnfant(
  uid: string,
  enfantId: string | null,
  data: Omit<Enfant, "id">
) {
  if (enfantId) {
    await setDoc(doc(db, "users", uid, "enfants", enfantId), data);
    return enfantId;
  } else {
    const ref = doc(collection(db, "users", uid, "enfants"));
    await setDoc(ref, data);
    return ref.id;
  }
}

export async function deleteEnfant(uid: string, enfantId: string) {
  await deleteDoc(doc(db, "users", uid, "enfants", enfantId));
}

// ============ Mois ============

function moisDocId(enfantId: string, annee: number, mois: number): string {
  return `${enfantId}_${annee}_${String(mois).padStart(2, "0")}`;
}

export async function getMoisData(
  uid: string,
  enfantId: string,
  annee: number,
  mois: number
): Promise<MoisData | null> {
  const id = moisDocId(enfantId, annee, mois);
  const snap = await getDoc(doc(db, "users", uid, "mois", id));
  return snap.exists() ? (snap.data() as MoisData) : null;
}

export async function saveMoisData(
  uid: string,
  enfantId: string,
  annee: number,
  mois: number,
  data: Partial<MoisData>
) {
  const id = moisDocId(enfantId, annee, mois);
  await setDoc(
    doc(db, "users", uid, "mois", id),
    { ...data, enfant_id: enfantId, annee, mois },
    { merge: true }
  );
}

export async function saveJourData(
  uid: string,
  enfantId: string,
  annee: number,
  mois: number,
  jour: string,
  data: JourData
) {
  const id = moisDocId(enfantId, annee, mois);
  await setDoc(
    doc(db, "users", uid, "mois", id),
    {
      enfant_id: enfantId,
      annee,
      mois,
      jours: { [jour]: data },
    },
    { merge: true }
  );
}

export async function getMoisDataForYear(
  uid: string,
  enfantId: string,
  annee: number
): Promise<MoisData[]> {
  const q = query(
    collection(db, "users", uid, "mois"),
    where("enfant_id", "==", enfantId),
    where("annee", "==", annee)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as MoisData);
}

// ============ Paramètres ============

export interface Parametres {
  annee: number;
  version: string;
  cotisations: Record<string, number>;
  ie_minimum_6h23: number;
  ie_minimum_9h: number;
  ie_par_heure_10h_plus: number;
  evaluation_repas: number;
}

export async function getParametres(uid: string): Promise<Parametres | null> {
  const snap = await getDoc(doc(db, "users", uid, "parametres", "config"));
  return snap.exists() ? (snap.data() as Parametres) : null;
}

export async function saveParametres(uid: string, data: Partial<Parametres>) {
  await setDoc(doc(db, "users", uid, "parametres", "config"), data, {
    merge: true,
  });
}

// ============ Default MoisData ============

export function defaultMoisData(
  enfantId: string,
  annee: number,
  mois: number,
  enfant: Enfant
): MoisData {
  return {
    enfant_id: enfantId,
    annee,
    mois,
    jours: {},
    taux_horaire_mois: enfant.taux_horaire,
    majoration_sup_mens: 0.25,
    heures_comp_base: 0,
    majoration_comp: 0,
    heures_sup_base: 0,
    majoration_sup: 0.25,
    absence_enfant_heures: 0,
    absence_salarie_heures: 0,
    indemnite_cp: 0,
    regularisation: 0,
    iccp: 0,
    prime_precarite_base: 0,
    ie_base: enfant.indemnite_entretien_jour,
    ie_nombre: 0,
    ie_comp_base: 0,
    ie_comp_nombre: 0,
    repas_base: enfant.indemnite_repas,
    repas_nombre: 0,
    repas_parents_base: 0,
    repas_parents_nombre: 0,
    km_base: enfant.indemnite_km,
    km_nombre: 0,
    indemnite_rupture: 0,
    autres_non_imposable: 0,
    taux_pas: 0,
    jours_pajemploi: 0,
    date_paiement: "",
    banque: "",
    num_cheque_virement: "",
    cp_n_mois_travailles: 0,
    cp_n_semaines_travaillees: 0,
    cp_n_jours_enfant: 0,
    cp_n_jours_pris: 0,
    cp_n1_mois_travailles: 0,
    cp_n1_semaines_travaillees: 0,
    cp_n1_jours_enfant: 0,
    cp_n1_jours_pris: 0,
    commentaire_mois: "",
  };
}
