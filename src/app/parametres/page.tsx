"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getUserData, saveUserData, getParametres, saveParametres } from "@/lib/firestore";
import { signOut } from "@/lib/auth";
import {
  COTISATIONS_2026,
  CotisationsConfig,
} from "@/lib/constants/cotisations-2026";
import {
  requestNotificationPermission,
  isDailyEnabled,
  scheduleDaily,
  disableDaily,
  getNotificationPermission,
} from "@/lib/notifications";
import { showToast } from "@/components/Toast";

const COTISATION_LABELS: Record<keyof CotisationsConfig, string> = {
  securite_sociale_salariale: "Sécu. sociale salariale",
  securite_sociale_salariale_alsace: "Sécu. sociale salariale (Alsace-Moselle)",
  securite_sociale_patronale: "Sécu. sociale patronale",
  fnal_patronale: "FNAL patronale",
  csa_patronale: "CSA patronale",
  formation_patronale: "Formation patronale",
  retraite_salariale: "Retraite salariale",
  retraite_patronale: "Retraite patronale",
  ircem_salariale: "IRCEM salariale",
  ircem_patronale: "IRCEM patronale",
  reduction_hchm: "Réduction HC/HM",
  chomage_salariale: "Chômage salariale",
  chomage_patronale: "Chômage patronale",
  dialogue_social_patronale: "Dialogue social patronale",
  cst_patronale: "CST patronale",
  cst_plafond: "CST plafond (EUR)",
  base_csg_crds: "Base CSG/CRDS",
  csg_crds_non_deductible: "CSG/CRDS non déductible",
  csg_deductible: "CSG déductible",
};

export default function ParametresPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile fields
  const [nom, setNom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [complement, setComplement] = useState("");
  const [cpVille, setCpVille] = useState("");
  const [numSs, setNumSs] = useState("");
  const [numPajemploi, setNumPajemploi] = useState("");
  const [qualification, setQualification] = useState("");
  const [agePlus65, setAgePlus65] = useState(false);
  const [alsaceMoselle, setAlsaceMoselle] = useState(false);

  // Cotisations
  const [cotisations, setCotisations] = useState<CotisationsConfig>({ ...COTISATIONS_2026 });

  // IE minimums
  const [ieMinimum6h23, setIeMinimum6h23] = useState(3.69);
  const [ieMinimum9h, setIeMinimum9h] = useState(4.44);
  const [ieParHeure10hPlus, setIeParHeure10hPlus] = useState(0.5);
  const [evaluationRepas, setEvaluationRepas] = useState(5.35);

  // Notifications
  const [notifDaily, setNotifDaily] = useState(false);
  const [notifPayslip, setNotifPayslip] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    async function loadAll() {
      setLoadingData(true);

      const userData = await getUserData(user!.uid);
      if (userData) {
        setNom(userData.nom || "");
        setAdresse(userData.adresse || "");
        setComplement(userData.complement || "");
        setCpVille(userData.cp_ville || "");
        setNumSs(userData.num_ss || "");
        setNumPajemploi(userData.num_pajemploi || "");
        setQualification(userData.qualification || "");
        setAgePlus65(userData.age_plus_65 || false);
        setAlsaceMoselle(userData.alsace_moselle || false);
      }

      const params = await getParametres(user!.uid);
      if (params) {
        if (params.cotisations) {
          setCotisations({ ...COTISATIONS_2026, ...params.cotisations } as unknown as CotisationsConfig);
        }
        if (params.ie_minimum_6h23 !== undefined) setIeMinimum6h23(params.ie_minimum_6h23);
        if (params.ie_minimum_9h !== undefined) setIeMinimum9h(params.ie_minimum_9h);
        if (params.ie_par_heure_10h_plus !== undefined) setIeParHeure10hPlus(params.ie_par_heure_10h_plus);
        if (params.evaluation_repas !== undefined) setEvaluationRepas(params.evaluation_repas);
      }

      setNotifDaily(isDailyEnabled());
      setNotifPayslip(isDailyEnabled());

      setLoadingData(false);
    }

    loadAll();
  }, [user]);

  async function handleSaveProfile() {
    if (!user) return;
    setSaving(true);
    await saveUserData(user.uid, {
      nom,
      adresse,
      complement,
      cp_ville: cpVille,
      num_ss: numSs,
      num_pajemploi: numPajemploi,
      qualification,
      age_plus_65: agePlus65,
      alsace_moselle: alsaceMoselle,
    });
    setSaving(false);
    showToast("Profil enregistré");
  }

  async function handleSaveCotisations() {
    if (!user) return;
    setSaving(true);
    await saveParametres(user.uid, {
      annee: 2026,
      version: "2026.1",
      cotisations: cotisations as unknown as Record<string, number>,
      ie_minimum_6h23: ieMinimum6h23,
      ie_minimum_9h: ieMinimum9h,
      ie_par_heure_10h_plus: ieParHeure10hPlus,
      evaluation_repas: evaluationRepas,
    });
    setSaving(false);
    showToast("Taux et minimums enregistrés");
  }

  function updateCotisation(key: keyof CotisationsConfig, value: number) {
    setCotisations((prev) => ({ ...prev, [key]: value }));
  }

  async function handleToggleDailyNotif(enabled: boolean) {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        scheduleDaily(19, 0);
        setNotifDaily(true);
      }
    } else {
      disableDaily();
      setNotifDaily(false);
    }
  }

  async function handleTogglePayslipNotif(enabled: boolean) {
    setNotifPayslip(enabled);
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        scheduleDaily(19, 0);
      }
    }
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!user) return null;

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  const profileFields = [
    { label: "Nom complet", value: nom, setter: setNom, type: "text" },
    { label: "Adresse", value: adresse, setter: setAdresse, type: "text" },
    { label: "Complément d'adresse", value: complement, setter: setComplement, type: "text" },
    { label: "Code postal / Ville", value: cpVille, setter: setCpVille, type: "text" },
    { label: "N° Sécurité sociale", value: numSs, setter: setNumSs, type: "text" },
    { label: "N° Pajemploi", value: numPajemploi, setter: setNumPajemploi, type: "text" },
    { label: "Qualification", value: qualification, setter: setQualification, type: "text" },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-purple-900">Paramètres</h1>

      {/* Profil */}
      <div className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden">
        <div className="bg-purple-600 text-white px-4 py-3">
          <h2 className="font-bold">Profil salarié(e)</h2>
        </div>
        <div className="p-4 space-y-4">
          {profileFields.map(({ label, value, setter, type }) => (
            <div key={label}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                type={type}
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          ))}

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={agePlus65}
                onChange={(e) => setAgePlus65(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              Âge &gt; 65 ans
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={alsaceMoselle}
                onChange={(e) => setAlsaceMoselle(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              Alsace-Moselle
            </label>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full py-2.5 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer le profil"}
          </button>
        </div>
      </div>

      {/* Cotisations */}
      <div className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden">
        <div className="bg-purple-600 text-white px-4 py-3">
          <h2 className="font-bold">Taux de cotisations</h2>
          <p className="text-purple-200 text-xs">Valeurs 2026 par défaut</p>
        </div>
        <div className="p-4 space-y-3">
          {(Object.keys(COTISATION_LABELS) as (keyof CotisationsConfig)[]).map(
            (key) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <label className="text-sm font-medium text-gray-700 flex-1">
                  {COTISATION_LABELS[key]}
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={cotisations[key]}
                  onChange={(e) =>
                    updateCotisation(key, parseFloat(e.target.value) || 0)
                  }
                  className="w-28 border border-gray-300 rounded-lg p-2 text-sm text-right focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            )
          )}
        </div>
      </div>

      {/* IE minimums */}
      <div className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden">
        <div className="bg-purple-600 text-white px-4 py-3">
          <h2 className="font-bold">Minimums conventionnels</h2>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-medium text-gray-700 flex-1">
              IE minimum journée &le; 6h23
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.01"
                value={ieMinimum6h23}
                onChange={(e) => setIeMinimum6h23(parseFloat(e.target.value) || 0)}
                className="w-24 border border-gray-300 rounded-lg p-2 text-sm text-right focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <span className="text-xs text-gray-400">EUR</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-medium text-gray-700 flex-1">
              IE minimum journée &le; 9h
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.01"
                value={ieMinimum9h}
                onChange={(e) => setIeMinimum9h(parseFloat(e.target.value) || 0)}
                className="w-24 border border-gray-300 rounded-lg p-2 text-sm text-right focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <span className="text-xs text-gray-400">EUR</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-medium text-gray-700 flex-1">
              IE par heure au-delà de 10h
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.01"
                value={ieParHeure10hPlus}
                onChange={(e) => setIeParHeure10hPlus(parseFloat(e.target.value) || 0)}
                className="w-24 border border-gray-300 rounded-lg p-2 text-sm text-right focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <span className="text-xs text-gray-400">EUR/h</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-medium text-gray-700 flex-1">
              Évaluation repas (avantage en nature)
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.01"
                value={evaluationRepas}
                onChange={(e) => setEvaluationRepas(parseFloat(e.target.value) || 0)}
                className="w-24 border border-gray-300 rounded-lg p-2 text-sm text-right focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <span className="text-xs text-gray-400">EUR</span>
            </div>
          </div>

          <button
            onClick={handleSaveCotisations}
            disabled={saving}
            className="w-full py-2.5 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer les taux et minimums"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden">
        <div className="bg-purple-600 text-white px-4 py-3">
          <h2 className="font-bold">Notifications</h2>
        </div>
        <div className="p-4 space-y-4">
          {getNotificationPermission() === "denied" && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
              Les notifications sont bloquées dans votre navigateur. Veuillez les
              autoriser dans les paramètres du navigateur.
            </p>
          )}

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Rappel quotidien de saisie
              </p>
              <p className="text-xs text-gray-500">
                Notification chaque soir à 19h pour saisir vos heures
              </p>
            </div>
            <div
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifDaily ? "bg-purple-600" : "bg-gray-300"
              }`}
              onClick={() => handleToggleDailyNotif(!notifDaily)}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifDaily ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </div>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Rappel fiches de paie
              </p>
              <p className="text-xs text-gray-500">
                Notification en fin de mois pour éditer vos bulletins
              </p>
            </div>
            <div
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifPayslip ? "bg-purple-600" : "bg-gray-300"
              }`}
              onClick={() => handleTogglePayslipNotif(!notifPayslip)}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifPayslip ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </div>
          </label>
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium text-sm hover:bg-red-100 transition-colors"
      >
        Se déconnecter
      </button>

      <p className="text-xs text-center text-gray-400 pb-4">
        AssMatPaie v2026.1
      </p>
    </div>
  );
}
