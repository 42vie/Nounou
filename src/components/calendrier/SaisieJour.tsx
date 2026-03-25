"use client";

import { useState } from "react";
import { JourData, JourType } from "@/lib/firestore";
import { isJourFerie, getJoursFeriesMap } from "@/lib/constants/feries";
import { JOURS_SEMAINE } from "@/lib/utils";

interface SaisieJourProps {
  annee: number;
  mois: number;
  jour: number;
  jourData: JourData | null;
  planningType: Record<string, number>;
  onSave: (jour: string, data: JourData) => void;
  onClose: () => void;
}

const TYPE_LABELS: Record<JourType, string> = {
  work: "Travaillé",
  abs_enfant: "Absence enfant",
  abs_salarie: "Absence salarié",
  conge: "Congé payé",
  ferie_travaille: "Férié travaillé",
  repos: "Repos / Non travaillé",
};

export function SaisieJour({
  annee,
  mois,
  jour,
  jourData,
  planningType,
  onSave,
  onClose,
}: SaisieJourProps) {
  const date = new Date(annee, mois, jour);
  const jourSemaine = JOURS_SEMAINE[date.getDay()];
  const ferie = isJourFerie(date);
  const feriesMap = getJoursFeriesMap(annee);
  const dateKey = `${annee}-${String(mois + 1).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
  const nomFerie = feriesMap.get(dateKey);

  // Heures par défaut du planning type
  const joursSemaine = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const jourSemaineKey = joursSemaine[date.getDay()];
  const heuresDefaut =
    planningType[jourSemaineKey as keyof typeof planningType] || 0;

  const [type, setType] = useState<JourType>(
    jourData?.type || (ferie ? "repos" : heuresDefaut > 0 ? "work" : "repos")
  );
  const [heures, setHeures] = useState(
    jourData?.heures ?? (ferie ? 0 : heuresDefaut)
  );
  const [heuresComp, setHeuresComp] = useState(jourData?.heures_comp ?? 0);
  const [heuresSup, setHeuresSup] = useState(jourData?.heures_sup ?? 0);
  const [heuresContrac, setHeuresContrac] = useState(
    jourData?.heures_contrac ?? heuresDefaut
  );
  const [repas, setRepas] = useState(jourData?.repas ?? heuresDefaut > 0);
  const [commentaire, setCommentaire] = useState(jourData?.commentaire ?? "");

  function handleSave() {
    onSave(String(jour), {
      type,
      heures,
      heures_comp: heuresComp,
      heures_sup: heuresSup,
      heures_contrac: heuresContrac,
      repas,
      commentaire,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg">
              {jourSemaine} {jour}/{mois + 1}/{annee}
            </h3>
            {nomFerie && (
              <span className="text-sm text-orange-600 font-medium">
                {nomFerie}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Type de journée */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de journée
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as JourType)}
              className="w-full border rounded-lg p-2.5 text-sm"
            >
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Heures */}
          {type !== "repos" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Heures du jour
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="24"
                    value={heures}
                    onChange={(e) => setHeures(parseFloat(e.target.value) || 0)}
                    className="w-full border rounded-lg p-2.5 text-sm bg-purple-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    H. contractuelles
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="24"
                    value={heuresContrac}
                    onChange={(e) =>
                      setHeuresContrac(parseFloat(e.target.value) || 0)
                    }
                    className="w-full border rounded-lg p-2.5 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    H. complémentaires
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={heuresComp}
                    onChange={(e) =>
                      setHeuresComp(parseFloat(e.target.value) || 0)
                    }
                    className="w-full border rounded-lg p-2.5 text-sm bg-purple-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    H. supplémentaires
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={heuresSup}
                    onChange={(e) =>
                      setHeuresSup(parseFloat(e.target.value) || 0)
                    }
                    className="w-full border rounded-lg p-2.5 text-sm bg-purple-50/50"
                  />
                </div>
              </div>
            </>
          )}

          {/* Repas */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="repas"
              checked={repas}
              onChange={(e) => setRepas(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="repas" className="text-sm">
              Repas fourni
            </label>
          </div>

          {/* Commentaire */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Commentaire
            </label>
            <input
              type="text"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Férié, CPC, ABS, css..."
              className="w-full border rounded-lg p-2.5 text-sm"
            />
          </div>
        </div>

        <div className="p-4 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border rounded-lg text-sm font-medium text-gray-600"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
