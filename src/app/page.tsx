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
  const [allMoisData, setAllMoisData] = useState<Record<string, MoisData>>({});
  const [cpExpanded, setCpExpanded] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
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

  useEffect(() => {
    if (user && enfants.length > 0) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      Promise.all(
        enfants.map(async (enf) => {
          const d = await getMoisData(user.uid, enf.id!, year, month);
          const data = d || defaultMoisData(enf.id!, year, month, enf);
          return [enf.id!, data] as [string, MoisData];
        })
      ).then((results) => {
        const map: Record<string, MoisData> = {};
        for (const [id, data] of results) map[id] = data;
        setAllMoisData(map);
      });
    }
  }, [user, enfants]);

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
        <div style={{ color: "#C97B4A" }}>Chargement...</div>
      </div>
    );
  }

  if (!user) return null;

  const now = new Date();
  const moisCourant = now.getMonth();
  const anneeCourante = now.getFullYear();
  const prenom = userData?.nom ? userData.nom.split(" ").pop() ?? "" : "";

  return (
    <div style={{ background: "#FAF0E6", minHeight: "100vh" }}>

      {/* ===== HEADER ===== */}
      <div className="relative overflow-hidden px-5 pt-8 pb-20" style={{ background: "#F5E6D0" }}>
        {/* Blob teal haut-gauche */}
        <div
          className="absolute -top-10 -left-10 w-40 h-40 rounded-full"
          style={{ background: "#5BB8C4", opacity: 0.75 }}
        />
        {/* Petit nuage blanc sur le blob */}
        <svg className="absolute top-6 left-2 w-20 h-10" viewBox="0 0 80 36" fill="none">
          <ellipse cx="40" cy="24" rx="28" ry="14" fill="white" opacity="0.85" />
          <ellipse cx="22" cy="28" rx="16" ry="10" fill="white" opacity="0.85" />
          <ellipse cx="58" cy="28" rx="18" ry="10" fill="white" opacity="0.85" />
        </svg>

        {/* Soleil haut-droite */}
        <svg className="absolute top-1 right-3 w-28 h-28" viewBox="0 0 110 110" fill="none">
          <circle cx="75" cy="30" r="20" fill="#F4B942" />
          {[0,45,90,135,180,225,270,315].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 75 + 24 * Math.cos(rad);
            const y1 = 30 + 24 * Math.sin(rad);
            const x2 = 75 + 32 * Math.cos(rad);
            const y2 = 30 + 32 * Math.sin(rad);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F4B942" strokeWidth="3.5" strokeLinecap="round" />;
          })}
          {/* Nuage sous le soleil */}
          <ellipse cx="55" cy="68" rx="22" ry="12" fill="white" opacity="0.9" />
          <ellipse cx="38" cy="72" rx="14" ry="9" fill="white" opacity="0.9" />
          <ellipse cx="72" cy="72" rx="16" ry="9" fill="white" opacity="0.9" />
        </svg>

        {/* Blob orange bas-droite */}
        <div
          className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full"
          style={{ background: "#E8855B", opacity: 0.45 }}
        />

        {/* Texte */}
        <div className="relative z-10 mt-2">
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "#2D2D2D" }}>
            Bonjour {prenom ? prenom.toUpperCase() : ""} !
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#7A6B5A" }}>
            {now.toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* ===== CONTENU ===== */}
      <div className="px-4 -mt-10 space-y-5 pb-28">

        {/* Notification banner */}
        {!notifEnabled && getNotificationPermission() !== "denied" && (
          <div
            className="rounded-2xl p-4 flex items-center justify-between shadow-sm"
            style={{ background: "#5BB8C4" }}
          >
            <div>
              <p className="text-sm font-bold text-white">Rappel quotidien</p>
              <p className="text-xs mt-0.5" style={{ color: "#D4F2F5" }}>
                Saisie des heures chaque soir à 19h
              </p>
            </div>
            <button
              onClick={handleEnableNotif}
              className="px-3 py-1.5 rounded-xl text-xs font-bold shadow"
              style={{ background: "white", color: "#5BB8C4" }}
            >
              Activer
            </button>
          </div>
        )}

        {/* ===== Actions rapides ===== */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowPopup(true)}
            className="rounded-2xl p-4 text-left relative overflow-hidden shadow-md"
            style={{ background: "#2D3442", minHeight: "110px" }}
          >
            <p className="text-sm font-bold text-white">Saisir mes heures</p>
            <p className="text-xs mt-1" style={{ color: "#9CA8BB" }}>Saisie du jour</p>
            <span className="absolute bottom-3 right-3 text-4xl" style={{ opacity: 0.65 }}>🧮</span>
          </button>

          <Link
            href="/enfant/nouveau"
            className="rounded-2xl p-4 text-left relative overflow-hidden shadow-md"
            style={{ background: "#2D3442", minHeight: "110px" }}
          >
            <p className="text-2xl font-black text-white leading-none mb-1">+</p>
            <p className="text-sm font-bold text-white">Ajouter un enfant</p>
            <span className="absolute bottom-3 right-3 text-4xl" style={{ opacity: 0.65 }}>🌱</span>
          </Link>
        </div>

        {/* ===== Mes contrats ===== */}
        <div>
          <h2 className="text-lg font-extrabold mb-3" style={{ color: "#2D2D2D" }}>
            Mes contrats ({enfants.length})
          </h2>

          {enfants.length === 0 ? (
            <div
              className="rounded-2xl p-6 text-center shadow-md relative overflow-hidden"
              style={{ background: "#C97B4A" }}
            >
              {/* Déco */}
              <div
                className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full"
                style={{ background: "#E8855B", opacity: 0.5 }}
              />
              <div className="relative z-10">
                <div className="text-5xl mb-3">🤝</div>
                <p className="text-white font-semibold mb-4">Aucun contrat enregistré</p>
                <Link
                  href="/enfant/nouveau"
                  className="inline-block px-5 py-2 rounded-full text-sm font-bold shadow"
                  style={{ background: "rgba(255,255,255,0.22)", color: "white", border: "1.5px solid rgba(255,255,255,0.45)" }}
                >
                  Ajouter un enfant
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {enfants.map((enfant) => (
                <Link
                  key={enfant.id}
                  href={`/enfant/${enfant.id}`}
                  className="block rounded-2xl p-4 shadow-sm"
                  style={{ background: "white" }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold" style={{ color: "#2D2D2D" }}>{enfant.nom}</h3>
                      <p className="text-sm" style={{ color: "#7A6B5A" }}>
                        Employeur : {enfant.emp_nom}
                      </p>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: "#FFF0E6", color: "#C97B4A" }}
                    >
                      {enfant.type_contrat === "CDI" ? "CDI" : "CDD"}
                    </span>
                  </div>

                  <div className="mt-3 flex gap-4 text-xs" style={{ color: "#7A6B5A" }}>
                    <span>{enfant.heures_normales_semaine}h/sem</span>
                    <span>{enfant.taux_horaire} €/h</span>
                    <span>IE: {enfant.indemnite_entretien_jour} €/j</span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/fiche/${enfant.id}/${anneeCourante}/${moisCourant}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs px-3 py-1.5 rounded-full font-semibold"
                      style={{ background: "#FFF0E6", color: "#C97B4A" }}
                    >
                      Bulletin
                    </Link>
                    <Link
                      href={`/conges/${enfant.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs px-3 py-1.5 rounded-full font-semibold"
                      style={{ background: "#E8F8FA", color: "#5BB8C4" }}
                    >
                      Congés
                    </Link>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ===== Congés payés ===== */}
        {enfants.length > 0 && (
          <div>
            <button
              onClick={() => setCpExpanded(!cpExpanded)}
              className="flex items-center gap-2 w-full text-left mb-3"
            >
              <h2 className="text-lg font-extrabold" style={{ color: "#2D2D2D" }}>
                Congés payés
              </h2>
              <svg
                className="w-4 h-4 transition-transform duration-200"
                style={{
                  color: "#7A6B5A",
                  transform: cpExpanded ? "rotate(180deg)" : "rotate(0deg)",
                }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {cpExpanded && (
              <div
                className="rounded-2xl p-4 shadow-md"
                style={{ background: "#C4956A" }}
              >
                <div className="grid gap-3 md:grid-cols-2">
                  {enfants.map((enfant) => {
                    const md = allMoisData[enfant.id!];
                    const soldeInitial = enfant.cp_solde_initial || 0;
                    const joursConge = md
                      ? Object.values(md.jours).filter(
                          (j) => j.commentaire === "CPC" || j.commentaire === "CPI"
                        ).length
                      : 0;
                    const cpAcquis = md ? md.cp_n_jours_enfant || 0 : 0;
                    const cpPris = joursConge;
                    const solde = soldeInitial + cpAcquis - cpPris;
                    const totalDispo = soldeInitial + cpAcquis;
                    const pctUsed =
                      totalDispo > 0 ? Math.min((cpPris / totalDispo) * 100, 100) : 0;

                    return (
                      <div
                        key={enfant.id}
                        className="rounded-xl p-3"
                        style={{ background: "rgba(255,255,255,0.22)" }}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-bold text-white text-sm">{enfant.nom}</h3>
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(255,255,255,0.28)", color: "white" }}
                          >
                            {solde} j
                          </span>
                        </div>

                        <div className="space-y-1 text-xs" style={{ color: "#F5E0CC" }}>
                          <div className="flex justify-between">
                            <span>Solde initial</span>
                            <span className="font-semibold text-white">{soldeInitial} j</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Acquis ce mois</span>
                            <span className="font-semibold" style={{ color: "#BBFFD8" }}>
                              +{cpAcquis} j
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pris ce mois</span>
                            <span className="font-semibold" style={{ color: "#FFD5D5" }}>
                              -{cpPris} j
                            </span>
                          </div>
                        </div>

                        <div className="mt-2.5">
                          <div
                            className="w-full h-1.5 rounded-full"
                            style={{ background: "rgba(255,255,255,0.2)" }}
                          >
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pctUsed}%`,
                                background: "rgba(255,255,255,0.65)",
                              }}
                            />
                          </div>
                        </div>

                        <Link
                          href={`/conges/${enfant.id}`}
                          className="inline-block mt-2 text-xs text-white underline underline-offset-2"
                        >
                          Voir détail →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
            planning_type: e.planning_type || {
              lundi: 0,
              mardi: 0,
              mercredi: 0,
              jeudi: 0,
              vendredi: 0,
              samedi: 0,
            },
            indemnite_entretien_jour: e.indemnite_entretien_jour,
            indemnite_repas: e.indemnite_repas,
            indemnite_km: e.indemnite_km,
          }))}
          enfantActifId={selectedEnfant}
          annee={now.getFullYear()}
          mois={now.getMonth()}
          jour={now.getDate()}
          joursData={moisData.jours || {}}
          onSave={async (jour, enfantId, data) => {
            if (!user) return;
            const n = new Date();
            await saveJourData(user.uid, enfantId, n.getFullYear(), n.getMonth(), String(jour), data);
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
