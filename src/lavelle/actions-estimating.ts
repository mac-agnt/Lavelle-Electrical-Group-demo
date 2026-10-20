/* Estimating helpers and actions. Size bands and turnaround follow what came
   out of the consultation: jobs under about €30,000 are often priced within a
   day; larger estimates take 2 days to 2 weeks. Effort days per band are a
   demo planning assumption, not measured performance. */

import { getState, update, logEvent, toast, setTab, personName, type LvState } from "./store";
import type { Approval, Enquiry } from "./types";
import { daysBetween, eur, TODAY } from "./format";

export const ESTIMATORS = ["e08", "e09"];

export const STAGES = ["Enquiry", "Drawings", "Take-off", "Cost estimate", "Review", "Quote", "Won/Lost", "Contract"];
export const OPEN_STAGES: Enquiry["stage"][] = ["New", "Drawings in", "Take-off", "Pricing", "Review"];
export const isOpenEnquiry = (e: Enquiry) => OPEN_STAGES.indexOf(e.stage) > -1;

export interface Band { key: string; label: string; turnaround: string; min: number; days: number; effort: number; }
export function band(value: number): Band {
  if (value < 30000) return { key: "small", label: "Under €30k", turnaround: "Within 1 day", min: 1, days: 1, effort: 0.5 };
  if (value < 150000) return { key: "medium", label: "€30k to €150k", turnaround: "2 to 5 days", min: 2, days: 5, effort: 2 };
  if (value < 400000) return { key: "large", label: "€150k to €400k", turnaround: "1 to 2 weeks", min: 7, days: 10, effort: 5 };
  return { key: "major", label: "€400k plus", turnaround: "Up to 2 weeks", min: 10, days: 14, effort: 8 };
}

/** Share of the estimating effort still to do at each stage (demo assumption). */
const REMAINING: Record<Enquiry["stage"], number> = { "New": 1, "Drawings in": 0.9, "Take-off": 0.7, "Pricing": 0.4, "Review": 0.1, "Submitted": 0, "Won": 0, "Lost": 0 };
export const effortLeft = (e: Enquiry) => band(e.value).effort * REMAINING[e.stage];

export const becameContract = (e: Enquiry, s: LvState = getState()) =>
  /Became contract/.test(e.note) || (e.id === "en101" && s.quoteStatus === "Contract drafted");

export function stageIndex(e: Enquiry, s: LvState = getState()): number {
  switch (e.stage) {
    case "New": return 0;
    case "Drawings in": return 1;
    case "Take-off": return 2;
    case "Pricing": return 3;
    case "Review": return 4;
    case "Submitted": return 5;
    case "Won": return becameContract(e, s) ? 7 : 6;
    default: return 6;
  }
}

/** Days the client gave us, received to due. */
export const allowedDays = (e: Enquiry) => daysBetween(e.received, e.due);
export const daysLeft = (e: Enquiry) => daysBetween(TODAY, e.due);
/** Small job priced the same or next day (EN-2026-102 is the live example). */
export const isSameDay = (e: Enquiry) => isOpenEnquiry(e) && e.value < 30000 && allowedDays(e) <= 1;
/** Client deadline shorter than the usual turnaround for its size band. */
export const isTight = (e: Enquiry) => isOpenEnquiry(e) && allowedDays(e) < band(e.value).min;

const NEXT: Partial<Record<Enquiry["stage"], Enquiry["stage"]>> = { "New": "Drawings in", "Drawings in": "Take-off", "Take-off": "Pricing", "Pricing": "Review" };
export const nextStage = (e: Enquiry) => NEXT[e.stage] || null;

/** Move an enquiry one stage on. Sending to Review raises an approval for Martin in Work. */
export function advanceEnquiry(id: string) {
  const s = getState();
  const e = s.enquiries.find(x => x.id === id); if (!e) return;
  const next = NEXT[e.stage]; if (!next) return;
  let approvals = s.approvals;
  if (next === "Review" && !s.approvals.some(a => a.refId === id)) {
    const ap: Approval = { id: "ap-" + id, kind: "Estimate", refId: id, title: "Tender submission: " + e.project, subject: e.client + ", estimated by " + personName(e.estimatorId),
      value: e.value, raisedById: e.estimatorId, raised: TODAY, projectId: null, status: "Awaiting you" };
    approvals = [ap, ...s.approvals];
  }
  update({ enquiries: s.enquiries.map(x => x.id === id ? { ...x, stage: next } : x), approvals });
  logEvent({ stream: "people", title: next === "Review" ? "Estimate sent for review" : "Enquiry moved on", note: e.ref + " " + e.project + " now at " + next + (next === "Review" ? ". Waiting on Martin in Work." : "."),
    actor: personName(e.estimatorId), rel: "Estimating", src: "Pulse", status: next === "Review" ? "awaiting" : "completed" });
  toast(e.ref + " moved to " + next + (next === "Review" ? ". Approval raised for Martin." : ""));
}

/** Countfire counts become an estimate: log it and open the Quote Builder. */
export function generateEstimateFromTakeoff(lines: number, value: number) {
  update(s => ({ enquiries: s.enquiries.map(e => e.id === "en101" && e.stage === "Take-off" ? { ...e, stage: "Pricing" } : e) }));
  logEvent({ stream: "people", title: "Estimate generated from take-off", note: "TO-0431 (simulated Countfire export): " + lines + " counted lines mapped to contract headings, " + eur(value) + " at take-off rates. Opened as QUO-2026-061.",
    actor: "Niall Hennessy", rel: "Estimating", src: "Pulse", status: "completed" });
  setTab("Estimating", "quote");
  toast("Estimate generated from TO-0431. Check rates and labour in the Quote Builder.");
}
