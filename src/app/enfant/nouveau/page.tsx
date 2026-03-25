"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { saveEnfant, Enfant } from "@/lib/firestore";
import { Timestamp } from "firebase/firestore";

export default function NouvelEnfantPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nom: "",
    emp_nom: "",
    emp_adresse: "",
    emp_complement: "",
    emp_cp_ville: "",
    emp_num: "",
    type_contrat: "CDI" as "CDI" | "CDD_terme_precis" | "CDD_terme_imprecis",
    date_embauche: "",
    date_fin_cdd: "",
    heures_normales_semaine: 0,
    heures_sup_semaine: 0,
    semaines_programmees: 52,
    mois_prevus: 12,
    annee_complete: true,
    taux_horaire: 0,
    indemnite_entretien_jour: 3.58,
    indemnite_repas: 0,
    indemnite_km: 0,
    planning_lundi: 0,
    planning_mardi: 0,
    planning_mercredi: 0,
    planning_jeudi: 0,
    planning_vendredi: 0,
    planning_samedi: 0,
    planning_alterne: false,
    planning_imp_lundi: 0,
    planning_imp_mardi: 0,
    planning_imp_mercredi: 0,
    planning_imp_jeudi: 0,
    planning_imp_vendredi: 0,
    planning_imp_samedi: 0,
    methode_absence: "heures" as "heures" | "jours" | "minoration_cassation",
    jours_pajemploi_contrat: 0,
    cp_solde_initial: 0,
    cp_solde_initial_date: "",
  });

  function update(field: string, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const enfantData: Omit<Enfant, "id"> = {
      nom: form.nom,
      emp_nom: form.emp_nom,
      emp_adresse: form.emp_adresse,
      emp_complement: form.emp_complement,
      emp_cp_ville: form.emp_cp_ville,
      emp_num: form.emp_num,
      type_contrat: form.type_contrat,
      date_embauche: form.date_embauche
        ? Timestamp.fromDate(new Date(form.date_embauche))
        : Timestamp.now(),
      date_fin_cdd: form.date_fin_cdd
        ? Timestamp.fromDate(new Date(form.date_fin_cdd))
        : null,
      heures_normales_semaine: form.heures_normales_semaine,
      heures_sup_semaine: form.heures_sup_semaine,
      semaines_programmees: form.semaines_programmees,
      mois_prevus: form.mois_prevus,
      annee_complete: form.annee_complete,
      taux_horaire: form.taux_horaire,
      indemnite_entretien_jour: form.indemnite_entretien_jour,
      indemnite_repas: form.indemnite_repas,
      indemnite_km: form.indemnite_km,
      planning_type: {
        lundi: form.planning_lundi,
        mardi: form.planning_mardi,
        mercredi: form.planning_mercredi,
        jeudi: form.planning_jeudi,
        vendredi: form.planning_vendredi,
        samedi: form.planning_samedi,
      },
      planning_alterne: form.planning_alterne as boolean,
      planning_type_impaire: form.planning_alterne ? {
        lundi: form.planning_imp_lundi as number,
        mardi: form.planning_imp_mardi as number,
        mercredi: form.planning_imp_mercredi as number,
        jeudi: form.planning_imp_jeudi as number,
        vendredi: form.planning_imp_vendredi as number,
        samedi: form.planning_imp_samedi as number,
      } : undefined,
      methode_absence: form.methode_absence,
      jours_pajemploi_contrat: form.jours_pajemploi_contrat as number,
      cp_solde_initial: form.cp_solde_initial as number,
      cp_solde_initial_date: form.cp_solde_initial_date as string,
    };

    const id = await saveEnfant(user.uid, null, enfantData);
    router.push(`/enfant/${id}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Nouveau contrat
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Enfant */}
        <section className="bg-white rounded-xl border p-4 space-y-3">
          <h2 className="font-bold text-purple-900 border-b pb-2">
            Enfant accueilli
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom et prénom de l&apos;enfant
            </label>
            <input
              type="text"
              required
              value={form.nom}
              onChange={(e) => update("nom", e.target.value)}
              className="w-full border rounded-lg p-2.5 text-sm"
              placeholder="DUPONT MARIE"
            />
          </div>
        </section>

        {/* Employeur */}
        <section className="bg-white rounded-xl border p-4 space-y-3">
          <h2 className="font-bold text-purple-900 border-b pb-2">
            Employeur (parent)
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom et prénom
            </label>
            <input
              type="text"
              required
              value={form.emp_nom}
              onChange={(e) => update("emp_nom", e.target.value)}
              className="w-full border rounded-lg p-2.5 text-sm"
              placeholder="DUPONT JEAN"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <input
              type="text"
              value={form.emp_adresse}
              onChange={(e) => update("emp_adresse", e.target.value)}
              className="w-full border rounded-lg p-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Complément d&apos;adresse
            </label>
            <input
              type="text"
              value={form.emp_complement}
              onChange={(e) => update("emp_complement", e.target.value)}
              className="w-full border rounded-lg p-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CP Ville
            </label>
            <input
              type="text"
              value={form.emp_cp_ville}
              onChange={(e) => update("emp_cp_ville", e.target.value)}
              className="w-full border rounded-lg p-2.5 text-sm"
              placeholder="75001 PARIS"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              N° employeur Pajemploi
            </label>
            <input
              type="text"
              value={form.emp_num}
              onChange={(e) => update("emp_num", e.target.value)}
              className="w-full border rounded-lg p-2.5 text-sm"
              placeholder="Y3426921780007"
            />
          </div>
        </section>

        {/* Contrat */}
        <section className="bg-white rounded-xl border p-4 space-y-3">
          <h2 className="font-bold text-purple-900 border-b pb-2">Contrat</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de contrat
              </label>
              <select
                value={form.type_contrat}
                onChange={(e) => update("type_contrat", e.target.value)}
                className="w-full border rounded-lg p-2.5 text-sm"
              >
                <option value="CDI">CDI</option>
                <option value="CDD_terme_precis">CDD terme précis</option>
                <option value="CDD_terme_imprecis">CDD terme imprécis</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date d&apos;embauche
              </label>
              <input
                type="date"
                value={form.date_embauche}
                onChange={(e) => update("date_embauche", e.target.value)}
                className="w-full border rounded-lg p-2.5 text-sm"
              />
            </div>
          </div>

          {form.type_contrat !== "CDI" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin CDD
              </label>
              <input
                type="date"
                value={form.date_fin_cdd}
                onChange={(e) => update("date_fin_cdd", e.target.value)}
                className="w-full border rounded-lg p-2.5 text-sm"
              />
            </div>
          )}
        </section>

        {/* Mensualisation */}
        <section className="bg-white rounded-xl border p-4 space-y-3">
          <h2 className="font-bold text-purple-900 border-b pb-2">
            Mensualisation
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heures normales / semaine
              </label>
              <input
                type="number"
                step="0.25"
                value={form.heures_normales_semaine || ""}
                onChange={(e) =>
                  update(
                    "heures_normales_semaine",
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-full border rounded-lg p-2.5 text-sm"
                placeholder="32.25"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heures sup / semaine (au-delà 45h)
              </label>
              <input
                type="number"
                step="0.25"
                value={form.heures_sup_semaine || ""}
                onChange={(e) =>
                  update("heures_sup_semaine", parseFloat(e.target.value) || 0)
                }
                className="w-full border rounded-lg p-2.5 text-sm"
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semaines programmées
              </label>
              <input
                type="number"
                value={form.semaines_programmees || ""}
                onChange={(e) =>
                  update("semaines_programmees", parseInt(e.target.value) || 0)
                }
                className="w-full border rounded-lg p-2.5 text-sm"
                placeholder="52"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mois prévus
              </label>
              <input
                type="number"
                value={form.mois_prevus || ""}
                onChange={(e) =>
                  update("mois_prevus", parseInt(e.target.value) || 0)
                }
                className="w-full border rounded-lg p-2.5 text-sm"
                placeholder="12"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="annee_complete"
              checked={form.annee_complete}
              onChange={(e) => update("annee_complete", e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="annee_complete" className="text-sm">
              Année complète (52 sem / 12 mois)
            </label>
          </div>
        </section>

        {/* Tarifs */}
        <section className="bg-white rounded-xl border p-4 space-y-3">
          <h2 className="font-bold text-purple-900 border-b pb-2">Tarifs</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taux horaire (€/h)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={form.taux_horaire || ""}
                onChange={(e) =>
                  update("taux_horaire", parseFloat(e.target.value) || 0)
                }
                className="w-full border rounded-lg p-2.5 text-sm"
                placeholder="4.68"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Indemnité d&apos;entretien (€/jour)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.indemnite_entretien_jour || ""}
                onChange={(e) =>
                  update(
                    "indemnite_entretien_jour",
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-full border rounded-lg p-2.5 text-sm"
                placeholder="3.58"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Indemnité repas (€/repas)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.indemnite_repas || ""}
                onChange={(e) =>
                  update("indemnite_repas", parseFloat(e.target.value) || 0)
                }
                className="w-full border rounded-lg p-2.5 text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Indemnité km (€/km)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.indemnite_km || ""}
                onChange={(e) =>
                  update("indemnite_km", parseFloat(e.target.value) || 0)
                }
                className="w-full border rounded-lg p-2.5 text-sm"
                placeholder="0"
              />
            </div>
          </div>
        </section>

        {/* Planning type */}
        <section className="bg-white rounded-xl border p-4 space-y-3">
          <h2 className="font-bold text-purple-900 border-b pb-2">
            Planning type (heures par jour)
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"].map(
              (jour) => (
                <div key={jour}>
                  <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                    {jour}
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={
                      form[
                        `planning_${jour}` as keyof typeof form
                      ] as number || ""
                    }
                    onChange={(e) =>
                      update(
                        `planning_${jour}`,
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full border rounded-lg p-2 text-sm"
                    placeholder="0"
                  />
                </div>
              )
            )}
          </div>

          {/* Toggle paire/impaire */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="planning_alterne"
              checked={form.planning_alterne as boolean}
              onChange={(e) => update("planning_alterne", e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="planning_alterne" className="text-sm">
              Planning alterné (semaine paire / impaire)
            </label>
          </div>

          {/* Planning semaine impaire */}
          {form.planning_alterne && (
            <div>
              <h3 className="text-xs font-bold text-purple-700 mb-2 mt-2">
                Semaine impaire (le planning ci-dessus = semaine paire)
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"].map(
                  (jour) => (
                    <div key={`imp_${jour}`}>
                      <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                        {jour}
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        value={
                          form[
                            `planning_imp_${jour}` as keyof typeof form
                          ] as number || ""
                        }
                        onChange={(e) =>
                          update(
                            `planning_imp_${jour}`,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full border rounded-lg p-2 text-sm bg-purple-50"
                        placeholder="0"
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </section>

        {/* Méthode absence */}
        <section className="bg-white rounded-xl border p-4 space-y-3">
          <h2 className="font-bold text-purple-900 border-b pb-2">
            Méthode de déduction d&apos;absence
          </h2>
          <select
            value={form.methode_absence}
            onChange={(e) => update("methode_absence", e.target.value)}
            className="w-full border rounded-lg p-2.5 text-sm"
          >
            <option value="heures">
              Par heures (accueil 52 semaines)
            </option>
            <option value="jours">
              Par jours (accueil ≤46 semaines)
            </option>
            <option value="minoration_cassation">
              Minoration Cour de Cassation
            </option>
          </select>
        </section>

        {/* Pajemploi + Congés */}
        <section className="bg-white rounded-xl border p-4 space-y-3">
          <h2 className="font-bold text-purple-900 border-b pb-2">
            Pajemploi & Congés payés
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de jours à déclarer à Pajemploi
            </label>
            <input
              type="number"
              value={form.jours_pajemploi_contrat || ""}
              onChange={(e) => update("jours_pajemploi_contrat", parseInt(e.target.value) || 0)}
              className="w-full border rounded-lg p-2.5 text-sm"
              placeholder="Ex: 20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Solde initial de congés payés (jours)
            </label>
            <input
              type="number"
              step="0.5"
              value={form.cp_solde_initial || ""}
              onChange={(e) => update("cp_solde_initial", parseFloat(e.target.value) || 0)}
              className="w-full border rounded-lg p-2.5 text-sm"
              placeholder="Ex: 10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de référence du solde initial
            </label>
            <input
              type="date"
              value={form.cp_solde_initial_date}
              onChange={(e) => update("cp_solde_initial_date", e.target.value)}
              className="w-full border rounded-lg p-2.5 text-sm"
            />
          </div>
        </section>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 border rounded-xl font-medium text-gray-600"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Créer le contrat"}
          </button>
        </div>
      </form>
    </div>
  );
}
