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
    let joursOuvres = 0;
    for (let j = 1; j <= nbJoursMois; j++) {
      const dow = new Date(annee, mois, j).getDay();
      if (dow !== 0) joursOuvres++; // lundi-samedi = ouvrable
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
    let joursTravailles = 0;

    for (const [, data] of Object.entries(joursData)) {
      joursSaisis++;
      totalHeures += data.heures || 0;
      totalHeuresComp += data.heures_comp || 0;
      totalHeuresSup += data.heures_sup || 0;
      totalHeuresContrac += data.heures_contrac || 0;

      if (data.repas) countRepas++;

      // Code from commentaire
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
    };
  }, [joursData, annee, mois]);

  const moisNom = MOIS_NOMS[mois];

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
        <span>{recap.joursGte8h} jrs ≥8h</span>
        <span className="text-purple-300">·</span>
        <span>{recap.heuresSub8h.toFixed(1)}h &lt;8h</span>
        <span className="text-purple-300">·</span>
        <span>{recap.countCSS} CSS</span>
        <span className="text-purple-300">·</span>
        <span>{recap.countCP} CP</span>
        <span className="text-purple-300">·</span>
        <span>{recap.countRepas} repas</span>
      </div>

      {/* Complementary / Supplementary */}
      {(recap.totalHeuresComp > 0 || recap.totalHeuresSup > 0) && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-purple-600">
          {recap.totalHeuresComp > 0 && (
            <span>+{recap.totalHeuresComp.toFixed(2)}h comp.</span>
          )}
          {recap.totalHeuresSup > 0 && (
            <span>+{recap.totalHeuresSup.toFixed(2)}h sup.</span>
          )}
          {recap.totalHeuresContrac > 0 && (
            <span>{recap.totalHeuresContrac.toFixed(2)}h contrac. (col. O)</span>
          )}
        </div>
      )}
    </div>
  );
}
