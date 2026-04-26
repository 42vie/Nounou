"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type { JourData, JourType } from "@/lib/firestore";
import { CODE_COLORS, type CodeJour, getCode } from "@/lib/constants/codes";
import { MOIS_NOMS, JOURS_SEMAINE, getDaysInMonth } from "@/lib/utils";
import { getJoursFeriesMap } from "@/lib/constants/feries";
import GrilleCode from "./GrilleCode";
import RecapMois from "./RecapMois";
import { showToast } from "@/components/Toast";

// ============ Types ============

interface EnfantSaisie {
  id: string;
  nom: string;
  taux_horaire: number;
  annee_complete: boolean;
  heures_normales_semaine: number;
  planning_type: {
    lundi: number;
    mardi: number;
    mercredi: number;
    jeudi: number;
    vendredi: number;
    samedi: number;
  };
  indemnite_entretien_jour: number;
  indemnite_repas: number;
  indemnite_km: number;
}

interface PopupJourProps {
  enfants: EnfantSaisie[];
  enfantActifId: string;
  annee: number;
  mois: number; // 0-11
  jour: number; // 1-31
  joursData: Record<string, JourData>;
  onSave: (jour: number, enfantId: string, data: JourData) => void;
  onChangeEnfant: (enfantId: string) => void;
  onChangeJour: (jour: number) => void;
  onClose: () => void;
}

// ============ Helpers ============

const JOURS_SEMAINE_KEYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"] as const;

/** Map our 12 codes to the existing JourType */
function codeToJourType(code: string): JourType {
  switch (code) {
    case "WORK":
      return "work";
    case "ANJE":
      return "abs_enfant";
    case "ABS":
      return "abs_salarie";
    case "CSS":
    case "CPC":
    case "CPI":
    case "SED":
      return "conge";
    case "FERIE":
    case "FCP":
      return "ferie_travaille";
    case "CEF":
    case "FRAC":
    case "FO":
    case "DIV":
      return "repos";
    default:
      return "work";
  }
}

/** Get the planning hours for a given day of week (0=dim, 1=lun, ..., 6=sam) */
function getPlanningHours(enfant: EnfantSaisie, dayOfWeek: number): number {
  const key = JOURS_SEMAINE_KEYS[dayOfWeek];
  if (key === "dimanche") return 0;
  return enfant.planning_type[key as keyof typeof enfant.planning_type] || 0;
}

/** Avatar color palette based on index */
const AVATAR_COLORS = [
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-cyan-500",
  "bg-rose-500",
  "bg-emerald-500",
];

// ============ Component ============

export default function PopupJour({
  enfants,
  enfantActifId,
  annee,
  mois,
  jour,
  joursData,
  onSave,
  onChangeEnfant,
  onChangeJour,
  onClose,
}: PopupJourProps) {
  const enfant = enfants.find((e) => e.id === enfantActifId) || enfants[0];
  const nbJours = getDaysInMonth(annee, mois);
  const feriesMap = useMemo(() => getJoursFeriesMap(annee), [annee]);
  const contentRef = useRef<HTMLDivElement>(null);

  // Date info
  const date = new Date(annee, mois, jour);
  const dayOfWeek = date.getDay();
  const jourSemaine = JOURS_SEMAINE[dayOfWeek];
  const dateKey = `${annee}-${String(mois + 1).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
  const nomFerie = feriesMap.get(dateKey);
  const planningHours = enfant ? getPlanningHours(enfant, dayOfWeek) : 0;

  // Existing data for this day
  const existingData = joursData[String(jour)] || null;

  // Determine initial code from existing data
  const initialCode = useMemo(() => {
    if (existingData?.commentaire) {
      const found = getCode(existingData.commentaire);
      if (found) return found.code;
    }
    // Default: if holiday suggest FERIE, if planning has hours suggest WORK, else nothing
    if (nomFerie) return "FERIE";
    if (planningHours > 0) return "WORK";
    return "WORK";
  }, [existingData, nomFerie, planningHours]);

  // State
  const [selectedCode, setSelectedCode] = useState<string>(initialCode);
  const [heures, setHeures] = useState<number>(existingData?.heures ?? (initialCode === "WORK" ? planningHours : 0));
  const [heuresContrac, setHeuresContrac] = useState<number>(existingData?.heures_contrac ?? (initialCode !== "WORK" && initialCode !== "CSS" && initialCode !== "CPI" ? planningHours : 0));
  const [heuresComp, setHeuresComp] = useState<number>(existingData?.heures_comp ?? 0);
  const [heuresSup, setHeuresSup] = useState<number>(existingData?.heures_sup ?? 0);
  const [repas, setRepas] = useState<boolean>(existingData?.repas ?? (initialCode === "WORK" && planningHours > 0));
  const [km, setKm] = useState<number>(0);

  // Animation state
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  // Get the current CodeJour object
  const currentCodeObj = useMemo(() => getCode(selectedCode), [selectedCode]);

  // When day changes, reset form
  useEffect(() => {
    const data = joursData[String(jour)] || null;
    const newDate = new Date(annee, mois, jour);
    const newDow = newDate.getDay();
    const newPlanningHours = enfant ? getPlanningHours(enfant, newDow) : 0;
    const newDateKey = `${annee}-${String(mois + 1).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
    const newNomFerie = feriesMap.get(newDateKey);

    if (data) {
      const code = data.commentaire && getCode(data.commentaire) ? data.commentaire : "WORK";
      setSelectedCode(code);
      setHeures(data.heures ?? 0);
      setHeuresContrac(data.heures_contrac ?? 0);
      setHeuresComp(data.heures_comp ?? 0);
      setHeuresSup(data.heures_sup ?? 0);
      setRepas(data.repas ?? false);
    } else {
      const code = newNomFerie ? "FERIE" : "WORK";
      setSelectedCode(code);
      const codeObj = getCode(code);
      setHeures(codeObj?.affecteColL ? newPlanningHours : 0);
      setHeuresContrac(codeObj?.autoRemplirColO ? newPlanningHours : 0);
      setHeuresComp(0);
      setHeuresSup(0);
      setRepas(code === "WORK" && newPlanningHours > 0);
    }
    setKm(0);

    // Scroll to top
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [jour, enfantActifId, joursData, annee, mois, enfant, feriesMap]);

  // When code changes, auto-fill fields
  const handleCodeSelect = useCallback(
    (codeObj: CodeJour) => {
      setSelectedCode(codeObj.code);

      const newDate = new Date(annee, mois, jour);
      const newDow = newDate.getDay();
      const ph = enfant ? getPlanningHours(enfant, newDow) : 0;

      if (codeObj.code === "WORK") {
        setHeures(ph);
        setHeuresContrac(0);
        setHeuresComp(0);
        setHeuresSup(0);
        setRepas(ph > 0);
      } else if (codeObj.code === "CSS" || codeObj.code === "CPI") {
        setHeures(0);
        setHeuresContrac(0);
        setHeuresComp(0);
        setHeuresSup(0);
        setRepas(false);
      } else {
        // FERIE, FCP, ANJE, ABS, CPC, CEF, FRAC, FO, DIV
        setHeures(0);
        setHeuresContrac(codeObj.autoRemplirColO ? ph : 0);
        setHeuresComp(0);
        setHeuresSup(0);
        setRepas(false);
      }
    },
    [annee, mois, jour, enfant]
  );

  // Field activation rules based on code properties
  const colLActive = currentCodeObj?.affecteColL ?? false;
  const colOActive = currentCodeObj?.affecteColO ?? false;
  const colMNActive = currentCodeObj?.affecteColMN ?? false;

  // Save handler
  const handleSave = useCallback(() => {
    if (!enfant) return;
    const data: JourData = {
      type: codeToJourType(selectedCode),
      heures: colLActive ? heures : 0,
      heures_comp: colMNActive ? heuresComp : 0,
      heures_sup: colMNActive ? heuresSup : 0,
      heures_contrac: colOActive ? heuresContrac : 0,
      repas,
      commentaire: selectedCode,
    };
    onSave(jour, enfant.id, data);
    showToast(`Jour ${jour} enregistré`);
  }, [enfant, selectedCode, heures, heuresComp, heuresSup, heuresContrac, repas, jour, onSave, colLActive, colOActive, colMNActive]);

  // Save and go to next weekday
  const handleSaveAndNext = useCallback(() => {
    handleSave();
    let d = jour + 1;
    while (d <= nbJours) {
      const dow = new Date(annee, mois, d).getDay();
      if (dow !== 0 && dow !== 6) { onChangeJour(d); return; }
      d++;
    }
  }, [handleSave, jour, nbJours, annee, mois, onChangeJour]);

  // Navigate days — skip weekends
  const goToPrevDay = useCallback(() => {
    let d = jour - 1;
    while (d >= 1) {
      const dow = new Date(annee, mois, d).getDay();
      if (dow !== 0 && dow !== 6) { onChangeJour(d); return; }
      d--;
    }
  }, [jour, annee, mois, onChangeJour]);

  const goToNextDay = useCallback(() => {
    let d = jour + 1;
    while (d <= nbJours) {
      const dow = new Date(annee, mois, d).getDay();
      if (dow !== 0 && dow !== 6) { onChangeJour(d); return; }
      d++;
    }
  }, [jour, nbJours, annee, mois, onChangeJour]);

  // Close with animation
  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose]
  );

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowLeft" && e.altKey) goToPrevDay();
      if (e.key === "ArrowRight" && e.altKey) goToNextDay();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleClose, goToPrevDay, goToNextDay]);

  if (!enfant) return null;

  // Format day header
  const moisNom = MOIS_NOMS[mois].toLowerCase();

  return (
    <div
      className={`
        fixed inset-0 z-[60] flex items-end md:items-center justify-center
        transition-all duration-200
        ${isVisible ? "bg-black/40 backdrop-blur-sm" : "bg-transparent"}
      `}
      onClick={handleOverlayClick}
    >
      <div
        className={`
          bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-lg
          max-h-[100dvh] md:max-h-[90vh]
          flex flex-col
          shadow-2xl
          transition-transform duration-300 ease-out
          ${isVisible ? "translate-y-0" : "translate-y-full md:translate-y-8"}
          ${isVisible ? "opacity-100" : "opacity-0 md:opacity-0"}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== Header avec bouton fermer ===== */}
        <div className="flex items-center justify-between pt-3 px-4 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full md:hidden" />
          <div className="flex-1" />
          <button
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ===== Enfant tabs ===== */}
        {enfants.length > 1 && (
          <div className="flex overflow-x-auto gap-1 px-4 pt-2 pb-1 scrollbar-none">
            {enfants.map((e, idx) => {
              const isActive = e.id === enfantActifId;
              const initial = e.nom.charAt(0).toUpperCase();
              const colorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onChangeEnfant(e.id)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium
                    whitespace-nowrap min-h-[44px] shrink-0
                    transition-all duration-150
                    ${isActive
                      ? "bg-purple-50 text-purple-800 border-b-2 border-purple-600"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    }
                  `}
                >
                  <span
                    className={`
                      w-7 h-7 rounded-full flex items-center justify-center
                      text-xs font-bold text-white
                      ${isActive ? colorClass : "bg-gray-300"}
                    `}
                  >
                    {initial}
                  </span>
                  <span className="hidden sm:inline">{e.nom}</span>
                  <span className="sm:hidden">{e.nom.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ===== Day header ===== */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <button
            type="button"
            onClick={goToPrevDay}
            disabled={jour <= 1}
            className="
              w-10 h-10 rounded-full flex items-center justify-center
              text-gray-500 hover:bg-gray-100 active:bg-gray-200
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-colors min-w-[44px] min-h-[44px]
            "
            aria-label="Jour précédent"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-center flex-1">
            <h2 className="text-lg font-bold text-gray-900">
              {jourSemaine} {jour} {moisNom}
            </h2>
            {nomFerie && (
              <span className="inline-block mt-0.5 px-2.5 py-0.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full">
                {nomFerie}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={goToNextDay}
            disabled={jour >= nbJours}
            className="
              w-10 h-10 rounded-full flex items-center justify-center
              text-gray-500 hover:bg-gray-100 active:bg-gray-200
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-colors min-w-[44px] min-h-[44px]
            "
            aria-label="Jour suivant"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* ===== Scrollable content ===== */}
        <div ref={contentRef} className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-5">
          {/* ===== Code grid ===== */}
          <GrilleCode
            selectedCode={selectedCode}
            onSelect={handleCodeSelect}
          />

          {/* ===== Info banner ===== */}
          {currentCodeObj && selectedCode !== "WORK" && (
            <div
              className={`
                flex items-start gap-2.5 p-3 rounded-xl border text-sm leading-snug
                ${CODE_COLORS[currentCodeObj.couleur]?.bg || "bg-gray-50"}
                ${CODE_COLORS[currentCodeObj.couleur]?.border || "border-gray-200"}
                ${CODE_COLORS[currentCodeObj.couleur]?.text || "text-gray-700"}
              `}
            >
              <svg className="w-4 h-4 mt-0.5 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs">{currentCodeObj.tooltip}</span>
            </div>
          )}

          {/* ===== Hour inputs - 2x2 grid ===== */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Heures
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Col L - Heures */}
              <div className={`${!colLActive ? "opacity-50" : ""}`}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  <span className="inline-block w-5 h-5 text-[10px] leading-5 text-center rounded bg-emerald-100 text-emerald-700 font-bold mr-1">
                    L
                  </span>
                  Heures
                </label>
                {colLActive ? (
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.25"
                    min="0"
                    max="24"
                    value={heures}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setHeures(val);
                      // Auto-calc H. supplémentaires si heures > planning
                      if (selectedCode === "WORK" && val > planningHours && planningHours > 0) {
                        setHeuresSup(Math.round((val - planningHours) * 100) / 100);
                        setHeuresComp(0);
                      } else if (selectedCode === "WORK") {
                        setHeuresSup(0);
                        setHeuresComp(0);
                      }
                    }}
                    className="
                      w-full border-2 border-gray-200 rounded-xl p-3 text-base font-semibold
                      bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-100
                      transition-colors min-h-[44px]
                    "
                  />
                ) : (
                  <div className="w-full border-2 border-gray-100 rounded-xl p-3 text-base font-semibold bg-gray-100 text-gray-400 min-h-[44px]">
                    {currentCodeObj?.label || "—"}
                  </div>
                )}
              </div>

              {/* Col O - H. contractuelles */}
              <div className={`${!colOActive ? "opacity-50" : ""}`}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  <span className="inline-block w-5 h-5 text-[10px] leading-5 text-center rounded bg-blue-100 text-blue-700 font-bold mr-1">
                    O
                  </span>
                  H. contractuelles
                </label>
                {colOActive ? (
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.25"
                    min="0"
                    max="24"
                    value={heuresContrac}
                    onChange={(e) => setHeuresContrac(parseFloat(e.target.value) || 0)}
                    className="
                      w-full border-2 border-gray-200 rounded-xl p-3 text-base font-semibold
                      bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-100
                      transition-colors min-h-[44px]
                    "
                  />
                ) : (
                  <div className="w-full border-2 border-gray-100 rounded-xl p-3 text-base font-semibold bg-gray-100 text-gray-400 min-h-[44px]">
                    —
                  </div>
                )}
              </div>

              {/* Col M - H. complementaires */}
              <div className={`${!colMNActive ? "opacity-50" : ""}`}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  <span className="inline-block w-5 h-5 text-[10px] leading-5 text-center rounded bg-amber-100 text-amber-700 font-bold mr-1">
                    M
                  </span>
                  H. complémentaires
                </label>
                {colMNActive ? (
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.25"
                    min="0"
                    max="24"
                    value={heuresComp}
                    onChange={(e) => setHeuresComp(parseFloat(e.target.value) || 0)}
                    className="
                      w-full border-2 border-gray-200 rounded-xl p-3 text-base font-semibold
                      bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-100
                      transition-colors min-h-[44px]
                    "
                  />
                ) : (
                  <div className="w-full border-2 border-gray-100 rounded-xl p-3 text-base font-semibold bg-gray-100 text-gray-400 min-h-[44px]">
                    —
                  </div>
                )}
              </div>

              {/* Col N - H. supplementaires */}
              <div className={`${!colMNActive ? "opacity-50" : ""}`}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  <span className="inline-block w-5 h-5 text-[10px] leading-5 text-center rounded bg-rose-100 text-rose-700 font-bold mr-1">
                    N
                  </span>
                  H. supplémentaires
                </label>
                {colMNActive ? (
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.25"
                    min="0"
                    max="24"
                    value={heuresSup}
                    onChange={(e) => setHeuresSup(parseFloat(e.target.value) || 0)}
                    className="
                      w-full border-2 border-gray-200 rounded-xl p-3 text-base font-semibold
                      bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-100
                      transition-colors min-h-[44px]
                    "
                  />
                ) : (
                  <div className="w-full border-2 border-gray-100 rounded-xl p-3 text-base font-semibold bg-gray-100 text-gray-400 min-h-[44px]">
                    —
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ===== Toggles: Repas + Km ===== */}
          <div className="flex items-center gap-6">
            {/* Repas toggle */}
            <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={repas}
                  onChange={(e) => setRepas(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="
                  w-11 h-6 bg-gray-200 rounded-full
                  peer-checked:bg-purple-500
                  peer-focus-visible:ring-2 peer-focus-visible:ring-purple-300
                  transition-colors duration-200
                " />
                <div className="
                  absolute left-0.5 top-0.5
                  w-5 h-5 bg-white rounded-full shadow-sm
                  peer-checked:translate-x-5
                  transition-transform duration-200
                " />
              </div>
              <span className="text-sm font-medium text-gray-700">Repas</span>
            </label>

            {/* Km input */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Km</label>
              <input
                type="number"
                inputMode="decimal"
                step="1"
                min="0"
                value={km}
                onChange={(e) => setKm(parseFloat(e.target.value) || 0)}
                className="
                  w-20 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold
                  bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-100
                  transition-colors min-h-[44px]
                "
              />
            </div>
          </div>

          {/* ===== Monthly recap ===== */}
          <RecapMois
            enfantNom={enfant.nom}
            annee={annee}
            mois={mois}
            joursData={joursData}
          />
        </div>

        {/* ===== Action buttons ===== */}
        <div className="px-4 py-4 border-t border-gray-100 space-y-2 bg-white rounded-b-2xl">
          {/* Effacer le jour */}
          {joursData[String(jour)] && (
            <button
              type="button"
              onClick={() => {
                // Enregistrer un jour vide pour effacer
                if (!enfant) return;
                const emptyData: JourData = {
                  type: "repos",
                  heures: 0,
                  heures_comp: 0,
                  heures_sup: 0,
                  heures_contrac: 0,
                  repas: false,
                  commentaire: "",
                };
                onSave(jour, enfant.id, emptyData);
                setSelectedCode("WORK");
                setHeures(planningHours);
                setHeuresContrac(0);
                setHeuresComp(0);
                setHeuresSup(0);
                setRepas(false);
                showToast(`Jour ${jour} effacé`, "info");
              }}
              className="
                w-full py-2 px-4 rounded-xl text-xs font-medium
                border border-red-200 text-red-600
                hover:bg-red-50 active:bg-red-100
                transition-colors min-h-[36px]
              "
            >
              Effacer ce jour
            </button>
          )}
          <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="
              flex-1 py-3 px-4 rounded-xl text-sm font-bold
              bg-purple-600 text-white
              hover:bg-purple-700 active:bg-purple-800
              focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2
              transition-colors min-h-[48px]
              shadow-sm shadow-purple-200
            "
          >
            Enregistrer
          </button>
          <button
            type="button"
            onClick={handleSaveAndNext}
            disabled={jour >= nbJours}
            className="
              flex-1 py-3 px-4 rounded-xl text-sm font-bold
              border-2 border-purple-200 text-purple-700
              hover:bg-purple-50 active:bg-purple-100
              disabled:opacity-40 disabled:cursor-not-allowed
              focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2
              transition-colors min-h-[48px]
            "
          >
            Jour suivant
            <svg className="inline w-4 h-4 ml-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
