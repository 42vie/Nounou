"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getEnfant, Enfant } from "@/lib/firestore";
import { calculerRupture, RuptureResult } from "@/lib/calculs/rupture";
import { formatEuro } from "@/lib/utils";

export default function RupturePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const enfantId = params.enfantId as string;

  const [enfant, setEnfant] = useState<Enfant | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const [form, setForm] = useState({
    total_salaires_bruts: 0,
    mois_accueil: 0,
    cp_acquis_non_pris: 0,
    salaire_mensuel_brut: 0,
    total_brut_periode_ref: 0,
    heures_reellement_effectuees: 0,
    heures_mensualisees_payees: 0,
  });

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user && enfantId) {
      setLoadingData(true);
      getEnfant(user.uid, enfantId).then((e) => {
        if (e) setEnfant(e);
        setLoadingData(false);
      });
    }
  }, [user, enfantId]);

  function update(field: string, value: number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!user) return null;

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  const result: RuptureResult = calculerRupture({
    total_salaires_bruts: form.total_salaires_bruts,
    mois_accueil: form.mois_accueil,
    cp_acquis_non_pris: form.cp_acquis_non_pris,
    salaire_mensuel_brut: form.salaire_mensuel_brut,
    total_brut_periode_ref: form.total_brut_periode_ref,
    heures_reellement_effectuees: form.heures_reellement_effectuees,
    heures_mensualisees_payees: form.heures_mensualisees_payees,
    taux_horaire: enfant?.taux_horaire || 0,
    annee_complete: enfant?.annee_complete ?? true,
  });

  const inputFields = [
    { field: "total_salaires_bruts", label: "Total salaires bruts perçus", step: "0.01", suffix: "EUR" },
    { field: "mois_accueil", label: "Nombre de mois d'accueil", step: "1", suffix: "mois" },
    { field: "cp_acquis_non_pris", label: "CP acquis non pris", step: "0.5", suffix: "jours" },
    { field: "salaire_mensuel_brut", label: "Salaire mensuel brut (maintien)", step: "0.01", suffix: "EUR" },
    { field: "total_brut_periode_ref", label: "Total brut période de référence", step: "0.01", suffix: "EUR" },
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
          Simulateur de rupture
        </h1>
        {enfant && (
          <p className="text-purple-600 text-sm mt-1">
            {enfant.nom} &mdash; {enfant.type_contrat}{" "}
            {enfant.annee_complete ? "(année complète)" : "(année incomplète)"}
          </p>
        )}
      </div>

      {/* Input fields */}
      <div className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden">
        <div className="bg-purple-600 text-white px-4 py-3">
          <h2 className="font-bold">Données du contrat</h2>
        </div>
        <div className="p-4 space-y-4">
          {inputFields.map(({ field, label, step, suffix }) => (
            <div key={field} className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium text-gray-700 flex-1">
                {label}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step={step}
                  min="0"
                  value={(form as Record<string, number>)[field] || ""}
                  onChange={(e) => update(field, parseFloat(e.target.value) || 0)}
                  className="w-28 border border-gray-300 rounded-lg p-2 text-sm text-right focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <span className="text-xs text-gray-400 w-10">{suffix}</span>
              </div>
            </div>
          ))}

          {/* Regularisation fields for annee incomplete */}
          {enfant && !enfant.annee_complete && (
            <>
              <div className="border-t border-purple-100 pt-4 mt-4">
                <p className="text-sm font-semibold text-purple-900 mb-3">
                  Régularisation (année incomplète)
                </p>
              </div>
              <div className="flex items-center justify-between gap-4">
                <label className="text-sm font-medium text-gray-700 flex-1">
                  Heures réellement effectuées
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={form.heures_reellement_effectuees || ""}
                    onChange={(e) =>
                      update("heures_reellement_effectuees", parseFloat(e.target.value) || 0)
                    }
                    className="w-28 border border-gray-300 rounded-lg p-2 text-sm text-right focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <span className="text-xs text-gray-400 w-10">h</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <label className="text-sm font-medium text-gray-700 flex-1">
                  Heures mensualisées payées
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={form.heures_mensualisees_payees || ""}
                    onChange={(e) =>
                      update("heures_mensualisees_payees", parseFloat(e.target.value) || 0)
                    }
                    className="w-28 border border-gray-300 rounded-lg p-2 text-sm text-right focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <span className="text-xs text-gray-400 w-10">h</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {/* Indemnite de rupture */}
        <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-purple-900 mb-3">
            Indemnité de rupture (1/80ème)
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {result.eligible_indemnite
                ? "Éligible (>= 9 mois d'ancienneté)"
                : "Non éligible (< 9 mois d'ancienneté)"}
            </span>
            <span className="text-xl font-bold text-purple-700">
              {formatEuro(result.indemnite_rupture)}
            </span>
          </div>
          {result.eligible_indemnite && (
            <p className="text-xs text-gray-400 mt-1">
              = {formatEuro(form.total_salaires_bruts)} / 80
            </p>
          )}
        </div>

        {/* ICCP */}
        <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-purple-900 mb-3">
            ICCP (Indemnité compensatrice de congés payés)
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Maintien de salaire</span>
              <span className="text-sm font-medium text-gray-900">
                {formatEuro(result.iccp_maintien)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">1/10ème</span>
              <span className="text-sm font-medium text-gray-900">
                {formatEuro(result.iccp_dixieme)}
              </span>
            </div>
            <div className="border-t border-purple-100 pt-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-purple-900">
                ICCP retenu (le plus avantageux)
              </span>
              <span className="text-xl font-bold text-purple-700">
                {formatEuro(result.iccp)}
              </span>
            </div>
          </div>
        </div>

        {/* Preavis */}
        <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-purple-900 mb-3">
            Durée de préavis
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Pour {form.mois_accueil} mois d&apos;accueil
            </span>
            <span className="text-lg font-bold text-purple-700">
              {result.duree_preavis}
            </span>
          </div>
        </div>

        {/* Regularisation */}
        {!enfant?.annee_complete && result.regularisation > 0 && (
          <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-purple-900 mb-3">
              Régularisation
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Différence heures effectuées vs payées
              </span>
              <span className="text-xl font-bold text-green-600">
                + {formatEuro(result.regularisation)}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              = ({form.heures_reellement_effectuees} - {form.heures_mensualisees_payees}) x{" "}
              {enfant?.taux_horaire} EUR/h
            </p>
          </div>
        )}

        {/* Total recap */}
        <div className="bg-purple-50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-purple-900 mb-3">
            Récapitulatif
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Indemnité de rupture</span>
              <span className="font-medium">{formatEuro(result.indemnite_rupture)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">ICCP</span>
              <span className="font-medium">{formatEuro(result.iccp)}</span>
            </div>
            {result.regularisation > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Régularisation</span>
                <span className="font-medium">{formatEuro(result.regularisation)}</span>
              </div>
            )}
            <div className="border-t border-purple-200 pt-2 flex justify-between">
              <span className="text-sm font-bold text-purple-900">Total à verser</span>
              <span className="text-xl font-bold text-purple-900">
                {formatEuro(
                  result.indemnite_rupture + result.iccp + result.regularisation
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
