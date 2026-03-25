"use client";

import { useState } from "react";
import { JourData, JourType } from "@/lib/firestore";
import { getJoursFeriesMap } from "@/lib/constants/feries";
import { getDaysInMonth, getDayOfWeek } from "@/lib/utils";
import { SaisieJour } from "./SaisieJour";

interface CalendrierMoisProps {
  annee: number;
  mois: number;
  jours: Record<string, JourData>;
  planningType: Record<string, number>;
  onSaveJour: (jour: string, data: JourData) => void;
  onApplyPlanning: () => void;
}

const TYPE_COLORS: Record<JourType, string> = {
  work: "bg-green-100 border-green-300",
  abs_enfant: "bg-red-100 border-red-300",
  abs_salarie: "bg-orange-100 border-orange-300",
  conge: "bg-blue-100 border-blue-300",
  ferie_travaille: "bg-yellow-100 border-yellow-300",
  repos: "bg-gray-100 border-gray-200",
};

export function CalendrierMois({
  annee,
  mois,
  jours,
  planningType,
  onSaveJour,
  onApplyPlanning,
}: CalendrierMoisProps) {
  const [selectedJour, setSelectedJour] = useState<number | null>(null);
  const nbJours = getDaysInMonth(annee, mois);
  const feriesMap = getJoursFeriesMap(annee);
  const today = new Date();

  // Compter les totaux
  let totalHeures = 0;
  let totalRepas = 0;
  let joursTravailes = 0;

  Object.values(jours).forEach((j) => {
    totalHeures += j.heures + j.heures_comp + j.heures_sup;
    if (j.repas) totalRepas++;
    if (j.type === "work" || j.type === "ferie_travaille") joursTravailes++;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-bold text-gray-900">Calendrier du mois</h3>
        <button
          onClick={onApplyPlanning}
          className="text-sm px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
        >
          Appliquer planning type
        </button>
      </div>

      {/* Résumé rapide */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-purple-50 text-center text-xs">
        <div>
          <div className="font-bold text-purple-900">{totalHeures.toFixed(1)}h</div>
          <div className="text-purple-600">Total heures</div>
        </div>
        <div>
          <div className="font-bold text-purple-900">{joursTravailes}j</div>
          <div className="text-purple-600">Jours travaillés</div>
        </div>
        <div>
          <div className="font-bold text-purple-900">{totalRepas}</div>
          <div className="text-purple-600">Repas</div>
        </div>
      </div>

      {/* Grille calendrier */}
      <div className="p-3">
        {/* En-têtes jours */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((j) => (
            <div key={j} className="text-center text-xs font-medium text-gray-500 py-1">
              {j}
            </div>
          ))}
        </div>

        {/* Jours */}
        <div className="grid grid-cols-7 gap-1">
          {/* Espaces vides avant le 1er */}
          {Array.from({
            length: (getDayOfWeek(annee, mois, 1) + 6) % 7,
          }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: nbJours }, (_, i) => i + 1).map((jour) => {
            const dateKey = `${annee}-${String(mois + 1).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
            const ferie = feriesMap.has(dateKey);
            const date = new Date(annee, mois, jour);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const jourData = jours[String(jour)];
            const isToday =
              today.getFullYear() === annee &&
              today.getMonth() === mois &&
              today.getDate() === jour;
            const isSaisi = !!jourData;

            let cellClass = "border rounded-lg p-1 text-center transition-colors cursor-pointer ";
            if (isToday) cellClass += "ring-2 ring-purple-500 ";
            if (isSaisi) {
              cellClass += TYPE_COLORS[jourData.type] + " ";
            } else if (ferie) {
              cellClass += "bg-yellow-50 border-yellow-200 ";
            } else if (isWeekend) {
              cellClass += "bg-gray-50 border-gray-200 ";
            } else {
              cellClass += "bg-white border-gray-200 hover:bg-purple-50 ";
            }

            return (
              <div
                key={jour}
                onClick={() => setSelectedJour(jour)}
                className={cellClass}
              >
                <div className={`text-xs font-bold ${isToday ? "text-purple-700" : "text-gray-700"}`}>
                  {jour}
                </div>
                {isSaisi && jourData.heures > 0 && (
                  <div className="text-[10px] text-gray-600 font-medium">
                    {jourData.heures}h
                  </div>
                )}
                {ferie && !isSaisi && (
                  <div className="text-[8px] text-orange-500">F</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Légende */}
      <div className="p-3 border-t flex flex-wrap gap-2 text-[10px]">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${color} border`} />
            <span className="text-gray-500">
              {type === "work" ? "Trav." : type === "abs_enfant" ? "Abs.E" : type === "abs_salarie" ? "Abs.S" : type === "conge" ? "CP" : type === "ferie_travaille" ? "Férié" : "Repos"}
            </span>
          </div>
        ))}
      </div>

      {/* Modal saisie jour */}
      {selectedJour !== null && (
        <SaisieJour
          annee={annee}
          mois={mois}
          jour={selectedJour}
          jourData={jours[String(selectedJour)] || null}
          planningType={planningType}
          onSave={onSaveJour}
          onClose={() => setSelectedJour(null)}
        />
      )}
    </div>
  );
}
