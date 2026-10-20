/* Pulse's answers for the Lavelle demo. Every number is computed from the live
   store, so a PO approved or a fuel line allocated changes the next answer.
   Nothing here reaches an external system. */

import { getState, finOf, personName, project, projectByRef, claimFor, createMonthlyClaim, applySuggestions, type LvState } from "./store";
import { ALLOCATIONS, EMPLOYEES, SUBCONTRACTORS, TYPE_LABEL, CONTRACT_LINES } from "./seed";
import { claimTotals, totals } from "./calc";
import { eur, eurShort, pct, date, dateShort } from "./format";
import type { NavTarget } from "./types";

export interface Answer {
  tool: string; effect: "read" | "write"; text: string;
  cols?: string[]; rows?: string[][];
  actions?: { label: string; primary?: boolean; nav?: NavTarget; ask?: string }[];
}

const ctx = (s: LvState) => ({ pos: s.pos, variations: s.variations });
export const unsubmitted = (s: LvState) => s.claims.filter(c => c.status === "Draft" || c.status === "Internal review");
export const pendingApprovals = (s: LvState) => s.approvals.filter(a => a.status === "Awaiting you");
export const fuelToAllocate = (s: LvState) => s.fuel.filter(f => f.state === "Needs allocation" || f.state === "Missing cardholder" || f.state === "Investigate");
export const labourIssues = (s: LvState) => s.timesheets.filter(t => t.state === "Mismatch" || t.state === "Missing hours" || t.state === "No clock-in");
export const marginAlerts = (s: LvState) => s.projects.filter(p => finOf(p, s).status === "Below target");
export const valuationsToReview = (s: LvState) => {
  const drafts = unsubmitted(s);
  return drafts;
};

export function kpis(s: LvState = getState()) {
  const t = totals(s.projects, ctx(s));
  return {
    active: t.count, contract: t.revised, committed: t.committed, labour: t.labour,
    unsubmitted: unsubmitted(s).reduce((n, c) => n + c.amount, 0), approvals: pendingApprovals(s).length,
    actual: t.actual, openPO: t.openPO, forecastProfit: t.profit, margin: t.margin, certified: t.certified, outstanding: t.outstanding
  };
}

/** The Briefing Agent's morning summary, built from current state. */
export function briefingLines(s: LvState = getState()) {
  const k = kpis(s);
  const dalkey = s.projects.find(p => p.id === "p01")!;
  const df = finOf(dalkey, s);
  const undelivered = s.pos.filter(p => p.projectId === "p01" && p.status === "Committed" && p.delivery !== "Delivered").length;
  const drafts = unsubmitted(s);
  const fuel = fuelToAllocate(s);
  const lab = labourIssues(s);
  const below = marginAlerts(s);
  const lines: { k: string; v: string; nav: NavTarget }[] = [];
  lines.push({ k: "Valuations", v: (drafts.length ? drafts.length + " drafts to review, " + eur(drafts.reduce((n, c) => n + c.amount, 0)) + " unsubmitted" : "No drafts waiting") + ". Dalkey October valuation due " + dateShort(dalkey.nextValuation) + ".", nav: { page: "Claims & Finance", tab: "claims" } });
  lines.push({ k: "Committed", v: "Dalkey (" + dalkey.ref + ") has " + eur(df.openPO) + " in open purchase orders, " + undelivered + " not yet delivered.", nav: { page: "Projects", project: "p01", projectTab: "procurement" } });
  if (below.length) {
    const g = below[0], gf = finOf(g, s);
    lines.push({ k: "Margin", v: g.name + " forecast " + pct(gf.margin) + " against a " + pct(g.targetMargin) + " target.", nav: { page: "Projects", project: g.id, projectTab: "financials" } });
  }
  lines.push({ k: "Labour", v: lab.length ? lab.length + " staff allocations from yesterday need confirming before they post." : "All of yesterday's hours are confirmed.", nav: { page: "Workforce", tab: "timesheets" } });
  lines.push({ k: "Fuel", v: fuel.length ? fuel.length + " fuel transactions still need a project (" + eur(fuel.reduce((n, f) => n + f.total, 0)) + ")." : "Every fuel transaction is allocated.", nav: { page: "Fleet & Fuel", tab: "transactions" } });
  lines.push({ k: "Approvals", v: k.approvals + " waiting on you.", nav: { page: "Work" } });
  return lines;
}

export function briefingSentence(s: LvState = getState()) {
  const drafts = unsubmitted(s), fuel = fuelToAllocate(s);
  const df = finOf(s.projects.find(p => p.id === "p01")!, s);
  const n = ["No", "One", "Two", "Three", "Four", "Five", "Six"];
  return (drafts.length ? (n[drafts.length] || drafts.length) + " project valuation" + (drafts.length === 1 ? " requires" : "s require") + " review. " : "No valuations waiting. ")
    + "The Dalkey residential demo project has " + eur(df.openPO) + " in committed procurement, including orders not yet delivered. "
    + (fuel.length ? (n[fuel.length] || fuel.length) + " fuel transaction" + (fuel.length === 1 ? " still needs" : "s still need") + " project allocation." : "Every fuel transaction is allocated.");
}

function findProject(q: string, s: LvState) {
  const ref = q.match(/le-\d{4}-\d{3}/i);
  if (ref) return projectByRef(ref[0], s);
  const words: [RegExp, string][] = [[/dalkey/, "p01"], [/grand canal|gcd/, "p02"], [/ballymount/, "p03"], [/tallaght/, "p04"], [/kimmage/, "p05"], [/galway medical|medical centre/, "p06"],
    [/santry|data hall/, "p07"], [/docklands|hotel/, "p08"], [/swords/, "p09"], [/clondalkin|school/, "p10"], [/rathmines/, "p11"], [/oranmore/, "p12"]];
  const hit = words.find(([r]) => r.test(q));
  return hit ? project(hit[1], s) : null;
}

export function answer(question: string): Answer {
  const s = getState(), q = question.toLowerCase();
  const p = findProject(q, s);

  if (/prepare|draft|create|build/.test(q) && /claim|valuation/.test(q)) {
    const target = p || s.projects[0];
    if (target.id !== "p01") return { tool: "claims.prepare", effect: "read", text: "I can only prepare a line-by-line claim where the contract schedule is loaded. In this demo that's LE-2026-014 Dalkey. " + target.ref + " has a summary claim in Claims & Finance.", actions: [{ label: "Open Monthly Claims", primary: true, nav: { page: "Claims & Finance", tab: "claims" } }] };
    const existing = claimFor("p01", s);
    let id = existing?.id || "";
    if (!existing || existing.status === "Not started") { id = createMonthlyClaim("p01", true, false); }
    else if (existing.status === "Draft") applySuggestions(existing.id);
    const c = getState().claims.find(x => x.id === id)!;
    const t = claimTotals(c, CONTRACT_LINES, getState().variations);
    const top = t.contract.map((l, i) => ({ l, h: CONTRACT_LINES[i] })).sort((a, b) => b.l.thisPeriod - a.l.thisPeriod).slice(0, 4);
    return { tool: "claims.prepare_draft", effect: "write",
      text: "I've prepared October's draft claim for LE-2026-014 from the contract schedule, using the progress in Marty's site report SR-1043. Cumulative valuation " + eur(t.cumulative) + ", less " + eur(t.prevCertified) + " previously certified, gives " + eur(t.thisPeriod) + " this period, including " + eur(t.varThis) + " on the approved EV variation. It's a draft: nothing goes to Seafield Homes until you review and submit it.",
      cols: ["Line", "Prev %", "Now %", "This period"],
      rows: top.map(({ l, h }) => [h.heading, pct(l.prevPct, 0), pct(l.curPct, 0), eur(l.thisPeriod)]),
      actions: [{ label: "Open the draft claim", primary: true, nav: { page: "Claims & Finance", tab: "claims", claim: id } }, { label: "Open Dalkey project", nav: { page: "Projects", project: "p01", projectTab: "contract" } }] };
  }

  if (/profitab|best margin|most profit|margin/.test(q) && !p) {
    const ranked = s.projects.map(x => ({ x, f: finOf(x, s) })).sort((a, b) => b.f.profit - a.f.profit);
    const byMargin = s.projects.map(x => ({ x, f: finOf(x, s) })).sort((a, b) => (b.f.margin - b.x.targetMargin) - (a.f.margin - a.x.targetMargin));
    const top = ranked[0], below = marginAlerts(s);
    return { tool: "projects.financials", effect: "read",
      text: "By forecast profit, " + top.x.name + " leads at " + eur(top.f.profit) + " (" + pct(top.f.margin) + " on " + eurShort(top.f.revised) + "). Against its own target, " + byMargin[0].x.name + " is furthest ahead: " + pct(byMargin[0].f.margin) + " vs " + pct(byMargin[0].x.targetMargin) + ". "
        + (below.length ? below.map(b => b.name + " is the one below target at " + pct(finOf(b, s).margin) + " vs " + pct(b.targetMargin) + ".").join(" ") : "Every project is at or above its target.")
        + " These are illustrative demo figures.",
      cols: ["Project", "Forecast profit", "Margin", "Target"],
      rows: ranked.slice(0, 5).map(({ x, f }) => [x.name, eur(f.profit), pct(f.margin), pct(x.targetMargin)]),
      actions: [{ label: "Project profitability", primary: true, nav: { page: "Dashboard", tab: "profitability" } }, { label: "Open " + (below[0]?.ref || top.x.ref), nav: { page: "Projects", project: (below[0] || top.x).id, projectTab: "financials" } }] };
  }

  if (/commit|spend|cost|po|purchase/.test(q) && p) {
    const f = finOf(p, s);
    const open = s.pos.filter(x => x.projectId === p.id && x.status === "Committed");
    const pending = s.pos.filter(x => x.projectId === p.id && x.status === "Awaiting approval");
    return { tool: "projects.commitments", effect: "read",
      text: p.name + " (" + p.ref + "): " + eur(f.actual) + " actual cost posted plus " + eur(f.openPO) + " in open purchase orders, so " + eur(f.committed) + " committed against a revised contract of " + eur(f.revised) + ". "
        + open.filter(x => x.delivery !== "Delivered").length + " of the " + open.length + " open orders aren't delivered yet. "
        + (pending.length ? pending.map(x => x.ref + " (" + eur(x.value) + ") is waiting on your approval and isn't counted until you approve it.").join(" ") : "")
        + " Forecast margin " + pct(f.margin) + " vs " + pct(p.targetMargin) + " target.",
      cols: ["Order", "Supplier item", "Value", "Delivery"],
      rows: open.map(x => [x.ref, x.description, eur(x.value), x.delivery]),
      actions: [{ label: "Open project financials", primary: true, nav: { page: "Projects", project: p.id, projectTab: "procurement" } }, { label: "Purchase orders", nav: { page: "Procurement", tab: "orders" } }] };
  }

  if (/claim|valuation|submitted|unsubmitted/.test(q)) {
    const notSub = s.claims.filter(c => c.period === "2026-10" && (c.status === "Draft" || c.status === "Internal review" || c.status === "Not started"));
    const overdue = s.claims.filter(c => c.status === "Submitted" && c.assessmentDue && c.assessmentDue < "2026-10-20");
    return { tool: "claims.status", effect: "read",
      text: notSub.length + " October claims haven't gone to the client yet, " + eur(notSub.reduce((n, c) => n + c.amount, 0)) + " in drafts. "
        + (notSub.some(c => c.status === "Not started") ? "Dalkey (LE-2026-014) hasn't been started: it's due " + dateShort(project("p01", s)!.nextValuation) + " and SR-1043 supports a bigger claim this month. " : "")
        + (overdue.length ? overdue.map(c => project(c.projectId, s)!.name + " claim #" + c.number + " is past its assessment date (" + date(c.assessmentDue) + ").").join(" ") : ""),
      cols: ["Project", "Claim", "Status", "This period"],
      rows: notSub.map(c => [project(c.projectId, s)!.name, c.ref, c.status, c.status === "Not started" ? "—" : eur(c.amount)]),
      actions: [{ label: "Open Monthly Claims", primary: true, nav: { page: "Claims & Finance", tab: "claims" } }, { label: "Prepare Dalkey claim", ask: "Prepare this month's claim for project LE-2026-014" }] };
  }

  if (/lads|crew|who.*site|on site|site today|allocation|who's where|where/.test(q)) {
    const by: Record<string, string[]> = {};
    ALLOCATIONS.forEach(a => { if (!a.projectId) return; (by[a.projectId] = by[a.projectId] || []).push(personName(a.personId).split(" ")[0]); });
    const rows = Object.entries(by).map(([pid, names]) => { const pr = project(pid, s)!; return [pr.name, String(names.length), names.slice(0, 5).join(", ") + (names.length > 5 ? " +" + (names.length - 5) : ""), pr.ref]; })
      .sort((a, b) => Number(b[1]) - Number(a[1]));
    const staff = ALLOCATIONS.filter(a => EMPLOYEES.some(e => e.id === a.personId)).length, subs = ALLOCATIONS.length - staff;
    return { tool: "workforce.allocations", effect: "read",
      text: staff + " of our own lads and " + subs + " subcontractors are allocated across " + rows.length + " sites today (Tue 20 Oct). Site hours are 07:00–15:30; at Grand Canal Dock the crew starts 07:30 and Kevin and the Brennan cabling crew work 08:00–16:30 because the floor is occupied. Galway runs 08:00–16:30. " + labourIssues(s).length + " of yesterday's allocations still need confirming.",
      cols: ["Site", "Heads", "Who", "Ref"], rows,
      actions: [{ label: "Allocation board", primary: true, nav: { page: "Workforce", tab: "allocations" } }, { label: "Confirm yesterday's hours", nav: { page: "Workforce", tab: "timesheets" } }] };
  }

  if (/diesel|fuel/.test(q)) {
    const wk = s.fuel.filter(f => f.date >= "2026-10-12" && f.date <= "2026-10-18");
    const total = wk.reduce((n, f) => n + f.total, 0), litres = wk.reduce((n, f) => n + f.litres, 0);
    const un = fuelToAllocate(s);
    const byProj: Record<string, number> = {};
    wk.forEach(f => { const k = f.projectId ? project(f.projectId, s)!.name : f.state === "Overhead" ? "Overhead (office vehicles)" : "Not allocated"; byProj[k] = (byProj[k] || 0) + f.total; });
    return { tool: "fleet.fuel_summary", effect: "read",
      text: "Last week (12–18 Oct) we spent " + eur(total) + " on " + Math.round(litres).toLocaleString("en-IE") + " litres across " + wk.length + " fills. " + (un.length ? un.length + " transactions still need a project, " + eur(un.reduce((n, f) => n + f.total, 0)) + " in total, including one on card ••3308 flagged for a second fill inside 24 hours." : "Everything is allocated.") + " Figures come from the simulated card statement import.",
      cols: ["Allocated to", "Spend", "", ""],
      rows: Object.entries(byProj).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => [k, eur(v), "", ""]),
      actions: [{ label: "Allocate fuel", primary: true, nav: { page: "Fleet & Fuel", tab: "transactions" } }, { label: "Fuel reports", nav: { page: "Fleet & Fuel", tab: "reports" } }] };
  }

  if (/labour|hours|timesheet|overtime/.test(q)) {
    const lab = labourIssues(s);
    const k = kpis(s);
    return { tool: "workforce.timesheets", effect: "read",
      text: "Labour posted to projects so far is " + eur(k.labour) + ". From yesterday's WhatsApp submissions and Sync clock-ins, " + s.timesheets.filter(t => t.state === "Matched").length + " allocations matched and " + lab.length + " need someone to decide before they post.",
      cols: ["Person", "Issue", "PM said", "Sync said"],
      rows: lab.map(t => [personName(t.personId), t.state, t.pm ? (project(t.pm.projectId, s)?.ref || "—") + " " + t.pm.hours + "h" : "nothing", t.sync ? (project(t.sync.projectId, s)?.ref || "—") + " " + t.sync.hours + "h" : "no clock-in"]),
      actions: [{ label: "Review timesheets", primary: true, nav: { page: "Workforce", tab: "timesheets" } }] };
  }

  if (p) {
    const f = finOf(p, s);
    const c = claimFor(p.id, s);
    return { tool: "projects.summary", effect: "read",
      text: p.name + " (" + p.ref + ", " + TYPE_LABEL[p.type].toLowerCase() + "): revised contract " + eur(f.revised) + ", " + pct(f.progress, 0) + " certified. Committed " + eur(f.committed) + " (" + eur(f.actual) + " actual + " + eur(f.openPO) + " open POs). Forecast profit " + eur(f.profit) + ", margin " + pct(f.margin) + " against a " + pct(p.targetMargin) + " target (" + f.status.toLowerCase() + "). "
        + (c ? "October claim: " + c.status.toLowerCase() + (c.amount ? ", " + eur(c.amount) : "") + "." : ""),
      actions: [{ label: "Open project", primary: true, nav: { page: "Projects", project: p.id } }, { label: "Financials", nav: { page: "Projects", project: p.id, projectTab: "financials" } }] };
  }

  if (/approv|decision|waiting|sign/.test(q)) {
    const ap = pendingApprovals(s);
    return { tool: "work.approvals", effect: "read", text: ap.length + " things are waiting on your yes, " + eur(ap.filter(a => a.kind !== "Estimate").reduce((n, a) => n + a.value, 0)) + " in committed or claimed value (the tender is listed separately).",
      cols: ["Request", "Kind", "Value", "Raised"], rows: ap.map(a => [a.title, a.kind, eur(a.value), dateShort(a.raised)]),
      actions: [{ label: "Open approvals", primary: true, nav: { page: "Work" } }] };
  }

  // default: what's happening across the projects
  const k = kpis(s);
  const lines = briefingLines(s);
  return { tool: "briefing.summary", effect: "read",
    text: "Across the " + k.active + " live projects: " + eurShort(k.contract) + " revised contract value, " + eurShort(k.committed) + " committed (" + eurShort(k.actual) + " posted + " + eurShort(k.openPO) + " open POs), " + eurShort(k.labour) + " labour to date. " + briefingSentence(s) + " All figures are illustrative demo data.",
    cols: ["Area", "What needs you", "", ""], rows: lines.map(l => [l.k, l.v, "", ""]),
    actions: [{ label: "Open Monthly Claims", primary: true, nav: { page: "Claims & Finance", tab: "claims" } }, { label: "Dashboard", nav: { page: "Dashboard", tab: "executive" } }] };
}

/* Short text for the agent threads and the mini chat. */
export const answerText = (q: string) => answer(q).text;
export const ALL_PEOPLE_COUNT = EMPLOYEES.length + SUBCONTRACTORS.length;
