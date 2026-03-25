"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  getEnfants,
  getMoisData,
  saveMoisData,
  saveJourData,
  saveCPMois,
  defaultMoisData,
  Enfant,
  MoisData,
} from "@/lib/firestore";
import { MOIS_NOMS, formatEuro, getDaysInMonth } from "@/lib/utils";
import { CalendrierMois } from "@/components/calendrier/CalendrierMois";
import { calculerMensualisation } from "@/lib/calculs/mensualisation";
import PopupJour from "@/components/saisie/PopupJour";

export default function MoisPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [enfants, setEnfants] = useState<Enfant[]>([]);
  const [selectedEnfant, setSelectedEnfant] = useState<string>("");
  const [moisIdx, setMoisIdx] = useState(new Date().getMonth());
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [moisData, setMoisData] = useState<MoisData | null>(null);
  const [enfant, setEnfant] = useState<Enfant | null>(null);
  const [popupJour, setPopupJour] = useState<number | null>(null);

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

  const loadMois = useCallback(async () => {
    if (!user || !selectedEnfant) return;
    const e = enfants.find((x) => x.id === selectedEnfant);
    setEnfant(e || null);
    const data = await getMoisData(user.uid, selectedEnfant, annee, moisIdx);
    if (data) {
      setMoisData(data);
    } else if (e) {
      setMoisData(defaultMoisData(selectedEnfant, annee, moisIdx, e));
    }
  }, [user, selectedEnfant, annee, moisIdx, enfants]);

  useEffect(() => {
    loadMois();
  }, [loadMois]);

  function handleApplyPlanning() {
    if (!enfant || !moisData) return;
    const nbJours = getDaysInMonth(annee, moisIdx);
    const joursSemaine = [
      "dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi",
    ];
    const newJours = { ...moisData.jours };

    for (let j = 1; j <= nbJours; j++) {
      if (newJours[String(j)]) continue; // Ne pas écraser les jours déjà saisis
      const date = new Date(annee, moisIdx, j);
      const jourKey = joursSemaine[date.getDay()];
      const heures =
        enfant.planning_type?.[jourKey as keyof typeof enfant.planning_type] || 0;
      if (heures > 0) {
        newJours[String(j)] = {
          type: "work",
          heures,
          heures_comp: 0,
          heures_sup: 0,
          heures_contrac: 0, // Col. O vide pour WORK — seulement pour les codes (FERIE, CPC, etc.)
          repas: true,
          commentaire: "",
        };
      }
    }

    setMoisData((prev) => (prev ? { ...prev, jours: newJours } : prev));
    // Save to Firestore
    if (user) {
      saveMoisData(user.uid, selectedEnfant, annee, moisIdx, { jours: newJours });
    }
  }

  async function handleSaveRemuneration(field: string, value: number) {
    if (!user || !selectedEnfant || !moisData) return;
    const updated = { ...moisData, [field]: value };
    setMoisData(updated);
    await saveMoisData(user.uid, selectedEnfant, annee, moisIdx, {
      [field]: value,
    });
  }

  if (!user || loading) return null;

  // Calcul rapide mensualisation pour affichage
  let mensu = { heures_mensualisees: 0, heures_sup_mensualisees: 0 };
  if (enfant) {
    mensu = calculerMensualisation({
      type_contrat: enfant.type_contrat,
      annee_complete: enfant.annee_complete,
      semaines_programmees: enfant.semaines_programmees,
      heures_normales_semaine: enfant.heures_normales_semaine,
      heures_sup_semaine: enfant.heures_sup_semaine,
      mois_prevus: enfant.mois_prevus,
    });
  }

  const taux = moisData?.taux_horaire_mois || enfant?.taux_horaire || 0;
  const brutBase = mensu.heures_mensualisees * taux;

  return (
    <div className="space-y-4 max-w-4xl mx-auto px-4 py-4">
      {/* Sélecteurs */}
      <div className="flex gap-3 items-center flex-wrap">
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
            onClick={() => {
              if (moisIdx === 0) { setMoisIdx(11); setAnnee(annee - 1); }
              else setMoisIdx(moisIdx - 1);
            }}
            className="px-2 py-2 border rounded-lg hover:bg-gray-100"
          >
            ◀
          </button>
          <span className="px-3 py-2 font-bold text-sm min-w-[140px] text-center">
            {MOIS_NOMS[moisIdx]} {annee}
          </span>
          <button
            onClick={() => {
              if (moisIdx === 11) { setMoisIdx(0); setAnnee(annee + 1); }
              else setMoisIdx(moisIdx + 1);
            }}
            className="px-2 py-2 border rounded-lg hover:bg-gray-100"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Info mensualisation */}
      {enfant && (
        <div className="bg-purple-50 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="font-bold text-purple-900">
              {mensu.heures_mensualisees} hrs
            </div>
            <div className="text-purple-600">Mensualisées</div>
          </div>
          <div>
            <div className="font-bold text-purple-900">{taux} €/h</div>
            <div className="text-purple-600">Taux horaire</div>
          </div>
          <div>
            <div className="font-bold text-purple-900">
              {formatEuro(brutBase)}
            </div>
            <div className="text-purple-600">Brut base</div>
          </div>
        </div>
      )}

      {/* Calendrier */}
      {moisData && enfant && (
        <CalendrierMois
          annee={annee}
          mois={moisIdx}
          jours={moisData.jours || {}}
          planningType={enfant.planning_type || {}}
          onSelectJour={(jour) => setPopupJour(jour)}
          onApplyPlanning={handleApplyPlanning}
        />
      )}

      {/* Popup saisie journalière */}
      {popupJour !== null && moisData && (
        <PopupJour
          enfants={enfants.map((e) => ({
            id: e.id!,
            nom: e.nom,
            taux_horaire: e.taux_horaire,
            annee_complete: e.annee_complete,
            heures_normales_semaine: e.heures_normales_semaine,
            planning_type: e.planning_type || { lundi: 0, mardi: 0, mercredi: 0, jeudi: 0, vendredi: 0, samedi: 0 },
            indemnite_entretien_jour: e.indemnite_entretien_jour,
            indemnite_repas: e.indemnite_repas,
            indemnite_km: e.indemnite_km,
          }))}
          enfantActifId={selectedEnfant}
          annee={annee}
          mois={moisIdx}
          jour={popupJour}
          joursData={moisData.jours || {}}
          onSave={async (jour, enfantId, data) => {
            if (!user) return;
            await saveJourData(user.uid, enfantId, annee, moisIdx, String(jour), data);
            setMoisData((prev) => {
              if (!prev) return prev;
              return { ...prev, jours: { ...prev.jours, [String(jour)]: data } };
            });
            // Si CPC/CPI, mettre à jour le tableau CP de l'enfant
            if (data.commentaire === "CPC" || data.commentaire === "CPI") {
              const updatedJours = { ...(moisData?.jours || {}), [String(jour)]: data };
              const cpcCount = Object.values(updatedJours).filter((j) => j.commentaire === "CPC").length;
              const cpiCount = Object.values(updatedJours).filter((j) => j.commentaire === "CPI").length;
              await saveCPMois(user.uid, enfantId, annee, moisIdx, {
                cpc_pris: cpcCount,
                cpi_pris: cpiCount,
              });
            }
          }}
          onChangeEnfant={(id) => setSelectedEnfant(id)}
          onChangeJour={(jour) => setPopupJour(jour)}
          onClose={() => setPopupJour(null)}
        />
      )}

      {/* Section rémunération */}
      {moisData && (
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <h3 className="font-bold text-purple-900 border-b pb-2">
            Rémunération du mois
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { field: "taux_horaire_mois", label: "Taux horaire (€/h)", step: "0.01" },
              { field: "heures_comp_base", label: "H. complémentaires", step: "0.25" },
              { field: "majoration_comp", label: "Majoration HC (%)", step: "0.01" },
              { field: "heures_sup_base", label: "H. supplémentaires", step: "0.25" },
              { field: "majoration_sup", label: "Majoration HS (%)", step: "0.01" },
              { field: "majoration_sup_mens", label: "Maj. HS mens. (%)", step: "0.01" },
              { field: "absence_enfant_heures", label: "Absence enfant (h)", step: "0.25" },
              { field: "absence_salarie_heures", label: "Absence salarié (h)", step: "0.25" },
              { field: "indemnite_cp", label: "ICP pendant contrat (€)", step: "0.01" },
              { field: "regularisation", label: "Régularisation (€)", step: "0.01" },
            ].map(({ field, label, step }) => (
              <div key={field}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {label}
                </label>
                <input
                  type="number"
                  step={step}
                  value={(moisData as unknown as Record<string, number>)[field] || ""}
                  onChange={(e) =>
                    handleSaveRemuneration(field, parseFloat(e.target.value) || 0)
                  }
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section indemnités */}
      {moisData && (
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <h3 className="font-bold text-purple-900 border-b pb-2">
            Indemnités
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { field: "ie_base", label: "IE entretien (€/jour)", step: "0.01" },
              { field: "ie_nombre", label: "IE nombre de jours", step: "1" },
              { field: "ie_comp_base", label: "IE HC/HS (€)", step: "0.01" },
              { field: "ie_comp_nombre", label: "IE HC/HS nombre", step: "1" },
              { field: "repas_base", label: "Repas (€/repas)", step: "0.01" },
              { field: "repas_nombre", label: "Repas nombre", step: "1" },
              { field: "km_base", label: "IK (€/km)", step: "0.01" },
              { field: "km_nombre", label: "IK km", step: "1" },
            ].map(({ field, label, step }) => (
              <div key={field}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {label}
                </label>
                <input
                  type="number"
                  step={step}
                  value={(moisData as unknown as Record<string, number>)[field] || ""}
                  onChange={(e) =>
                    handleSaveRemuneration(field, parseFloat(e.target.value) || 0)
                  }
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PAS + Paiement */}
      {moisData && (
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <h3 className="font-bold text-purple-900 border-b pb-2">
            Prélèvement à la source & Paiement
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Taux PAS (ex: 0.05 = 5%)
              </label>
              <input
                type="number"
                step="0.001"
                value={moisData.taux_pas || ""}
                onChange={(e) =>
                  handleSaveRemuneration("taux_pas", parseFloat(e.target.value) || 0)
                }
                className="w-full border rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Jours Pajemploi
              </label>
              <input
                type="number"
                value={moisData.jours_pajemploi || ""}
                onChange={(e) =>
                  handleSaveRemuneration("jours_pajemploi", parseInt(e.target.value) || 0)
                }
                className="w-full border rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Date paiement
              </label>
              <input
                type="text"
                value={moisData.date_paiement || ""}
                onChange={(e) =>
                  handleSaveRemuneration("date_paiement", e.target.value as unknown as number)
                }
                className="w-full border rounded-lg p-2 text-sm"
                placeholder="25/01/2026"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Banque / N° chèque
              </label>
              <input
                type="text"
                value={moisData.banque || ""}
                onChange={(e) =>
                  handleSaveRemuneration("banque", e.target.value as unknown as number)
                }
                className="w-full border rounded-lg p-2 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Bouton bulletin */}
      {enfant && (
        <div className="flex gap-3">
          <button
            onClick={() =>
              router.push(`/fiche/${selectedEnfant}/${annee}/${moisIdx}`)
            }
            className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold text-center hover:bg-purple-700"
          >
            Voir le bulletin de paie
          </button>
        </div>
      )}
    </div>
  );
}
