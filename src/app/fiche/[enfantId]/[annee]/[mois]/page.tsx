"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  getEnfant,
  getMoisData,
  getUserData,
  defaultMoisData,
  getMoisDataForYear,
  getCPTableau,
  Enfant,
  MoisData,
  UserData,
  CPMoisEntry,
} from "@/lib/firestore";
import { MOIS_NOMS, getDaysInMonth } from "@/lib/utils";
import { calculerBulletinComplet } from "@/lib/calculs/fiche-complete";
import { COTISATIONS_2026 } from "@/lib/constants/cotisations-2026";
import { calculerAbsencesMois } from "@/lib/calculs/absences";
import { calculerMensualisation } from "@/lib/calculs/mensualisation";
import { BulletinComplet } from "@/components/bulletin/BulletinComplet";

export default function FichePage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const enfantId = params.enfantId as string;
  const annee = parseInt(params.annee as string);
  const moisIdx = parseInt(params.mois as string);

  const [enfant, setEnfant] = useState<Enfant | null>(null);
  const [moisData, setMoisData] = useState<MoisData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [cumulData, setCumulData] = useState<{ netImposable: number; ieInIk: number }>({ netImposable: 0, ieInIk: 0 });
  const [cpTableau, setCpTableau] = useState<CPMoisEntry[]>([]);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [e, m, u, cpData] = await Promise.all([
      getEnfant(user.uid, enfantId),
      getMoisData(user.uid, enfantId, annee, moisIdx),
      getUserData(user.uid),
      getCPTableau(user.uid, enfantId),
    ]);
    setEnfant(e);
    setUserData(u);
    setCpTableau(cpData);
    if (m) {
      setMoisData(m);
    } else if (e) {
      setMoisData(defaultMoisData(enfantId, annee, moisIdx, e));
    }

    // Calculer cumul annuel
    const allMois = await getMoisDataForYear(user.uid, enfantId, annee);
    let cumulNet = 0;
    let cumulIe = 0;
    for (const md of allMois) {
      // Ne cumuler que les mois avec des jours réellement saisis
      const hasJours = md.jours && Object.keys(md.jours).length > 0;
      if (md.mois <= moisIdx && hasJours) {
        try {
          const enf = e!;
          const bulletin = calculerBulletinComplet({
            mensualisation: {
              type_contrat: enf.type_contrat,
              annee_complete: enf.annee_complete,
              semaines_programmees: enf.semaines_programmees,
              heures_normales_semaine: enf.heures_normales_semaine,
              heures_sup_semaine: enf.heures_sup_semaine,
              mois_prevus: enf.mois_prevus,
            },
            taux_horaire: md.taux_horaire_mois || enf.taux_horaire,
            majoration_sup_mens: md.majoration_sup_mens || 0.25,
            heures_comp_base: md.heures_comp_base || 0,
            majoration_comp: md.majoration_comp || 0,
            heures_sup_base: md.heures_sup_base || 0,
            majoration_sup: md.majoration_sup || 0.25,
            absence_enfant_heures: md.absence_enfant_heures || 0,
            absence_salarie_heures: md.absence_salarie_heures || 0,
            taux_deduction_absence_enfant: md.taux_horaire_mois || enf.taux_horaire,
            taux_deduction_absence_salarie: md.taux_horaire_mois || enf.taux_horaire,
            indemnite_cp: md.indemnite_cp || 0,
            regularisation: md.regularisation || 0,
            iccp: md.iccp || 0,
            prime_precarite_base: md.prime_precarite_base || 0,
            alsace_moselle: u?.alsace_moselle || false,
            cotisations_config: COTISATIONS_2026,
            indemnites: {
              ie_base: md.ie_base || 0,
              ie_nombre: md.ie_nombre || 0,
              ie_comp_base: md.ie_comp_base || 0,
              ie_comp_nombre: md.ie_comp_nombre || 0,
              repas_base: md.repas_base || 0,
              repas_nombre: md.repas_nombre || 0,
              repas_parents_base: md.repas_parents_base || 0,
              repas_parents_nombre: md.repas_parents_nombre || 0,
              km_base: md.km_base || 0,
              km_nombre: md.km_nombre || 0,
              indemnite_rupture: md.indemnite_rupture || 0,
              autres_non_imposable: md.autres_non_imposable || 0,
            },
            taux_pas: md.taux_pas || 0,
            jours: Object.fromEntries(
              Object.entries(md.jours || {}).map(([k, v]) => [
                k,
                { heures: v.heures || 0, heures_comp: v.heures_comp || 0, heures_sup: v.heures_sup || 0 },
              ])
            ),
            conges_n: {
              mois_travailles: md.cp_n_mois_travailles || 0,
              semaines_travaillees: md.cp_n_semaines_travaillees || 0,
              jours_enfant: md.cp_n_jours_enfant || 0,
              jours_pris: md.cp_n_jours_pris || 0,
            },
            conges_n1: {
              mois_travailles: md.cp_n1_mois_travailles || 0,
              semaines_travaillees: md.cp_n1_semaines_travaillees || 0,
              jours_enfant: md.cp_n1_jours_enfant || 0,
              jours_pris: md.cp_n1_jours_pris || 0,
            },
          });
          cumulNet += bulletin.net.net_imposable;
          cumulIe += bulletin.indemnites.total_ie_in_ik;
        } catch {
          // skip
        }
      }
    }
    setCumulData({ netImposable: cumulNet, ieInIk: cumulIe });
  }, [user, enfantId, annee, moisIdx]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!enfant || !moisData) {
    return <div className="p-8 text-center text-gray-400">Chargement du bulletin...</div>;
  }

  // Auto-calculer depuis les jours saisis
  const joursArray = Object.values(moisData.jours || {});
  const joursEffectifsTravailles = joursArray.filter(
    (j) => j.type === "work" || (j.commentaire === "WORK" && j.heures > 0)
  ).length;

  // Auto-sommer heures complémentaires et supplémentaires depuis col. M et N
  let autoHeuresComp = 0;
  let autoHeuresSup = 0;
  joursArray.forEach((j) => {
    autoHeuresComp += j.heures_comp || 0;
    autoHeuresSup += j.heures_sup || 0;
  });

  // Auto-calculer absences depuis les jours saisis
  const taux = moisData.taux_horaire_mois || enfant.taux_horaire;
  const mens = calculerMensualisation({
    type_contrat: enfant.type_contrat,
    annee_complete: enfant.annee_complete,
    semaines_programmees: enfant.semaines_programmees,
    heures_normales_semaine: enfant.heures_normales_semaine,
    heures_sup_semaine: enfant.heures_sup_semaine,
    mois_prevus: enfant.mois_prevus,
  });

  // Prorata du 1er mois si embauche en cours de mois
  const embaucheDate = enfant.date_embauche?.toDate?.() ? enfant.date_embauche.toDate() : null;
  const isPremierMois = embaucheDate &&
    embaucheDate.getFullYear() === annee &&
    embaucheDate.getMonth() === moisIdx &&
    embaucheDate.getDate() > 1;

  let heuresMensuProrata = mens.heures_mensualisees;
  if (isPremierMois && embaucheDate) {
    // Prorata basé sur les HEURES du planning type
    // Heures prévues dans le mois entier vs heures à partir de l'embauche
    const nbJM = getDaysInMonth(annee, moisIdx);
    const joursSemaine = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    let heuresTotalMois = 0;
    let heuresEffectives = 0;
    for (let d = 1; d <= nbJM; d++) {
      const date = new Date(annee, moisIdx, d);
      const dow = date.getDay();
      if (dow === 0 || dow === 6) continue;
      const jourKey = joursSemaine[dow];
      const h = (enfant.planning_type as Record<string, number>)?.[jourKey] || 0;
      heuresTotalMois += h;
      if (d >= embaucheDate.getDate()) heuresEffectives += h;
    }
    if (heuresTotalMois > 0) {
      heuresMensuProrata = Math.round(mens.heures_mensualisees * heuresEffectives / heuresTotalMois * 100) / 100;
    }
  }

  const salaireMensualise = heuresMensuProrata * taux;
  const absences = calculerAbsencesMois(
    {
      annee_complete: enfant.annee_complete,
      salaire_mensualise: salaireMensualise,
      taux_horaire: taux,
      planning_type: enfant.planning_type || {},
    },
    annee, moisIdx, moisData.jours || {}
  );

  // ===== AUTO-CALCUL CONGÉS PAYÉS =====
  const cpNDebut = moisIdx < 5 ? new Date(annee - 1, 5, 1) : new Date(annee, 5, 1);
  const embauche = enfant.date_embauche?.toDate?.() ? enfant.date_embauche.toDate() : new Date(2020, 0, 1);
  const cpNStart = embauche > cpNDebut ? embauche : cpNDebut;
  const cpNMoisTrav = Math.max(0, (annee * 12 + moisIdx) - (cpNStart.getFullYear() * 12 + cpNStart.getMonth()) + 1);
  const cpNSemTrav = Math.round(cpNMoisTrav * (enfant.semaines_programmees / 12));
  // CP pris = total de la collection CP (tous les mois de la période)
  const cpNPris = cpTableau.reduce(
    (sum, entry) => sum + (entry.cpc_pris || 0) + (entry.cpi_pris || 0),
    0
  );
  const cpSoldeInitial = enfant.cp_solde_initial || 0;

  // Calcul complet
  const bulletin = calculerBulletinComplet({
    mensualisation: {
      type_contrat: enfant.type_contrat,
      annee_complete: enfant.annee_complete,
      semaines_programmees: enfant.semaines_programmees,
      heures_normales_semaine: enfant.heures_normales_semaine,
      heures_sup_semaine: enfant.heures_sup_semaine,
      mois_prevus: enfant.mois_prevus,
    },
    // Prorata du 1er mois si embauche en cours de mois
    heures_mensualisees_override: isPremierMois ? heuresMensuProrata : undefined,
    taux_horaire: taux,
    majoration_sup_mens: moisData.majoration_sup_mens ?? 0.25,
    heures_comp_base: autoHeuresComp || moisData.heures_comp_base || 0,
    majoration_comp: moisData.majoration_comp || 0,
    heures_sup_base: autoHeuresSup || moisData.heures_sup_base || 0,
    majoration_sup: moisData.majoration_sup ?? 0.25,
    absence_enfant_heures: absences.heures_abs_enfant,
    absence_salarie_heures: absences.heures_abs_salarie,
    taux_deduction_absence_enfant: taux,
    taux_deduction_absence_salarie: taux,
    // Montant de déduction pré-calculé avec la bonne méthode (proportionnelle)
    // ≤46 sem : mens × jours_abs / jours_potentiel
    // 52 sem  : mens × heures_abs / heures_potentiel
    montant_deduction_salarie: absences.deduction,
    montant_deduction_enfant: 0, // ANJE ne déduit pas
    indemnite_cp: moisData.indemnite_cp || 0,
    regularisation: moisData.regularisation || 0,
    iccp: moisData.iccp || 0,
    prime_precarite_base: moisData.prime_precarite_base || 0,
    alsace_moselle: userData?.alsace_moselle || false,
    cotisations_config: COTISATIONS_2026,
    indemnites: {
      ie_base: moisData.ie_base || enfant.indemnite_entretien_jour || 0,
      ie_nombre: joursEffectifsTravailles,
      ie_comp_base: moisData.ie_comp_base || 0,
      ie_comp_nombre: moisData.ie_comp_nombre || 0,
      repas_base: moisData.repas_base || 0,
      repas_nombre: moisData.repas_nombre || 0,
      repas_parents_base: moisData.repas_parents_base || 0,
      repas_parents_nombre: moisData.repas_parents_nombre || 0,
      km_base: moisData.km_base || 0,
      km_nombre: moisData.km_nombre || 0,
      indemnite_rupture: moisData.indemnite_rupture || 0,
      autres_non_imposable: moisData.autres_non_imposable || 0,
    },
    taux_pas: moisData.taux_pas || 0,
    jours: Object.fromEntries(
      Object.entries(moisData.jours || {}).map(([k, v]) => [
        k,
        { heures: v.heures || 0, heures_comp: v.heures_comp || 0, heures_sup: v.heures_sup || 0 },
      ])
    ),
    conges_n: {
      mois_travailles: cpNMoisTrav,
      semaines_travaillees: cpNSemTrav,
      jours_enfant: moisData.cp_n_jours_enfant || 0,
      jours_pris: cpNPris,
    },
    conges_n1: {
      mois_travailles: moisData.cp_n1_mois_travailles || 0,
      semaines_travaillees: moisData.cp_n1_semaines_travaillees || 0,
      jours_enfant: moisData.cp_n1_jours_enfant || 0,
      jours_pris: moisData.cp_n1_jours_pris || 0,
    },
  });

  // Compute total heures contrac
  let totalHeuresContrac = 0;
  let totalHeures = 0;
  Object.values(moisData.jours || {}).forEach((j) => {
    totalHeuresContrac += j.heures_contrac || 0;
    totalHeures += j.heures || 0;
  });

  const nbJoursMois = getDaysInMonth(annee, moisIdx);

  const cpNPeriode = moisIdx < 5
    ? `01/06/${annee - 1} au 31/05/${annee}`
    : `01/06/${annee} au 31/05/${annee + 1}`;
  const cpN1Periode = moisIdx < 5
    ? `01/06/${annee - 2} au 31/05/${annee - 1}`
    : `01/06/${annee - 1} au 31/05/${annee}`;

  const dateEmbauche = enfant.date_embauche?.toDate?.()
    ? enfant.date_embauche.toDate().toLocaleDateString("fr-FR")
    : "";

  return (
    <div className="space-y-4 max-w-5xl mx-auto px-4 py-4">
      {/* Controls */}
      <div className="no-print flex justify-between items-center">
        <button onClick={() => router.back()} className="text-sm text-purple-600 hover:underline">
          ← Retour
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
          >
            Imprimer / PDF
          </button>
          <button
            onClick={() => router.push(`/mois`)}
            className="px-4 py-2 border rounded-lg text-sm"
          >
            Modifier
          </button>
        </div>
      </div>

      {/* Bulletin */}
      <BulletinComplet
        employeur={{
          nom: enfant.emp_nom,
          adresse: enfant.emp_adresse,
          complement: enfant.emp_complement,
          cp_ville: enfant.emp_cp_ville,
          num: enfant.emp_num,
        }}
        salarie={{
          nom: userData?.nom || "",
          adresse: userData?.adresse || "",
          complement: userData?.complement || "",
          cp_ville: userData?.cp_ville || "",
          num_ss: userData?.num_ss || "",
          num_pajemploi: userData?.num_pajemploi || "",
          date_embauche: dateEmbauche,
          qualification: userData?.qualification || "Assistant(e) maternel(le) Agréé(e)",
        }}
        enfant_nom={enfant.nom}
        type_contrat={enfant.type_contrat === "CDI" ? "CDI" : "CDD"}
        mois_label={MOIS_NOMS[moisIdx].toLowerCase()}
        annee={annee}
        semaines_prog={enfant.semaines_programmees}
        heures_norm_sem={enfant.heures_normales_semaine}
        heures_sup_sem={enfant.heures_sup_semaine}
        heures_mensualisees={isPremierMois ? heuresMensuProrata : bulletin.mensualisation.heures_mensualisees}
        heures_sup_mensualisees={bulletin.mensualisation.heures_sup_mensualisees}
        remuneration={bulletin.remuneration}
        taux_horaire={taux}
        majoration_sup_mens={moisData.majoration_sup_mens ?? 0.25}
        majoration_comp={moisData.majoration_comp || 0}
        majoration_sup={moisData.majoration_sup ?? 0.25}
        heures_comp_base={autoHeuresComp || moisData.heures_comp_base || 0}
        heures_sup_base={autoHeuresSup || moisData.heures_sup_base || 0}
        absence_enfant_heures={absences.heures_abs_enfant}
        absence_salarie_heures={absences.heures_abs_salarie}
        taux_deduction_enfant={taux}
        taux_deduction_salarie={taux}
        prime_precarite_base={moisData.prime_precarite_base || 0}
        jours={Object.fromEntries(
          Object.entries(moisData.jours || {}).map(([k, v]) => [k, {
            heures: v.heures || 0,
            heures_comp: v.heures_comp || 0,
            heures_sup: v.heures_sup || 0,
            heures_contrac: v.heures_contrac || 0,
            commentaire: v.commentaire || "",
          }])
        )}
        nbJoursMois={nbJoursMois}
        cotisations={bulletin.cotisations}
        total_heures={bulletin.resume_heures.total_heures}
        total_heures_comp={bulletin.resume_heures.total_heures_comp}
        total_heures_sup={bulletin.resume_heures.total_heures_sup}
        total_heures_contrac={totalHeuresContrac + totalHeures}
        salaire_net_social={bulletin.net.salaire_net_social}
        indemnites={{
          ie_base: moisData.ie_base || enfant.indemnite_entretien_jour || 0,
          ie_nombre: joursEffectifsTravailles,
          g52: bulletin.indemnites.g52,
          ie_comp_base: moisData.ie_comp_base || 0,
          ie_comp_nombre: moisData.ie_comp_nombre || 0,
          g53: bulletin.indemnites.g53,
          repas_base: moisData.repas_base || 0,
          repas_nombre: moisData.repas_nombre || 0,
          g54: bulletin.indemnites.g54,
          repas_parents_base: moisData.repas_parents_base || 0,
          repas_parents_nombre: moisData.repas_parents_nombre || 0,
          g55: bulletin.indemnites.g55,
          km_base: moisData.km_base || 0,
          km_nombre: moisData.km_nombre || 0,
          g56: bulletin.indemnites.g56,
          g57: bulletin.indemnites.g57,
          g58: bulletin.indemnites.g58,
          total_indemnites: bulletin.indemnites.total_indemnites,
        }}
        jours_8h_plus={bulletin.pajemploi.jours_8h_plus}
        cumul_heures_moins_8h={bulletin.pajemploi.cumul_heures_moins_8h}
        jours_pajemploi={moisData.jours_pajemploi || enfant.jours_pajemploi_contrat || 0}
        net_imposable={bulletin.net.net_imposable}
        taux_pas={moisData.taux_pas || 0}
        montant_pas={bulletin.net.montant_pas}
        net_a_payer={bulletin.net.net_a_payer}
        date_paiement={moisData.date_paiement || ""}
        banque={moisData.banque || ""}
        num_cheque_virement={moisData.num_cheque_virement || ""}
        total_ie_in_ik={bulletin.indemnites.total_ie_in_ik}
        cumul_net_imposable={cumulData.netImposable}
        cumul_ie_in_ik={cumulData.ieInIk}
        conges_n={{
          periode: cpNPeriode,
          mois_trav: cpNMoisTrav,
          sem_trav: cpNSemTrav,
          jours_enfant: moisData.cp_n_jours_enfant || 0,
          jours_acquis: Math.min(Math.round(cpNMoisTrav * 2.5 * 100) / 100, 30),
          jours_pris: cpNPris,
          solde: Math.round((cpSoldeInitial + Math.min(cpNMoisTrav * 2.5, 30) - cpNPris) * 100) / 100,
        }}
        conges_n1={{
          periode: cpN1Periode,
          mois_trav: moisData.cp_n1_mois_travailles || 0,
          sem_trav: moisData.cp_n1_semaines_travaillees || 0,
          jours_enfant: moisData.cp_n1_jours_enfant || 0,
          jours_acquis: bulletin.conges_n1.jours_acquis,
          jours_pris: moisData.cp_n1_jours_pris || 0,
          solde: bulletin.conges_n1.solde,
        }}
        commentaire_mois={moisData.commentaire_mois || ""}
      />
    </div>
  );
}
