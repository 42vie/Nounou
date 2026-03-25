"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getEnfant, getMoisData, saveMoisData, Enfant } from "@/lib/firestore";
import { calculerConges, CongesResult } from "@/lib/calculs/conges";

interface PeriodData {
  mois_travailles: number;
  semaines_travaillees: number;
  jours_enfant: number;
  jours_pris: number;
}

function getPeriodDates(annee: number): { debut: string; fin: string } {
  return {
    debut: `1er juin ${annee - 1}`,
    fin: `31 mai ${annee}`,
  };
}

function getCurrentPeriodYear(): number {
  const now = new Date();
  // Period N runs 1er juin Y-1 to 31 mai Y
  // If we're June or later, the current period started this year
  if (now.getMonth() >= 5) {
    return now.getFullYear() + 1;
  }
  return now.getFullYear();
}

function calcAcquis(p: PeriodData): CongesResult {
  return calculerConges({
    mois_travailles: p.mois_travailles,
    semaines_travaillees: p.semaines_travaillees,
    jours_enfant: p.jours_enfant,
    jours_pris: p.jours_pris,
  });
}

export default function CongesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const enfantId = params.enfantId as string;

  const [enfant, setEnfant] = useState<Enfant | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const periodYear = getCurrentPeriodYear();

  const [periodN, setPeriodN] = useState<PeriodData>({
    mois_travailles: 0,
    semaines_travaillees: 0,
    jours_enfant: 0,
    jours_pris: 0,
  });
  const [periodN1, setPeriodN1] = useState<PeriodData>({
    mois_travailles: 0,
    semaines_travaillees: 0,
    jours_enfant: 0,
    jours_pris: 0,
  });

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const loadData = useCallback(async () => {
    if (!user || !enfantId) return;
    setLoadingData(true);

    const e = await getEnfant(user.uid, enfantId);
    setEnfant(e);

    // Load latest month data to get CP state
    const now = new Date();
    const moisData = await getMoisData(user.uid, enfantId, now.getFullYear(), now.getMonth());

    if (moisData) {
      setPeriodN({
        mois_travailles: moisData.cp_n_mois_travailles || 0,
        semaines_travaillees: moisData.cp_n_semaines_travaillees || 0,
        jours_enfant: moisData.cp_n_jours_enfant || 0,
        jours_pris: moisData.cp_n_jours_pris || 0,
      });
      setPeriodN1({
        mois_travailles: moisData.cp_n1_mois_travailles || 0,
        semaines_travaillees: moisData.cp_n1_semaines_travaillees || 0,
        jours_enfant: moisData.cp_n1_jours_enfant || 0,
        jours_pris: moisData.cp_n1_jours_pris || 0,
      });
    }

    setLoadingData(false);
  }, [user, enfantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function savePeriods(n: PeriodData, n1: PeriodData) {
    if (!user || !enfantId) return;
    const now = new Date();
    await saveMoisData(user.uid, enfantId, now.getFullYear(), now.getMonth(), {
      cp_n_mois_travailles: n.mois_travailles,
      cp_n_semaines_travaillees: n.semaines_travaillees,
      cp_n_jours_enfant: n.jours_enfant,
      cp_n_jours_pris: n.jours_pris,
      cp_n1_mois_travailles: n1.mois_travailles,
      cp_n1_semaines_travaillees: n1.semaines_travaillees,
      cp_n1_jours_enfant: n1.jours_enfant,
      cp_n1_jours_pris: n1.jours_pris,
    });
  }

  function handleChangeN(field: keyof PeriodData, value: number) {
    const updated = { ...periodN, [field]: value };
    setPeriodN(updated);
    savePeriods(updated, periodN1);
  }

  function handleChangeN1(field: keyof PeriodData, value: number) {
    const updated = { ...periodN1, [field]: value };
    setPeriodN1(updated);
    savePeriods(periodN, updated);
  }

  if (loading || !user) return null;

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  const congesN = calcAcquis(periodN);
  const congesN1 = calcAcquis(periodN1);
  const datesN = getPeriodDates(periodYear);
  const datesN1 = getPeriodDates(periodYear - 1);

  const fields: { key: keyof PeriodData; label: string; step: string }[] = [
    { key: "mois_travailles", label: "Mois travailles", step: "1" },
    { key: "semaines_travaillees", label: "Semaines travaillees", step: "1" },
    { key: "jours_enfant", label: "Jours supp. enfant (< 14 ans)", step: "1" },
    { key: "jours_pris", label: "Jours de CP pris", step: "0.5" },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto px-4 py-6">
      <div>
        <button
          onClick={() => router.back()}
          className="text-purple-600 text-sm font-medium mb-2 hover:underline"
        >
          &larr; Retour
        </button>
        <h1 className="text-2xl font-bold text-purple-900">
          Conges payes
        </h1>
        {enfant && (
          <p className="text-purple-600 text-sm mt-1">{enfant.nom}</p>
        )}
      </div>

      {/* Periode N */}
      <div className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden">
        <div className="bg-purple-600 text-white px-4 py-3">
          <h2 className="font-bold">Periode N (en cours)</h2>
          <p className="text-purple-200 text-xs">{datesN.debut} au {datesN.fin}</p>
        </div>
        <div className="p-4 space-y-3">
          {fields.map(({ key, label, step }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium text-gray-700 flex-1">{label}</label>
              <input
                type="number"
                step={step}
                min="0"
                value={periodN[key] || ""}
                onChange={(e) => handleChangeN(key, parseFloat(e.target.value) || 0)}
                className="w-24 border border-gray-300 rounded-lg p-2 text-sm text-right focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          ))}
          <div className="border-t border-purple-100 pt-3 mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-purple-900">Jours acquis</span>
              <span className="text-lg font-bold text-purple-700">{congesN.jours_acquis}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-purple-900">Solde</span>
              <span className={`text-lg font-bold ${congesN.solde >= 0 ? "text-green-600" : "text-red-600"}`}>
                {congesN.solde}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Periode N-1 */}
      <div className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden">
        <div className="bg-purple-500 text-white px-4 py-3">
          <h2 className="font-bold">Periode N-1 (precedente)</h2>
          <p className="text-purple-200 text-xs">{datesN1.debut} au {datesN1.fin}</p>
        </div>
        <div className="p-4 space-y-3">
          {fields.map(({ key, label, step }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium text-gray-700 flex-1">{label}</label>
              <input
                type="number"
                step={step}
                min="0"
                value={periodN1[key] || ""}
                onChange={(e) => handleChangeN1(key, parseFloat(e.target.value) || 0)}
                className="w-24 border border-gray-300 rounded-lg p-2 text-sm text-right focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          ))}
          <div className="border-t border-purple-100 pt-3 mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-purple-900">Jours acquis</span>
              <span className="text-lg font-bold text-purple-700">{congesN1.jours_acquis}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-purple-900">Solde</span>
              <span className={`text-lg font-bold ${congesN1.solde >= 0 ? "text-green-600" : "text-red-600"}`}>
                {congesN1.solde}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recap */}
      <div className="bg-purple-50 rounded-xl p-4 text-center">
        <p className="text-sm text-purple-700 font-medium">Total solde conges</p>
        <p className={`text-3xl font-bold mt-1 ${(congesN.solde + congesN1.solde) >= 0 ? "text-purple-900" : "text-red-600"}`}>
          {congesN.solde + congesN1.solde} jours
        </p>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Formule : acquis = min(ceil(sem/4 &times; 2.5 + mois &times; 2.5) + jours enfant, 30)
      </p>
    </div>
  );
}
