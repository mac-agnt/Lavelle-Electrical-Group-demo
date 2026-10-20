/* Shared financial calculations. Every screen reads money through these, so a
   project's numbers are the same wherever they appear.

   Rules
   - Committed cost = actual cost posted + open purchase-order commitments.
     A PO leaves "open" the moment its supplier invoice is posted to actual,
     so the same spend is never counted twice.
   - Forecast total cost = actual + open POs + forecast cost still to commit.
   - Revised contract value = original value + approved variations only.
   - Forecast profit = revised value − forecast total cost.
   - Forecast margin = forecast profit ÷ revised value.
   - A claim line's value this period = current cumulative valuation − value
     previously certified. Never the cumulative figure itself.          */

import type { Project, PurchaseOrder, Variation, Claim, ClaimLine, ContractLine, CostCat, Invoice, VatMode } from "./types";
import { CATS } from "./seed";

export interface Fin {
  original: number; variations: number; revised: number;
  actual: number; actualByCat: Record<CostCat, number>;
  openPO: number; openPOByCat: Record<CostCat, number>;
  committed: number;
  ctc: number; forecast: number; forecastByCat: Record<CostCat, number>;
  budget: number; budgetByCat: Record<CostCat, number>;
  profit: number; margin: number; target: number; gap: number;
  status: "On target" | "Watch" | "Below target";
  certified: number; invoiced: number; paid: number; outstanding: number;
  progress: number; costProgress: number;
}

export interface FinCtx { pos: PurchaseOrder[]; variations: Variation[]; }

const zero = (): Record<CostCat, number> => ({ labour: 0, materials: 0, subcontract: 0, plant: 0, prelims: 0 });
const sum = (r: Record<CostCat, number>) => CATS.reduce((n, c) => n + r[c], 0);

export function isOpenPO(po: PurchaseOrder) { return po.status === "Committed"; }

export function fin(p: Project, ctx: FinCtx): Fin {
  const openPOByCat = zero();
  ctx.pos.forEach(po => { if (po.projectId === p.id && isOpenPO(po)) openPOByCat[po.category] += po.value; });
  const variations = ctx.variations.filter(v => v.projectId === p.id && v.status === "Approved").reduce((n, v) => n + v.value, 0);
  const revised = p.originalValue + variations;
  const actual = sum(p.actual), openPO = sum(openPOByCat), ctc = sum(p.ctc);
  const forecastByCat = zero();
  CATS.forEach(c => { forecastByCat[c] = p.actual[c] + openPOByCat[c] + p.ctc[c]; });
  const forecast = actual + openPO + ctc;
  const profit = revised - forecast;
  const margin = revised ? profit / revised : 0;
  const gap = margin - p.targetMargin;
  return {
    original: p.originalValue, variations, revised,
    actual, actualByCat: { ...p.actual }, openPO, openPOByCat, committed: actual + openPO,
    ctc, forecast, forecastByCat, budget: sum(p.budget), budgetByCat: { ...p.budget },
    profit, margin, target: p.targetMargin, gap,
    status: gap >= 0 ? "On target" : gap > -0.01 ? "Watch" : "Below target",
    certified: p.certifiedToDate, invoiced: p.invoicedToDate, paid: p.paidToDate,
    outstanding: p.invoicedToDate - p.paidToDate,
    progress: revised ? p.certifiedToDate / revised : 0,
    costProgress: forecast ? actual / forecast : 0
  };
}

/* ── Claims ───────────────────────────────────────────────────────────── */
export interface LineCalc { value: number; prevPct: number; curPct: number; prevValue: number; cumValue: number; thisPeriod: number; }
export function lineCalc(value: number, prevPct: number, curPct: number): LineCalc {
  const prevValue = Math.round(value * prevPct * 100) / 100;
  const cumValue = Math.round(value * curPct * 100) / 100;
  return { value, prevPct, curPct, prevValue, cumValue, thisPeriod: Math.round((cumValue - prevValue) * 100) / 100 };
}

export interface ClaimTotals {
  contract: LineCalc[]; vars: LineCalc[];
  contractValue: number; varValue: number;
  prevCertified: number; cumulative: number; thisPeriod: number;
  contractThis: number; varThis: number;
  belowPrev: number;
}

export function claimTotals(claim: Claim, lines: ContractLine[], vars: Variation[]): ClaimTotals {
  const byId = (id: string) => lines.find(l => l.id === id);
  const vById = (id: string) => vars.find(v => v.id === id);
  const contract = (claim.lines || []).map((cl: ClaimLine) => lineCalc(byId(cl.lineId)?.value || 0, cl.prevPct, cl.curPct));
  const varCalcs = (claim.varLines || []).map((cl: ClaimLine) => lineCalc(vById(cl.lineId)?.value || 0, cl.prevPct, cl.curPct));
  const all = contract.concat(varCalcs);
  const s = (k: keyof LineCalc, list: LineCalc[]) => list.reduce((n, l) => n + (l[k] as number), 0);
  return {
    contract, vars: varCalcs,
    contractValue: s("value", contract), varValue: s("value", varCalcs),
    prevCertified: s("prevValue", all), cumulative: s("cumValue", all), thisPeriod: s("thisPeriod", all),
    contractThis: s("thisPeriod", contract), varThis: s("thisPeriod", varCalcs),
    belowPrev: all.filter(l => l.curPct < l.prevPct).length
  };
}

/* ── VAT ──────────────────────────────────────────────────────────────── */
export const VAT_LABEL: Record<VatMode, string> = {
  rct: "Reverse charge (RCT subcontract): VAT accounted for by principal contractor",
  "13.5": "13.5% (construction services)",
  "23": "23% (standard rate)"
};
export const VAT_SHORT: Record<VatMode, string> = { rct: "Reverse charge", "13.5": "VAT 13.5%", "23": "VAT 23%" };
export function vat(inv: { net: number; vatMode: VatMode }) {
  const rate = inv.vatMode === "rct" ? 0 : Number(inv.vatMode) / 100;
  const v = Math.round(inv.net * rate * 100) / 100;
  return { rate, vat: v, gross: Math.round((inv.net + v) * 100) / 100 };
}

/* ── Portfolio roll-ups ──────────────────────────────────────────────── */
export function totals(projects: Project[], ctx: FinCtx) {
  const fs = projects.map(p => fin(p, ctx));
  const s = (k: keyof Fin) => fs.reduce((n, f) => n + (f[k] as number), 0);
  const labour = projects.reduce((n, p) => n + p.actual.labour, 0);
  return {
    count: projects.length, revised: s("revised"), actual: s("actual"), openPO: s("openPO"), committed: s("committed"),
    forecast: s("forecast"), profit: s("profit"), labour, certified: s("certified"), invoiced: s("invoiced"), paid: s("paid"),
    outstanding: s("outstanding"), margin: s("revised") ? s("profit") / s("revised") : 0, fins: fs
  };
}

export function invoiceOutstanding(i: Invoice) { return i.net - i.paid; }
