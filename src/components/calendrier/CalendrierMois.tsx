"use client";

import { JourData, JourType } from "@/lib/firestore";
import { getJoursFeriesMap } from "@/lib/constants/feries";
import { getDaysInMonth, getDayOfWeek } from "@/lib/utils";

interface CalendrierMoisProps {
  annee: number;
  mois: number;
  jours: Record<string, JourData>;
  planningType?: Record<string, number>;
  onSelectJour: (jour: number) => void;
  onApplyPlanning: () => void;
}

const TYPE_COLORS: Record<JourType, string> = {
  work: "bg-green-100 border-green-300",
  abs_enfant: "bg-orange-100 border-orange-300",
  abs_salarie: "bg-red-100 border-red-300",
  conge: "bg-blue-100 border-blue-300",
  ferie_travaille: "bg-yellow-100 border-yellow-300",
  repos: "bg-gray-100 border-gray-200",
};

export function CalendrierMois({
  annee,
  mois,
  jours,
  onSelectJour,
  onApplyPlanning,
}: CalendrierMoisProps) {
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

  // Construire les semaines (Lun-Ven uniquement)
  const semaines: (number | null)[][] = [];
  let semaineCourante: (number | null)[] = [];

  // Trouver le jour de la semaine du 1er (0=dim, 1=lun, ..., 6=sam)
  const premierJour = getDayOfWeek(annee, mois, 1);
  // Convertir en index Lun-Ven (0=lun, 1=mar, ..., 4=ven)
  const offsetLunVen = premierJour === 0 ? -1 : premierJour - 1; // dimanche = pas dans la grille

  // Remplir les cases vides avant le 1er jour ouvré
  if (offsetLunVen > 0 && offsetLunVen <= 4) {
    for (let i = 0; i < offsetLunVen; i++) {
      semaineCourante.push(null);
    }
  }

  for (let jour = 1; jour <= nbJours; jour++) {
    const date = new Date(annee, mois, jour);
    const dow = date.getDay(); // 0=dim, 6=sam

    // Ignorer samedi et dimanche
    if (dow === 0 || dow === 6) continue;

    const lunVenIdx = dow - 1; // 0=lun, 4=ven

    // Nouvelle semaine si on est lundi et la semaine courante n'est pas vide
    if (lunVenIdx === 0 && semaineCourante.length > 0) {
      // Compléter la semaine précédente à 5 colonnes
      while (semaineCourante.length < 5) semaineCourante.push(null);
      semaines.push(semaineCourante);
      semaineCourante = [];
    }

    // Remplir les trous (ex: si le mois commence un mercredi)
    while (semaineCourante.length < lunVenIdx) {
      semaineCourante.push(null);
    }

    semaineCourante.push(jour);
  }

  // Dernière semaine
  if (semaineCourante.length > 0) {
    while (semaineCourante.length < 5) semaineCourante.push(null);
    semaines.push(semaineCourante);
  }

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

      {/* Grille calendrier Lun-Ven */}
      <div className="p-3">
        {/* En-têtes */}
        <div className="grid grid-cols-5 gap-1 mb-1">
          {["Lun", "Mar", "Mer", "Jeu", "Ven"].map((j) => (
            <div key={j} className="text-center text-xs font-medium text-gray-500 py-1">
              {j}
            </div>
          ))}
        </div>

        {/* Semaines */}
        {semaines.map((semaine, sIdx) => (
          <div key={sIdx} className="grid grid-cols-5 gap-1 mb-1">
            {semaine.map((jour, jIdx) => {
              if (jour === null) {
                return <div key={`empty-${sIdx}-${jIdx}`} />;
              }

              const dateKey = `${annee}-${String(mois + 1).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
              const ferie = feriesMap.has(dateKey);
              const jourData = jours[String(jour)];
              const isToday =
                today.getFullYear() === annee &&
                today.getMonth() === mois &&
                today.getDate() === jour;
              const isSaisi = !!jourData;

              let cellClass =
                "border rounded-lg p-1.5 text-center transition-colors cursor-pointer min-h-[48px] ";
              if (isToday) cellClass += "ring-2 ring-purple-500 ";
              if (isSaisi) {
                cellClass += TYPE_COLORS[jourData.type] + " ";
              } else if (ferie) {
                cellClass += "bg-yellow-50 border-yellow-200 ";
              } else {
                cellClass += "bg-white border-gray-200 hover:bg-purple-50 ";
              }

              return (
                <div
                  key={jour}
                  onClick={() => onSelectJour(jour)}
                  className={cellClass}
                >
                  <div
                    className={`text-xs font-bold ${
                      isToday ? "text-purple-700" : "text-gray-700"
                    }`}
                  >
                    {jour}
                  </div>
                  {isSaisi && (
                    <div className="text-[10px] text-gray-600 font-medium">
                      {jourData.heures > 0
                        ? `${jourData.heures}h`
                        : jourData.commentaire || ""}
                    </div>
                  )}
                  {ferie && !isSaisi && (
                    <div className="text-[8px] text-orange-500">Férié</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Légende */}
      <div className="p-3 border-t flex flex-wrap gap-2 text-[10px]">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${color} border`} />
            <span className="text-gray-500">
              {type === "work"
                ? "Trav."
                : type === "abs_enfant"
                ? "Abs.E"
                : type === "abs_salarie"
                ? "Abs.S"
                : type === "conge"
                ? "CP"
                : type === "ferie_travaille"
                ? "Férié"
                : "Repos"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
