/* Site Operations helpers shared by SiteOps, the Dashboard and the Records
   relationship explorer. Read-only derivations from the live store. */

import type { LvState } from "./store";
import { sub } from "./store";
import { ALLOCATIONS } from "./seed";
import type { Project, SiteReport } from "./types";
import { TODAY } from "./format";

const SHORT: Record<string, string> = {
  p01: "Dalkey", p02: "Grand Canal Dock", p03: "Ballymount", p04: "Tallaght", p05: "Kimmage", p06: "Galway Medical",
  p07: "Santry", p08: "Docklands Hotel", p09: "Swords", p10: "Clondalkin", p11: "Rathmines", p12: "Oranmore"
};
const TINY: Record<string, string> = {
  p01: "Dalkey", p02: "GCD", p03: "Bmount", p04: "Tallaght", p05: "Kimmage", p06: "Galway",
  p07: "Santry", p08: "Docklands", p09: "Swords", p10: "Clond.", p11: "Rathm.", p12: "Oranmore"
};
/** "Dalkey", "Grand Canal Dock" … */
export const shortName = (p: Project | null | undefined) => (p ? SHORT[p.id] || p.name : "");
/** Very short label for chart axes. */
export const tinyName = (p: Project | null | undefined) => (p ? TINY[p.id] || p.ref.slice(-3) : "");

/** Head count for one allocation (a crew booking counts its people). */
export function headsFor(personId: string) {
  const s = sub(personId);
  if (!s) return 1;
  const m = /(\d+)-person/.exec(s.trade);
  return m ? Number(m[1]) : 1;
}

/** Who is booked on each site today, split staff vs subcontract. */
export function headsToday() {
  const out: Record<string, { staff: number; subs: number; total: number; people: string[] }> = {};
  ALLOCATIONS.filter(a => a.date === TODAY && a.projectId).forEach(a => {
    const k = a.projectId as string;
    const r = out[k] || (out[k] = { staff: 0, subs: 0, total: 0, people: [] });
    const n = headsFor(a.personId);
    if (a.personId.startsWith("s")) r.subs += n; else r.staff += n;
    r.total += n; r.people.push(a.personId);
  });
  return out;
}

/** Most recent report per project. */
export function latestReports(s: LvState) {
  const out: Record<string, SiteReport> = {};
  s.reports.forEach(r => { const c = out[r.projectId]; if (!c || r.date > c.date) out[r.projectId] = r; });
  return out;
}

/** Projects with people booked today but no report dated today. */
export function missingToday(s: LvState) {
  const heads = headsToday();
  const today = new Set(s.reports.filter(r => r.date === TODAY).map(r => r.projectId));
  return s.projects.filter(p => heads[p.id] && !today.has(p.id));
}

/** Sites with people booked today. */
export function activeToday(s: LvState) {
  const heads = headsToday();
  return s.projects.filter(p => heads[p.id]);
}

/** Booked hours for an allocation window, less a 30 minute break. */
export function bookedHours(start: string, end: string) {
  const m = (t: string) => { const [h, mi] = t.split(":").map(Number); return h * 60 + mi; };
  return Math.max(0, (m(end) - m(start) - 30) / 60);
}
