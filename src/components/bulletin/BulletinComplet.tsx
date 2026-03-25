"use client";

import React from "react";

function fmt(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n: number): string {
  return (n * 100).toFixed(2) + "%";
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
  const cellS = { backgroundColor: "#FFE4E1" }; // rose saisie
  const cellC = { backgroundColor: "#E9ABEB" }; // violet calcul
  const cellVL = { backgroundColor: "#CC99FF" }; // violet light
  const cellLav = { backgroundColor: "#E7E2F8" }; // lavande
  const cellVF = { backgroundColor: "#CFC6F2" }; // violet foncé
  const neg = { color: "red" };
  const bold: React.CSSProperties = { fontWeight: "bold" };
  const right: React.CSSProperties = { textAlign: "right" };
  const center: React.CSSProperties = { textAlign: "center" };
  const small: React.CSSProperties = { fontSize: "7px" };

  // Generate calendar rows (jours 1-31)
  const calRows: React.ReactNode[] = [];
  for (let d = 1; d <= 31; d++) {
    const j = p.jours[String(d)];
    const inMonth = d <= p.nbJoursMois;
    calRows.push(
      <React.Fragment key={d}>
        <td style={{ ...center, ...bold }}>{inMonth ? d : ""}</td>
        <td style={{ ...cellVL, ...right, fontSize: "8px" }}>
          {inMonth && j ? (j.heures > 0 ? fmt(j.heures) : j.commentaire || "") : ""}
        </td>
        <td style={{ ...cellLav, ...right, fontSize: "8px" }}>
          {inMonth && j && j.heures_comp > 0 ? fmt(j.heures_comp) : ""}
        </td>
        <td style={{ ...cellC, ...right, fontSize: "8px" }}>
          {inMonth && j && j.heures_sup > 0 ? fmt(j.heures_sup) : ""}
        </td>
        <td style={{ ...cellVF, ...right, fontSize: "8px" }}>
          {inMonth && j && j.heures_contrac > 0 ? fmt(j.heures_contrac) : ""}
        </td>
      </React.Fragment>
    );
  }

  // Rémunération rows (lines 15-25) — we need exactly 31 rows for the calendar side
  // Line 15-25 = 11 remu rows, then lines 26-45 = 20 more rows for cotisations
  const remuRows = [
    { label: "Salaire brut de base", h: p.heures_mensualisees, t: p.taux_horaire, m: p.remuneration.j15, f: undefined },
    { label: "H.sup au-delà 45h, mensualisées", h: p.heures_sup_mensualisees, t: p.taux_horaire, m: p.remuneration.j16, f: undefined },
    { label: "Majoration H.sup mensualisées", h: p.heures_sup_mensualisees, t: p.taux_horaire * p.majoration_sup_mens, m: p.remuneration.j17, f: p.majoration_sup_mens },
    { label: "Heures complémentaires", h: p.heures_comp_base, t: p.taux_horaire * (1 + p.majoration_comp), m: p.remuneration.j18, f: p.majoration_comp, fLabel: "majoration:" },
    { label: "Heures supplémentaires", h: p.heures_sup_base, t: p.taux_horaire * (1 + p.majoration_sup), m: p.remuneration.j19, f: p.majoration_sup, fLabel: "majoration:" },
    { label: "Absence de l'enfant", h: p.absence_enfant_heures, t: p.taux_deduction_enfant, m: p.remuneration.j20, isNeg: true },
    { label: "Absence du salarié", h: p.absence_salarie_heures, t: p.taux_deduction_salarie, m: p.remuneration.j21, isNeg: true },
    { label: "Indemnité de congés payés pendant le contrat", h: undefined, t: undefined, m: p.remuneration.j22 },
    { label: "Régularisation", h: undefined, t: undefined, m: p.remuneration.j23 },
    { label: "Indemnité compensatrice de congés payés - ICCP", h: undefined, t: undefined, m: p.remuneration.j24 },
    { label: "Prime de précarité si CDD", h: p.prime_precarite_base, t: 0.10, m: p.remuneration.j25 },
  ];

  return (
    <div className="bulletin" style={{ maxWidth: "210mm", margin: "0 auto", padding: "8px", background: "#fff" }}>
      {/* ========== EN-TÊTE ========== */}
      <table style={{ marginBottom: 0 }}>
        <tbody>
          <tr>
            <td colSpan={4} rowSpan={2} style={{ width: "25%", verticalAlign: "top", padding: "4px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-proassmat.svg"
                alt="PROASSMAT & ASSFAM"
                style={{ width: "100%", maxWidth: "140px", height: "auto" }}
              />
            </td>
            <td colSpan={7} style={{ ...center, ...bold, fontSize: "11px" }}>
              Bulletin de paie du mois de
            </td>
            <td colSpan={2} style={{ ...cellS, ...center, ...bold, fontSize: "12px" }}>
              {p.mois_label}
            </td>
            <td colSpan={2} style={{ ...center, ...bold, fontSize: "12px" }}>
              {p.annee}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Employeur / Salarié */}
      <table style={{ marginTop: -1 }}>
        <tbody>
          <tr style={{ backgroundColor: "#e8eaf6" }}>
            <td colSpan={5} style={bold}>EMPLOYEUR</td>
            <td colSpan={10} style={bold}>SALARIÉ</td>
          </tr>
          {[
            ["Nom prénom", p.employeur.nom, "Nom prénom", p.salarie.nom],
            ["Adresse", p.employeur.adresse, "Adresse", p.salarie.adresse],
            ["complément", p.employeur.complement, "complément", p.salarie.complement],
            ["CP Ville", p.employeur.cp_ville, "CP Ville", p.salarie.cp_ville],
            ["N°employeur", p.employeur.num, "N° sécu sociale", p.salarie.num_ss],
          ].map(([l1, v1, l2, v2], i) => (
            <tr key={i}>
              <td colSpan={2} style={small}>{l1}</td>
              <td colSpan={3} style={{ ...cellS, ...bold }}>{v1}</td>
              <td colSpan={3} style={small}>{l2}</td>
              <td colSpan={7} style={{ ...cellS, ...bold }}>{v2}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={2} style={small}>Nom, prénom de l&apos;enfant</td>
            <td colSpan={3} style={{ ...cellS, ...bold }}>{p.enfant_nom}</td>
            <td colSpan={3} style={small}>N° salariéPajemploi</td>
            <td colSpan={7} style={{ ...cellS, ...bold }}>{p.salarie.num_pajemploi}</td>
          </tr>
          <tr>
            <td colSpan={5} rowSpan={2} style={{ ...small, fontSize: "6.5px" }}>
              Convention Collective des assistants maternels du particulier employeur - code NAF 8891.A
              <br />Services des URSSAF - Centre national Pajemploi
            </td>
            <td colSpan={3} style={small}>Date embauche</td>
            <td colSpan={3} style={cellS}>{p.salarie.date_embauche}</td>
            <td colSpan={1} style={small}>type contrat</td>
            <td colSpan={3} style={{ ...cellS, ...bold }}>{p.type_contrat}</td>
          </tr>
          <tr>
            <td colSpan={3} style={small}>Qualification</td>
            <td colSpan={7} style={cellS}>{p.salarie.qualification}</td>
          </tr>
        </tbody>
      </table>

      {/* ========== MENSUALISATION ========== */}
      <table style={{ marginTop: 2 }}>
        <tbody>
          <tr style={{ backgroundColor: "#f3e5f5" }}>
            <td colSpan={3} style={small}>Nbre semaines programmées :</td>
            <td style={{ ...cellS, ...center }}>{p.semaines_prog} s</td>
            <td colSpan={3} style={small}>Heures normales par semaine</td>
            <td style={{ ...cellS, ...center }}>{p.heures_norm_sem.toFixed(4)} hrs</td>
            <td colSpan={3} style={small}>Mensualisation (max 45h/semaine)</td>
            <td colSpan={4} style={{ ...cellC, ...right, ...bold }}>{fmt(p.heures_mensualisees)} hrs</td>
          </tr>
          <tr style={{ backgroundColor: "#f3e5f5" }}>
            <td colSpan={4}></td>
            <td colSpan={3} style={small}>Heures supplémentaires par semaine</td>
            <td style={{ ...cellS, ...center }}>{p.heures_sup_sem.toFixed(4)} hrs</td>
            <td colSpan={3} style={small}>Heures supplémentaires mensualisées</td>
            <td colSpan={4} style={{ ...cellC, ...right, ...bold }}>{fmt(p.heures_sup_mensualisees)} hrs</td>
          </tr>
        </tbody>
      </table>

      {/* ========== RÉMUNÉRATION + CALENDRIER ========== */}
      <table style={{ marginTop: 2 }}>
        <thead>
          <tr style={{ backgroundColor: "#e8eaf6" }}>
            <th colSpan={4} style={{ textAlign: "left" }}>RÉMUNÉRATION</th>
            <th style={center}>Base</th>
            <th style={center}>Taux</th>
            <th style={center}>Montant</th>
            {/* Calendar header */}
            <th style={center}>Jour</th>
            <th style={{ ...cellVL, ...center }}>Heures</th>
            <th style={{ ...cellLav, ...center }}>H.compl</th>
            <th style={{ ...cellC, ...center }}>H.sup</th>
            <th style={{ ...cellVF, ...center }}>H.contrac</th>
          </tr>
        </thead>
        <tbody>
          {remuRows.map((row, idx) => (
            <tr key={idx}>
              {row.f !== undefined && (
                <td colSpan={2} style={small}>
                  {row.fLabel || ""} {fmtPct(row.f)}
                </td>
              )}
              {row.f !== undefined ? (
                <td colSpan={2} style={small}>{row.label}</td>
              ) : (
                <td colSpan={4} style={small}>{row.label}</td>
              )}
              <td style={{ ...right, fontSize: "8px" }}>
                {row.h !== undefined ? (row.h > 0 ? fmt(row.h) : "") : ""}
              </td>
              <td style={{ ...right, fontSize: "8px" }}>
                {row.t !== undefined ? (row.t > 0 ? fmt(row.t) : "") : ""}
              </td>
              <td style={{
                ...right,
                fontSize: "8px",
                ...(row.isNeg && row.m < 0 ? neg : {}),
              }}>
                {row.m !== 0 ? fmt(row.m) + " €" : ""}
              </td>
              {/* Calendar cell for this row */}
              {calRows[idx] || <><td></td><td></td><td></td><td></td><td></td></>}
            </tr>
          ))}
          {/* SALAIRE BRUT */}
          <tr>
            <td colSpan={6} style={{ ...bold, textAlign: "right" }}>Salaire brut</td>
            <td style={{ ...cellC, ...bold, ...right }}>{fmt(p.remuneration.salaire_brut)} €</td>
            {calRows[11] || <><td></td><td></td><td></td><td></td><td></td></>}
          </tr>
        </tbody>
      </table>

      {/* ========== COTISATIONS ========== */}
      <table style={{ marginTop: 2 }}>
        <thead>
          <tr style={{ backgroundColor: "#e8eaf6" }}>
            <th colSpan={2} style={{ textAlign: "left" }}>COTISATIONS SOCIALES</th>
            <th style={center}>Base</th>
            <th colSpan={2} style={center}>SALARIALES</th>
            <th colSpan={2} style={center}>PATRONALES</th>
            {/* Calendar continues */}
            <th style={center}>Jour</th>
            <th style={{ ...cellVL, ...center }}>Heures</th>
            <th style={{ ...cellLav, ...center }}>H.compl</th>
            <th style={{ ...cellC, ...center }}>H.sup</th>
            <th style={{ ...cellVF, ...center }}>H.contrac</th>
          </tr>
          <tr style={{ fontSize: "7px" }}>
            <td colSpan={2}>Base 100% du salaire brut</td>
            <td style={center}>Base</td>
            <td style={center}>Taux</td>
            <td style={center}>Montant</td>
            <td style={center}>Taux</td>
            <td style={center}>Montant</td>
            <td colSpan={5}></td>
          </tr>
        </thead>
        <tbody>
          {p.cotisations.lignes.map((ligne, idx) => {
            const calIdx = 12 + idx; // Continue calendar from row 12
            return (
              <tr key={idx}>
                <td colSpan={2} style={{ ...small, maxWidth: "120px" }}>{ligne.label}</td>
                <td style={{ ...right, fontSize: "7px" }}>{fmt(ligne.base)} €</td>
                <td style={{ ...right, fontSize: "7px" }}>
                  {ligne.taux_salarial ? fmtPct(ligne.taux_salarial) : ""}
                </td>
                <td style={{
                  ...right,
                  fontSize: "7px",
                  ...(ligne.is_reduction ? neg : {}),
                }}>
                  {ligne.montant_salarial !== undefined ? fmt(ligne.montant_salarial) : ""}
                </td>
                <td style={{ ...right, fontSize: "7px" }}>
                  {ligne.taux_patronal ? fmtPct(ligne.taux_patronal) : ""}
                </td>
                <td style={{ ...right, fontSize: "7px" }}>
                  {ligne.montant_patronal !== undefined ? fmt(ligne.montant_patronal) : ""}
                </td>
                {calRows[calIdx] || <><td></td><td></td><td></td><td></td><td></td></>}
              </tr>
            );
          })}
          {/* Total cotisations */}
          <tr style={{ ...bold }}>
            <td colSpan={2}>Total cotisations</td>
            <td></td>
            <td></td>
            <td style={right}>{fmt(p.cotisations.total_salarial)}</td>
            <td></td>
            <td style={right}>{fmt(p.cotisations.total_patronal)}</td>
            {/* Remaining calendar rows */}
            {calRows[24] || <><td></td><td></td><td></td><td></td><td></td></>}
          </tr>
        </tbody>
      </table>

      {/* ========== RÉSUMÉ HEURES + NET SOCIAL ========== */}
      <table style={{ marginTop: 2 }}>
        <tbody>
          <tr>
            <td colSpan={7}></td>
            <td colSpan={2} style={small}>Total heures</td>
            <td style={{ ...cellVL, ...right, ...bold }}>{fmt(p.total_heures)}</td>
            <td colSpan={2}></td>
          </tr>
          <tr>
            <td colSpan={7}></td>
            <td colSpan={2} style={small}>Heures complémentaires du mois</td>
            <td style={{ ...cellLav, ...right }}>{fmt(p.total_heures_comp)}</td>
            <td colSpan={2}></td>
          </tr>
          <tr>
            <td colSpan={3} style={{ ...cellC, ...bold, fontSize: "10px" }}>
              Salaire net social
            </td>
            <td colSpan={4} style={{ ...cellC, ...bold, ...right, fontSize: "10px" }}>
              {fmt(p.salaire_net_social)} €
            </td>
            <td colSpan={2} style={small}>Heures supplémentaires du mois</td>
            <td style={{ ...cellC, ...right }}>{fmt(p.total_heures_sup)}</td>
            <td colSpan={2}></td>
          </tr>
          <tr>
            <td colSpan={7}></td>
            <td colSpan={2} style={small}>Heures contractuelles rémunérées mois</td>
            <td colSpan={3} style={{ ...cellVF, ...right, ...bold }}>{fmt(p.total_heures_contrac)}</td>
          </tr>
        </tbody>
      </table>

      {/* ========== INDEMNITÉS + PAJEMPLOI ========== */}
      <table style={{ marginTop: 2 }}>
        <thead>
          <tr style={{ backgroundColor: "#e8eaf6" }}>
            <th colSpan={4} style={{ textAlign: "left" }}>INDEMNITÉS</th>
            <th style={center}>Base</th>
            <th style={center}>Nbre</th>
            <th style={center}>Montant</th>
            <th colSpan={5} style={center}>JOURS & HEURES D&apos;ACCUEIL (IRPP)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={4} style={small}>IE - Indemnité entretien négociée au contrat (par jour)</td>
            <td style={right}>{fmt(p.indemnites.ie_base)}</td>
            <td style={center}>{p.indemnites.ie_nombre}</td>
            <td style={right}>{fmt(p.indemnites.g52)} €</td>
            <td colSpan={5}></td>
          </tr>
          <tr>
            <td colSpan={4} style={small}>Indemnité entretien des hrs cpl et sup non mensualisées</td>
            <td style={right}>{p.indemnites.ie_comp_base > 0 ? fmt(p.indemnites.ie_comp_base) : ""}</td>
            <td style={center}>{p.indemnites.ie_comp_nombre > 0 ? p.indemnites.ie_comp_nombre : ""}</td>
            <td style={right}>{p.indemnites.g53 > 0 ? fmt(p.indemnites.g53) + " €" : ""}</td>
            <td colSpan={3} style={small}>Nbre de jours de 8 heures ou plus d&apos;activité</td>
            <td colSpan={2} style={{ ...cellS, ...right, ...bold }}>{p.jours_8h_plus} jrs</td>
          </tr>
          <tr>
            <td colSpan={4} style={small}>IN - Indemnité de repas</td>
            <td style={right}>{p.indemnites.repas_base > 0 ? fmt(p.indemnites.repas_base) : ""}</td>
            <td style={center}>{p.indemnites.repas_nombre > 0 ? p.indemnites.repas_nombre : ""}</td>
            <td style={right}>{p.indemnites.g54 > 0 ? fmt(p.indemnites.g54) + " €" : ""}</td>
            <td colSpan={3} style={small}>Cumul des heures des journées inférieures à 8 heures d&apos;activité</td>
            <td colSpan={2} style={{ ...cellS, ...right }}>{fmt(p.cumul_heures_moins_8h)} hrs</td>
          </tr>
          <tr>
            <td colSpan={4} style={small}>IN - Indemnité de repas fourni par les parents</td>
            <td style={right}>{p.indemnites.repas_parents_base > 0 ? fmt(p.indemnites.repas_parents_base) : ""}</td>
            <td style={center}>{p.indemnites.repas_parents_nombre > 0 ? p.indemnites.repas_parents_nombre : ""}</td>
            <td style={right}>{p.indemnites.g55 > 0 ? fmt(p.indemnites.g55) + " €" : ""}</td>
            <td colSpan={5}></td>
          </tr>
          <tr>
            <td colSpan={4} style={small}>IK - Indemnité kilométrique</td>
            <td style={right}>{p.indemnites.km_base > 0 ? fmt(p.indemnites.km_base) : ""}</td>
            <td style={center}>{p.indemnites.km_nombre > 0 ? p.indemnites.km_nombre : ""}</td>
            <td style={right}>{p.indemnites.g56 > 0 ? fmt(p.indemnites.g56) + " €" : ""}</td>
            <td colSpan={2} style={{ ...bold, fontSize: "8px" }}>POUR LA DÉCLARATION PAJEMPLOI</td>
            <td colSpan={3}></td>
          </tr>
          <tr>
            <td colSpan={4} style={small}>Indemnité de rupture</td>
            <td></td>
            <td></td>
            <td style={right}>{p.indemnites.g57 > 0 ? fmt(p.indemnites.g57) + " €" : ""}</td>
            <td colSpan={5}></td>
          </tr>
          <tr>
            <td colSpan={4} style={small}>Autres (non imposable)</td>
            <td></td>
            <td></td>
            <td style={right}>{p.indemnites.g58 > 0 ? fmt(p.indemnites.g58) + " €" : ""}</td>
            <td colSpan={3} style={small}>Nbre de jours d&apos;activité à déclarer à pajemploi</td>
            <td colSpan={2} style={{ ...cellS, ...right, ...bold }}>{p.jours_pajemploi} jrs</td>
          </tr>
          <tr style={bold}>
            <td colSpan={4}>Total des indemnités à régler :</td>
            <td></td>
            <td></td>
            <td style={{ ...right, ...bold }}>{fmt(p.indemnites.total_indemnites)} €</td>
            <td colSpan={2} style={{ fontSize: "8px" }}>Commentaires du mois</td>
            <td colSpan={3} style={{ fontSize: "7px" }}>{p.commentaire_mois}</td>
          </tr>
        </tbody>
      </table>

      {/* ========== IMPOSITION À LA SOURCE ========== */}
      <table style={{ marginTop: 2 }}>
        <tbody>
          <tr>
            <td colSpan={3} style={small}>Imposition à la source</td>
            <td colSpan={2}>Base : {fmt(p.net_imposable)} €</td>
            <td colSpan={2}>Montant : {fmt(p.montant_pas)} €</td>
            <td colSpan={5}></td>
          </tr>
          <tr>
            <td colSpan={3}></td>
            <td colSpan={2}>Taux : {fmtPct(p.taux_pas)}</td>
            <td colSpan={7}></td>
          </tr>
        </tbody>
      </table>

      {/* ========== NET À PAYER ========== */}
      <table style={{ marginTop: 2 }}>
        <tbody>
          <tr>
            <td
              colSpan={12}
              style={{
                ...cellC,
                ...bold,
                textAlign: "center",
                fontSize: "14px",
                padding: "6px",
              }}
            >
              MONTANT NET À PAYER &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {fmt(p.net_a_payer)} €
            </td>
          </tr>
        </tbody>
      </table>

      {/* ========== PAIEMENT + NET IMPOSABLE ========== */}
      <table style={{ marginTop: 4 }}>
        <tbody>
          <tr>
            <td colSpan={2} style={small}>Date paiement</td>
            <td colSpan={3} style={cellS}>{p.date_paiement}</td>
            <td colSpan={3} style={small}>Signature de l&apos;employeur</td>
            <td colSpan={4}></td>
          </tr>
          <tr>
            <td colSpan={2} style={small}>Banque</td>
            <td colSpan={3} style={cellS}>{p.banque}</td>
            <td colSpan={7}></td>
          </tr>
          <tr>
            <td colSpan={2} style={small}>N°chèque ou virement</td>
            <td colSpan={3} style={cellS}>{p.num_cheque_virement}</td>
            <td colSpan={7}></td>
          </tr>
        </tbody>
      </table>

      <table style={{ marginTop: 2 }}>
        <tbody>
          <tr style={{ backgroundColor: "#f3e5f5" }}>
            <td colSpan={2} style={bold}>MENSUEL</td>
            <td style={small}>Net imposable</td>
            <td style={{ ...right, ...bold }}>{fmt(p.net_imposable)} €</td>
            <td style={small}>IE + IN + IK</td>
            <td style={right}>{fmt(p.total_ie_in_ik)} €</td>
            <td colSpan={2} style={bold}>CUMUL ANNUEL</td>
            <td style={small}>Net imposable</td>
            <td style={{ ...right, ...bold }}>{fmt(p.cumul_net_imposable)} €</td>
            <td style={small}>IE+IN+IK</td>
            <td style={right}>{fmt(p.cumul_ie_in_ik)} €</td>
          </tr>
        </tbody>
      </table>

      {/* ========== CONGÉS PAYÉS ========== */}
      <table style={{ marginTop: 4 }}>
        <thead>
          <tr style={{ backgroundColor: "#e8eaf6" }}>
            <th colSpan={12} style={{ textAlign: "left" }}>CONGÉS PAYÉS</th>
          </tr>
        </thead>
        <tbody>
          {/* Période N */}
          <tr>
            <td colSpan={2} style={{ ...small, ...bold }}>{p.conges_n.periode} (N)</td>
            <td style={small}>Nb de mois travaillés</td>
            <td style={cellS}>{p.conges_n.mois_trav}</td>
            <td style={small}>Jours enfant</td>
            <td style={cellS}>{p.conges_n.jours_enfant}</td>
            <td style={small}>Total jrs ouvrables acquis</td>
            <td style={{ ...cellC, ...bold }}>{p.conges_n.jours_acquis} jrs</td>
            <td style={small}>Nb de jrs pris</td>
            <td style={cellS}>{p.conges_n.jours_pris}</td>
            <td style={bold}>SOLDE</td>
            <td style={{ ...cellC, ...bold }}>{p.conges_n.solde} jrs</td>
          </tr>
          <tr>
            <td colSpan={2}></td>
            <td style={small}>Nb de semaines travaillées</td>
            <td style={cellS}>{p.conges_n.sem_trav}</td>
            <td style={small}>- 15 ans</td>
            <td></td>
            <td colSpan={6}></td>
          </tr>
          {/* Période N-1 */}
          <tr>
            <td colSpan={2} style={{ ...small, ...bold }}>{p.conges_n1.periode} (N-1)</td>
            <td style={small}>Nb de mois travaillés</td>
            <td style={cellS}>{p.conges_n1.mois_trav}</td>
            <td style={small}>Jours enfant</td>
            <td style={cellS}>{p.conges_n1.jours_enfant}</td>
            <td style={small}>Total jrs ouvrables acquis</td>
            <td style={{ ...cellC, ...bold }}>{p.conges_n1.jours_acquis} jrs</td>
            <td style={small}>Nb de jrs pris</td>
            <td style={cellS}>{p.conges_n1.jours_pris}</td>
            <td style={bold}>SOLDE</td>
            <td style={{ ...cellC, ...bold }}>{p.conges_n1.solde} jrs</td>
          </tr>
          <tr>
            <td colSpan={2}></td>
            <td style={small}>Nb de semaines travaillées</td>
            <td style={cellS}>{p.conges_n1.sem_trav}</td>
            <td style={small}>- 15 ans</td>
            <td></td>
            <td colSpan={6}></td>
          </tr>
        </tbody>
      </table>

      {/* ========== PIED DE PAGE ========== */}
      <div style={{ marginTop: 6, textAlign: "center", fontSize: "7px" }}>
        <p style={bold}>
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
