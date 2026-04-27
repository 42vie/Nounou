"use client";

import { useMemo } from "react";
import type { JourData } from "@/lib/firestore";
import { MOIS_NOMS, getDaysInMonth } from "@/lib/utils";

interface RecapMoisProps {
  enfantNom: string;
  annee: number;
  mois: number; // 0-11
  joursData: Record<string, JourData>;
}

export default function RecapMois({ enfantNom, annee, mois, joursData }: RecapMoisProps) {
  const recap = useMemo(() => {
    const nbJoursMois = getDaysInMonth(annee, mois);

    // Count working days (lundi-samedi = ouvrable)
    let joursOuvres = 0;
    for (let j = 1; j <= nbJoursMois; j++) {
      const dow = new Date(annee, mois, j).getDay();
      if (dow !== 0) joursOuvres++;
    }

    let joursSaisis = 0;
    let totalHeures = 0;
    let totalHeuresComp = 0;
    let totalHeuresSup = 0;
    let totalHeuresContrac = 0;
    let joursGte8h = 0;
    let heuresSub8h = 0;
    let countCSS = 0;
    let countCP = 0;
    let countRepas = 0;
    let totalAbsSalarieH = 0;
    let totalAbsEnfantH = 0;
    let joursTravailles = 0;
    let countFeries = 0;
    let countAbsences = 0;

    for (const [, data] of Object.entries(joursData)) {
      joursSaisis++;
      totalHeures += data.heures || 0;
      totalHeuresComp += data.heures_comp || 0;
      totalHeuresSup += data.heures_sup || 0;
      totalHeuresContrac += data.heures_contrac || 0;

      if (data.repas) countRepas++;
      totalAbsSalarieH += data.abs_salarie_h || 0;
      totalAbsEnfantH += data.abs_enfant_h || 0;

      // Code stored in commentaire field
      const code = data.commentaire || "";

      if (code === "WORK") {
        joursTravailles++;
        const h = data.heures || 0;
        if (h >= 8) {
          joursGte8h++;
        } else if (h > 0) {
          heuresSub8h += h;
        }
      }

      if (code === "CSS") countCSS++;
      if (code === "CPC" || code === "CPI") countCP++;
      if (code === "FERIE" || code === "FCP") countFeries++;
      if (code === "ANJE" || code === "ABS") countAbsences++;
    }

    return {
      joursOuvres,
      joursSaisis,
      totalHeures,
      totalHeuresComp,
      totalHeuresSup,
      totalHeuresContrac,
      joursGte8h,
      heuresSub8h,
      countCSS,
      countCP,
      countRepas,
      joursTravailles,
      countFeries,
      countAbsences,
      totalAbsSalarieH,
      totalAbsEnfantH,
    };
  }, [joursData, annee, mois]);

  const moisNom = MOIS_NOMS[mois];

  const progressPct = recap.joursOuvres > 0
    ? Math.min(100, Math.round((recap.joursSaisis / recap.joursOuvres) * 100))
    : 0;

  return (
    <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-purple-900">
          Cumul {moisNom} — {enfantNom}
        </h4>
        <span className="text-xs text-purple-600 font-medium">
          {recap.joursSaisis} jrs saisis / {recap.joursOuvres} ouvrés
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-purple-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-2xl font-bold text-purple-800">
          {recap.totalHeures.toFixed(2)}h
        </span>
        <span className="text-xs text-purple-600">
          travaillées (col. L)
        </span>
      </div>

      {/* Detail row */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-purple-700">
        <span>{recap.joursGte8h} jrs &ge;8h</span>
        <span className="text-purple-300">&middot;</span>
        <span>{recap.heuresSub8h.toFixed(1)}h &lt;8h</span>
        <span className="text-purple-300">&middot;</span>
        <span>{recap.countCSS} CSS</span>
        <span className="text-purple-300">&middot;</span>
        <span>{recap.countCP} CP</span>
        <span className="text-purple-300">&middot;</span>
        <span>{recap.countRepas} repas</span>
      </div>

      {/* Complementary / Supplementary / Contractual */}
      {(recap.totalHeuresComp > 0 || recap.totalHeuresSup > 0 || recap.totalHeuresContrac > 0) && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-purple-600 pt-1 border-t border-purple-100">
          {recap.totalHeuresComp > 0 && (
            <span>+{recap.totalHeuresComp.toFixed(2)}h comp. (M)</span>
          )}
          {recap.totalHeuresSup > 0 && (
            <span>+{recap.totalHeuresSup.toFixed(2)}h sup. (N)</span>
          )}
          {recap.totalHeuresContrac > 0 && (
            <span>{recap.totalHeuresContrac.toFixed(2)}h contrac. (O)</span>
          )}
        </div>
      )}

      {/* Absences partielles */}
      {(recap.totalAbsSalarieH > 0 || recap.totalAbsEnfantH > 0) && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs pt-1 border-t border-purple-100">
          {recap.totalAbsSalarieH > 0 && (
            <span className="text-red-600 font-medium">
              {recap.totalAbsSalarieH.toFixed(2)}h abs. salarié (déduit)
            </span>
          )}
          {recap.totalAbsEnfantH > 0 && (
            <span className="text-orange-600 font-medium">
              {recap.totalAbsEnfantH.toFixed(2)}h abs. enfant
            </span>
          )}
        </div>
      )}

      {/* Counts by category */}
      {(recap.countFeries > 0 || recap.countAbsences > 0) && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-purple-600">
          {recap.joursTravailles > 0 && (
            <span>{recap.joursTravailles} jrs trav.</span>
          )}
          {recap.countFeries > 0 && (
            <>
              <span className="text-purple-300">&middot;</span>
              <span>{recap.countFeries} fériés</span>
            </>
          )}
          {recap.countAbsences > 0 && (
            <>
              <span className="text-purple-300">&middot;</span>
              <span>{recap.countAbsences} abs.</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
