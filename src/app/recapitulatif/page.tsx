"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  getEnfants,
  getMoisDataForYear,
  defaultMoisData,
  Enfant,
  MoisData,
} from "@/lib/firestore";
import { MOIS_NOMS, formatEuro } from "@/lib/utils";
import { calculerBulletinComplet } from "@/lib/calculs/fiche-complete";
import { COTISATIONS_2026 } from "@/lib/constants/cotisations-2026";

interface MoisRecap {
  mois: number;
  revenuImposable: number;
  jours8hPlus: number;
  heuresMoins8h: number;
  jours24h: number;
}

export default function RecapitulatifPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [enfants, setEnfants] = useState<Enfant[]>([]);
  const [selectedEnfant, setSelectedEnfant] = useState<string>("");
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [recapData, setRecapData] = useState<MoisRecap[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [enfant, setEnfant] = useState<Enfant | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      getEnfants(user.uid).then((e) => {
        setEnfants(e);
        if (e.length > 0 && !selectedEnfant) {
          setSelectedEnfant(e[0].id!);
        }
      });
    }
  }, [user, selectedEnfant]);

  const loadRecap = useCallback(async () => {
    if (!user || !selectedEnfant) return;
    setLoadingData(true);

    const e = enfants.find((x) => x.id === selectedEnfant);
    setEnfant(e || null);
    if (!e) {
      setLoadingData(false);
      return;
    }

    const moisDataList = await getMoisDataForYear(user.uid, selectedEnfant, annee);

    const moisMap: Record<number, MoisData> = {};
    moisDataList.forEach((md) => {
      moisMap[md.mois] = md;
    });

    const recap: MoisRecap[] = [];

    for (let m = 0; m < 12; m++) {
      const md = moisMap[m] || defaultMoisData(selectedEnfant, annee, m, e);

      try {
        const bulletin = calculerBulletinComplet({
          mensualisation: {
            type_contrat: e.type_contrat,
            annee_complete: e.annee_complete,
            semaines_programmees: e.semaines_programmees,
            heures_normales_semaine: e.heures_normales_semaine,
            heures_sup_semaine: e.heures_sup_semaine,
            mois_prevus: e.mois_prevus,
          },
          taux_horaire: md.taux_horaire_mois || e.taux_horaire,
          majoration_sup_mens: md.majoration_sup_mens,
          heures_comp_base: md.heures_comp_base,
          majoration_comp: md.majoration_comp,
          heures_sup_base: md.heures_sup_base,
          majoration_sup: md.majoration_sup,
          absence_enfant_heures: md.absence_enfant_heures,
          absence_salarie_heures: md.absence_salarie_heures,
          taux_deduction_absence_enfant: 1,
          taux_deduction_absence_salarie: 1,
          indemnite_cp: md.indemnite_cp,
          regularisation: md.regularisation,
          iccp: md.iccp,
          prime_precarite_base: md.prime_precarite_base,
          alsace_moselle: false,
          cotisations_config: COTISATIONS_2026,
          indemnites: {
            ie_base: md.ie_base,
            ie_nombre: md.ie_nombre,
            ie_comp_base: md.ie_comp_base,
            ie_comp_nombre: md.ie_comp_nombre,
            repas_base: md.repas_base,
            repas_nombre: md.repas_nombre,
            repas_parents_base: md.repas_parents_base,
            repas_parents_nombre: md.repas_parents_nombre,
            km_base: md.km_base,
            km_nombre: md.km_nombre,
            indemnite_rupture: md.indemnite_rupture,
            autres_non_imposable: md.autres_non_imposable,
          },
          taux_pas: md.taux_pas,
          jours: md.jours || {},
          conges_n: {
            mois_travailles: md.cp_n_mois_travailles,
            semaines_travaillees: md.cp_n_semaines_travaillees,
            jours_enfant: md.cp_n_jours_enfant,
            jours_pris: md.cp_n_jours_pris,
          },
          conges_n1: {
            mois_travailles: md.cp_n1_mois_travailles,
            semaines_travaillees: md.cp_n1_semaines_travaillees,
            jours_enfant: md.cp_n1_jours_enfant,
            jours_pris: md.cp_n1_jours_pris,
          },
        });

        // Count jours >= 8h, hours < 8h, and jours 24h
        let jours8hPlus = 0;
        let heuresMoins8h = 0;
        let jours24h = 0;

        Object.values(md.jours || {}).forEach((j) => {
          const total = j.heures + (j.heures_comp || 0) + (j.heures_sup || 0);
          if (total >= 24) {
            jours24h++;
          } else if (total >= 8) {
            jours8hPlus++;
          } else if (total > 0) {
            heuresMoins8h += total;
          }
        });

        recap.push({
          mois: m,
          revenuImposable: bulletin.net.net_imposable || 0,
          jours8hPlus,
          heuresMoins8h: Math.round(heuresMoins8h * 100) / 100,
          jours24h,
        });
      } catch {
        recap.push({
          mois: m,
          revenuImposable: 0,
          jours8hPlus: 0,
          heuresMoins8h: 0,
          jours24h: 0,
        });
      }
    }

    setRecapData(recap);
    setLoadingData(false);
  }, [user, selectedEnfant, annee, enfants]);

  useEffect(() => {
    loadRecap();
  }, [loadRecap]);

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!user) return null;

  const totaux = recapData.reduce(
    (acc, r) => ({
      revenuImposable: acc.revenuImposable + r.revenuImposable,
      jours8hPlus: acc.jours8hPlus + r.jours8hPlus,
      heuresMoins8h: Math.round((acc.heuresMoins8h + r.heuresMoins8h) * 100) / 100,
      jours24h: acc.jours24h + r.jours24h,
    }),
    { revenuImposable: 0, jours8hPlus: 0, heuresMoins8h: 0, jours24h: 0 }
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-purple-900">Recapitulatif annuel</h1>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 print:hidden"
        >
          Imprimer
        </button>
      </div>

      {/* Selectors */}
      <div className="flex gap-3 items-center flex-wrap print:hidden">
        <select
          value={selectedEnfant}
          onChange={(e) => setSelectedEnfant(e.target.value)}
          className="border rounded-lg p-2.5 text-sm font-medium flex-1 min-w-0"
        >
          {enfants.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nom}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAnnee(annee - 1)}
            className="px-3 py-2 border rounded-lg hover:bg-gray-100"
          >
            &larr;
          </button>
          <span className="px-4 py-2 font-bold text-sm min-w-[80px] text-center">
            {annee}
          </span>
          <button
            onClick={() => setAnnee(annee + 1)}
            className="px-3 py-2 border rounded-lg hover:bg-gray-100"
          >
            &rarr;
          </button>
        </div>
      </div>

      {enfant && (
        <p className="text-sm text-purple-600 print:text-black">
          {enfant.nom} &mdash; Annee {annee}
        </p>
      )}

      {loadingData ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-purple-600 text-white">
                <th className="px-4 py-3 text-left font-semibold">Mois</th>
                <th className="px-4 py-3 text-right font-semibold">Revenu Imposable</th>
                <th className="px-4 py-3 text-right font-semibold">Jrs &ge;8h</th>
                <th className="px-4 py-3 text-right font-semibold">Hrs &lt;8h</th>
                <th className="px-4 py-3 text-right font-semibold">Jrs 24h</th>
              </tr>
            </thead>
            <tbody>
              {recapData.map((r, idx) => (
                <tr
                  key={r.mois}
                  className={`border-b border-purple-50 ${idx % 2 === 0 ? "bg-white" : "bg-purple-50/30"}`}
                >
                  <td className="px-4 py-2.5 font-medium text-gray-900">{MOIS_NOMS[r.mois]}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">{formatEuro(r.revenuImposable)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">{r.jours8hPlus}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">{r.heuresMoins8h}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">{r.jours24h}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-purple-100 font-bold text-purple-900">
                <td className="px-4 py-3">TOTAUX</td>
                <td className="px-4 py-3 text-right">{formatEuro(totaux.revenuImposable)}</td>
                <td className="px-4 py-3 text-right">{totaux.jours8hPlus}</td>
                <td className="px-4 py-3 text-right">{totaux.heuresMoins8h}</td>
                <td className="px-4 py-3 text-right">{totaux.jours24h}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
