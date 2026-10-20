/* One local store for every Lavelle module. Edits, approvals, allocations and
   simulated syncs all go through these actions, so Home, the agents, the
   dashboard and each module read the same state. No backend: it resets on
   reload. */

import { useSyncExternalStore } from "react";
import type {
  Project, Variation, Claim, Invoice, PurchaseOrder, FuelTxn, Timesheet, Approval, Task, SiteReport, Unit,
  ActivityEvent, SyncEvent, QuoteLine, Enquiry, NavTarget, VatMode, ClaimLine
} from "./types";
import {
  buildProjects, VARIATIONS, CLAIMS, INVOICES, PURCHASE_ORDERS, FUEL, TIMESHEETS, APPROVALS, TASKS, SITE_REPORTS, UNITS,
  ACTIVITY, XERO_LOG, QUOTE_SEED, ENQUIRIES, CONTRACT_LINES, EMPLOYEES, SUBCONTRACTORS, CLIENTS
} from "./seed";
import { claimTotals, fin } from "./calc";
import { addDays, eur, TODAY } from "./format";

export interface LvState {
  tabs: Record<string, string>;
  openProject: string | null; projectTab: string;
  focusClaim: string | null;
  projects: Project[]; variations: Variation[]; claims: Claim[]; invoices: Invoice[];
  pos: PurchaseOrder[]; fuel: FuelTxn[]; timesheets: Timesheet[]; approvals: Approval[]; tasks: Task[];
  reports: SiteReport[]; units: Unit[]; activity: ActivityEvent[]; xeroLog: SyncEvent[];
  quote: QuoteLine[]; quoteMarkup: number; labourRate: number; quoteStatus: "Draft" | "Sent" | "Won" | "Contract drafted";
  enquiries: Enquiry[];
  vatMode: VatMode;
  toast: { text: string; n: number } | null;
  filters: { type: string; region: string; pm: string; risk: string; q: string };
  seq: number;
}

export const MODULE_TABS: Record<string, [string, string][]> = {
  "Projects": [["overview", "Overview"], ["all", "All Projects"], ["financials", "Project Financials"], ["progress", "Progress & Milestones"], ["variations", "Variations"], ["documents", "Documents"], ["reports", "Reports"]],
  "Estimating": [["overview", "Overview"], ["enquiries", "Enquiries"], ["estimates", "Estimates"], ["takeoffs", "Take-offs"], ["quote", "Quote Builder"], ["wonlost", "Won & Lost"]],
  "Claims & Finance": [["overview", "Overview"], ["claims", "Monthly Claims"], ["valuations", "Valuations"], ["invoices", "Invoices"], ["cost", "Cost Control"], ["cashflow", "Cash Flow"], ["xero", "Xero Sync"]],
  "Workforce": [["overview", "Overview"], ["employees", "Employees"], ["subcontractors", "Subcontractors"], ["allocations", "Allocations"], ["timesheets", "Timesheets"], ["labour", "Labour Costs"]],
  "Site Operations": [["overview", "Overview"], ["reports", "Daily Reports"], ["progress", "Project Progress"], ["fix", "First & Second Fix"], ["issues", "Issues & Delays"], ["inspections", "Site Inspections"]],
  "Procurement": [["overview", "Overview"], ["orders", "Purchase Orders"], ["materials", "Materials"], ["suppliers", "Suppliers"], ["deliveries", "Deliveries"], ["commitments", "Commitments"]],
  "Fleet & Fuel": [["overview", "Overview"], ["vehicles", "Vehicles"], ["transactions", "Fuel Transactions"], ["cards", "Fuel Cards"], ["allocation", "Project Allocation"], ["reports", "Fuel Reports"]],
  "Dashboard": [["executive", "Executive"], ["profitability", "Project Profitability"], ["labour", "Labour"], ["commercial", "Commercial"], ["cashflow", "Cash Flow"]]
};
export const LV_PAGES = Object.keys(MODULE_TABS).filter(p => p !== "Dashboard");

function initial(): LvState {
  const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
  return {
    tabs: Object.fromEntries(Object.entries(MODULE_TABS).map(([k, v]) => [k, v[0][0]])),
    openProject: null, projectTab: "overview", focusClaim: null,
    projects: buildProjects(), variations: clone(VARIATIONS), claims: clone(CLAIMS), invoices: clone(INVOICES),
    pos: clone(PURCHASE_ORDERS), fuel: clone(FUEL), timesheets: clone(TIMESHEETS), approvals: clone(APPROVALS), tasks: clone(TASKS),
    reports: clone(SITE_REPORTS), units: clone(UNITS), activity: clone(ACTIVITY), xeroLog: clone(XERO_LOG),
    quote: clone(QUOTE_SEED), quoteMarkup: 0.22, labourRate: 42, quoteStatus: "Draft",
    enquiries: clone(ENQUIRIES), vatMode: "rct", toast: null,
    filters: { type: "all", region: "all", pm: "all", risk: "all", q: "" }, seq: 0
  };
}

let state: LvState = initial();
const listeners = new Set<() => void>();
let navHandler: ((page: string) => void) | null = null;

export const getState = () => state;
export function subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
function set(patch: Partial<LvState> | ((s: LvState) => Partial<LvState>)) {
  const p = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...p, seq: state.seq + 1 };
  listeners.forEach(l => l());
}
export function useLv(): LvState { return useSyncExternalStore(subscribe, getState, getState); }
export function setNavHandler(fn: (page: string) => void) { navHandler = fn; }

/* ── lookups ──────────────────────────────────────────────────────────── */
export const person = (id: string | null | undefined) => EMPLOYEES.find(e => e.id === id) || null;
export const sub = (id: string | null | undefined) => SUBCONTRACTORS.find(s => s.id === id) || null;
export const personName = (id: string | null | undefined) => person(id)?.name || sub(id)?.name || "Unassigned";
export const client = (id: string) => CLIENTS.find(c => c.id === id)!;
export const project = (id: string | null | undefined, s: LvState = state) => s.projects.find(p => p.id === id) || null;
export const projectByRef = (ref: string, s: LvState = state) => s.projects.find(p => p.ref.toLowerCase() === ref.toLowerCase()) || null;
export const finOf = (p: Project, s: LvState = state) => fin(p, { pos: s.pos, variations: s.variations });

/* ── navigation ───────────────────────────────────────────────────────── */
export function setTab(page: string, tab: string) {
  set(s => ({ tabs: { ...s.tabs, [page]: tab }, openProject: page === "Projects" ? null : s.openProject }));
}
export function navigate(t: NavTarget) {
  set(s => ({
    tabs: t.tab ? { ...s.tabs, [t.page]: t.tab } : s.tabs,
    openProject: t.project !== undefined ? t.project : (t.page === "Projects" && t.tab ? null : s.openProject),
    projectTab: t.projectTab || (t.project ? "overview" : s.projectTab),
    focusClaim: t.claim !== undefined ? t.claim : s.focusClaim
  }));
  navHandler?.(t.page);
}
export const openProject = (id: string, tab = "overview") => navigate({ page: "Projects", project: id, projectTab: tab });
export const closeProject = () => set({ openProject: null });
export const setProjectTab = (tab: string) => set({ projectTab: tab });
export const setFilter = (k: keyof LvState["filters"], v: string) => set(s => ({ filters: { ...s.filters, [k]: v } }));
export const toast = (text: string) => set(s => ({ toast: { text, n: (s.toast?.n || 0) + 1 } }));
export const clearToast = () => set({ toast: null });

function now() { const d = new Date(); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }
function log(e: Omit<ActivityEvent, "id" | "at" | "time">): ActivityEvent[] {
  return [{ ...e, id: "a" + Date.now() + Math.random().toString(36).slice(2, 6), at: TODAY, time: now() }, ...state.activity];
}
function xlog(kind: string, text: string, st: SyncEvent["state"] = "ok"): SyncEvent[] {
  return [{ id: "x" + Date.now() + Math.random().toString(36).slice(2, 5), at: "20 Oct " + now(), kind, text, state: st }, ...state.xeroLog];
}
const mapProject = (id: string, fn: (p: Project) => Project) => state.projects.map(p => p.id === id ? fn(p) : p);
const refOf = (id: string | null) => project(id)?.ref || "";

/* ── margins ──────────────────────────────────────────────────────────── */
export function setTarget(projectId: string, target: number) {
  const t = Math.max(0, Math.min(0.6, target));
  set({ projects: mapProject(projectId, p => ({ ...p, targetMargin: t })),
    activity: log({ stream: "people", title: "Margin target changed", note: refOf(projectId) + " target set to " + (t * 100).toFixed(1) + "%.", actor: "Martin Lavelle", rel: refOf(projectId), src: "Pulse", status: "completed" }) });
}

/* ── claims ───────────────────────────────────────────────────────────── */
export const claimFor = (projectId: string, s: LvState = state) => s.claims.find(c => c.projectId === projectId && c.period === "2026-10") || null;

export function createMonthlyClaim(projectId: string, withSuggestions = false, go = true) {
  const existing = claimFor(projectId);
  if (existing && existing.status !== "Not started") { if (go) navigate({ page: "Claims & Finance", tab: "claims", claim: existing.id }); return existing.id; }
  const lines: ClaimLine[] = CONTRACT_LINES.filter(l => l.projectId === projectId)
    .map(l => ({ lineId: l.id, prevPct: l.prevPct, curPct: withSuggestions ? l.suggestedPct : l.prevPct, note: "" }));
  const varLines: ClaimLine[] = state.variations.filter(v => v.projectId === projectId && v.status === "Approved")
    .map(v => ({ lineId: v.id, prevPct: v.prevPct, curPct: withSuggestions ? v.suggestedPct : v.prevPct, note: "" }));
  const id = existing ? existing.id : "cm-" + projectId + "-new";
  const p = project(projectId)!;
  const base: Claim = existing || { id, ref: "VAL-" + p.ref.slice(-3) + "-NEW", projectId, number: 1, period: "2026-10", periodLabel: "October 2026", status: "Not started",
    amount: 0, certified: null, certifiedDate: "", submitted: "", assessmentDue: "", invoiceId: null, note: "", history: [] };
  const claim: Claim = { ...base, status: "Draft", lines, varLines, periodLabel: "October 2026 (1–31 Oct)",
    history: [...base.history, { at: TODAY + " " + now(), text: "Created from contract schedule " + p.quoteRef + " by Martin Lavelle" }] };
  claim.amount = claimTotals(claim, CONTRACT_LINES, state.variations).thisPeriod;
  set(s => ({ claims: existing ? s.claims.map(c => c.id === id ? claim : c) : [claim, ...s.claims], focusClaim: id,
    activity: log({ stream: "people", title: "Monthly claim created", note: claim.ref + " prepopulated from " + lines.length + " contract lines" + (varLines.length ? " and " + varLines.length + " approved variation" : "") + ".", actor: "Martin Lavelle", rel: p.ref, src: "Pulse", status: "completed" }) }));
  if (go) navigate({ page: "Claims & Finance", tab: "claims", claim: id });
  return id;
}

function updateClaim(id: string, fn: (c: Claim) => Claim) {
  set(s => ({ claims: s.claims.map(c => {
    if (c.id !== id) return c;
    const n = fn(c);
    if (n.lines) n.amount = claimTotals(n, CONTRACT_LINES, s.variations).thisPeriod;
    return n;
  }) }));
}
export function setClaimPct(id: string, lineId: string, pct: number, isVar = false) {
  const v = Math.max(0, Math.min(1, pct));
  updateClaim(id, c => isVar
    ? { ...c, varLines: (c.varLines || []).map(l => l.lineId === lineId ? { ...l, curPct: v } : l) }
    : { ...c, lines: (c.lines || []).map(l => l.lineId === lineId ? { ...l, curPct: v } : l) });
}
export function setClaimNote(id: string, lineId: string, note: string) {
  updateClaim(id, c => ({ ...c, lines: (c.lines || []).map(l => l.lineId === lineId ? { ...l, note } : l), varLines: (c.varLines || []).map(l => l.lineId === lineId ? { ...l, note } : l) }));
}
export function applySuggestions(id: string) {
  updateClaim(id, c => ({ ...c,
    lines: (c.lines || []).map(l => ({ ...l, curPct: CONTRACT_LINES.find(x => x.id === l.lineId)?.suggestedPct ?? l.curPct, note: l.note || "From SR-1043" })),
    varLines: (c.varLines || []).map(l => ({ ...l, curPct: state.variations.find(x => x.id === l.lineId)?.suggestedPct ?? l.curPct })),
    history: [...c.history, { at: TODAY + " " + now(), text: "Site-report suggestions applied (SR-1043). Reviewed before submission." }] }));
}
export function resetClaimLines(id: string) {
  updateClaim(id, c => ({ ...c, lines: (c.lines || []).map(l => ({ ...l, curPct: l.prevPct })), varLines: (c.varLines || []).map(l => ({ ...l, curPct: l.prevPct })) }));
}

export function claimStep(id: string, step: "save" | "review" | "submit" | "certify-full" | "certify-partial" | "dispute" | "back") {
  const c = state.claims.find(x => x.id === id); if (!c) return;
  const p = project(c.projectId)!;
  const stamp = TODAY + " " + now();
  if (step === "save") { updateClaim(id, x => ({ ...x, history: [...x.history, { at: stamp, text: "Draft saved" }] })); toast("Draft saved"); return; }
  if (step === "back") { updateClaim(id, x => ({ ...x, status: "Draft", history: [...x.history, { at: stamp, text: "Returned to draft" }] })); return; }
  if (step === "review") {
    updateClaim(id, x => ({ ...x, status: "Internal review", history: [...x.history, { at: stamp, text: "Sent for internal review (Shane Gallagher, QS)" }] }));
    set(s => ({ activity: log({ stream: "people", title: "Valuation prepared", note: c.ref + " " + eur(c.amount) + " sent for internal review.", actor: "Martin Lavelle", rel: p.ref, src: "Pulse", status: "awaiting" }) }));
    return;
  }
  if (step === "submit") {
    updateClaim(id, x => ({ ...x, status: "Submitted", submitted: TODAY, assessmentDue: addDays(TODAY, 14), history: [...x.history, { at: stamp, text: "Submitted to " + client(p.clientId).name + " (simulated email)" }] }));
    set(s => ({ approvals: s.approvals.map(a => a.refId === id ? { ...a, status: "Approved" } : a),
      activity: log({ stream: "people", title: "Claim submitted", note: c.ref + " " + eur(c.amount) + " submitted to " + client(p.clientId).name + ". Awaiting assessment.", actor: "Martin Lavelle", rel: p.ref, src: "Pulse", status: "completed" }) }));
    toast("Claim submitted. Awaiting client assessment.");
    return;
  }
  if (step === "certify-full" || step === "certify-partial") {
    let certified = c.amount, note = "Certified in full";
    if (step === "certify-partial") {
      // The client QS trims one line: General Services held at 5% below the claimed position.
      const gs = (c.lines || []).find(l => l.lineId === "cl04");
      const cut = gs && gs.curPct - gs.prevPct >= 0.05 ? Math.round(CONTRACT_LINES.find(l => l.id === "cl04")!.value * 0.05) : Math.round(c.amount * 0.04);
      certified = Math.max(0, c.amount - cut);
      note = "Partially certified: client QS held " + eur(cut) + (gs ? " on General Services (55% agreed vs 60% claimed)" : "");
    }
    updateClaim(id, x => ({ ...x, status: step === "certify-full" ? "Certified" : "Partially certified", certified, certifiedDate: TODAY, history: [...x.history, { at: stamp, text: note + " (simulated client response)" }] }));
    set(s => ({ projects: mapProject(c.projectId, pr => ({ ...pr, certifiedToDate: pr.certifiedToDate + certified })),
      activity: log({ stream: "people", title: "Claim certified", note: c.ref + ": " + eur(certified) + " certified of " + eur(c.amount) + " claimed.", actor: client(p.clientId).name + " QS (simulated)", rel: p.ref, src: "Pulse", status: "completed" }) }));
    return;
  }
  if (step === "dispute") {
    updateClaim(id, x => ({ ...x, status: "Disputed", history: [...x.history, { at: stamp, text: "Client disputed part of the valuation (simulated)" }] }));
  }
}

export function setVatMode(m: VatMode) { set({ vatMode: m }); }

export function generateInvoice(claimId: string) {
  const c = state.claims.find(x => x.id === claimId); if (!c || c.certified == null) return null;
  if (c.invoiceId) return c.invoiceId;
  const p = project(c.projectId)!;
  const n = 1210 + state.invoices.length;
  const inv: Invoice = { id: "in-" + n, ref: "INV-LE-" + n, projectId: p.id, clientId: p.clientId, claimId, issued: TODAY, due: addDays(TODAY, 30),
    net: c.certified, vatMode: state.vatMode, status: "Draft", paid: 0, xero: "Not sent", xeroRef: "", period: c.periodLabel.replace(/ \(.*\)/, "") };
  set(s => ({ invoices: [inv, ...s.invoices], claims: s.claims.map(x => x.id === claimId ? { ...x, invoiceId: inv.id, history: [...x.history, { at: TODAY + " " + now(), text: "Draft invoice " + inv.ref + " generated from certified amount " + eur(c.certified!) }] } : x),
    activity: log({ stream: "people", title: "Invoice drafted from certified claim", note: inv.ref + " " + eur(inv.net) + " for " + c.ref + ".", actor: "Martin Lavelle", rel: p.ref, src: "Pulse", status: "completed" }) }));
  return inv.id;
}
export function setInvoiceVat(id: string, m: VatMode) { set(s => ({ vatMode: m, invoices: s.invoices.map(i => i.id === id && i.xero === "Not sent" ? { ...i, vatMode: m } : i) })); }

export function pushToXero(invoiceId: string) {
  const inv = state.invoices.find(i => i.id === invoiceId); if (!inv) return;
  set(s => ({ invoices: s.invoices.map(i => i.id === invoiceId ? { ...i, xero: "Queued" } : i), xeroLog: xlog("Invoice", inv.ref + " queued for Xero (demo connection)", "info") }));
  setTimeout(() => {
    const ref = "XR-DEMO-" + (4480 + Math.floor(Math.random() * 400));
    set(s => ({ invoices: s.invoices.map(i => i.id === invoiceId ? { ...i, xero: "Draft in Xero", xeroRef: ref, status: "Approved" } : i),
      xeroLog: xlog("Invoice", inv.ref + " " + eur(inv.net) + " created as a draft invoice, contact " + client(inv.clientId).xeroContact + " (simulated)"),
      activity: log({ stream: "data", title: "Invoice synchronised with Xero demo connection", note: inv.ref + " created as draft " + ref + ". No real API call was made.", actor: "Xero (demo connection)", rel: refOf(inv.projectId), src: "Xero", status: "completed" }) }));
  }, 1400);
}
export function approveInXero(invoiceId: string) {
  const inv = state.invoices.find(i => i.id === invoiceId); if (!inv) return;
  set(s => ({ invoices: s.invoices.map(i => i.id === invoiceId ? { ...i, xero: "Awaiting payment", status: "Sent" } : i),
    projects: mapProject(inv.projectId, p => ({ ...p, invoicedToDate: p.invoicedToDate + inv.net })),
    claims: s.claims.map(c => c.id === inv.claimId ? { ...c, status: "Invoiced" } : c),
    xeroLog: xlog("Status", inv.ref + " approved and sent. Status now Awaiting payment (simulated)") }));
}
export function simulatePayment(invoiceId: string) {
  const inv = state.invoices.find(i => i.id === invoiceId); if (!inv) return;
  const due = inv.net - inv.paid;
  set(s => ({ invoices: s.invoices.map(i => i.id === invoiceId ? { ...i, paid: i.net, xero: "Paid", status: "Paid" } : i),
    projects: mapProject(inv.projectId, p => ({ ...p, paidToDate: p.paidToDate + due })),
    claims: s.claims.map(c => c.id === inv.claimId ? { ...c, status: "Paid" } : c),
    xeroLog: xlog("Payment", inv.ref + " " + eur(due) + " matched to bank line '" + client(inv.clientId).xeroContact + "' (simulated)"),
    activity: log({ stream: "data", title: "Payment matched", note: inv.ref + " " + eur(due) + " received and reconciled (simulated).", actor: "Xero (demo connection)", rel: refOf(inv.projectId), src: "Xero", status: "completed" }) }));
}
export function resolveReconcile(invoiceId: string) {
  set(s => ({ invoices: s.invoices.map(i => i.id === invoiceId ? { ...i, xero: "Awaiting payment" } : i),
    xeroLog: xlog("Reconcile", "Part payment on " + (s.invoices.find(i => i.id === invoiceId)?.ref || "") + " marked as on-account, pending remittance (simulated)") }));
}
export function syncContacts() {
  set(() => ({ xeroLog: xlog("Contacts", CLIENTS.length + " customer records compared. 0 created, 1 updated (Seafield Homes billing email) (simulated)") }));
  toast("Contact sync simulated. No data left this browser.");
}

/* ── procurement ──────────────────────────────────────────────────────── */
export function approvePO(poId: string) {
  const po = state.pos.find(p => p.id === poId); if (!po || po.status !== "Awaiting approval") return;
  set(s => ({
    pos: s.pos.map(p => p.id === poId ? { ...p, status: "Committed", delivery: "Awaiting delivery" } : p),
    // committing an order moves forecast spend out of cost-to-complete, so the forecast itself doesn't double up
    projects: mapProject(po.projectId, p => ({ ...p, ctc: { ...p.ctc, [po.category]: Math.max(0, p.ctc[po.category] - po.value) } })),
    approvals: s.approvals.map(a => a.refId === poId ? { ...a, status: "Approved" } : a),
    tasks: s.tasks.map(t => t.title.indexOf(po.ref) > -1 ? { ...t, status: "Done" } : t),
    activity: log({ stream: "people", title: "Purchase order committed", note: po.ref + " " + eur(po.value) + " committed against " + refOf(po.projectId) + " the moment it was approved.", actor: "Martin Lavelle", rel: refOf(po.projectId), src: "Pulse", status: "completed" })
  }));
  toast(po.ref + " approved. " + eur(po.value) + " now committed against " + refOf(po.projectId));
}
export function rejectPO(poId: string) {
  set(s => ({ pos: s.pos.map(p => p.id === poId ? { ...p, status: "Rejected" } : p), approvals: s.approvals.map(a => a.refId === poId ? { ...a, status: "Rejected" } : a) }));
}
export function markDelivered(poId: string) { set(s => ({ pos: s.pos.map(p => p.id === poId ? { ...p, delivery: "Delivered" } : p) })); }
export function postSupplierInvoice(poId: string) {
  const po = state.pos.find(p => p.id === poId); if (!po || po.status !== "Committed") return;
  set(s => ({
    pos: s.pos.map(p => p.id === poId ? { ...p, invoiced: true, status: "Posted", delivery: p.delivery === "Late" || p.delivery === "Awaiting delivery" ? "Delivered" : p.delivery } : p),
    projects: mapProject(po.projectId, p => ({ ...p, actual: { ...p.actual, [po.category]: p.actual[po.category] + po.value } })),
    activity: log({ stream: "data", title: "Supplier invoice matched and posted", note: po.ref + " " + eur(po.value) + " moved from open commitment to actual cost. Counted once.", actor: "Orla Dempsey", rel: refOf(po.projectId), src: "Pulse", status: "completed" })
  }));
  toast(po.ref + " posted to actual cost. Open commitment reduced by " + eur(po.value));
}

/* ── fuel ─────────────────────────────────────────────────────────────── */
export function allocateFuel(txnId: string, projectId: string) {
  const t = state.fuel.find(f => f.id === txnId); if (!t) return;
  set(s => ({
    fuel: s.fuel.map(f => f.id === txnId ? { ...f, projectId, state: "Allocated" } : f),
    projects: mapProject(projectId, p => ({ ...p, actual: { ...p.actual, plant: Math.round((p.actual.plant + t.total) * 100) / 100 } })),
    tasks: t.cardId === "fc18" ? s.tasks.map(x => x.id === "t03" ? { ...x, status: "Done" } : x) : s.tasks,
    activity: log({ stream: "people", title: "Fuel transaction allocated", note: "€" + t.total.toFixed(2) + " " + t.station + " allocated to " + refOf(projectId) + " plant & fuel.", actor: "Martin Lavelle", rel: refOf(projectId), src: "Pulse", status: "completed" })
  }));
  toast("€" + t.total.toFixed(2) + " added to " + refOf(projectId) + " plant & fuel");
}
export function fuelOverhead(txnId: string) {
  set(s => ({ fuel: s.fuel.map(f => f.id === txnId ? { ...f, state: "Overhead", projectId: null } : f) }));
}
export function importFuelCsv() {
  set(s => ({ activity: log({ stream: "data", title: "Fuel CSV import simulated", note: "Statement w/e 18 Oct re-read: 41 rows, 0 new. Supplier-agnostic CSV mapping, no live connector.", actor: "Fuel CSV import (simulated)", rel: "Fleet & Fuel", src: "Pulse", status: "completed" }) }));
  toast("CSV import simulated: 41 rows read, 0 new");
}

/* ── labour ───────────────────────────────────────────────────────────── */
export function labourCost(personId: string, hours: number, ot: number) {
  const r = person(personId)?.rate || 0;
  return Math.round((hours * r + ot * r * 1.5) * 100) / 100;
}
export function approveTimesheet(id: string, proposal?: { projectId: string; hours: number; ot: number }) {
  const t = state.timesheets.find(x => x.id === id); if (!t || t.state === "Posted") return;
  const pr = proposal || t.proposal; if (!pr) return;
  const cost = labourCost(t.personId, pr.hours, pr.ot);
  set(s => ({
    timesheets: s.timesheets.map(x => x.id === id ? { ...x, state: "Posted", proposal: pr } : x),
    projects: mapProject(pr.projectId, p => ({ ...p, actual: { ...p.actual, labour: p.actual.labour + cost }, ctc: { ...p.ctc, labour: Math.max(0, p.ctc.labour - cost) } })),
    activity: t.state === "Matched" ? s.activity : log({ stream: "people", title: "Staff allocation confirmed", note: personName(t.personId) + ": " + pr.hours + "h" + (pr.ot ? " + " + pr.ot + "h OT" : "") + " to " + refOf(pr.projectId) + " (" + eur(cost) + ").", actor: "Orla Dempsey", rel: refOf(pr.projectId), src: "Pulse", status: "completed" })
  }));
}
export function approveAllMatched() {
  const matched = state.timesheets.filter(t => t.state === "Matched");
  matched.forEach(t => approveTimesheet(t.id));
  set(s => ({ activity: log({ stream: "people", title: "Matched hours posted", note: matched.length + " matched allocations for Mon 19 Oct posted to project labour (LiveCosts entry no longer re-keyed).", actor: "Orla Dempsey", rel: "Workforce", src: "Pulse", status: "completed" }) }));
  const left = state.timesheets.filter(t => t.state !== "Posted").length;
  set(s => ({ tasks: left === 0 ? s.tasks.map(x => x.id === "t07" ? { ...x, status: "Done" } : x) : s.tasks }));
  toast(matched.length + " matched allocations posted");
}
export function setProposal(id: string, patch: Partial<{ projectId: string; hours: number; ot: number }>) {
  set(s => ({ timesheets: s.timesheets.map(t => t.id === id && t.proposal ? { ...t, proposal: { ...t.proposal, ...patch } } : t) }));
}

/* ── site reports ─────────────────────────────────────────────────────── */
export function approveReport(id: string) {
  const r = state.reports.find(x => x.id === id); if (!r) return;
  set(s => ({
    reports: s.reports.map(x => x.id === id ? { ...x, status: "Approved" } : x),
    units: r.unitsSecondFix ? s.units.map(u => u.projectId === r.projectId && r.unitsSecondFix!.indexOf(u.no) > -1 ? { ...u, secondFix: 1 } : u) : s.units,
    tasks: s.tasks.map(t => t.id === "t04" && id === "sr1043" ? { ...t, status: "Done" } : t),
    activity: log({ stream: "people", title: "Site report approved", note: r.ref + (r.unitsSecondFix ? ": second fix confirmed on " + r.unitsSecondFix.length + " more units. Proposed valuation update created for review." : " approved."), actor: "Colm Kinsella", rel: refOf(r.projectId), src: "Pulse", status: "completed" })
  }));
  toast(r.ref + " approved" + (r.unitsSecondFix ? ". Valuation suggestion ready for review." : ""));
}

/* ── approvals queue ──────────────────────────────────────────────────── */
export function decide(approvalId: string, yes: boolean) {
  const a = state.approvals.find(x => x.id === approvalId); if (!a || a.status !== "Awaiting you") return;
  if (!yes) {
    if (a.kind === "PO") rejectPO(a.refId);
    set(s => ({ approvals: s.approvals.map(x => x.id === approvalId ? { ...x, status: "Rejected" } : x) }));
    return;
  }
  if (a.kind === "PO") { approvePO(a.refId); return; }
  if (a.kind === "Claim") { claimStep(a.refId, "submit"); return; }
  const mark = (extra: Partial<LvState> = {}) => set(s => ({ approvals: s.approvals.map(x => x.id === approvalId ? { ...x, status: "Approved" } : x), ...extra }));
  if (a.kind === "Timesheet" && a.projectId) {
    mark({ projects: mapProject(a.projectId, p => ({ ...p, actual: { ...p.actual, subcontract: p.actual.subcontract + a.value }, ctc: { ...p.ctc, subcontract: Math.max(0, p.ctc.subcontract - a.value) } })),
      tasks: state.tasks.map(t => t.id === "t06" ? { ...t, status: "Done" } : t),
      activity: log({ stream: "people", title: "Subcontractor timesheet approved", note: a.title + ": " + eur(a.value) + " posted to " + refOf(a.projectId) + " subcontract cost.", actor: "Martin Lavelle", rel: refOf(a.projectId), src: "Pulse", status: "completed" }) });
  } else if (a.kind === "Variation" && a.projectId) {
    const cost = Math.round(a.value * 0.76);
    mark({ variations: state.variations.map(v => v.id === a.refId ? { ...v, status: "Approved" } : v),
      projects: mapProject(a.projectId, p => ({ ...p, ctc: { ...p.ctc, labour: p.ctc.labour + Math.round(cost * 0.6), subcontract: p.ctc.subcontract + cost - Math.round(cost * 0.6) } })),
      activity: log({ stream: "people", title: "Variation approved", note: a.title + ": revised contract value +" + eur(a.value) + ", forecast cost +" + eur(cost) + ".", actor: "Martin Lavelle", rel: refOf(a.projectId), src: "Pulse", status: "completed" }) });
  } else if (a.kind === "Estimate") {
    mark({ enquiries: state.enquiries.map(e => e.id === a.refId ? { ...e, stage: "Submitted" } : e),
      tasks: state.tasks.map(t => t.id === "t05" && a.refId === "en103" ? { ...t, status: "Done" } : t),
      activity: log({ stream: "people", title: "Tender submission approved", note: a.title + " released to the client (simulated).", actor: "Martin Lavelle", rel: "Estimating", src: "Pulse", status: "completed" }) });
  } else if (a.kind === "Overtime" && a.projectId) {
    mark({ projects: mapProject(a.projectId, p => ({ ...p, ctc: { ...p.ctc, labour: p.ctc.labour + a.value } })),
      activity: log({ stream: "people", title: "Overtime approved", note: a.title + ": " + eur(a.value) + " added to forecast labour.", actor: "Martin Lavelle", rel: refOf(a.projectId), src: "Pulse", status: "completed" }) });
  } else mark();
  toast(a.title + " approved");
}

/* ── work ─────────────────────────────────────────────────────────────── */
export function toggleTask(id: string) { set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, status: t.status === "Done" ? "In progress" : "Done" } : t) })); }

/* ── estimating ───────────────────────────────────────────────────────── */
export function setQuoteLine(id: string, field: "qty" | "matRate" | "labHrs", value: number) {
  set(s => ({ quote: s.quote.map(q => q.id === id ? { ...q, [field]: isFinite(value) ? Math.max(0, value) : 0 } : q) }));
}
export const setMarkup = (m: number) => set({ quoteMarkup: Math.max(0, Math.min(0.6, m)) });
export const setLabourRate = (r: number) => set({ labourRate: Math.max(0, r) });
export function quoteTotals(s: LvState = state) {
  const lines = s.quote.map(q => {
    const materials = q.qty * q.matRate, hours = q.qty * q.labHrs, labour = hours * s.labourRate;
    const cost = materials + labour, sell = cost * (1 + s.quoteMarkup);
    return { ...q, materials, hours, labour, cost, sell };
  });
  const t = (k: "materials" | "hours" | "labour" | "cost" | "sell") => lines.reduce((n, l) => n + l[k], 0);
  return { lines, materials: t("materials"), hours: t("hours"), labour: t("labour"), cost: t("cost"), sell: t("sell"), margin: t("sell") ? (t("sell") - t("cost")) / t("sell") : 0 };
}
export function setQuoteStatus(st: LvState["quoteStatus"]) {
  set(s => ({ quoteStatus: st, enquiries: st === "Won" || st === "Contract drafted" ? s.enquiries.map(e => e.id === "en101" ? { ...e, stage: "Won" } : e) : st === "Sent" ? s.enquiries.map(e => e.id === "en101" ? { ...e, stage: "Submitted" } : e) : s.enquiries,
    activity: log({ stream: "people", title: st === "Contract drafted" ? "Contract drafted from quote" : "Quote " + st.toLowerCase(), note: "QUO-2026-061 Cherrywood L2: " + (st === "Contract drafted" ? "contract schedule created with 10 headings, ready for claims. Not yet an active project." : "status " + st + "."), actor: "Niall Hennessy", rel: "Estimating", src: "Pulse", status: "completed" }) }));
}
export function resetQuote() { set({ quote: JSON.parse(JSON.stringify(QUOTE_SEED)), quoteMarkup: 0.22, labourRate: 42, quoteStatus: "Draft" }); }

/* ── resets ───────────────────────────────────────────────────────────── */
export function resetDemo() { const keep = { tabs: state.tabs }; state = { ...initial(), ...keep }; listeners.forEach(l => l()); }

/* ── extension points for module files ───────────────────────────────────
   Module-specific actions live next to their views and go through these, so
   the core store stays small. */
export function update(patch: Partial<LvState> | ((s: LvState) => Partial<LvState>)) { set(patch); }
export function logEvent(e: Omit<ActivityEvent, "id" | "at" | "time">) { set({ activity: log(e) }); }
export { mapProject };
