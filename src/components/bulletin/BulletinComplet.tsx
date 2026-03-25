"use client";

import React from "react";

function fmt(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n: number): string {
  return (n * 100).toFixed(2) + "%";
}

function fmtE(n: number): string {
  if (n === 0) return "- €";
  return fmt(n) + " €";
}

interface BulletinCompletProps {
  employeur: { nom: string; adresse: string; complement: string; cp_ville: string; num: string };
  salarie: { nom: string; adresse: string; complement: string; cp_ville: string; num_ss: string; num_pajemploi: string; date_embauche: string; qualification: string };
  enfant_nom: string;
  type_contrat: string;
  mois_label: string;
  annee: number;
  semaines_prog: number;
  heures_norm_sem: number;
  heures_sup_sem: number;
  heures_mensualisees: number;
  heures_sup_mensualisees: number;
  remuneration: { j15: number; j16: number; j17: number; j18: number; j19: number; j20: number; j21: number; j22: number; j23: number; j24: number; j25: number; salaire_brut: number };
  taux_horaire: number;
  majoration_sup_mens: number;
  majoration_comp: number;
  majoration_sup: number;
  heures_comp_base: number;
  heures_sup_base: number;
  absence_enfant_heures: number;
  absence_salarie_heures: number;
  taux_deduction_enfant: number;
  taux_deduction_salarie: number;
  // Méthode absence pour affichage
  absence_methode?: "heures" | "jours";
  absence_salaire_mensualise?: number;
  absence_unites_potentiel?: number;
  prime_precarite_base: number;
  jours: Record<string, { heures: number; heures_comp: number; heures_sup: number; heures_contrac: number; commentaire: string }>;
  nbJoursMois: number;
  cotisations: { lignes: Array<{ label: string; base: number; taux_salarial?: number; montant_salarial?: number; taux_patronal?: number; montant_patronal?: number; is_reduction?: boolean }>; total_salarial: number; total_patronal: number };
  total_heures: number;
  total_heures_comp: number;
  total_heures_sup: number;
  total_heures_contrac: number;
  salaire_net_social: number;
  indemnites: { ie_base: number; ie_nombre: number; g52: number; ie_comp_base: number; ie_comp_nombre: number; g53: number; repas_base: number; repas_nombre: number; g54: number; repas_parents_base: number; repas_parents_nombre: number; g55: number; km_base: number; km_nombre: number; g56: number; g57: number; g58: number; total_indemnites: number };
  jours_8h_plus: number;
  cumul_heures_moins_8h: number;
  jours_pajemploi: number;
  net_imposable: number;
  taux_pas: number;
  montant_pas: number;
  net_a_payer: number;
  date_paiement: string;
  banque: string;
  num_cheque_virement: string;
  total_ie_in_ik: number;
  cumul_net_imposable: number;
  cumul_ie_in_ik: number;
  conges_n: { periode: string; mois_trav: number; sem_trav: number; jours_enfant: number; jours_acquis: number; jours_pris: number; solde: number };
  conges_n1: { periode: string; mois_trav: number; sem_trav: number; jours_enfant: number; jours_acquis: number; jours_pris: number; solde: number };
  commentaire_mois: string;
}

export function BulletinComplet(p: BulletinCompletProps) {
  // Styles
  const S = { backgroundColor: "#FFE4E1" }; // rose saisie
  const C = { backgroundColor: "#E9ABEB" }; // violet calcul
  const VL = { backgroundColor: "#CC99FF" }; // violet light (heures)
  const LAV = { backgroundColor: "#E7E2F8" }; // lavande (h.compl)
  const VF = { backgroundColor: "#CFC6F2" }; // violet foncé (h.contrac)
  const r: React.CSSProperties = { textAlign: "right" };
  const c: React.CSSProperties = { textAlign: "center" };
  const b: React.CSSProperties = { fontWeight: "bold" };
  const sm: React.CSSProperties = { fontSize: "7px" };
  const neg: React.CSSProperties = { color: "red" };

  // Build 31 jour rows for the right-side calendar
  function jourCell(d: number) {
    const j = p.jours[String(d)];
    const inMonth = d <= p.nbJoursMois;
    return (
      <React.Fragment key={`j${d}`}>
        <td style={{ ...c, ...b, width: "22px" }}>{inMonth ? d : ""}</td>
        <td style={{ ...VL, ...c, fontSize: "8px", width: "38px" }}>
          {inMonth && j ? (j.heures > 0 ? fmt(j.heures) : j.commentaire || "") : ""}
        </td>
        <td style={{ ...LAV, ...c, fontSize: "8px", width: "32px" }}>
          {inMonth && j && j.heures_comp > 0 ? fmt(j.heures_comp) : ""}
        </td>
        <td style={{ ...C, ...c, fontSize: "8px", width: "32px" }}>
          {inMonth && j && j.heures_sup > 0 ? fmt(j.heures_sup) : ""}
        </td>
        <td style={{ ...VF, ...c, fontSize: "8px", width: "38px" }}>
          {inMonth && j && j.heures_contrac > 0 ? fmt(j.heures_contrac) : ""}
        </td>
      </React.Fragment>
    );
  }

  // Rémunération rows (11 lines = jours 1-11, + salaire brut = jour 12)
  const remuLines = [
    { lbl: "Salaire brut de base", h: p.heures_mensualisees, t: p.taux_horaire, m: p.remuneration.j15, hFmt: "hrs" },
    { lbl: "H.sup au-delà 45h, mensualisées", h: p.heures_sup_mensualisees, t: p.taux_horaire, m: p.remuneration.j16, hFmt: "hrs" },
    { lbl2: fmtPct(p.majoration_sup_mens), lbl: "Majoration H.sup mensualisées", h: p.heures_sup_mensualisees, t: p.taux_horaire * p.majoration_sup_mens, m: p.remuneration.j17, hFmt: "hrs" },
    { lbl2: "majoration:", lbl: "Heures complémentaires", h: p.heures_comp_base || undefined, t: p.taux_horaire * (1 + p.majoration_comp), m: p.remuneration.j18 },
    { lbl2: "majoration:", lbl: "Heures supplémentaires", h: p.heures_sup_base || undefined, t: p.taux_horaire * (1 + p.majoration_sup), m: p.remuneration.j19 },
    { lbl: "Absence de l'enfant", h: p.absence_enfant_heures || undefined, m: p.remuneration.j20, isNeg: true, hFmt: "hrs" },
    { lbl: "Absence du salarié", h: p.absence_salarie_heures || undefined, t: p.absence_salarie_heures > 0 ? p.taux_deduction_salarie : undefined, m: p.remuneration.j21, isNeg: true, hFmt: "hrs" },
    { lbl: "Indemnité de congés payés pendant le contrat", m: p.remuneration.j22 },
    { lbl: "Régularisation", m: p.remuneration.j23 },
    { lbl: "Indemnité compensatrice de congés payés - ICCP", m: p.remuneration.j24 },
    { lbl: "Prime de précarité si CDD", t2: "10%", m: p.remuneration.j25 },
  ];

  return (
    <div className="bulletin" style={{ maxWidth: "210mm", margin: "0 auto", padding: "8px", background: "#fff" }}>
      {/* ========== EN-TÊTE ========== */}
      <table>
        <tbody>
          <tr>
            <td colSpan={4} rowSpan={2} style={{ width: "20%", verticalAlign: "top", padding: "4px", border: "none" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-proassmat.png" alt="PROASSMAT & ASSFAM" style={{ width: "100%", maxWidth: "130px" }} />
            </td>
            <td colSpan={6} style={{ ...c, ...b, fontSize: "11px", border: "none" }}>Bulletin de paie du mois de</td>
            <td colSpan={2} style={{ ...S, ...c, ...b, fontSize: "12px" }}>{p.mois_label}</td>
            <td colSpan={2} style={{ ...c, ...b, fontSize: "12px" }}>{p.annee}</td>
          </tr>
          <tr><td colSpan={10} style={{ border: "none" }}></td></tr>
        </tbody>
      </table>

      {/* Employeur / Salarié */}
      <table style={{ marginTop: -1 }}>
        <tbody>
          <tr style={{ backgroundColor: "#e8eaf6" }}>
            <td colSpan={5} style={b}>EMPLOYEUR</td>
            <td colSpan={9} style={b}>SALARIÉ</td>
          </tr>
          {[
            ["Nom prénom", p.employeur.nom, "Nom prénom", p.salarie.nom],
            ["Adresse", p.employeur.adresse, "Adresse", p.salarie.adresse],
            ["complément", p.employeur.complement, "complément", p.salarie.complement],
            ["CP Ville", p.employeur.cp_ville, "CP Ville", p.salarie.cp_ville],
            ["N°employeur", p.employeur.num, "N° sécu sociale", p.salarie.num_ss],
          ].map(([l1, v1, l2, v2], i) => (
            <tr key={i}>
              <td colSpan={2} style={sm}>{l1}</td>
              <td colSpan={3} style={{ ...S, ...b }}>{v1}</td>
              <td colSpan={2} style={sm}>{l2}</td>
              <td colSpan={7} style={{ ...S, ...b }}>{v2}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={2} style={sm}>Nom, prénom de l&apos;enfant</td>
            <td colSpan={3} style={{ ...S, ...b }}>{p.enfant_nom}</td>
            <td colSpan={2} style={sm}>N° salarié Pajemploi</td>
            <td colSpan={7} style={{ ...S, ...b }}>{p.salarie.num_pajemploi}</td>
          </tr>
          <tr>
            <td colSpan={5} rowSpan={2} style={{ ...sm, fontSize: "6.5px" }}>
              Convention Collective des assistants maternels du particulier employeur - code NAF 8891.A<br />
              Services des URSSAF - Centre national Pajemploi
            </td>
            <td colSpan={2} style={sm}>Date embauche</td>
            <td colSpan={3} style={S}>{p.salarie.date_embauche}</td>
            <td style={sm}>type contrat</td>
            <td colSpan={3} style={{ ...S, ...b }}>{p.type_contrat}</td>
          </tr>
          <tr>
            <td colSpan={2} style={sm}>Qualification</td>
            <td colSpan={7} style={S}>{p.salarie.qualification}</td>
          </tr>
        </tbody>
      </table>

      {/* ========== MENSUALISATION ========== */}
      <table style={{ marginTop: 2 }}>
        <tbody>
          <tr style={{ backgroundColor: "#f3e5f5" }}>
            <td colSpan={2} style={sm}>Nbre semaines programmées :</td>
            <td style={{ ...S, ...c }}>{p.semaines_prog} s</td>
            <td colSpan={2} style={sm}>Heures normales par semaine</td>
            <td style={{ ...S, ...c }}>{p.heures_norm_sem.toFixed(4)} hrs</td>
            <td colSpan={2} style={sm}>Mensualisation (max 45h/semaine)</td>
            <td colSpan={6} style={{ ...C, ...r, ...b }}>{fmt(p.heures_mensualisees)} hrs</td>
          </tr>
          <tr style={{ backgroundColor: "#f3e5f5" }}>
            <td colSpan={3}></td>
            <td colSpan={2} style={sm}>Heures supplémentaires par semaine</td>
            <td style={{ ...S, ...c }}>{p.heures_sup_sem.toFixed(4)} hrs</td>
            <td colSpan={2} style={sm}>Heures supplémentaires mensualisées</td>
            <td colSpan={6} style={{ ...C, ...r, ...b }}>{fmt(p.heures_sup_mensualisees)} hrs</td>
          </tr>
        </tbody>
      </table>

      {/* ========== RÉMUNÉRATION (gauche) + JOURS 1-31 (droite) ========== */}
      {/* Architecture: flexbox with 2 tables side by side */}
      <div style={{ display: "flex", marginTop: 2, gap: 0 }}>
        {/* === GAUCHE: Rémunération + Cotisations === */}
        <div style={{ flex: "1 1 auto", minWidth: 0 }}>
          {/* Rémunération header */}
          <table>
            <thead>
              <tr style={{ backgroundColor: "#e8eaf6" }}>
                <th colSpan={3} style={{ textAlign: "left" }}>RÉMUNÉRATION</th>
                <th style={{ ...c, width: "60px" }}>Base</th>
                <th style={{ ...c, width: "50px" }}>Taux</th>
                <th style={{ ...c, width: "70px" }}>Montant</th>
              </tr>
            </thead>
            <tbody>
              {remuLines.map((line, idx) => (
                <tr key={idx}>
                  {line.lbl2 ? (
                    <>
                      <td style={sm}>{line.lbl2}</td>
                      <td colSpan={2} style={sm}>{line.lbl}</td>
                    </>
                  ) : (
                    <td colSpan={3} style={sm}>{line.lbl}</td>
                  )}
                  <td style={{ ...c, fontSize: "8px" }}>
                    {line.h !== undefined && line.h > 0 ? `${fmt(line.h)}${line.hFmt ? " " + line.hFmt : ""}` : ""}
                  </td>
                  <td style={{ ...c, fontSize: "8px" }}>
                    {line.t !== undefined && line.t > 0 ? fmtE(line.t) : line.t2 || ""}
                  </td>
                  <td style={{
                    ...c, fontSize: "8px",
                    ...(line.isNeg && line.m !== undefined && line.m < 0 ? neg : {}),
                  }}>
                    {line.m !== undefined ? fmtE(line.m) : ""}
                  </td>
                </tr>
              ))}
              {/* Salaire brut */}
              <tr>
                <td colSpan={5} style={{ ...b, ...r }}>Salaire brut</td>
                <td style={{ ...C, ...b, ...c }}>{fmtE(p.remuneration.salaire_brut)}</td>
              </tr>
            </tbody>
          </table>

          {/* Cotisations */}
          <table style={{ marginTop: -1 }}>
            <thead>
              <tr style={{ backgroundColor: "#e8eaf6" }}>
                <th colSpan={2} style={{ textAlign: "left" }}>COTISATIONS SOCIALES</th>
                <th style={c}>Base</th>
                <th colSpan={2} style={c}>SALARIALES</th>
                <th colSpan={2} style={c}>PATRONALES</th>
              </tr>
              <tr style={{ fontSize: "7px" }}>
                <td colSpan={2}>Base 100% du salaire brut</td>
                <td style={c}>Base</td>
                <td style={c}>Taux</td>
                <td style={c}>Montant</td>
                <td style={c}>Taux</td>
                <td style={c}>Montant</td>
              </tr>
            </thead>
            <tbody>
              {p.cotisations.lignes.map((l, idx) => (
                <tr key={idx}>
                  <td colSpan={2} style={{ ...sm, maxWidth: "140px" }}>{l.label}</td>
                  <td style={{ ...c, fontSize: "7px" }}>{fmtE(l.base)}</td>
                  <td style={{ ...c, fontSize: "7px" }}>{l.taux_salarial ? fmtPct(l.taux_salarial) : ""}</td>
                  <td style={{ ...c, fontSize: "7px", ...(l.is_reduction ? neg : {}) }}>
                    {l.montant_salarial !== undefined ? fmt(l.montant_salarial) : ""}
                  </td>
                  <td style={{ ...c, fontSize: "7px" }}>{l.taux_patronal ? fmtPct(l.taux_patronal) : ""}</td>
                  <td style={{ ...c, fontSize: "7px" }}>{l.montant_patronal !== undefined ? fmt(l.montant_patronal) : ""}</td>
                </tr>
              ))}
              <tr style={b}>
                <td colSpan={2}>Total cotisations</td>
                <td></td>
                <td></td>
                <td style={c}>{fmtE(p.cotisations.total_salarial)}</td>
                <td></td>
                <td style={c}>{fmtE(p.cotisations.total_patronal)}</td>
              </tr>
            </tbody>
          </table>

          {/* Résumé heures + Net social */}
          <table style={{ marginTop: -1 }}>
            <tbody>
              <tr>
                <td colSpan={4} style={{ ...C, ...b, fontSize: "10px" }}>Salaire net social</td>
                <td colSpan={2} style={{ ...C, ...b, ...r, fontSize: "10px" }}>{fmtE(p.salaire_net_social)}</td>
              </tr>
            </tbody>
          </table>

          {/* Indemnités */}
          <table style={{ marginTop: -1 }}>
            <thead>
              <tr style={{ backgroundColor: "#e8eaf6" }}>
                <th colSpan={2} style={{ textAlign: "left" }}>INDEMNITÉS</th>
                <th style={c}>Base</th>
                <th style={c}>Nbre</th>
                <th colSpan={2} style={c}>Montant</th>
              </tr>
            </thead>
            <tbody>
              {[
                { lbl: "IE - Indemnité entretien négociée au contrat (par jour)", b: p.indemnites.ie_base, n: p.indemnites.ie_nombre, m: p.indemnites.g52 },
                { lbl: "Indemnité entretien des hrs cpl et sup non mensualisées", b: p.indemnites.ie_comp_base, n: p.indemnites.ie_comp_nombre, m: p.indemnites.g53 },
                { lbl: "IN - Indemnité de repas", b: p.indemnites.repas_base, n: p.indemnites.repas_nombre, m: p.indemnites.g54 },
                { lbl: "IN - Indemnité de repas fourni par les parents", b: p.indemnites.repas_parents_base, n: p.indemnites.repas_parents_nombre, m: p.indemnites.g55 },
                { lbl: "IK - Indemnité kilométrique", b: p.indemnites.km_base, n: p.indemnites.km_nombre, m: p.indemnites.g56 },
                { lbl: "Indemnité de rupture", m: p.indemnites.g57 },
                { lbl: "Autres (non imposable)", m: p.indemnites.g58 },
              ].map((line, idx) => (
                <tr key={idx}>
                  <td colSpan={2} style={sm}>{line.lbl}</td>
                  <td style={{ ...c, fontSize: "7px" }}>{line.b && line.b > 0 ? fmt(line.b) : ""}</td>
                  <td style={{ ...c, fontSize: "7px" }}>{line.n && line.n > 0 ? line.n : ""}</td>
                  <td colSpan={2} style={{ ...c, fontSize: "7px" }}>{line.m && line.m > 0 ? fmtE(line.m) : ""}</td>
                </tr>
              ))}
              <tr style={b}>
                <td colSpan={2}>Total des indemnités à régler :</td>
                <td></td>
                <td></td>
                <td colSpan={2} style={c}>{fmtE(p.indemnites.total_indemnites)}</td>
              </tr>
            </tbody>
          </table>

          {/* Imposition */}
          <table style={{ marginTop: -1 }}>
            <tbody>
              <tr>
                <td colSpan={2} style={sm}>Imposition à la source</td>
                <td colSpan={2}>Base : {fmtE(p.net_imposable)}</td>
                <td colSpan={2}>Montant : {fmtE(p.montant_pas)}</td>
              </tr>
              <tr>
                <td colSpan={2}></td>
                <td colSpan={2}>Taux : {fmtPct(p.taux_pas)}</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>

          {/* Net à payer */}
          <table style={{ marginTop: -1 }}>
            <tbody>
              <tr>
                <td colSpan={6} style={{ ...C, ...b, ...c, fontSize: "14px", padding: "6px" }}>
                  MONTANT NET À PAYER&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{fmtE(p.net_a_payer)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Mensuel / Cumul annuel */}
          <table style={{ marginTop: 2 }}>
            <tbody>
              <tr style={{ backgroundColor: "#f3e5f5" }}>
                <td style={b}>MENSUEL</td>
                <td style={sm}>Net imposable</td>
                <td style={{ ...c, ...b }}>{fmtE(p.net_imposable)}</td>
                <td style={sm}>IE+IN+IK</td>
                <td style={c}>{fmtE(p.total_ie_in_ik)}</td>
                <td style={b}>CUMUL ANNUEL</td>
                <td style={sm}>Net imposable</td>
                <td style={{ ...c, ...b }}>{fmtE(p.cumul_net_imposable)}</td>
                <td style={sm}>IE+IN+IK</td>
                <td style={c}>{fmtE(p.cumul_ie_in_ik)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* === DROITE: Jours 1-31 (tableau continu) === */}
        <div style={{ flexShrink: 0 }}>
          <table>
            <thead>
              <tr style={{ backgroundColor: "#e8eaf6" }}>
                <th style={{ ...c, width: "22px" }}>Jour</th>
                <th style={{ ...VL, ...c, width: "38px" }}>Heures</th>
                <th style={{ ...LAV, ...c, width: "32px" }}>H.compl</th>
                <th style={{ ...C, ...c, width: "32px" }}>H.sup</th>
                <th style={{ ...VF, ...c, width: "38px" }}>H.contrac</th>
              </tr>
            </thead>
            <tbody>
              {/* 31 jours continus */}
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <tr key={d}>{jourCell(d)}</tr>
              ))}
              {/* Total */}
              <tr style={b}>
                <td style={c}>Total</td>
                <td style={{ ...VL, ...c }}>{fmt(p.total_heures)}</td>
                <td style={{ ...LAV, ...c }}>{fmt(p.total_heures_comp)}</td>
                <td style={{ ...C, ...c }}>{fmt(p.total_heures_sup)}</td>
                <td style={{ ...VF, ...c }}>{fmt(p.total_heures_contrac)}</td>
              </tr>
            </tbody>
          </table>

          {/* Pajemploi */}
          <table style={{ marginTop: -1 }}>
            <tbody>
              <tr>
                <td colSpan={3} style={sm}>JOURS & HEURES D&apos;ACCUEIL (IRPP)</td>
                <td colSpan={2}></td>
              </tr>
              <tr>
                <td colSpan={3} style={sm}>Nbre jrs ≥ 8h d&apos;activité</td>
                <td colSpan={2} style={{ ...S, ...c, ...b }}>{p.jours_8h_plus} jrs</td>
              </tr>
              <tr>
                <td colSpan={3} style={sm}>Cumul hrs jours &lt; 8h</td>
                <td colSpan={2} style={{ ...S, ...c }}>{fmt(p.cumul_heures_moins_8h)} hrs</td>
              </tr>
              <tr>
                <td colSpan={5} style={{ ...b, fontSize: "8px" }}>POUR LA DÉCLARATION PAJEMPLOI</td>
              </tr>
              <tr>
                <td colSpan={3} style={sm}>Nbre jrs activité à déclarer</td>
                <td colSpan={2} style={{ ...S, ...c, ...b }}>{p.jours_pajemploi} jrs</td>
              </tr>
              <tr>
                <td colSpan={5} style={{ fontSize: "8px" }}>Commentaires du mois</td>
              </tr>
              <tr>
                <td colSpan={5} style={{ fontSize: "7px", minHeight: "20px" }}>{p.commentaire_mois}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== CONGÉS PAYÉS ========== */}
      <table style={{ marginTop: 4 }}>
        <thead>
          <tr style={{ backgroundColor: "#e8eaf6" }}>
            <th colSpan={12} style={{ textAlign: "left" }}>CONGÉS PAYÉS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={2} style={{ ...sm, ...b }}>{p.conges_n.periode} (N)</td>
            <td style={sm}>Nb mois trav.</td>
            <td style={S}>{p.conges_n.mois_trav}</td>
            <td style={sm}>Jrs enfant</td>
            <td style={S}>{p.conges_n.jours_enfant}</td>
            <td style={sm}>Total jrs acquis</td>
            <td style={{ ...C, ...b }}>{p.conges_n.jours_acquis} jrs</td>
            <td style={sm}>Nb jrs pris</td>
            <td style={S}>{p.conges_n.jours_pris}</td>
            <td style={b}>SOLDE</td>
            <td style={{ ...C, ...b }}>{p.conges_n.solde} jrs</td>
          </tr>
          <tr>
            <td colSpan={2}></td>
            <td style={sm}>Nb sem. trav.</td>
            <td style={S}>{p.conges_n.sem_trav}</td>
            <td style={sm}>- 15 ans</td>
            <td colSpan={7}></td>
          </tr>
          <tr>
            <td colSpan={2} style={{ ...sm, ...b }}>{p.conges_n1.periode} (N-1)</td>
            <td style={sm}>Nb mois trav.</td>
            <td style={S}>{p.conges_n1.mois_trav}</td>
            <td style={sm}>Jrs enfant</td>
            <td style={S}>{p.conges_n1.jours_enfant}</td>
            <td style={sm}>Total jrs acquis</td>
            <td style={{ ...C, ...b }}>{p.conges_n1.jours_acquis} jrs</td>
            <td style={sm}>Nb jrs pris</td>
            <td style={S}>{p.conges_n1.jours_pris}</td>
            <td style={b}>SOLDE</td>
            <td style={{ ...C, ...b }}>{p.conges_n1.solde} jrs</td>
          </tr>
          <tr>
            <td colSpan={2}></td>
            <td style={sm}>Nb sem. trav.</td>
            <td style={S}>{p.conges_n1.sem_trav}</td>
            <td style={sm}>- 15 ans</td>
            <td colSpan={7}></td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ marginTop: 6, textAlign: "center", fontSize: "7px" }}>
        <p style={b}>
          Dans votre intérêt et pour vous aider à faire valoir vos droits,
          conservez votre bulletin de salaire sans limitation de durée
        </p>
        <p style={{ color: "#666", marginTop: 2 }}>
          © {p.annee} - Reproduction interdite - Tous droits réservés à UNSA PROASSMAT&ASSFAM
        </p>
      </div>
    </div>
  );
}
