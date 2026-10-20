/* Projects module helpers. Read-only selectors over the shared store plus the
   one simulated action (report export). Money still comes from fin(). */

import { finOf, toast, claimFor, type LvState } from "./store";
import { fuelToAllocate, labourIssues } from "./answers";
import { ISSUES } from "./seed";
import type { Fin } from "./calc";
import type { NavTarget, Project, PurchaseOrder, Timesheet } from "./types";
import { TODAY, daysBetween, dateShort, eur, pct } from "./format";

/** A committed order is late once its due date has passed without full delivery. */
export function isLatePO(po: PurchaseOrder) {
  if (po.status !== "Committed") return false;
  if (po.delivery === "Late") return true;
  return (po.delivery === "Awaiting delivery" || po.delivery === "Part delivered") && po.due < TODAY;
}
export const daysLate = (po: PurchaseOrder) => Math.max(0, daysBetween(po.due, TODAY));

export const marginTone = (f: Fin): "ok" | "warn" | "bad" => f.status === "On target" ? "ok" : f.status === "Watch" ? "warn" : "bad";
export const riskKey = (f: Fin) => f.status === "On target" ? "on" : f.status === "Watch" ? "watch" : "below";
/** Gap to target in percentage points, signed. */
export const gapPts = (f: Fin) => (f.gap * 100 >= 0 ? "+" : "") + (f.gap * 100).toFixed(1) + " pts";

/** Operational status, separate from margin status. */
export function opStatus(p: Project): { label: string; tone: "accent" | "ok" | "info" } {
  if (/mobilis/i.test(p.stage)) return { label: "Mobilising", tone: "info" };
  if (daysBetween(TODAY, p.finish) <= 45) return { label: "Completing", tone: "ok" };
  return { label: "Live", tone: "accent" };
}

/** Share of the programme elapsed, 0..1. */
export function timeElapsed(p: Project) {
  const total = daysBetween(p.start, p.finish);
  return total > 0 ? Math.max(0, Math.min(1, daysBetween(p.start, TODAY) / total)) : 0;
}

export const touchesProject = (t: Timesheet, id: string) =>
  t.pm?.projectId === id || t.sync?.projectId === id || t.proposal?.projectId === id;

/** Paid hours for a shift such as 07:00 to 15:30, less a 30 minute break. */
export function shiftHours(start: string, end: string) {
  const m = (x: string) => { const [h, mm] = x.split(":").map(Number); return h * 60 + mm; };
  return Math.max(0, (m(end) - m(start)) / 60 - 0.5);
}

export interface Flag { tone: "bad" | "warn"; kind: string; title: string; sub: string; nav: NavTarget; }

/** Everything on a project that needs someone, built from live state. */
export function projectFlags(p: Project, s: LvState): Flag[] {
  const f = finOf(p, s);
  const out: Flag[] = [];
  const ws = (projectTab: string): NavTarget => ({ page: "Projects", project: p.id, projectTab });
  if (f.status !== "On target") {
    out.push({ tone: f.status === "Below target" ? "bad" : "warn", kind: "Margin",
      title: "Forecast margin " + pct(f.margin) + " against a " + pct(f.target) + " target",
      sub: gapPts(f) + ". Profit " + eur(f.profit) + " versus " + eur(f.revised * f.target) + " at target.", nav: ws("financials") });
  }
  s.pos.filter(po => po.projectId === p.id && isLatePO(po)).forEach(po => out.push({ tone: "bad", kind: "Delivery",
    title: po.ref + " late by " + daysLate(po) + " day" + (daysLate(po) === 1 ? "" : "s"),
    sub: po.description + ", " + eur(po.value) + ", due " + dateShort(po.due) + " (" + po.delivery.toLowerCase() + ").", nav: ws("procurement") }));
  s.pos.filter(po => po.projectId === p.id && po.status === "Awaiting approval").forEach(po => out.push({ tone: "warn", kind: "PO",
    title: po.ref + " awaiting approval, " + eur(po.value), sub: po.description + ". Not yet committed against the project.", nav: ws("procurement") }));
  s.claims.filter(c => c.projectId === p.id && c.status === "Submitted" && c.assessmentDue && c.assessmentDue < TODAY).forEach(c => out.push({ tone: "bad", kind: "Claim",
    title: c.ref + " assessment overdue", sub: eur(c.amount) + " submitted " + dateShort(c.submitted) + ", assessment was due " + dateShort(c.assessmentDue) + ".", nav: ws("claims") }));
  s.claims.filter(c => c.projectId === p.id && c.status === "Disputed").forEach(c => out.push({ tone: "bad", kind: "Claim",
    title: c.ref + " disputed by client", sub: c.note || "Client QS has disputed part of the valuation.", nav: ws("claims") }));
  const cur = claimFor(p.id, s);
  const due = daysBetween(TODAY, p.nextValuation);
  if (due >= 0 && due <= 7 && (!cur || cur.status === "Not started" || cur.status === "Draft" || cur.status === "Internal review")) {
    out.push({ tone: "warn", kind: "Valuation", title: "Valuation due " + dateShort(p.nextValuation) + " (" + (due === 0 ? "today" : due + " days") + ")",
      sub: cur ? cur.ref + " is " + cur.status.toLowerCase() + "." : "No claim started for this period.", nav: p.id === "p01" ? ws("contract") : ws("claims") });
  }
  const hrs = labourIssues(s).filter(t => touchesProject(t, p.id));
  if (hrs.length) out.push({ tone: "warn", kind: "Hours", title: hrs.length + " labour allocation" + (hrs.length === 1 ? "" : "s") + " from Mon 19 Oct to confirm",
    sub: "Sync clock-in and PM submission disagree. Hours don't post to labour cost until confirmed.", nav: ws("workforce") });
  const fuel = fuelToAllocate(s).filter(x => x.suggestedProjectId === p.id);
  if (fuel.length) out.push({ tone: "warn", kind: "Fuel", title: fuel.length + " fuel transaction" + (fuel.length === 1 ? "" : "s") + " suggested for this project",
    sub: eur(fuel.reduce((n, x) => n + x.total, 0)) + " not yet in plant & fuel cost.", nav: { page: "Fleet & Fuel", tab: "transactions" } });
  ISSUES.filter(i => i.projectId === p.id && i.status === "Open" && i.severity === "High").forEach(i => out.push({ tone: "warn", kind: i.kind,
    title: i.title, sub: i.impact, nav: ws("programme") }));
  return out;
}

export function exportReport(name: string) {
  toast("Export simulated: " + name + ". No file was created.");
}
