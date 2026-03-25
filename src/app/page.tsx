"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  getEnfants,
  getUserData,
  getMoisData,
  saveJourData,
  defaultMoisData,
  Enfant,
  UserData,
  MoisData,
} from "@/lib/firestore";
import {
  requestNotificationPermission,
  isDailyEnabled,
  scheduleDaily,
  getNotificationPermission,
} from "@/lib/notifications";
import PopupJour from "@/components/saisie/PopupJour";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [enfants, setEnfants] = useState<Enfant[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [moisData, setMoisData] = useState<MoisData | null>(null);
  const [selectedEnfant, setSelectedEnfant] = useState<string>("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      getEnfants(user.uid).then((e) => {
        setEnfants(e);
        if (e.length > 0 && !selectedEnfant) setSelectedEnfant(e[0].id!);
      });
      getUserData(user.uid).then(setUserData);
      setNotifEnabled(isDailyEnabled());
    }
  }, [user, selectedEnfant]);

  // Charger les données du mois courant pour le popup
  useEffect(() => {
    if (user && selectedEnfant) {
      const now = new Date();
      const enf = enfants.find((e) => e.id === selectedEnfant);
      getMoisData(user.uid, selectedEnfant, now.getFullYear(), now.getMonth()).then((d) => {
        if (d) {
          setMoisData(d);
        } else if (enf) {
          setMoisData(defaultMoisData(selectedEnfant, now.getFullYear(), now.getMonth(), enf));
        }
      });
    }
  }, [user, selectedEnfant, enfants]);

  async function handleEnableNotif() {
    const granted = await requestNotificationPermission();
    if (granted) {
      scheduleDaily(19, 0);
      setNotifEnabled(true);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (!user) return null;

  const now = new Date();
  const moisCourant = now.getMonth();
  const anneeCourante = now.getFullYear();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour{userData?.nom ? ` ${userData.nom.split(" ").pop()}` : ""} !
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Notification banner */}
      {!notifEnabled && getNotificationPermission() !== "denied" && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-900">
              Rappel quotidien de saisie des heures
            </p>
            <p className="text-xs text-purple-600 mt-0.5">
              Recevez une notification chaque soir pour ne pas oublier
            </p>
          </div>
          <button
            onClick={handleEnableNotif}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
          >
            Activer
          </button>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowPopup(true)}
          className="bg-purple-600 text-white rounded-xl p-4 hover:bg-purple-700 transition-colors text-left"
        >
          <div className="text-lg font-bold">Saisir mes heures</div>
          <div className="text-purple-200 text-sm mt-1">
            Saisie du jour
          </div>
        </button>
        <Link
          href="/enfant/nouveau"
          className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-purple-400 transition-colors text-center"
        >
          <div className="text-2xl">+</div>
          <div className="text-sm text-gray-500">Ajouter un enfant</div>
        </Link>
      </div>

      {/* Enfants */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          Mes contrats ({enfants.length})
        </h2>
        {enfants.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center">
            <p className="text-gray-500">Aucun contrat enregistré</p>
            <Link
              href="/enfant/nouveau"
              className="inline-block mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium"
            >
              Ajouter un enfant
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {enfants.map((enfant) => (
              <Link
                key={enfant.id}
                href={`/enfant/${enfant.id}`}
                className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">{enfant.nom}</h3>
                    <p className="text-sm text-gray-500">
                      Employeur : {enfant.emp_nom}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                    {enfant.type_contrat === "CDI" ? "CDI" : "CDD"}
                  </span>
                </div>
                <div className="mt-3 flex gap-4 text-xs text-gray-500">
                  <span>{enfant.heures_normales_semaine}h/sem</span>
                  <span>{enfant.taux_horaire} €/h</span>
                  <span>IE: {enfant.indemnite_entretien_jour} €/j</span>
                </div>
                <div className="mt-2 flex gap-2">
                  <Link
                    href={`/fiche/${enfant.id}/${anneeCourante}/${moisCourant}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Bulletin
                  </Link>
                  <Link
                    href={`/conges/${enfant.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Congés
                  </Link>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Popup saisie du jour */}
      {showPopup && moisData && enfants.length > 0 && (
        <PopupJour
          enfants={enfants.map((e) => ({
            id: e.id!,
            nom: e.nom,
            taux_horaire: e.taux_horaire,
            annee_complete: e.annee_complete,
            heures_normales_semaine: e.heures_normales_semaine,
            planning_type: e.planning_type || { lundi: 0, mardi: 0, mercredi: 0, jeudi: 0, vendredi: 0, samedi: 0 },
            indemnite_entretien_jour: e.indemnite_entretien_jour,
            indemnite_repas: e.indemnite_repas,
            indemnite_km: e.indemnite_km,
          }))}
          enfantActifId={selectedEnfant}
          annee={new Date().getFullYear()}
          mois={new Date().getMonth()}
          jour={new Date().getDate()}
          joursData={moisData.jours || {}}
          onSave={async (jour, enfantId, data) => {
            if (!user) return;
            const now = new Date();
            await saveJourData(user.uid, enfantId, now.getFullYear(), now.getMonth(), String(jour), data);
            setMoisData((prev) => {
              if (!prev) return prev;
              return { ...prev, jours: { ...prev.jours, [String(jour)]: data } };
            });
          }}
          onChangeEnfant={(id) => setSelectedEnfant(id)}
          onChangeJour={() => {}}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
}
