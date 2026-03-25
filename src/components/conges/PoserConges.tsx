"use client";

import { useState } from "react";
import { poserCongesPeriode } from "@/lib/firestore";
import { MOIS_NOMS, getDaysInMonth } from "@/lib/utils";

interface PoserCongesProps {
  uid: string;
  enfantId: string;
  enfantNom: string;
  anneeComplete: boolean;
  planningType: Record<string, number>;
  onCongesPoses: (annee: number, mois: number, count: number) => void;
}

export default function PoserConges({
  uid,
  enfantId,
  enfantNom,
  anneeComplete,
  planningType,
  onCongesPoses,
}: PoserCongesProps) {
  const now = new Date();
  const [annee, setAnnee] = useState(now.getFullYear());
  const [mois, setMois] = useState(now.getMonth());
  const [jourDebut, setJourDebut] = useState(1);
  const [jourFin, setJourFin] = useState(5);
  const [code, setCode] = useState<"CPC" | "CPI">(anneeComplete ? "CPC" : "CPI");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const nbJoursMois = getDaysInMonth(annee, mois);

  // Prévisualiser les jours ouvrés dans la période
  const joursSemaine = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  let previewCount = 0;
  const previewJours: number[] = [];
  for (let j = jourDebut; j <= jourFin && j <= nbJoursMois; j++) {
    const date = new Date(annee, mois, j);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;
    const jourKey = joursSemaine[dow];
    if ((planningType[jourKey] || 0) === 0) continue;
    previewCount++;
    previewJours.push(j);
  }

  async function handlePoser() {
    setSaving(true);
    setResult(null);
    const count = await poserCongesPeriode(
      uid,
      enfantId,
      annee,
      mois,
      jourDebut,
      Math.min(jourFin, nbJoursMois),
      code,
      planningType
    );
    setSaving(false);
    setResult(`${count} jour${count > 1 ? "s" : ""} de ${code === "CPC" ? "CPc" : "CPi"} posé${count > 1 ? "s" : ""}`);
    onCongesPoses(annee, mois, count);
  }

  return (
    <div className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden">
      <div className="bg-purple-600 text-white px-4 py-3">
        <h2 className="font-bold">Poser des congés — {enfantNom}</h2>
        <p className="text-purple-200 text-xs">Sélectionnez une période pour poser des CP en avance</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Mois / Année */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mois</label>
            <select
              value={mois}
              onChange={(e) => setMois(parseInt(e.target.value))}
              className="w-full border rounded-lg p-2.5 text-sm"
            >
              {MOIS_NOMS.map((nom, idx) => (
                <option key={idx} value={idx}>{nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Année</label>
            <select
              value={annee}
              onChange={(e) => setAnnee(parseInt(e.target.value))}
              className="w-full border rounded-lg p-2.5 text-sm"
            >
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Période */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Du jour</label>
            <input
              type="number"
              min={1}
              max={nbJoursMois}
              value={jourDebut}
              onChange={(e) => setJourDebut(parseInt(e.target.value) || 1)}
              className="w-full border rounded-lg p-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Au jour</label>
            <input
              type="number"
              min={jourDebut}
              max={nbJoursMois}
              value={jourFin}
              onChange={(e) => setJourFin(parseInt(e.target.value) || jourDebut)}
              className="w-full border rounded-lg p-2.5 text-sm"
            />
          </div>
        </div>

        {/* Type de CP */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Type de congé</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCode("CPC")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                code === "CPC"
                  ? "bg-violet-100 border-violet-400 text-violet-800"
                  : "bg-white border-gray-200 text-gray-500"
              }`}
            >
              CPc (année complète)
            </button>
            <button
              type="button"
              onClick={() => setCode("CPI")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                code === "CPI"
                  ? "bg-violet-100 border-violet-400 text-violet-800"
                  : "bg-white border-gray-200 text-gray-500"
              }`}
            >
              CPi (année incomplète)
            </button>
          </div>
        </div>

        {/* Prévisualisation */}
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-sm font-medium text-purple-900 mb-1">
            Prévisualisation : {previewCount} jour{previewCount > 1 ? "s" : ""} ouvré{previewCount > 1 ? "s" : ""}
          </div>
          <div className="flex flex-wrap gap-1">
            {previewJours.map((j) => (
              <span
                key={j}
                className="inline-flex items-center justify-center w-8 h-8 text-xs font-bold bg-violet-200 text-violet-800 rounded-lg"
              >
                {j}
              </span>
            ))}
          </div>
          {previewCount === 0 && (
            <p className="text-xs text-purple-500 mt-1">Aucun jour ouvré dans cette période</p>
          )}
        </div>

        {/* Bouton */}
        <button
          onClick={handlePoser}
          disabled={saving || previewCount === 0}
          className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Enregistrement..." : `Poser ${previewCount} jour${previewCount > 1 ? "s" : ""} de ${code === "CPC" ? "CPc" : "CPi"}`}
        </button>

        {/* Résultat */}
        {result && (
          <div className="bg-green-50 text-green-700 text-sm rounded-lg p-3 text-center font-medium">
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
