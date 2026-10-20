/* Shared shapes for the Lavelle Electrical Group demo. Every record points at
   its relations by stable id, so one change (a PO approved, a fuel line
   allocated, hours posted) shows up everywhere that reads it. */

export type ProjectType = "residential" | "commercial" | "industrial" | "small";
export type CostCat = "labour" | "materials" | "subcontract" | "plant" | "prelims";
export type Region = "Dublin" | "Galway";

export interface Client {
  id: string; name: string; kind: string; contact: string; email: string; phone: string;
  region: Region; xeroContact: string; terms: string;
}

export interface Project {
  id: string; ref: string; name: string; clientId: string; type: ProjectType; region: Region;
  location: string; pmId: string; foremanId: string;
  stage: string; start: string; finish: string;
  originalValue: number;
  /** Cost posted to date, by category. Excludes open PO commitments. */
  actual: Record<CostCat, number>;
  /** Forecast cost still to commit (not yet ordered or worked), by category. */
  ctc: Record<CostCat, number>;
  /** Original cost budget by category (from the estimate). */
  budget: Record<CostCat, number>;
  targetMargin: number;
  certifiedToDate: number; invoicedToDate: number; paidToDate: number;
  nextValuation: string; valuationDay: string;
  quoteRef: string; takeoffRef: string;
  summary: string;
  units?: number;
}

export interface ContractLine {
  id: string; projectId: string; code: string; heading: string; description: string;
  value: number; prevPct: number; suggestedPct: number;
}

export interface Variation {
  id: string; ref: string; projectId: string; title: string; value: number;
  status: "Approved" | "Pending approval" | "Priced" | "Rejected";
  raised: string; prevPct: number; suggestedPct: number; reason: string;
}

export type ClaimStatus = "Not started" | "Draft" | "Internal review" | "Submitted" | "Certified"
  | "Partially certified" | "Disputed" | "Invoiced" | "Paid";

export interface ClaimLine { lineId: string; prevPct: number; curPct: number; note: string; }

export interface Claim {
  id: string; ref: string; projectId: string; number: number; period: string; periodLabel: string;
  status: ClaimStatus;
  /** Value claimed this period (cumulative less previously certified). */
  amount: number;
  certified: number | null; certifiedDate: string;
  submitted: string; assessmentDue: string;
  invoiceId: string | null;
  /** Only the flagship claim carries line detail; others are summary records. */
  lines?: ClaimLine[]; varLines?: ClaimLine[];
  note: string; history: { at: string; text: string }[];
}

export type XeroState = "Not sent" | "Queued" | "Draft in Xero" | "Awaiting payment" | "Paid" | "Reconcile warning";

export interface Invoice {
  id: string; ref: string; projectId: string; clientId: string; claimId: string | null;
  issued: string; due: string; net: number; vatMode: VatMode; status: "Draft" | "Approved" | "Sent" | "Part paid" | "Paid";
  paid: number; xero: XeroState; xeroRef: string; period: string;
}

export type VatMode = "rct" | "13.5" | "23";

export interface Employee {
  id: string; name: string; role: string; group: "Office" | "Foreman" | "Electrician" | "Apprentice";
  rate: number; base: Region; phone: string; vanId: string | null; since: string; fictional: boolean;
  syncId: string;
}

export interface Subcontractor {
  id: string; name: string; company: string; trade: string; dayRate: number; rctRate: string;
  insuranceExpiry: string; status: "On site" | "Available" | "Booked"; fictional: boolean;
}

export interface Allocation {
  id: string; personId: string; projectId: string | null; date: string; start: string; end: string;
  note: string;
}

export type TimesheetState = "Matched" | "Mismatch" | "Missing hours" | "No clock-in" | "Approved" | "Posted";

export interface Timesheet {
  id: string; personId: string; date: string;
  pm: { projectId: string | null; hours: number; ot: number } | null;
  sync: { projectId: string | null; in: string; out: string; hours: number } | null;
  state: TimesheetState; issue: string; proposal: { projectId: string; hours: number; ot: number } | null;
}

export interface Supplier {
  id: string; name: string; category: string; account: string; terms: string; contact: string;
  region: Region; onTime: number; fictional: boolean;
}

export type PoStatus = "Awaiting approval" | "Committed" | "Posted" | "Rejected";
export type Delivery = "Not due" | "Awaiting delivery" | "Part delivered" | "Delivered" | "Late";

export interface PurchaseOrder {
  id: string; ref: string; supplierId: string; projectId: string; category: CostCat;
  description: string; value: number; ordered: string; due: string;
  status: PoStatus; delivery: Delivery; invoiced: boolean; approverId: string; raisedById: string;
}

export interface Vehicle {
  id: string; reg: string; make: string; kind: "Van" | "Car"; driverId: string | null;
  cardId: string; base: Region; odometer: number; nextService: string;
}

export interface FuelCard { id: string; last4: string; holderId: string | null; vehicleId: string | null; limit: number; status: "Active" | "Stopped"; }

export type FuelState = "Auto-allocated" | "Allocated" | "Needs allocation" | "Missing cardholder" | "Investigate" | "Overhead";

export interface FuelTxn {
  id: string; date: string; time: string; cardId: string; vehicleId: string | null; holderId: string | null;
  station: string; litres: number; ppl: number; total: number; projectId: string | null;
  state: FuelState; flag: string; suggestedProjectId: string | null;
}

export interface Enquiry {
  id: string; ref: string; client: string; project: string; type: ProjectType; region: Region;
  received: string; due: string; value: number; estimatorId: string;
  stage: "New" | "Drawings in" | "Take-off" | "Pricing" | "Review" | "Submitted" | "Won" | "Lost";
  source: string; note: string;
}

export interface TakeoffItem { symbol: string; description: string; qty: number; unit: string; heading: string; rate: number; }

export interface QuoteLine {
  id: string; heading: string; description: string; qty: number; unit: string;
  matRate: number; labHrs: number;
}

export interface SiteReport {
  id: string; ref: string; projectId: string; foremanId: string; date: string;
  workers: number; done: string; progress: number; delays: string; materials: string;
  photos: number; next: string; status: "Submitted" | "Reviewed" | "Approved";
  unitsSecondFix?: number[];
}

export interface Unit {
  projectId: string; block: string; no: number;
  firstFix: number; secondFix: number; testing: number; snagging: number;
}

export interface Issue {
  id: string; projectId: string; title: string; kind: "Delay" | "Issue" | "RFI" | "Safety";
  severity: "High" | "Medium" | "Low"; raised: string; ownerId: string; status: "Open" | "Mitigated" | "Closed"; impact: string;
}

export interface Inspection {
  id: string; projectId: string; kind: string; standard: string; date: string;
  inspectorId: string; result: "Pass" | "Pass with actions" | "Fail" | "Booked"; actions: number;
}

export interface Task {
  id: string; title: string; ownerId: string; priority: "High" | "Medium" | "Low";
  due: string; projectId: string | null; status: "Not started" | "In progress" | "Review" | "Done";
  link: { page: string; tab?: string; project?: string };
}

export interface Approval {
  id: string; kind: "PO" | "Claim" | "Timesheet" | "Variation" | "Estimate" | "Overtime" | "Fuel";
  refId: string; title: string; subject: string; value: number; raisedById: string; raised: string;
  projectId: string | null; status: "Awaiting you" | "Approved" | "Rejected";
}

export interface ActivityEvent {
  id: string; at: string; time: string; stream: "data" | "people" | "ai";
  title: string; note: string; actor: string; rel: string; src: string;
  status: "completed" | "awaiting" | "failed" | "working";
}

export interface SyncEvent { id: string; at: string; kind: string; text: string; state: "ok" | "warn" | "info"; }

export interface DocumentRec {
  id: string; projectId: string | null; title: string; kind: string; rev: string; added: string; by: string; size: string;
}

export interface NavTarget { page: string; tab?: string; project?: string | null; projectTab?: string; claim?: string | null; }
