"use client";

import { useState, useEffect } from "react";
import { CPMoisEntry, getCPTableau, saveCPMois } from "@/lib/firestore";
import { MOIS_NOMS } from "@/lib/utils";

interface TableauCPProps {
  uid: string;
  enfantId: string;
  enfantNom: string;
  dateEmbauche: Date;
  semaineProgrammees: number;
  anneeComplete: boolean;
  cpSoldeInitial: number;
  cpSoldeInitialDate: string;
  // Pour savoir le mois/année courant
  anneeCourante: number;
  moisCourant: number; // 0-11
}

export default function TableauCP({
  uid,
  enfantId,
  enfantNom,
  dateEmbauche,
  semaineProgrammees,
  anneeComplete,
  cpSoldeInitial,
  cpSoldeInitialDate,
  anneeCourante,
  moisCourant,
}: TableauCPProps) {
  const [cpData, setCpData] = useState<CPMoisEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCPTableau(uid, enfantId).then((data) => {
      setCpData(data);
      setLoading(false);
    });
  }, [uid, enfantId]);

  // Déterminer la période N (1er juin → 31 mai)
  const periodeNDebut = moisCourant < 5
    ? new Date(anneeCourante - 1, 5, 1)
    : new Date(anneeCourante, 5, 1);
  const periodeNFin = moisCourant < 5
    ? new Date(anneeCourante, 4, 31)
    : new Date(anneeCourante + 1, 4, 31);

  // Générer la liste des mois depuis le début de la période (ou embauche)
  const debutEffectif = dateEmbauche > periodeNDebut ? dateEmbauche : periodeNDebut;
  const moisListe: { annee: number; mois: number }[] = [];
  const d = new Date(debutEffectif.getFullYear(), debutEffectif.getMonth(), 1);
  const finCalcul = new Date(anneeCourante, moisCourant, 1);
  while (d <= finCalcul && d <= periodeNFin) {
    moisListe.push({ annee: d.getFullYear(), mois: d.getMonth() });
    d.setMonth(d.getMonth() + 1);
  }

  // Acquis par mois : semaines_programmées / 12 / 4 × 2.5
  const acquisParMois = Math.round(((semaineProgrammees / 12) / 4) * 2.5 * 100) / 100;

  // Lookup CP data
  function getCPForMois(annee: number, mois: number): CPMoisEntry | undefined {
    return cpData.find((c) => c.annee === annee && c.mois === mois);
  }

  // Totaux
  let totalCpc = 0;
  let totalCpi = 0;
  let totalAcquis = 0;
  moisListe.forEach(({ annee, mois }) => {
    const entry = getCPForMois(annee, mois);
    totalCpc += entry?.cpc_pris || 0;
    totalCpi += entry?.cpi_pris || 0;
    totalAcquis += acquisParMois;
  });
  totalAcquis = Math.round(totalAcquis * 100) / 100;
  const solde = Math.round(Math.min(cpSoldeInitial + totalAcquis - totalCpc - totalCpi, 30) * 100) / 100;

  // Modifier un mois
  async function handleUpdate(annee: number, mois: number, field: "cpc_pris" | "cpi_pris", value: number) {
    await saveCPMois(uid, enfantId, annee, mois, {
      [field]: value,
      manuel: true,
    });
    setCpData((prev) => {
      const existing = prev.find((c) => c.annee === annee && c.mois === mois);
      if (existing) {
        return prev.map((c) =>
          c.annee === annee && c.mois === mois
            ? { ...c, [field]: value, manuel: true }
            : c
        );
      }
      return [...prev, { annee, mois, cpc_pris: 0, cpi_pris: 0, acquis: acquisParMois, manuel: true, [field]: value }];
    });
  }

  if (loading) {
    return <div className="text-center text-gray-400 py-4">Chargement CP...</div>;
  }

  return (
    <div className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden">
      <div className="bg-purple-600 text-white px-4 py-3 flex justify-between items-center">
        <div>
          <h2 className="font-bold">Congés payés — {enfantNom}</h2>
          <p className="text-purple-200 text-xs">
            Période {periodeNDebut.toLocaleDateString("fr-FR")} au {periodeNFin.toLocaleDateString("fr-FR")}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{solde}</div>
          <div className="text-purple-200 text-xs">jours restants</div>
        </div>
      </div>

      {/* Solde initial */}
      {cpSoldeInitial > 0 && (
        <div className="px-4 py-2 bg-purple-50 text-sm flex justify-between">
          <span className="text-purple-700">Solde initial{cpSoldeInitialDate ? ` au ${cpSoldeInitialDate}` : ""}</span>
          <span className="font-bold text-purple-900">{cpSoldeInitial} jours</span>
        </div>
      )}

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mois</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">
                {anneeComplete ? "CPc pris" : "CPi pris"}
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Acquis</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Cumul</th>
            </tr>
          </thead>
          <tbody>
            {moisListe.map(({ annee, mois }, idx) => {
              const entry = getCPForMois(annee, mois);
              const cpPris = anneeComplete ? (entry?.cpc_pris || 0) : (entry?.cpi_pris || 0);
              const cumulAcquis = Math.round(acquisParMois * (idx + 1) * 100) / 100;
              const cumulPris = moisListe.slice(0, idx + 1).reduce((sum, m) => {
                const e = getCPForMois(m.annee, m.mois);
                return sum + (anneeComplete ? (e?.cpc_pris || 0) : (e?.cpi_pris || 0));
              }, 0);
              const cumulSolde = Math.round((cpSoldeInitial + cumulAcquis - cumulPris) * 100) / 100;
              const isCurrent = annee === anneeCourante && mois === moisCourant;

              return (
                <tr
                  key={`${annee}-${mois}`}
                  className={`border-b ${isCurrent ? "bg-purple-50" : "hover:bg-gray-50"}`}
                >
                  <td className="px-3 py-1.5 text-gray-700">
                    <span className={isCurrent ? "font-bold text-purple-700" : ""}>
                      {MOIS_NOMS[mois]} {annee}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={cpPris}
                      onChange={(e) =>
                        handleUpdate(
                          annee,
                          mois,
                          anneeComplete ? "cpc_pris" : "cpi_pris",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-14 text-center border rounded p-1 text-sm"
                    />
                  </td>
                  <td className="px-3 py-1.5 text-center text-gray-500">
                    {acquisParMois}
                  </td>
                  <td className="px-3 py-1.5 text-center font-medium">
                    <span className={cumulSolde < 5 ? "text-red-600" : "text-purple-700"}>
                      {Math.min(cumulSolde, 30)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-purple-50 font-bold">
              <td className="px-3 py-2">TOTAL</td>
              <td className="px-3 py-2 text-center text-purple-700">{totalCpc + totalCpi}</td>
              <td className="px-3 py-2 text-center text-purple-700">{totalAcquis}</td>
              <td className="px-3 py-2 text-center text-purple-900">{solde}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
