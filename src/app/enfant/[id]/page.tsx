"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getEnfant, saveEnfant, deleteEnfant, Enfant } from "@/lib/firestore";
import { Timestamp } from "firebase/firestore";
import TableauCP from "@/components/conges/TableauCP";
import PoserConges from "@/components/conges/PoserConges";

export default function EnfantPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [enfant, setEnfant] = useState<Enfant | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState<Record<string, string | number | boolean>>({});

  useEffect(() => {
    if (user && id) {
      getEnfant(user.uid, id).then((e) => {
        if (e) {
          setEnfant(e);
          setForm({
            nom: e.nom,
            emp_nom: e.emp_nom,
            emp_adresse: e.emp_adresse,
            emp_complement: e.emp_complement,
            emp_cp_ville: e.emp_cp_ville,
            emp_num: e.emp_num,
            type_contrat: e.type_contrat,
            date_embauche: e.date_embauche?.toDate?.()
              ? e.date_embauche.toDate().toISOString().split("T")[0]
              : "",
            date_fin_cdd: e.date_fin_cdd?.toDate?.()
              ? e.date_fin_cdd.toDate().toISOString().split("T")[0]
              : "",
            heures_normales_semaine: e.heures_normales_semaine,
            heures_sup_semaine: e.heures_sup_semaine,
            semaines_programmees: e.semaines_programmees,
            mois_prevus: e.mois_prevus,
            annee_complete: e.annee_complete,
            taux_horaire: e.taux_horaire,
            indemnite_entretien_jour: e.indemnite_entretien_jour,
            indemnite_repas: e.indemnite_repas,
            indemnite_km: e.indemnite_km,
            planning_lundi: e.planning_type?.lundi || 0,
            planning_mardi: e.planning_type?.mardi || 0,
            planning_mercredi: e.planning_type?.mercredi || 0,
            planning_jeudi: e.planning_type?.jeudi || 0,
            planning_vendredi: e.planning_type?.vendredi || 0,
            planning_samedi: e.planning_type?.samedi || 0,
            methode_absence: e.methode_absence,
            jours_pajemploi_contrat: e.jours_pajemploi_contrat || 0,
            cp_solde_initial: e.cp_solde_initial || 0,
            cp_solde_initial_date: e.cp_solde_initial_date || "",
          });
        }
      });
    }
  }, [user, id]);

  function update(field: string, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!user || !enfant) return;
    setSaving(true);

    const data: Omit<Enfant, "id"> = {
      nom: form.nom as string,
      emp_nom: form.emp_nom as string,
      emp_adresse: form.emp_adresse as string,
      emp_complement: form.emp_complement as string,
      emp_cp_ville: form.emp_cp_ville as string,
      emp_num: form.emp_num as string,
      type_contrat: form.type_contrat as Enfant["type_contrat"],
      date_embauche: form.date_embauche
        ? Timestamp.fromDate(new Date(form.date_embauche as string))
        : Timestamp.now(),
      date_fin_cdd: form.date_fin_cdd
        ? Timestamp.fromDate(new Date(form.date_fin_cdd as string))
        : null,
      heures_normales_semaine: form.heures_normales_semaine as number,
      heures_sup_semaine: form.heures_sup_semaine as number,
      semaines_programmees: form.semaines_programmees as number,
      mois_prevus: form.mois_prevus as number,
      annee_complete: form.annee_complete as boolean,
      taux_horaire: form.taux_horaire as number,
      indemnite_entretien_jour: form.indemnite_entretien_jour as number,
      indemnite_repas: form.indemnite_repas as number,
      indemnite_km: form.indemnite_km as number,
      planning_type: {
        lundi: form.planning_lundi as number,
        mardi: form.planning_mardi as number,
        mercredi: form.planning_mercredi as number,
        jeudi: form.planning_jeudi as number,
        vendredi: form.planning_vendredi as number,
        samedi: form.planning_samedi as number,
      },
      methode_absence: form.methode_absence as Enfant["methode_absence"],
      jours_pajemploi_contrat: form.jours_pajemploi_contrat as number,
      cp_solde_initial: form.cp_solde_initial as number,
      cp_solde_initial_date: form.cp_solde_initial_date as string,
    };

    await saveEnfant(user.uid, id, data);
    setEnfant({ ...data, id });
    setEditing(false);
    setSaving(false);
  }

  async function handleDelete() {
    if (!user || !confirm("Supprimer ce contrat ?")) return;
    await deleteEnfant(user.uid, id);
    router.push("/");
  }

  if (!enfant) {
    return <div className="p-8 text-center text-gray-400">Chargement...</div>;
  }

  const now = new Date();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{enfant.nom}</h1>
        <div className="flex gap-2">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium"
            >
              Modifier
            </button>
          ) : (
            <>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium"
              >
                {saving ? "..." : "Enregistrer"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Résumé contrat */}
      <div className="bg-white rounded-xl border p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-purple-700">
              {enfant.taux_horaire} €
            </div>
            <div className="text-xs text-gray-500">Taux horaire</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-700">
              {enfant.heures_normales_semaine}h
            </div>
            <div className="text-xs text-gray-500">/ semaine</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-700">
              {enfant.semaines_programmees}
            </div>
            <div className="text-xs text-gray-500">semaines</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-700">
              {enfant.type_contrat === "CDI" ? "CDI" : "CDD"}
            </div>
            <div className="text-xs text-gray-500">Contrat</div>
          </div>
        </div>
      </div>

      {editing ? (
        <div className="space-y-4">
          {/* Employeur */}
          <section className="bg-white rounded-xl border p-4 space-y-3">
            <h2 className="font-bold text-purple-900 border-b pb-2">Employeur</h2>
            {[
              { field: "emp_nom", label: "Nom prénom", type: "text" },
              { field: "emp_adresse", label: "Adresse", type: "text" },
              { field: "emp_complement", label: "Complément", type: "text" },
              { field: "emp_cp_ville", label: "CP Ville", type: "text" },
              { field: "emp_num", label: "N° Pajemploi employeur", type: "text" },
            ].map(({ field, label, type }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type={type}
                  value={form[field] as string}
                  onChange={(e) => update(field, e.target.value)}
                  className="w-full border rounded-lg p-2.5 text-sm"
                />
              </div>
            ))}
          </section>

          {/* Contrat */}
          <section className="bg-white rounded-xl border p-4 space-y-3">
            <h2 className="font-bold text-purple-900 border-b pb-2">Contrat & Mensualisation</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type contrat</label>
                <select value={form.type_contrat as string} onChange={(e) => update("type_contrat", e.target.value)} className="w-full border rounded-lg p-2.5 text-sm">
                  <option value="CDI">CDI</option>
                  <option value="CDD_terme_precis">CDD terme précis</option>
                  <option value="CDD_terme_imprecis">CDD terme imprécis</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date embauche</label>
                <input type="date" value={form.date_embauche as string} onChange={(e) => update("date_embauche", e.target.value)} className="w-full border rounded-lg p-2.5 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { field: "heures_normales_semaine", label: "H. normales/sem" },
                { field: "heures_sup_semaine", label: "H. sup/sem (>45h)" },
                { field: "semaines_programmees", label: "Semaines prog." },
                { field: "mois_prevus", label: "Mois prévus" },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type="number" step="0.25" value={form[field] as number || ""} onChange={(e) => update(field, parseFloat(e.target.value) || 0)} className="w-full border rounded-lg p-2.5 text-sm" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="ac" checked={form.annee_complete as boolean} onChange={(e) => update("annee_complete", e.target.checked)} className="w-4 h-4" />
              <label htmlFor="ac" className="text-sm">Année complète</label>
            </div>
          </section>

          {/* Tarifs */}
          <section className="bg-white rounded-xl border p-4 space-y-3">
            <h2 className="font-bold text-purple-900 border-b pb-2">Tarifs</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { field: "taux_horaire", label: "Taux horaire (€/h)" },
                { field: "indemnite_entretien_jour", label: "IE entretien (€/jour)" },
                { field: "indemnite_repas", label: "Indemnité repas (€)" },
                { field: "indemnite_km", label: "Indemnité km (€/km)" },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type="number" step="0.01" value={form[field] as number || ""} onChange={(e) => update(field, parseFloat(e.target.value) || 0)} className="w-full border rounded-lg p-2.5 text-sm" />
                </div>
              ))}
            </div>
          </section>

          {/* Planning */}
          <section className="bg-white rounded-xl border p-4 space-y-3">
            <h2 className="font-bold text-purple-900 border-b pb-2">Planning type</h2>
            <div className="grid grid-cols-3 gap-3">
              {["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"].map((j) => (
                <div key={j}>
                  <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">{j}</label>
                  <input type="number" step="0.25" value={form[`planning_${j}`] as number || ""} onChange={(e) => update(`planning_${j}`, parseFloat(e.target.value) || 0)} className="w-full border rounded-lg p-2 text-sm" />
                </div>
              ))}
            </div>
          </section>

          {/* Méthode absence */}
          <section className="bg-white rounded-xl border p-4 space-y-3">
            <h2 className="font-bold text-purple-900 border-b pb-2">Méthode absence</h2>
            <select value={form.methode_absence as string} onChange={(e) => update("methode_absence", e.target.value)} className="w-full border rounded-lg p-2.5 text-sm">
              <option value="heures">Par heures (52 semaines)</option>
              <option value="jours">Par jours (≤46 semaines)</option>
              <option value="minoration_cassation">Minoration Cassation</option>
            </select>
          </section>

          <button
            onClick={handleDelete}
            className="w-full py-3 text-red-600 border border-red-200 rounded-xl text-sm hover:bg-red-50"
          >
            Supprimer ce contrat
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Détails affichés */}
          <section className="bg-white rounded-xl border p-4">
            <h2 className="font-bold text-purple-900 border-b pb-2 mb-3">Employeur</h2>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-500">Nom :</span> {enfant.emp_nom}</p>
              <p><span className="text-gray-500">Adresse :</span> {enfant.emp_adresse}</p>
              {enfant.emp_complement && <p><span className="text-gray-500">Complément :</span> {enfant.emp_complement}</p>}
              <p><span className="text-gray-500">CP Ville :</span> {enfant.emp_cp_ville}</p>
              <p><span className="text-gray-500">N° Pajemploi :</span> {enfant.emp_num}</p>
            </div>
          </section>

          <section className="bg-white rounded-xl border p-4">
            <h2 className="font-bold text-purple-900 border-b pb-2 mb-3">Tarifs</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p><span className="text-gray-500">Taux horaire :</span> {enfant.taux_horaire} €/h</p>
              <p><span className="text-gray-500">IE entretien :</span> {enfant.indemnite_entretien_jour} €/j</p>
              <p><span className="text-gray-500">Ind. repas :</span> {enfant.indemnite_repas} €</p>
              <p><span className="text-gray-500">Ind. km :</span> {enfant.indemnite_km} €/km</p>
            </div>
          </section>

          <section className="bg-white rounded-xl border p-4">
            <h2 className="font-bold text-purple-900 border-b pb-2 mb-3">Planning type</h2>
            <div className="grid grid-cols-3 gap-2 text-sm">
              {["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"].map((j) => {
                const h = enfant.planning_type?.[j as keyof typeof enfant.planning_type] || 0;
                return (
                  <div key={j} className={`text-center p-2 rounded ${h > 0 ? "bg-purple-50" : "bg-gray-50"}`}>
                    <div className="capitalize text-xs text-gray-500">{j}</div>
                    <div className="font-bold">{h}h</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Liens rapides */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href={`/fiche/${id}/${now.getFullYear()}/${now.getMonth()}`}
              className="bg-purple-600 text-white rounded-xl p-4 text-center hover:bg-purple-700"
            >
              <div className="font-bold">Bulletin du mois</div>
            </a>
            <a
              href={`/rupture/${id}`}
              className="bg-white border rounded-xl p-4 text-center hover:bg-gray-50"
            >
              <div className="font-bold text-gray-900">Fin de contrat</div>
            </a>
          </div>

          {/* Poser des congés */}
          {user && (
            <PoserConges
              uid={user.uid}
              enfantId={id}
              enfantNom={enfant.nom}
              anneeComplete={enfant.annee_complete}
              planningType={enfant.planning_type || {}}
              onCongesPoses={() => {
                // Recharger le tableau CP
                window.location.reload();
              }}
            />
          )}

          {/* Tableau CP */}
          {user && (
            <TableauCP
              uid={user.uid}
              enfantId={id}
              enfantNom={enfant.nom}
              dateEmbauche={
                enfant.date_embauche?.toDate?.()
                  ? enfant.date_embauche.toDate()
                  : new Date(2024, 0, 1)
              }
              semaineProgrammees={enfant.semaines_programmees}
              anneeComplete={enfant.annee_complete}
              cpSoldeInitial={enfant.cp_solde_initial || 0}
              cpSoldeInitialDate={enfant.cp_solde_initial_date || ""}
              anneeCourante={now.getFullYear()}
              moisCourant={now.getMonth()}
            />
          )}
        </div>
      )}
    </div>
  );
}
