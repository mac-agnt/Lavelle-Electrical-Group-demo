/* Procurement helpers. The four money states of a purchase order:
   1 PO committed (approved, counted in committed cost as an open commitment)
   2 Materials received (still an open commitment)
   3 Supplier invoiced (matched to the PO)
   4 Actual cost posted (moves from open commitment to actual, counted once)
   In Pulse, matching the supplier invoice posts it, so 3 and 4 happen together. */

import { PURCHASE_ORDERS, SUPPLIERS } from "./seed";
import type { PurchaseOrder, Supplier } from "./types";
import { addDays, eur, TODAY } from "./format";
import { logEvent, toast, project } from "./store";

export const LIFECYCLE = ["PO committed", "Materials received", "Supplier invoiced", "Actual cost posted"];

const SEED_POSTED = new Set(PURCHASE_ORDERS.filter(p => p.status === "Posted").map(p => p.id));

export const supplierOf = (id: string): Supplier => SUPPLIERS.find(s => s.id === id) || SUPPLIERS[0];
export const supplierShort = (s: Supplier) => s.name.replace(/ (Electrical Wholesale|Lighting Distributors|Containment Ltd|Supplies|Systems Supply)$/, "");
export const sumPO = (l: PurchaseOrder[]) => l.reduce((n, p) => n + p.value, 0);

/** When the PO was posted to actual cost. Seeded posts use their delivery date; anything posted in the demo is today. */
export const postedOn = (po: PurchaseOrder) => po.status !== "Posted" ? null : SEED_POSTED.has(po.id) ? po.due : TODAY;

export const isOpen = (po: PurchaseOrder) => po.status === "Committed";
export const isLate = (po: PurchaseOrder) => po.status === "Committed" && (po.delivery === "Late" || (po.delivery === "Awaiting delivery" && po.due < TODAY));
export const dueThisWeek = (po: PurchaseOrder) => po.status === "Committed" && po.delivery === "Awaiting delivery" && !isLate(po) && po.due <= addDays(TODAY, 7);
export const dueLater = (po: PurchaseOrder) => po.status === "Committed" && po.delivery === "Awaiting delivery" && po.due > addDays(TODAY, 7);
export const deliveredNotInvoiced = (po: PurchaseOrder) => po.status === "Committed" && po.delivery === "Delivered" && !po.invoiced;
export const deliveryState = (po: PurchaseOrder) => isLate(po) ? "Late" : po.delivery;

export function invoiceState(po: PurchaseOrder) {
  if (po.status === "Posted") return "Invoiced, posted";
  if (po.status === "Rejected") return "Not applicable";
  if (po.status === "Awaiting approval") return "Not ordered";
  return po.delivery === "Delivered" ? "Awaiting invoice" : "Not invoiced";
}

/** Position on the LIFECYCLE steps (index of the current step; 4 = all done). */
export function lifecycleAt(po: PurchaseOrder) {
  if (po.status === "Awaiting approval" || po.status === "Rejected") return 0;
  if (po.status === "Posted") return 4;
  return po.delivery === "Delivered" ? 2 : 1;
}

/** A material group read from the PO description. */
export function materialGroup(desc: string) {
  const d = desc.toLowerCase();
  if (/detector|smoke|sounder|l1 panel|fire/.test(d)) return "Fire detection";
  if (/cat6a|data|nurse call|patch/.test(d)) return "Data & comms";
  if (/consumer unit|board|busbar|tap-off|ups|switchboard|distribution|meter/.test(d)) return "Distribution & boards";
  if (/tray|basket|trunking|^containment/.test(d)) return "Containment";
  if (/cable|swa|twin/.test(d)) return "Cable";
  if (/led|light|luminaire|emergency|spots|bulkhead|fitting|exit/.test(d)) return "Lighting & emergency";
  return "Wiring accessories";
}

/** Log a delivery chase. No email leaves the demo. */
export function chaseDelivery(po: PurchaseOrder) {
  const s = supplierOf(po.supplierId);
  logEvent({ stream: "people", title: "Supplier delivery chased", note: po.ref + " " + eur(po.value) + " with " + s.name + " for " + (project(po.projectId)?.ref || "") + ". Chase logged (simulated, no email sent).",
    actor: "Orla Dempsey", rel: project(po.projectId)?.ref || "Procurement", src: "Pulse", status: "awaiting" });
  toast("Chase logged for " + po.ref + " with " + s.name + ". No email sent from the demo.");
}
