/* Lavelle Electrical Group: demo dataset.

   Every operational and financial figure in this file is ILLUSTRATIVE DEMO
   DATA. Clients, staff (other than Martin Lavelle), suppliers, contract values,
   costs and margins are invented to show how Pulse would work. They are not
   Lavelle Electrical Group's actual performance or contracts.

   The headline figures reconcile by construction:
     12 active projects, revised contract value €8.42m
     actual cost posted + open PO commitments = €3.18m
     labour posted to date = €1.26m
     claims drafted but not submitted = €428,600
     7 approvals waiting on Martin                                        */

import type {
  Client, Project, ContractLine, Variation, Claim, Invoice, Employee, Subcontractor, Allocation,
  Timesheet, Supplier, PurchaseOrder, Vehicle, FuelCard, FuelTxn, Enquiry, TakeoffItem, QuoteLine,
  SiteReport, Unit, Issue, Inspection, Task, Approval, ActivityEvent, SyncEvent, DocumentRec, CostCat, ProjectType
} from "./types";

export const DEMO_NOTE = "Illustrative demo data. Not Lavelle Electrical Group's actual figures.";

export const TYPE_LABEL: Record<ProjectType, string> = {
  residential: "Residential development", commercial: "Commercial fit-out", industrial: "Industrial", small: "Small works"
};
/** Demo assumptions, editable per contract. Not company performance. */
export const DEFAULT_TARGET: Record<ProjectType, number> = { commercial: 0.24, industrial: 0.18, residential: 0.13, small: 0.28 };
export const CATS: CostCat[] = ["labour", "materials", "subcontract", "plant", "prelims"];
export const CAT_LABEL: Record<CostCat, string> = { labour: "Labour", materials: "Materials", subcontract: "Subcontract", plant: "Plant & fuel", prelims: "Preliminaries" };

/* ── Clients (fictional) ─────────────────────────────────────────────── */
export const CLIENTS: Client[] = [
  { id: "c1", name: "Seafield Homes Ltd", kind: "Developer", contact: "Eimear Hanlon", email: "eimear@seafieldhomes.example", phone: "01 555 0141", region: "Dublin", xeroContact: "SEAFIELD-HOMES", terms: "30 days from certificate" },
  { id: "c2", name: "Harcourt Fit-Out Partners", kind: "Main contractor", contact: "Rob Delaney", email: "rob.delaney@harcourtfitout.example", phone: "01 555 0177", region: "Dublin", xeroContact: "HARCOURT-FOP", terms: "30 days, RCT" },
  { id: "c3", name: "Ballymount Logistics Park DAC", kind: "Developer", contact: "Siobhán Rafter", email: "srafter@ballymountlp.example", phone: "01 555 0102", region: "Dublin", xeroContact: "BALLYMOUNT-LP", terms: "30 days from certificate" },
  { id: "c4", name: "Tallaght Living Ltd", kind: "Developer", contact: "Peter Considine", email: "peter@tallaghtliving.example", phone: "01 555 0193", region: "Dublin", xeroContact: "TALLAGHT-LIVING", terms: "45 days" },
  { id: "c5", name: "Kimmage Village Homes", kind: "Developer", contact: "Ann Furlong", email: "ann@kimmagevillage.example", phone: "01 555 0128", region: "Dublin", xeroContact: "KIMMAGE-VH", terms: "30 days" },
  { id: "c6", name: "Western Health Partners", kind: "Healthcare operator", contact: "Dr Fionn Garvey", email: "estates@westernhealth.example", phone: "091 555 044", region: "Galway", xeroContact: "WESTERN-HP", terms: "30 days" },
  { id: "c7", name: "Northside Data Centres Ltd", kind: "Owner-operator", contact: "Karen Moynihan", email: "kmoynihan@northsidedc.example", phone: "01 555 0166", region: "Dublin", xeroContact: "NORTHSIDE-DC", terms: "30 days" },
  { id: "c8", name: "Liffey Quay Hotels", kind: "Hotel group", contact: "James Brophy", email: "projects@liffeyquayhotels.example", phone: "01 555 0150", region: "Dublin", xeroContact: "LIFFEY-QH", terms: "30 days" },
  { id: "c9", name: "Pavilion Retail Group", kind: "Retailer", contact: "Lorna Kiely", email: "lorna@pavilionretail.example", phone: "01 555 0112", region: "Dublin", xeroContact: "PAVILION-RG", terms: "30 days" },
  { id: "c10", name: "Dublin Schools Building Trust", kind: "Education body", contact: "Mairéad Walsh", email: "facilities@dsbt.example", phone: "01 555 0134", region: "Dublin", xeroContact: "DSBT", terms: "30 days" },
  { id: "c11", name: "Rathmines Court Management Co.", kind: "Management company", contact: "Hugh Ennis", email: "hugh@rathminescourt.example", phone: "01 555 0109", region: "Dublin", xeroContact: "RATHMINES-CMC", terms: "14 days" },
  { id: "c12", name: "Atlantic Foods Ireland", kind: "Manufacturer", contact: "Declan Fahey", email: "dfahey@atlanticfoods.example", phone: "091 555 071", region: "Galway", xeroContact: "ATLANTIC-FOODS", terms: "30 days" }
];

/* ── People ─────────────────────────────────────────────────────────────
   Martin Lavelle is the founder. Every other name is fictional. */
const E = (id: string, name: string, role: string, group: Employee["group"], rate: number, base: "Dublin" | "Galway", since: string, vanId: string | null, phone: string): Employee =>
  ({ id, name, role, group, rate, base, since, vanId, phone, fictional: id !== "e01", syncId: "SY-" + id.slice(1).padStart(4, "0") });

export const EMPLOYEES: Employee[] = [
  E("e01", "Martin Lavelle", "Managing Director", "Office", 0, "Dublin", "2015-03-02", "v17", "087 000 0001"),
  E("e02", "Gráinne Fitzpatrick", "Contracts Manager", "Office", 0, "Dublin", "2017-09-04", "v18", "087 000 0002"),
  E("e03", "Colm Kinsella", "Project Manager", "Office", 0, "Dublin", "2018-01-15", null, "087 000 0003"),
  E("e04", "Conor Mulvihill", "Project Manager", "Office", 0, "Dublin", "2019-05-20", null, "087 000 0004"),
  E("e05", "Aisling Brennan", "Project Manager", "Office", 0, "Dublin", "2020-02-10", null, "087 000 0005"),
  E("e06", "Ronan Keane", "Project Manager (Galway)", "Office", 0, "Galway", "2021-06-14", null, "087 000 0006"),
  E("e07", "Shane Gallagher", "Quantity Surveyor", "Office", 0, "Dublin", "2020-08-24", null, "087 000 0007"),
  E("e08", "Niall Hennessy", "Senior Electrical Estimator", "Office", 0, "Dublin", "2018-11-05", null, "087 000 0008"),
  E("e09", "Sinéad Corcoran", "Electrical Estimator", "Office", 0, "Dublin", "2022-03-07", null, "087 000 0009"),
  E("e10", "Orla Dempsey", "Office Administrator", "Office", 0, "Dublin", "2019-10-01", null, "087 000 0010"),
  E("e11", "Ciara Nolan", "Accounts & Payroll", "Office", 0, "Dublin", "2021-01-11", null, "087 000 0011"),
  E("e12", "Marty Doyle", "Foreman", "Foreman", 48, "Dublin", "2016-04-18", "v01", "087 000 0012"),
  E("e13", "Declan Ryan", "Foreman", "Foreman", 48, "Dublin", "2017-02-27", "v02", "087 000 0013"),
  E("e14", "Fergal Byrne", "Foreman", "Foreman", 48, "Dublin", "2018-06-11", "v03", "087 000 0014"),
  E("e15", "Pádraig Quinn", "Foreman", "Foreman", 48, "Dublin", "2019-03-04", "v04", "087 000 0015"),
  E("e16", "Eoin Kavanagh", "Foreman (Galway)", "Foreman", 48, "Galway", "2021-07-05", "v05", "087 000 0016"),
  E("e17", "Dara Fahy", "Electrician", "Electrician", 40, "Dublin", "2017-08-14", "v06", "087 000 0017"),
  E("e18", "Kevin Murray", "Electrician", "Electrician", 40, "Dublin", "2018-02-05", "v07", "087 000 0018"),
  E("e19", "Liam Carroll", "Electrician", "Electrician", 40, "Dublin", "2018-09-17", null, "087 000 0019"),
  E("e20", "Seán Whelan", "Electrician", "Electrician", 40, "Dublin", "2019-01-21", "v08", "087 000 0020"),
  E("e21", "Barry O'Brien", "Electrician", "Electrician", 40, "Dublin", "2019-04-08", null, "087 000 0021"),
  E("e22", "Ciarán Lynch", "Electrician", "Electrician", 40, "Dublin", "2019-11-11", "v09", "087 000 0022"),
  E("e23", "Darren Kehoe", "Electrician", "Electrician", 40, "Dublin", "2020-01-13", null, "087 000 0023"),
  E("e24", "Gavin McCann", "Electrician", "Electrician", 40, "Dublin", "2020-05-25", "v10", "087 000 0024"),
  E("e25", "Jamie Dunne", "Electrician", "Electrician", 40, "Dublin", "2020-09-07", null, "087 000 0025"),
  E("e26", "Mark Tierney", "Electrician", "Electrician", 40, "Dublin", "2021-02-15", "v11", "087 000 0026"),
  E("e27", "Paul Farrell", "Electrician", "Electrician", 40, "Dublin", "2021-06-28", "v12", "087 000 0027"),
  E("e28", "Rory Moran", "Electrician", "Electrician", 40, "Dublin", "2022-01-10", null, "087 000 0028"),
  E("e29", "Stephen Hayes", "Electrician", "Electrician", 40, "Galway", "2022-04-04", "v13", "087 000 0029"),
  E("e30", "Tomás Ó Súilleabháin", "Electrician", "Electrician", 40, "Galway", "2022-08-22", "v14", "087 000 0030"),
  E("e31", "Alan Cullen", "Electrician", "Electrician", 40, "Dublin", "2023-02-06", null, "087 000 0031"),
  E("e32", "Brian Healy", "Electrician (chargehand)", "Electrician", 42, "Dublin", "2017-05-15", "v15", "087 000 0032"),
  E("e33", "Gerry Malone", "Electrician", "Electrician", 40, "Dublin", "2023-09-18", null, "087 000 0033"),
  E("e34", "Cian Daly", "Apprentice (4th year)", "Apprentice", 29, "Dublin", "2023-01-09", null, "087 000 0034"),
  E("e35", "Adam Kearney", "Apprentice (3rd year)", "Apprentice", 25, "Dublin", "2024-01-08", null, "087 000 0035"),
  E("e36", "Josh Lawlor", "Apprentice (2nd year)", "Apprentice", 21, "Dublin", "2025-01-13", null, "087 000 0036"),
  E("e37", "Oisín Murphy", "Apprentice (1st year)", "Apprentice", 18, "Dublin", "2026-01-12", null, "087 000 0037"),
  E("e38", "Luke Ennis", "Apprentice (3rd year)", "Apprentice", 25, "Dublin", "2024-01-08", null, "087 000 0038"),
  E("e39", "Evan Foley", "Apprentice (2nd year)", "Apprentice", 21, "Dublin", "2025-01-13", null, "087 000 0039"),
  E("e40", "Conall Reid", "Apprentice (4th year)", "Apprentice", 29, "Galway", "2023-01-09", null, "087 000 0040")
];

export const SUBCONTRACTORS: Subcontractor[] = [
  { id: "s01", name: "Philip Kenny", company: "P. Kenny Electrical (sole trader)", trade: "Electrician, labour only", dayRate: 340, rctRate: "20%", insuranceExpiry: "2027-02-28", status: "On site", fictional: true },
  { id: "s02", name: "Tadhg Brennan", company: "TB Electrical Services", trade: "Electrician, labour only", dayRate: 340, rctRate: "20%", insuranceExpiry: "2026-12-31", status: "On site", fictional: true },
  { id: "s03", name: "Wojciech Nowak", company: "WN Electrical Ltd", trade: "Electrician, labour only", dayRate: 350, rctRate: "0%", insuranceExpiry: "2027-04-30", status: "On site", fictional: true },
  { id: "s04", name: "Kieran Dolan", company: "Dolan Electrical", trade: "Electrician, labour only", dayRate: 340, rctRate: "20%", insuranceExpiry: "2026-11-15", status: "On site", fictional: true },
  { id: "s05", name: "Andrius Petrauskas", company: "AP Install Ltd", trade: "Electrician, labour only", dayRate: 345, rctRate: "0%", insuranceExpiry: "2027-01-31", status: "On site", fictional: true },
  { id: "s06", name: "Noel Fagan", company: "Fagan Electrical", trade: "Electrician, labour only", dayRate: 330, rctRate: "20%", insuranceExpiry: "2027-03-31", status: "On site", fictional: true },
  { id: "s07", name: "Derek Quigley", company: "DQ Electrical", trade: "Electrician, labour only", dayRate: 330, rctRate: "20%", insuranceExpiry: "2026-10-31", status: "On site", fictional: true },
  { id: "s08", name: "Mihai Popescu", company: "MP Power Ltd", trade: "Electrician, data hall", dayRate: 360, rctRate: "0%", insuranceExpiry: "2027-05-31", status: "On site", fictional: true },
  { id: "s09", name: "Ger Hickey", company: "Hickey Electrical", trade: "Electrician, data hall", dayRate: 360, rctRate: "20%", insuranceExpiry: "2027-01-31", status: "On site", fictional: true },
  { id: "s10", name: "Emmet Shields", company: "Shields Electrical", trade: "Electrician, labour only", dayRate: 335, rctRate: "20%", insuranceExpiry: "2027-06-30", status: "On site", fictional: true },
  { id: "s11", name: "Brennan Data Cabling Ltd", company: "Brennan Data Cabling Ltd", trade: "Structured cabling (3-person crew)", dayRate: 1080, rctRate: "0%", insuranceExpiry: "2027-03-31", status: "On site", fictional: true },
  { id: "s12", name: "Kestrel Fire & Security", company: "Kestrel Fire & Security Ltd", trade: "Fire alarm commissioning (I.S. 3218)", dayRate: 720, rctRate: "0%", insuranceExpiry: "2027-02-28", status: "Booked", fictional: true },
  { id: "s13", name: "Liffey Access Hire", company: "Liffey Access Hire Ltd", trade: "MEWP & access", dayRate: 260, rctRate: "0%", insuranceExpiry: "2027-08-31", status: "Available", fictional: true },
  { id: "s14", name: "Midland Core Drilling", company: "Midland Core Drilling Ltd", trade: "Core drilling & firestopping", dayRate: 640, rctRate: "0%", insuranceExpiry: "2026-12-31", status: "Booked", fictional: true },
  { id: "s15", name: "Pale HV Jointing", company: "Pale HV Jointing Ltd", trade: "HV/LV jointing", dayRate: 980, rctRate: "0%", insuranceExpiry: "2027-01-31", status: "Available", fictional: true }
];

/* ── Projects ───────────────────────────────────────────────────────────
   seed: [actual by category], forecast total cost, open POs come from PURCHASE_ORDERS. */
type Seed = Omit<Project, "ctc" | "budget" | "targetMargin"> & { ftc: number; budgetOverride?: Record<CostCat, number>; ctcOverride?: Record<CostCat, number> };
const A = (labour: number, materials: number, subcontract: number, plant: number, prelims: number): Record<CostCat, number> => ({ labour, materials, subcontract, plant, prelims });

const PROJECT_SEEDS: Seed[] = [
  { id: "p01", ref: "LE-2026-014", name: "Dalkey Residential Development", clientId: "c1", type: "residential", region: "Dublin", location: "Dalkey, Co. Dublin",
    pmId: "e03", foremanId: "e12", stage: "Second fix", start: "2026-05-11", finish: "2027-03-26", originalValue: 600000,
    actual: A(98400, 78600, 14200, 3800, 10000), ftc: 533100, certifiedToDate: 191750, invoicedToDate: 191750, paidToDate: 148900,
    nextValuation: "2026-10-26", valuationDay: "Last Monday of month", quoteRef: "QUO-2026-031", takeoffRef: "TO-0412", units: 24,
    summary: "24 houses. First fix complete on all units; second fix running block by block. Valuation for October is due." },
  { id: "p02", ref: "LE-2026-008", name: "Grand Canal Dock Office Fit-out", clientId: "c2", type: "commercial", region: "Dublin", location: "Grand Canal Dock, Dublin 2",
    pmId: "e04", foremanId: "e13", stage: "Second fix & ceilings", start: "2026-03-02", finish: "2026-12-18", originalValue: 1240000,
    actual: A(322600, 248400, 62800, 9200, 25800), ftc: 1034800, certifiedToDate: 742000, invoicedToDate: 742000, paidToDate: 655400,
    nextValuation: "2026-10-23", valuationDay: "4th Friday", quoteRef: "QUO-2025-118", takeoffRef: "TO-0377",
    summary: "Cat A + B across four floors. Ceiling services clash on L3–L4 forced a containment re-route; labour is running over budget.",
    budgetOverride: A(372000, 368000, 128000, 22000, 79760), ctcOverride: A(88000, 57400, 75440, 12800, 53960) },
  { id: "p03", ref: "LE-2026-003", name: "Ballymount Logistics Warehouse", clientId: "c3", type: "industrial", region: "Dublin", location: "Ballymount, Dublin 24",
    pmId: "e05", foremanId: "e14", stage: "Containment & LV distribution", start: "2026-04-13", finish: "2027-02-12", originalValue: 1480000,
    actual: A(176000, 214500, 31600, 8900, 17000), ftc: 1204700, certifiedToDate: 452000, invoicedToDate: 452000, paidToDate: 380600,
    nextValuation: "2026-10-28", valuationDay: "Last Wednesday", quoteRef: "QUO-2026-009", takeoffRef: "TO-0389",
    summary: "22,000 m² distribution warehouse. High-bay lighting and LV board install; ESB connection date still to be confirmed." },
  { id: "p04", ref: "LE-2025-041", name: "Tallaght Residential Scheme – Phase 2", clientId: "c4", type: "residential", region: "Dublin", location: "Tallaght, Dublin 24",
    pmId: "e05", foremanId: "e15", stage: "First fix (Blocks C–D)", start: "2025-11-03", finish: "2027-05-28", originalValue: 1960000,
    actual: A(248000, 201400, 33800, 7600, 21200), ftc: 1701300, certifiedToDate: 588000, invoicedToDate: 588000, paidToDate: 512300,
    nextValuation: "2026-10-30", valuationDay: "Last Friday", quoteRef: "QUO-2025-092", takeoffRef: "TO-0355", units: 62,
    summary: "62 apartments across four blocks. Blocks A–B in second fix, C–D in first fix." },
  { id: "p05", ref: "LE-2026-009", name: "Kimmage Residential Units", clientId: "c5", type: "residential", region: "Dublin", location: "Kimmage, Dublin 12",
    pmId: "e03", foremanId: "e32", stage: "Testing & snagging", start: "2026-02-16", finish: "2026-11-27", originalValue: 384000,
    actual: A(112000, 89300, 12600, 3100, 11000), ftc: 329900, certifiedToDate: 241300, invoicedToDate: 241300, paidToDate: 241300,
    nextValuation: "2026-10-26", valuationDay: "Last Monday of month", quoteRef: "QUO-2025-131", takeoffRef: "TO-0368", units: 12,
    summary: "12 units in testing and snagging. Claim #7 submitted 5 Oct, client assessment overdue." },
  { id: "p06", ref: "LE-2026-017", name: "Galway Medical Centre Fit-out", clientId: "c6", type: "commercial", region: "Galway", location: "Galway city",
    pmId: "e06", foremanId: "e16", stage: "First fix", start: "2026-07-06", finish: "2027-01-29", originalValue: 726000,
    actual: A(54000, 49200, 14800, 2900, 7100), ftc: 543000, certifiedToDate: 163400, invoicedToDate: 163400, paidToDate: 91800,
    nextValuation: "2026-11-06", valuationDay: "1st Friday", quoteRef: "QUO-2026-024", takeoffRef: "TO-0398",
    summary: "Two-storey primary care centre. Nurse call, medical IT and emergency lighting packages." },
  { id: "p07", ref: "LE-2026-005", name: "Santry Data Hall Power Upgrade", clientId: "c7", type: "industrial", region: "Dublin", location: "Santry, Dublin 9",
    pmId: "e05", foremanId: "e14", stage: "Live-environment works", start: "2026-05-04", finish: "2026-12-11", originalValue: 880000,
    actual: A(118000, 141600, 26400, 4200, 11800), ftc: 735100, certifiedToDate: 361500, invoicedToDate: 265000, paidToDate: 265000,
    nextValuation: "2026-11-02", valuationDay: "1st Monday", quoteRef: "QUO-2026-015", takeoffRef: "TO-0384",
    summary: "UPS and PDU upgrade in a live data hall. Weekend shutdown 24–25 Oct needs overtime sign-off." },
  { id: "p08", ref: "LE-2026-012", name: "Docklands Hotel Refurbishment", clientId: "c8", type: "commercial", region: "Dublin", location: "North Wall Quay, Dublin 1",
    pmId: "e04", foremanId: "e13", stage: "Strip-out & first fix", start: "2026-07-20", finish: "2027-03-05", originalValue: 538000,
    actual: A(52000, 38400, 6200, 1900, 5500), ftc: 407300, certifiedToDate: 96000, invoicedToDate: 96000, paidToDate: 96000,
    nextValuation: "2026-10-30", valuationDay: "Last Friday", quoteRef: "QUO-2026-052", takeoffRef: "TO-0405",
    summary: "140-bedroom refurbishment in phases. Claim #3 disputed by the client QS on second-fix lighting." },
  { id: "p09", ref: "LE-2026-019", name: "Swords Retail Unit Fit-out", clientId: "c9", type: "commercial", region: "Dublin", location: "Swords, Co. Dublin",
    pmId: "e04", foremanId: "e13", stage: "Second fix", start: "2026-08-10", finish: "2026-11-20", originalValue: 214000,
    actual: A(46000, 37800, 2400, 1300, 4500), ftc: 158100, certifiedToDate: 118000, invoicedToDate: 118000, paidToDate: 118000,
    nextValuation: "2026-10-30", valuationDay: "Last Friday", quoteRef: "QUO-2026-044", takeoffRef: "TO-0401",
    summary: "Anchor retail unit. Track lighting and tills power; opening date 27 Nov." },
  { id: "p10", ref: "LE-2026-021", name: "Clondalkin School Emergency Lighting Upgrade", clientId: "c10", type: "small", region: "Dublin", location: "Clondalkin, Dublin 22",
    pmId: "e03", foremanId: "e15", stage: "Install (mid-term break)", start: "2026-09-21", finish: "2026-11-06", originalValue: 48600,
    actual: A(11800, 8100, 0, 600, 900), ftc: 33900, certifiedToDate: 29160, invoicedToDate: 29160, paidToDate: 14580,
    nextValuation: "2026-11-06", valuationDay: "On completion", quoteRef: "QUO-2026-058", takeoffRef: "TO-0409",
    summary: "Emergency lighting replacement to I.S. 3217. Remaining rooms done over mid-term break." },
  { id: "p11", ref: "LE-2026-022", name: "Rathmines Apartments Fire Alarm Upgrade", clientId: "c11", type: "small", region: "Dublin", location: "Rathmines, Dublin 6",
    pmId: "e03", foremanId: "e12", stage: "Commissioning", start: "2026-09-07", finish: "2026-10-30", originalValue: 36400,
    actual: A(9200, 8900, 0, 400, 1100), ftc: 25800, certifiedToDate: 29120, invoicedToDate: 29120, paidToDate: 29120,
    nextValuation: "2026-10-30", valuationDay: "On completion", quoteRef: "QUO-2026-060", takeoffRef: "TO-0411",
    summary: "L1 fire alarm upgrade, 48 apartments. Commissioning with Kestrel booked for 28 Oct." },
  { id: "p12", ref: "LE-2026-015", name: "Oranmore Food Production Facility", clientId: "c12", type: "industrial", region: "Galway", location: "Oranmore, Co. Galway",
    pmId: "e06", foremanId: "e16", stage: "Mobilising", start: "2026-09-28", finish: "2027-04-30", originalValue: 226600,
    actual: A(12000, 12600, 0, 800, 2600), ftc: 184900, certifiedToDate: 0, invoicedToDate: 0, paidToDate: 0,
    nextValuation: "2026-11-27", valuationDay: "Last Friday", quoteRef: "QUO-2026-049", takeoffRef: "TO-0403",
    summary: "Washdown-rated lighting and power for a new production hall. First valuation in November." }
];

/* ── Contract schedule for the flagship contract (LE-2026-014) ────────── */
export const CONTRACT_LINES: ContractLine[] = [
  ["01", "Containment", "Cable tray, basket and trunking to all units and landlord areas", 90000, 0.40, 0.65],
  ["02", "General Lighting", "Internal and external luminaires, switching and controls", 80000, 0.30, 0.55],
  ["03", "Emergency Lighting", "Self-contained emergency fittings and exit signage to I.S. 3217", 40000, 0.20, 0.40],
  ["04", "General Services", "Small power, cooker and appliance circuits, accessories", 110000, 0.35, 0.60],
  ["05", "Fire Alarm", "Grade D1 detection to each dwelling, landlord L3 system", 60000, 0.25, 0.45],
  ["06", "Protective Services", "Earthing, bonding and surge protection", 35000, 0.30, 0.50],
  ["07", "Communications", "Data, TV/satellite and door-entry wiring", 45000, 0.20, 0.35],
  ["08", "Power Distribution", "Meter cabinets, consumer units and sub-mains", 85000, 0.45, 0.60],
  ["09", "Testing & Commissioning", "I.S. 10101 testing, certification and handover", 30000, 0, 0.05],
  ["10", "Preliminaries", "Site set-up, supervision and welfare", 25000, 0.50, 0.65]
].map(([code, heading, description, value, prevPct, suggestedPct]) => ({
  id: "cl" + code, projectId: "p01", code: code as string, heading: heading as string, description: description as string,
  value: value as number, prevPct: prevPct as number, suggestedPct: suggestedPct as number
}));

export const VARIATIONS: Variation[] = [
  { id: "vo1", ref: "VO-014-01", projectId: "p01", title: "EV charger supplies and containment to 24 driveways", value: 18400, status: "Approved", raised: "2026-08-19", prevPct: 0, suggestedPct: 0.5, reason: "Client instruction CI-07" },
  { id: "vo2", ref: "VO-008-01", projectId: "p02", title: "Additional AV containment to six meeting rooms", value: 14200, status: "Approved", raised: "2026-05-12", prevPct: 1, suggestedPct: 1, reason: "Architect's instruction AI-22" },
  { id: "vo3", ref: "VO-008-02", projectId: "p02", title: "Reception feature lighting package", value: 21800, status: "Approved", raised: "2026-06-30", prevPct: 0.6, suggestedPct: 0.8, reason: "Client design change" },
  { id: "vo4", ref: "VO-008-03", projectId: "p02", title: "Containment re-route around revised ceiling grid, L3–L4", value: 22800, status: "Pending approval", raised: "2026-10-14", prevPct: 0, suggestedPct: 0, reason: "Ceiling services clash, RFI-031" },
  { id: "vo5", ref: "VO-005-01", projectId: "p07", title: "Additional UPS feed to Hall B", value: 32000, status: "Approved", raised: "2026-06-08", prevPct: 0.7, suggestedPct: 0.9, reason: "Client instruction CI-03" },
  { id: "vo6", ref: "VO-012-01", projectId: "p08", title: "Bedroom USB-C sockets, 140 rooms", value: 9600, status: "Priced", raised: "2026-10-09", prevPct: 0, suggestedPct: 0, reason: "Client request, awaiting instruction" },
  { id: "vo7", ref: "VO-041-01", projectId: "p04", title: "Additional external lighting to podium", value: 0, status: "Rejected", raised: "2026-04-02", prevPct: 0, suggestedPct: 0, reason: "Client withdrew request" }
];

/* ── Suppliers (fictional) and purchase orders ───────────────────────── */
export const SUPPLIERS: Supplier[] = [
  { id: "su1", name: "Liffey Electrical Wholesale", category: "General wholesale & distribution", account: "LEW-2207", terms: "60 days EOM", contact: "trade@liffeyew.example", region: "Dublin", onTime: 0.94, fictional: true },
  { id: "su2", name: "Brightline Lighting Distributors", category: "Luminaires & controls", account: "BLD-0418", terms: "30 days", contact: "orders@brightline.example", region: "Dublin", onTime: 0.81, fictional: true },
  { id: "su3", name: "Pale Containment Ltd", category: "Tray, basket & trunking", account: "PCL-1130", terms: "30 days", contact: "sales@palecontainment.example", region: "Dublin", onTime: 0.97, fictional: true },
  { id: "su4", name: "Dublin Cable Supplies", category: "Cable & data", account: "DCS-0902", terms: "45 days", contact: "orders@dublincable.example", region: "Dublin", onTime: 0.92, fictional: true },
  { id: "su5", name: "FireSafe Systems Supply", category: "Fire detection", account: "FSS-3321", terms: "30 days", contact: "trade@firesafe.example", region: "Dublin", onTime: 0.95, fictional: true },
  { id: "su6", name: "Atlantic Electrical Wholesale", category: "General wholesale (Galway)", account: "AEW-0077", terms: "30 days", contact: "galway@atlanticew.example", region: "Galway", onTime: 0.9, fictional: true }
];

const PO = (ref: string, supplierId: string, projectId: string, category: CostCat, description: string, value: number, ordered: string, due: string,
  status: PurchaseOrder["status"], delivery: PurchaseOrder["delivery"], invoiced: boolean, approverId: string, raisedById: string): PurchaseOrder =>
  ({ id: ref.toLowerCase(), ref, supplierId, projectId, category, description, value, ordered, due, status, delivery, invoiced, approverId, raisedById });

export const PURCHASE_ORDERS: PurchaseOrder[] = [
  // LE-2026-014 Dalkey — €61,200 committed, not yet posted
  PO("PO-2594", "su3", "p01", "materials", "Cable tray & basket, Blocks B–C", 18600, "2026-10-02", "2026-10-22", "Committed", "Awaiting delivery", false, "e01", "e12"),
  PO("PO-2601", "su2", "p01", "materials", "LED downlights & external bulkheads, units 9–24", 24300, "2026-10-06", "2026-10-16", "Committed", "Part delivered", false, "e01", "e03"),
  PO("PO-2607", "su1", "p01", "materials", "Consumer units & meter cabinets, units 13–24", 12450, "2026-10-09", "2026-10-27", "Committed", "Awaiting delivery", false, "e03", "e12"),
  PO("PO-2609", "su5", "p01", "materials", "Grade D1 smoke/heat detectors", 5850, "2026-10-12", "2026-10-15", "Committed", "Delivered", false, "e03", "e12"),
  PO("PO-2611", "su3", "p01", "materials", "Containment to EV charger runs (VO-014-01)", 8940, "2026-10-19", "2026-10-29", "Awaiting approval", "Not due", false, "e01", "e12"),
  // LE-2026-008 GCD — €78,400 committed
  PO("PO-2588", "su4", "p02", "materials", "Cat6A cable & patch panels, L3–L4", 22600, "2026-09-29", "2026-10-21", "Committed", "Awaiting delivery", false, "e01", "e13"),
  PO("PO-2596", "su2", "p02", "materials", "LED panels & DALI controls, L3–L4", 41200, "2026-09-30", "2026-10-14", "Committed", "Late", false, "e01", "e04"),
  PO("PO-2603", "su1", "p02", "materials", "Busbar tap-off units", 14600, "2026-10-07", "2026-10-13", "Committed", "Delivered", false, "e04", "e13"),
  PO("PO-2618", "su4", "p02", "materials", "LSZH cable for containment re-route (VO-008-03)", 12600, "2026-10-20", "2026-10-30", "Awaiting approval", "Not due", false, "e01", "e13"),
  // LE-2026-003 Ballymount — €92,600
  PO("PO-2571", "su1", "p03", "materials", "LV main switchboard & sub-distribution boards", 64800, "2026-08-24", "2026-11-09", "Committed", "Awaiting delivery", false, "e01", "e05"),
  PO("PO-2599", "su2", "p03", "materials", "High-bay LED fittings, Zones 1–3", 27800, "2026-10-05", "2026-10-26", "Committed", "Awaiting delivery", false, "e01", "e14"),
  // LE-2025-041 Tallaght — €66,800
  PO("PO-2585", "su1", "p04", "materials", "Consumer units & sub-main cable, Block C", 29400, "2026-09-25", "2026-10-19", "Committed", "Part delivered", false, "e01", "e15"),
  PO("PO-2604", "su5", "p04", "materials", "Smoke & heat detectors, Blocks C–D", 11200, "2026-10-08", "2026-10-23", "Committed", "Awaiting delivery", false, "e05", "e15"),
  PO("PO-2610", "su3", "p04", "materials", "Trunking & basket, Block D", 26200, "2026-10-13", "2026-10-30", "Committed", "Awaiting delivery", false, "e01", "e15"),
  // Others
  PO("PO-2602", "su1", "p05", "materials", "Second-fix accessories, units 7–12", 12400, "2026-10-06", "2026-10-12", "Committed", "Delivered", false, "e03", "e32"),
  PO("PO-2590", "su6", "p06", "materials", "Nurse call system & data outlets", 26900, "2026-09-29", "2026-10-30", "Committed", "Awaiting delivery", false, "e01", "e16"),
  PO("PO-2606", "su6", "p06", "materials", "Emergency luminaires & exit signs", 14300, "2026-10-08", "2026-10-21", "Committed", "Awaiting delivery", false, "e06", "e16"),
  PO("PO-2593", "su1", "p07", "materials", "UPS output distribution panels", 38600, "2026-09-30", "2026-10-22", "Committed", "Awaiting delivery", false, "e01", "e05"),
  PO("PO-2598", "su2", "p08", "materials", "Bedroom lighting control modules, Phase 1", 16800, "2026-10-02", "2026-10-28", "Committed", "Awaiting delivery", false, "e04", "e13"),
  PO("PO-2608", "su2", "p09", "materials", "Track lighting & spots", 6200, "2026-10-09", "2026-10-16", "Committed", "Delivered", false, "e04", "e13"),
  PO("PO-2612", "su2", "p10", "materials", "Self-test emergency fittings, 24 no.", 1800, "2026-10-12", "2026-10-26", "Committed", "Awaiting delivery", false, "e03", "e15"),
  PO("PO-2613", "su5", "p11", "materials", "Replacement detector heads", 900, "2026-10-14", "2026-10-21", "Committed", "Delivered", false, "e03", "e12"),
  PO("PO-2605", "su6", "p12", "materials", "IP69K washdown luminaires, sample batch", 6300, "2026-10-07", "2026-10-28", "Committed", "Awaiting delivery", false, "e06", "e16"),
  // Recently posted (already in actual cost; shown for the trail)
  PO("PO-2572", "su4", "p01", "materials", "Twin & earth and SWA, first fix", 21800, "2026-08-28", "2026-09-04", "Posted", "Delivered", true, "e03", "e12"),
  PO("PO-2580", "su3", "p02", "materials", "Cable tray, L1–L2", 31200, "2026-09-08", "2026-09-15", "Posted", "Delivered", true, "e01", "e13"),
  PO("PO-2583", "su1", "p03", "materials", "SWA sub-mains", 44100, "2026-09-14", "2026-09-28", "Posted", "Delivered", true, "e01", "e14"),
  PO("PO-2586", "su5", "p11", "materials", "L1 panel & sounders", 6900, "2026-09-18", "2026-09-25", "Posted", "Delivered", true, "e03", "e12")
];

/* ── Claims, invoices ─────────────────────────────────────────────────── */
export const CLAIMS: Claim[] = [
  { id: "cm-p01-5", ref: "VAL-014-05", projectId: "p01", number: 5, period: "2026-10", periodLabel: "October 2026", status: "Not started", amount: 0, certified: null, certifiedDate: "", submitted: "", assessmentDue: "", invoiceId: null, note: "Valuation due 26 Oct. Site report SR-1043 suggests second fix complete on six more units.", history: [] },
  { id: "cm-p01-4", ref: "VAL-014-04", projectId: "p01", number: 4, period: "2026-09", periodLabel: "September 2026", status: "Invoiced", amount: 42850, certified: 42850, certifiedDate: "2026-09-29", submitted: "2026-09-25", assessmentDue: "2026-10-09", invoiceId: "in-1187", note: "", history: [] },
  { id: "cm-p01-3", ref: "VAL-014-03", projectId: "p01", number: 3, period: "2026-08", periodLabel: "August 2026", status: "Paid", amount: 64300, certified: 64300, certifiedDate: "2026-08-28", submitted: "2026-08-25", assessmentDue: "", invoiceId: "in-1161", note: "", history: [] },
  { id: "cm-p02-9", ref: "VAL-008-09", projectId: "p02", number: 9, period: "2026-10", periodLabel: "October 2026", status: "Internal review", amount: 186400, certified: null, certifiedDate: "", submitted: "", assessmentDue: "", invoiceId: null, note: "QS draft. Includes VO-008-02 at 80%. Waiting on Martin.", history: [{ at: "2026-10-19", text: "Drafted by Shane Gallagher" }] },
  { id: "cm-p03-5", ref: "VAL-003-05", projectId: "p03", number: 5, period: "2026-10", periodLabel: "October 2026", status: "Draft", amount: 142800, certified: null, certifiedDate: "", submitted: "", assessmentDue: "", invoiceId: null, note: "LV boards excluded until delivered on site.", history: [{ at: "2026-10-17", text: "Drafted by Shane Gallagher" }] },
  { id: "cm-p04-11", ref: "VAL-041-11", projectId: "p04", number: 11, period: "2026-10", periodLabel: "October 2026", status: "Draft", amount: 99400, certified: null, certifiedDate: "", submitted: "", assessmentDue: "", invoiceId: null, note: "Blocks A–B second fix progress from Pádraig's reports.", history: [{ at: "2026-10-18", text: "Drafted by Shane Gallagher" }] },
  { id: "cm-p05-7", ref: "VAL-009-07", projectId: "p05", number: 7, period: "2026-10", periodLabel: "October 2026", status: "Submitted", amount: 48200, certified: null, certifiedDate: "", submitted: "2026-10-05", assessmentDue: "2026-10-19", invoiceId: null, note: "Client assessment overdue since 19 Oct.", history: [{ at: "2026-10-05", text: "Submitted to Kimmage Village Homes" }] },
  { id: "cm-p06-3", ref: "VAL-017-03", projectId: "p06", number: 3, period: "2026-10", periodLabel: "October 2026", status: "Invoiced", amount: 71600, certified: 71600, certifiedDate: "2026-10-09", submitted: "2026-10-02", assessmentDue: "2026-10-16", invoiceId: "in-1201", note: "", history: [] },
  { id: "cm-p07-4", ref: "VAL-005-04", projectId: "p07", number: 4, period: "2026-10", periodLabel: "October 2026", status: "Partially certified", amount: 102000, certified: 96500, certifiedDate: "2026-10-16", submitted: "2026-10-02", assessmentDue: "2026-10-16", invoiceId: null, note: "Client QS held €5,500 on PDU commissioning until witness test.", history: [{ at: "2026-10-02", text: "Submitted" }, { at: "2026-10-16", text: "Certified €96,500 of €102,000" }] },
  { id: "cm-p08-3", ref: "VAL-012-03", projectId: "p08", number: 3, period: "2026-10", periodLabel: "October 2026", status: "Disputed", amount: 38000, certified: 31800, certifiedDate: "", submitted: "2026-10-01", assessmentDue: "2026-10-15", invoiceId: null, note: "Client QS disputes €6,200 on second-fix lighting, Floors 2–3.", history: [{ at: "2026-10-01", text: "Submitted" }, { at: "2026-10-15", text: "Disputed: €6,200 on second-fix lighting" }] },
  { id: "cm-p09-2", ref: "VAL-019-02", projectId: "p09", number: 2, period: "2026-10", periodLabel: "October 2026", status: "Paid", amount: 41800, certified: 41800, certifiedDate: "2026-10-02", submitted: "2026-09-28", assessmentDue: "", invoiceId: "in-1190", note: "", history: [] },
  { id: "cm-p10-2", ref: "VAL-021-02", projectId: "p10", number: 2, period: "2026-10", periodLabel: "October 2026", status: "Invoiced", amount: 14580, certified: 14580, certifiedDate: "2026-10-08", submitted: "2026-10-06", assessmentDue: "", invoiceId: "in-1195", note: "", history: [] }
];

export const INVOICES: Invoice[] = [
  { id: "in-1161", ref: "INV-LE-1161", projectId: "p01", clientId: "c1", claimId: "cm-p01-3", issued: "2026-08-31", due: "2026-09-30", net: 64300, vatMode: "rct", status: "Paid", paid: 64300, xero: "Paid", xeroRef: "XR-DEMO-4410", period: "August 2026" },
  { id: "in-1179", ref: "INV-LE-1179", projectId: "p02", clientId: "c2", claimId: null, issued: "2026-09-30", due: "2026-10-30", net: 86600, vatMode: "rct", status: "Sent", paid: 0, xero: "Awaiting payment", xeroRef: "XR-DEMO-4452", period: "September 2026" },
  { id: "in-1181", ref: "INV-LE-1181", projectId: "p03", clientId: "c3", claimId: null, issued: "2026-09-30", due: "2026-10-30", net: 71400, vatMode: "13.5", status: "Sent", paid: 0, xero: "Awaiting payment", xeroRef: "XR-DEMO-4455", period: "September 2026" },
  { id: "in-1183", ref: "INV-LE-1183", projectId: "p04", clientId: "c4", claimId: null, issued: "2026-09-30", due: "2026-11-14", net: 75700, vatMode: "13.5", status: "Sent", paid: 0, xero: "Awaiting payment", xeroRef: "XR-DEMO-4457", period: "September 2026" },
  { id: "in-1187", ref: "INV-LE-1187", projectId: "p01", clientId: "c1", claimId: "cm-p01-4", issued: "2026-09-30", due: "2026-10-30", net: 42850, vatMode: "rct", status: "Sent", paid: 0, xero: "Awaiting payment", xeroRef: "XR-DEMO-4461", period: "September 2026" },
  { id: "in-1190", ref: "INV-LE-1190", projectId: "p09", clientId: "c9", claimId: "cm-p09-2", issued: "2026-10-02", due: "2026-11-01", net: 41800, vatMode: "13.5", status: "Paid", paid: 41800, xero: "Paid", xeroRef: "XR-DEMO-4466", period: "October 2026" },
  { id: "in-1195", ref: "INV-LE-1195", projectId: "p10", clientId: "c10", claimId: "cm-p10-2", issued: "2026-10-08", due: "2026-11-07", net: 14580, vatMode: "13.5", status: "Sent", paid: 0, xero: "Reconcile warning", xeroRef: "XR-DEMO-4471", period: "October 2026" },
  { id: "in-1201", ref: "INV-LE-1201", projectId: "p06", clientId: "c6", claimId: "cm-p06-3", issued: "2026-10-09", due: "2026-11-08", net: 71600, vatMode: "13.5", status: "Sent", paid: 0, xero: "Awaiting payment", xeroRef: "XR-DEMO-4474", period: "October 2026" }
];

/* Previous certified valuations on LE-2026-014 (cumulative €191,750). */
export const DALKEY_HISTORY = [
  { ref: "VAL-014-01", period: "June 2026", certified: 38400, invoice: "INV-LE-1108", paid: true },
  { ref: "VAL-014-02", period: "July 2026", certified: 46200, invoice: "INV-LE-1134", paid: true },
  { ref: "VAL-014-03", period: "August 2026", certified: 64300, invoice: "INV-LE-1161", paid: true },
  { ref: "VAL-014-04", period: "September 2026", certified: 42850, invoice: "INV-LE-1187", paid: false }
];

/* ── Today's allocations (Tue 20 Oct) ─────────────────────────────────── */
const AL = (personId: string, projectId: string | null, start = "07:00", end = "15:30", note = ""): Allocation =>
  ({ id: "al-" + personId, personId, projectId, date: "2026-10-20", start, end, note });
export const ALLOCATIONS: Allocation[] = [
  AL("e12", "p01"), AL("e17", "p01"), AL("e19", "p01"), AL("e25", "p01"), AL("e37", "p01"), AL("e36", "p01"), AL("s01", "p01"), AL("s02", "p01"),
  AL("e13", "p02", "07:30", "16:00"), AL("e18", "p02", "08:00", "16:30", "Office hours on an occupied floor"), AL("e20", "p02", "07:30", "16:00"), AL("e21", "p02", "07:30", "16:00"),
  AL("e24", "p02", "07:30", "16:00"), AL("e34", "p02", "07:30", "16:00"), AL("s03", "p02", "07:30", "16:00"), AL("s04", "p02", "07:30", "16:00"), AL("s11", "p02", "08:00", "16:30", "3-person crew"),
  AL("e14", "p03"), AL("e22", "p03"), AL("e23", "p03"), AL("e26", "p03"), AL("e35", "p03"), AL("s05", "p03"), AL("s06", "p03"),
  AL("e15", "p04"), AL("e27", "p04"), AL("e28", "p04"), AL("e31", "p04"), AL("e38", "p04"), AL("e39", "p04"), AL("s07", "p04"),
  AL("e32", "p05"), AL("e33", "p05"),
  AL("e16", "p06", "08:00", "16:30"), AL("e29", "p06", "08:00", "16:30"), AL("e40", "p06", "08:00", "16:30"),
  AL("e30", "p12", "08:00", "16:30"),
  AL("s08", "p07", "07:00", "15:30"), AL("s09", "p07", "07:00", "15:30"),
  AL("s10", "p08")
];

/* Yesterday (Mon 19 Oct): PM submissions in the WhatsApp group versus Sync clock-ins.
   25 matched, 4 need someone to decide. */
const matchedYesterday: [string, string][] = [
  ["e12", "p01"], ["e17", "p01"], ["e25", "p01"], ["e37", "p01"],
  ["e13", "p02"], ["e18", "p02"], ["e20", "p02"], ["e21", "p02"], ["e34", "p02"],
  ["e14", "p03"], ["e22", "p03"], ["e23", "p03"], ["e26", "p03"], ["e35", "p03"],
  ["e15", "p04"], ["e27", "p04"], ["e31", "p04"], ["e38", "p04"], ["e39", "p04"],
  ["e32", "p05"], ["e33", "p05"], ["e16", "p06"], ["e29", "p06"], ["e40", "p06"], ["e30", "p12"]
];
export const TIMESHEETS: Timesheet[] = [
  ...matchedYesterday.map(([pid, prj]) => {
    const gal = prj === "p06" || prj === "p12";
    return { id: "ts-" + pid, personId: pid, date: "2026-10-19", pm: { projectId: prj, hours: 8, ot: 0 },
      sync: { projectId: prj, in: gal ? "07:58" : "06:57", out: gal ? "16:32" : "15:33", hours: 8 }, state: "Matched" as const, issue: "", proposal: { projectId: prj, hours: 8, ot: 0 } };
  }),
  { id: "ts-e19", personId: "e19", date: "2026-10-19", pm: { projectId: "p01", hours: 8, ot: 0 }, sync: { projectId: "p04", in: "07:04", out: "15:31", hours: 8 },
    state: "Mismatch", issue: "Colm submitted Dalkey, but Sync clocked Liam in at the Tallaght site gate. Pádraig confirms he covered a Block C day.", proposal: { projectId: "p04", hours: 8, ot: 0 } },
  { id: "ts-e24", personId: "e24", date: "2026-10-19", pm: { projectId: "p02", hours: 8, ot: 0 }, sync: { projectId: "p02", in: "07:28", out: "18:10", hours: 10.5 },
    state: "Mismatch", issue: "Sync shows clock-out at 18:10, 2.5 hours past the PM's submission. Possible overtime on the L3 re-route.", proposal: { projectId: "p02", hours: 8, ot: 2.5 } },
  { id: "ts-e36", personId: "e36", date: "2026-10-19", pm: null, sync: { projectId: "p01", in: "06:59", out: "15:30", hours: 8 },
    state: "Missing hours", issue: "Josh clocked in at Dalkey but wasn't in Colm's 16:00 WhatsApp submission.", proposal: { projectId: "p01", hours: 8, ot: 0 } },
  { id: "ts-e28", personId: "e28", date: "2026-10-19", pm: { projectId: "p04", hours: 8, ot: 0 }, sync: null,
    state: "No clock-in", issue: "Aisling submitted 8 hours at Tallaght but there's no Sync clock-in. Phone may not have been used.", proposal: { projectId: "p04", hours: 8, ot: 0 } }
];

/* ── Fleet & fuel ─────────────────────────────────────────────────────── */
const vehicleDrivers = ["e12", "e13", "e14", "e15", "e16", "e17", "e18", "e20", "e22", "e24", "e26", "e27", "e29", "e30", "e32", null, "e01", "e02"];
const regs = ["221-D-31873", "221-D-40512", "221-D-27790", "222-D-11934", "231-G-2087", "222-D-30655", "231-D-20914", "231-D-18342", "231-D-27706", "232-D-9918",
  "232-D-15520", "241-D-7031", "241-G-1093", "241-G-1188", "242-D-20407", "242-D-21877", "251-D-4410", "241-D-11206"];
export const VEHICLES: Vehicle[] = regs.map((reg, i) => {
  const id = "v" + String(i + 1).padStart(2, "0");
  const car = i >= 16;
  return { id, reg, make: car ? (i === 16 ? "Skoda Superb" : "Toyota RAV4 Hybrid") : (i % 3 === 0 ? "Ford Transit Custom" : i % 3 === 1 ? "Renault Trafic" : "VW Transporter"),
    kind: car ? "Car" : "Van", driverId: vehicleDrivers[i], cardId: "fc" + String(i + 1).padStart(2, "0"),
    base: reg.indexOf("-G-") > -1 ? "Galway" : "Dublin", odometer: 38000 + ((i * 7919) % 90000), nextService: ["2026-11-04", "2026-12-12", "2027-01-20", "2026-10-29"][i % 4] };
});
const last4 = ["4417", "8820", "1306", "7712", "5098", "6631", "5521", "0947", "3385", "2264", "9150", "4479", "8013", "6620", "1185", "7349", "0021", "3308"];
export const FUEL_CARDS: FuelCard[] = VEHICLES.map((v, i): FuelCard => ({ id: v.cardId, last4: last4[i], holderId: v.driverId, vehicleId: v.id, limit: v.kind === "Car" ? 600 : 900, status: "Active" as const }))
  .concat([{ id: "fc19", last4: "2290", holderId: null, vehicleId: null, limit: 500, status: "Active" as const }]);

/* Home projects for a driver, used for auto-allocation of routine fills. */
const driverProject: Record<string, string> = { e12: "p01", e13: "p02", e14: "p03", e15: "p04", e16: "p06", e17: "p01", e18: "p02", e20: "p02", e22: "p03",
  e24: "p02", e26: "p03", e27: "p04", e29: "p06", e30: "p12", e32: "p05" };
const STATIONS_D = ["Circle K Ballymount", "Applegreen M50 Lucan", "Maxol Tallaght", "Circle K Stillorgan", "Applegreen Ringsend", "Circle K Santry", "Maxol Swords", "Circle K Naas Road"];
const STATIONS_G = ["Applegreen Headford Road", "Circle K Oranmore", "Maxol Briarhill"];

function rng(seed: number) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

function buildFuel(): FuelTxn[] {
  const r = rng(20261020);
  const out: FuelTxn[] = [];
  let n = 0;
  // 14 Sep → 16 Oct: routine fills, already allocated
  for (let day = 0; day < 33; day++) {
    const d = new Date(Date.UTC(2026, 8, 14 + day));
    const dow = d.getUTCDay();
    if (dow === 0) continue;
    const iso = d.toISOString().slice(0, 10);
    VEHICLES.forEach(v => {
      const chance = v.kind === "Car" ? 0.12 : dow === 6 ? 0.05 : 0.27;
      if (r() > chance) return;
      const litres = Math.round((v.kind === "Car" ? 38 : 46) + r() * 28);
      const ppl = Math.round((1.62 + r() * 0.09) * 1000) / 1000;
      const gal = v.base === "Galway";
      const proj = v.driverId ? driverProject[v.driverId] || null : null;
      out.push({ id: "ft" + (++n), date: iso, time: String(6 + Math.floor(r() * 3)).padStart(2, "0") + ":" + String(Math.floor(r() * 60)).padStart(2, "0"),
        cardId: v.cardId, vehicleId: v.id, holderId: v.driverId, station: gal ? STATIONS_G[Math.floor(r() * STATIONS_G.length)] : STATIONS_D[Math.floor(r() * STATIONS_D.length)],
        litres, ppl, total: Math.round(litres * ppl * 100) / 100, projectId: proj, state: proj ? "Auto-allocated" : "Overhead", flag: "", suggestedProjectId: null });
    });
  }
  // The four that need someone (Story D)
  out.push({ id: "ft-x1", date: "2026-10-17", time: "11:42", cardId: "fc01", vehicleId: "v01", holderId: "e12", station: "Circle K Ballymount", litres: 68.4, ppl: 1.65, total: 112.86,
    projectId: null, state: "Needs allocation", flag: "Saturday fill, no site allocated that day", suggestedProjectId: "p01" });
  out.push({ id: "ft-x2", date: "2026-10-18", time: "09:15", cardId: "fc19", vehicleId: null, holderId: null, station: "Applegreen M50 Lucan", litres: 61.2, ppl: 1.669, total: 102.14,
    projectId: null, state: "Missing cardholder", flag: "Pool card with no holder or vehicle recorded", suggestedProjectId: null });
  out.push({ id: "ft-x3", date: "2026-10-19", time: "06:48", cardId: "fc07", vehicleId: "v07", holderId: "e18", station: "Circle K Stillorgan", litres: 54.2, ppl: 1.659, total: 89.92,
    projectId: null, state: "Needs allocation", flag: "Van crossed sites (Dalkey drop-off, then GCD)", suggestedProjectId: "p02" });
  out.push({ id: "ft-x4", date: "2026-10-19", time: "19:22", cardId: "fc18", vehicleId: "v18", holderId: "e02", station: "Maxol Swords", litres: 71.0, ppl: 1.67, total: 118.57,
    projectId: null, state: "Investigate", flag: "Second fill on this card within 24 hours, above tank size", suggestedProjectId: null });
  return out.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
}
export const FUEL: FuelTxn[] = buildFuel();

/* ── Estimating ───────────────────────────────────────────────────────── */
export const ENQUIRIES: Enquiry[] = [
  { id: "en101", ref: "EN-2026-101", client: "Harcourt Fit-Out Partners", project: "Cherrywood Office Fit-out, Level 2", type: "commercial", region: "Dublin", received: "2026-10-12", due: "2026-10-30", value: 420000, estimatorId: "e08", stage: "Take-off", source: "Tender invite", note: "Countfire take-off TO-0431 running on E-201 Rev C." },
  { id: "en102", ref: "EN-2026-102", client: "Little Steps Creche (fictional)", project: "Lucan Creche Rewire", type: "small", region: "Dublin", received: "2026-10-19", due: "2026-10-20", value: 26000, estimatorId: "e09", stage: "Pricing", source: "Website enquiry", note: "Small job: same-day turnaround." },
  { id: "en103", ref: "EN-2026-103", client: "Western Health Partners", project: "Galway Clinic Phase 2", type: "commercial", region: "Galway", received: "2026-10-02", due: "2026-10-23", value: 310000, estimatorId: "e09", stage: "Review", source: "Repeat client", note: "Tender submission waiting on Martin's review." },
  { id: "en104", ref: "EN-2026-104", client: "Citywest Logistics (fictional)", project: "Citywest Distribution Centre Lighting Retrofit", type: "industrial", region: "Dublin", received: "2026-10-15", due: "2026-11-03", value: 185000, estimatorId: "e08", stage: "Drawings in", source: "Tender invite", note: "Lighting layout only, no M&E spec yet." },
  { id: "en105", ref: "EN-2026-105", client: "Ranelagh Mews Ltd (fictional)", project: "Ranelagh Mews Houses (6 units)", type: "residential", region: "Dublin", received: "2026-10-14", due: "2026-10-23", value: 142000, estimatorId: "e09", stage: "Pricing", source: "Referral", note: "" },
  { id: "en106", ref: "EN-2026-106", client: "Smithfield Coffee Co. (fictional)", project: "Smithfield Café Fit-out", type: "small", region: "Dublin", received: "2026-10-15", due: "2026-10-16", value: 18500, estimatorId: "e08", stage: "Submitted", source: "Website enquiry", note: "Submitted next day." },
  { id: "en107", ref: "EN-2026-107", client: "Dublin Schools Building Trust", project: "Clonskeagh School Fire Alarm Upgrade", type: "small", region: "Dublin", received: "2026-10-20", due: "2026-10-21", value: 38000, estimatorId: "e09", stage: "New", source: "Repeat client", note: "" },
  { id: "en108", ref: "EN-2026-108", client: "Pavilion Retail Group", project: "Blanchardstown Retail Park, Unit 4", type: "commercial", region: "Dublin", received: "2026-09-30", due: "2026-10-13", value: 96000, estimatorId: "e08", stage: "Submitted", source: "Repeat client", note: "Decision expected end of October." },
  { id: "en090", ref: "EN-2026-031", client: "Seafield Homes Ltd", project: "Dalkey Residential Development", type: "residential", region: "Dublin", received: "2026-03-09", due: "2026-03-23", value: 600000, estimatorId: "e08", stage: "Won", source: "Tender invite", note: "Became contract LE-2026-014." },
  { id: "en091", ref: "EN-2026-044", client: "Pavilion Retail Group", project: "Swords Retail Unit Fit-out", type: "commercial", region: "Dublin", received: "2026-06-22", due: "2026-07-01", value: 214000, estimatorId: "e09", stage: "Won", source: "Repeat client", note: "Became contract LE-2026-019." },
  { id: "en092", ref: "EN-2026-039", client: "Naas Road Industrial (fictional)", project: "Naas Road Warehouse Extension", type: "industrial", region: "Dublin", received: "2026-05-11", due: "2026-05-29", value: 640000, estimatorId: "e08", stage: "Lost", source: "Tender invite", note: "Lost on price, 6% above winning bid." },
  { id: "en093", ref: "EN-2026-047", client: "Sandymount Residential (fictional)", project: "Sandymount Apartments", type: "residential", region: "Dublin", received: "2026-07-06", due: "2026-07-24", value: 890000, estimatorId: "e09", stage: "Lost", source: "Tender invite", note: "Lost on programme: client wanted a January start." },
  { id: "en094", ref: "EN-2026-052", client: "Liffey Quay Hotels", project: "Docklands Hotel Refurbishment", type: "commercial", region: "Dublin", received: "2026-06-01", due: "2026-06-19", value: 538000, estimatorId: "e08", stage: "Won", source: "Repeat client", note: "Became contract LE-2026-012." },
  { id: "en095", ref: "EN-2026-058", client: "Dublin Schools Building Trust", project: "Clondalkin School Emergency Lighting", type: "small", region: "Dublin", received: "2026-08-31", due: "2026-09-01", value: 48600, estimatorId: "e09", stage: "Won", source: "Repeat client", note: "Priced in a day." },
  { id: "en096", ref: "EN-2026-055", client: "Glasnevin Offices (fictional)", project: "Glasnevin Office Cat B", type: "commercial", region: "Dublin", received: "2026-08-10", due: "2026-08-28", value: 275000, estimatorId: "e09", stage: "Lost", source: "Tender invite", note: "Client went with incumbent." }
];

export const TAKEOFF_DRAWINGS = [
  { ref: "E-201", rev: "C", title: "Level 2: lighting & small power", sheets: 1, uploaded: "2026-10-14", status: "Counted" },
  { ref: "E-301", rev: "B", title: "Level 2: fire detection & alarm", sheets: 1, uploaded: "2026-10-14", status: "Counted" },
  { ref: "E-401", rev: "A", title: "Level 2: containment routes", sheets: 1, uploaded: "2026-10-15", status: "Counted" },
  { ref: "E-501", rev: "A", title: "Level 2: data & comms", sheets: 1, uploaded: "2026-10-16", status: "Needs review" }
];
export const TAKEOFF_ITEMS: TakeoffItem[] = [
  { symbol: "DL", description: "LED downlight, 12W", qty: 412, unit: "no.", heading: "General Lighting", rate: 64 },
  { symbol: "LP", description: "Recessed LED panel 600×600", qty: 186, unit: "no.", heading: "General Lighting", rate: 118 },
  { symbol: "EM", description: "Emergency bulkhead, self-test", qty: 64, unit: "no.", heading: "Emergency Lighting", rate: 92 },
  { symbol: "EX", description: "Exit sign, maintained", qty: 38, unit: "no.", heading: "Emergency Lighting", rate: 104 },
  { symbol: "DS", description: "Twin switched socket outlet", qty: 296, unit: "no.", heading: "General Services", rate: 58 },
  { symbol: "FP", description: "Floor box, 4-module", qty: 84, unit: "no.", heading: "General Services", rate: 146 },
  { symbol: "SD", description: "Optical smoke detector", qty: 118, unit: "no.", heading: "Fire Alarm", rate: 71 },
  { symbol: "MCP", description: "Manual call point", qty: 22, unit: "no.", heading: "Fire Alarm", rate: 84 },
  { symbol: "SB", description: "Sounder beacon", qty: 46, unit: "no.", heading: "Fire Alarm", rate: 96 },
  { symbol: "DO", description: "Cat6A data outlet", qty: 352, unit: "no.", heading: "Communications", rate: 52 },
  { symbol: "DB", description: "Distribution board, TPN", qty: 6, unit: "no.", heading: "Power Distribution", rate: 2400 },
  { symbol: "CT", description: "Cable tray, 300mm", qty: 840, unit: "m", heading: "Containment", rate: 38 },
  { symbol: "TR", description: "Dado trunking, 3-compartment", qty: 360, unit: "m", heading: "Containment", rate: 46 }
];

export const QUOTE_SEED: QuoteLine[] = [
  { id: "q01", heading: "Containment", description: "Tray, basket & dado trunking per E-401", qty: 1200, unit: "m", matRate: 24, labHrs: 0.45 },
  { id: "q02", heading: "General Lighting", description: "Downlights & panels with DALI controls", qty: 598, unit: "no.", matRate: 58, labHrs: 0.9 },
  { id: "q03", heading: "Emergency Lighting", description: "Self-test bulkheads & exit signs (I.S. 3217)", qty: 102, unit: "no.", matRate: 62, labHrs: 0.8 },
  { id: "q04", heading: "General Services", description: "Sockets, floor boxes & final circuits", qty: 380, unit: "no.", matRate: 34, labHrs: 0.75 },
  { id: "q05", heading: "Fire Alarm", description: "Detectors, MCPs, sounders (I.S. 3218)", qty: 186, unit: "no.", matRate: 46, labHrs: 0.7 },
  { id: "q06", heading: "Protective Services", description: "Earthing, bonding & SPD", qty: 1, unit: "item", matRate: 4200, labHrs: 60 },
  { id: "q07", heading: "Communications", description: "Cat6A outlets & patching", qty: 352, unit: "no.", matRate: 31, labHrs: 0.55 },
  { id: "q08", heading: "Power Distribution", description: "TPN boards & sub-mains", qty: 6, unit: "no.", matRate: 2150, labHrs: 26 },
  { id: "q09", heading: "Testing & Commissioning", description: "I.S. 10101 test, certs & O&M", qty: 1, unit: "item", matRate: 900, labHrs: 140 },
  { id: "q10", heading: "Preliminaries", description: "Supervision, welfare, access equipment", qty: 12, unit: "weeks", matRate: 1450, labHrs: 20 }
];

/* ── Site operations ──────────────────────────────────────────────────── */
export const SITE_REPORTS: SiteReport[] = [
  { id: "sr1050", ref: "SR-1050", projectId: "p01", foremanId: "e12", date: "2026-10-20", workers: 8, done: "Second fix started on units 19–21. Testing units 1–4 continued.", progress: 0.59, delays: "None.", materials: "Consumer units 19–24 (PO-2607) due 27 Oct.", photos: 6, next: "Finish units 19–21, test units 5–6.", status: "Submitted" },
  { id: "sr1049", ref: "SR-1049", projectId: "p02", foremanId: "e13", date: "2026-10-20", workers: 9, done: "L3 containment re-route 85% complete. Data containment started on L4.", progress: 0.65, delays: "PO-2596 LED panels still not on site.", materials: "LED panels & DALI controls (PO-2596).", photos: 7, next: "Complete L3 re-route.", status: "Submitted" },
  { id: "sr1048", ref: "SR-1048", projectId: "p04", foremanId: "e15", date: "2026-10-20", workers: 7, done: "Block C floor 4 first fix underway. Block A snagging closed out.", progress: 0.32, delays: "None.", materials: "None.", photos: 5, next: "Block D floor 1.", status: "Submitted" },
  { id: "sr1047", ref: "SR-1047", projectId: "p05", foremanId: "e32", date: "2026-10-20", workers: 2, done: "Testing units 11–12. Certs drafted for units 7–10.", progress: 0.8, delays: "None.", materials: "None.", photos: 3, next: "Client snag walk 23 Oct.", status: "Submitted" },
  { id: "sr1046", ref: "SR-1046", projectId: "p06", foremanId: "e16", date: "2026-10-20", workers: 3, done: "First fix first floor started.", progress: 0.25, delays: "Nurse call head-end still awaited.", materials: "Nurse call system (PO-2590).", photos: 4, next: "Containment first floor corridor.", status: "Submitted" },
  { id: "sr1045", ref: "SR-1045", projectId: "p12", foremanId: "e16", date: "2026-10-20", workers: 1, done: "Set-out and containment brackets in production hall.", progress: 0.06, delays: "None.", materials: "Washdown luminaire samples (PO-2605).", photos: 2, next: "Containment runs, east wall.", status: "Submitted" },
  { id: "sr1044", ref: "SR-1044", projectId: "p07", foremanId: "e14", date: "2026-10-20", workers: 2, done: "Pre-shutdown checks on UPS output panels. Labelling complete.", progress: 0.42, delays: "Isolation audit actions still open (4).", materials: "UPS output panels (PO-2593) due 22 Oct.", photos: 3, next: "Shutdown 24–25 Oct if actions close.", status: "Submitted" },
  { id: "sr1051", ref: "SR-1051", projectId: "p08", foremanId: "e13", date: "2026-10-20", workers: 1, done: "Strip-out Floor 4 complete.", progress: 0.2, delays: "None.", materials: "None.", photos: 2, next: "First fix Floor 4.", status: "Submitted" },
  { id: "sr1043", ref: "SR-1043", projectId: "p01", foremanId: "e12", date: "2026-10-19", workers: 8, done: "Second fix completed to units 13–18: sockets, switches, consumer units dressed and labelled. Downlights fitted to units 13–16.", progress: 0.58, delays: "External bulkheads for units 17–18 short-delivered on PO-2601.", materials: "Remaining external bulkheads (PO-2601), consumer units for units 19–24 (PO-2607).", photos: 14, next: "Second fix units 19–21, start testing units 1–6.", status: "Submitted", unitsSecondFix: [13, 14, 15, 16, 17, 18] },
  { id: "sr1042", ref: "SR-1042", projectId: "p02", foremanId: "e13", date: "2026-10-19", workers: 9, done: "L3 containment re-route 70% complete. LED panels fitted on L2 east wing.", progress: 0.64, delays: "LED panel delivery PO-2596 now six days late. L4 ceiling closure at risk.", materials: "LED panels & DALI controls (PO-2596).", photos: 9, next: "Finish L3 re-route, data containment on L4.", status: "Reviewed" },
  { id: "sr1041", ref: "SR-1041", projectId: "p03", foremanId: "e14", date: "2026-10-19", workers: 7, done: "High-bay containment Zone 2 complete. SWA sub-mains pulled to DB-03, DB-04.", progress: 0.37, delays: "ESB connection date still not confirmed.", materials: "High-bay fittings Zone 1 (PO-2599).", photos: 6, next: "Zone 3 containment.", status: "Reviewed" },
  { id: "sr1040", ref: "SR-1040", projectId: "p04", foremanId: "e15", date: "2026-10-19", workers: 7, done: "Block C first fix floors 2–3 complete. Block A second fix snagging.", progress: 0.31, delays: "None.", materials: "Trunking Block D (PO-2610).", photos: 8, next: "Block C floor 4, Block D floor 1.", status: "Approved" },
  { id: "sr1039", ref: "SR-1039", projectId: "p05", foremanId: "e32", date: "2026-10-19", workers: 2, done: "Testing units 7–10, certs issued for units 1–6.", progress: 0.78, delays: "Client snag walk moved to 23 Oct.", materials: "None.", photos: 4, next: "Test units 11–12.", status: "Approved" },
  { id: "sr1038", ref: "SR-1038", projectId: "p06", foremanId: "e16", date: "2026-10-19", workers: 3, done: "First fix ground floor consult rooms complete.", progress: 0.24, delays: "Nurse call head-end awaiting delivery (PO-2590).", materials: "Nurse call system.", photos: 5, next: "First fix first floor.", status: "Reviewed" }
];

/* Dalkey: 24 houses. 0..1 for each stage. Units 13–18 report second fix done in SR-1043 (pending review). */
export const UNITS: Unit[] = [
  ...Array.from({ length: 24 }, (_, i) => {
    const no = i + 1;
    const block = no <= 8 ? "Block A" : no <= 16 ? "Block B" : "Block C";
    return { projectId: "p01", block, no, firstFix: 1, secondFix: no <= 12 ? 1 : no <= 18 ? 0.6 : no <= 21 ? 0.2 : 0, testing: no <= 4 ? 0.5 : 0, snagging: 0 };
  }),
  ...Array.from({ length: 62 }, (_, i) => {
    const no = i + 1;
    const block = no <= 16 ? "Block A" : no <= 32 ? "Block B" : no <= 48 ? "Block C" : "Block D";
    const ff = no <= 32 ? 1 : no <= 44 ? 1 : no <= 48 ? 0.5 : no <= 52 ? 0.3 : 0;
    const sf = no <= 20 ? 1 : no <= 32 ? 0.5 : 0;
    return { projectId: "p04", block, no, firstFix: ff, secondFix: sf, testing: no <= 12 ? 1 : 0, snagging: no <= 8 ? 1 : 0 };
  }),
  ...Array.from({ length: 12 }, (_, i) => ({ projectId: "p05", block: "Terrace", no: i + 1, firstFix: 1, secondFix: 1, testing: i < 6 ? 1 : i < 10 ? 0.5 : 0, snagging: i < 6 ? 0.5 : 0 }))
];

/* Commercial progress by contract section. */
export const SECTION_PROGRESS: { projectId: string; section: string; pct: number; prev: number }[] = [
  ["p02", "Lighting", 0.62, 0.48], ["p02", "Containment", 0.81, 0.70], ["p02", "Fire alarm", 0.55, 0.40], ["p02", "Communications", 0.58, 0.41], ["p02", "Commissioning", 0.08, 0],
  ["p06", "Lighting", 0.18, 0.06], ["p06", "Containment", 0.42, 0.25], ["p06", "Fire alarm", 0.12, 0.04], ["p06", "Communications", 0.15, 0.05], ["p06", "Commissioning", 0, 0],
  ["p08", "Lighting", 0.22, 0.12], ["p08", "Containment", 0.35, 0.22], ["p08", "Fire alarm", 0.14, 0.08], ["p08", "Communications", 0.10, 0.04], ["p08", "Commissioning", 0, 0],
  ["p09", "Lighting", 0.66, 0.38], ["p09", "Containment", 0.95, 0.80], ["p09", "Fire alarm", 0.50, 0.30], ["p09", "Communications", 0.45, 0.20], ["p09", "Commissioning", 0.05, 0],
  ["p03", "Lighting", 0.24, 0.12], ["p03", "Containment", 0.58, 0.41], ["p03", "Fire alarm", 0.10, 0.05], ["p03", "Communications", 0.12, 0.06], ["p03", "Commissioning", 0, 0],
  ["p07", "Lighting", 0.30, 0.25], ["p07", "Containment", 0.70, 0.60], ["p07", "Fire alarm", 0.20, 0.20], ["p07", "Communications", 0.25, 0.20], ["p07", "Commissioning", 0.15, 0.05]
].map(([projectId, section, pct, prev]) => ({ projectId: projectId as string, section: section as string, pct: pct as number, prev: prev as number }));

export const ISSUES: Issue[] = [
  { id: "is1", projectId: "p02", title: "LED panel delivery (PO-2596) six days late", kind: "Delay", severity: "High", raised: "2026-10-15", ownerId: "e04", status: "Open", impact: "L4 ceiling closure slips a week if not on site by 23 Oct." },
  { id: "is2", projectId: "p02", title: "Ceiling services clash on L3–L4 (RFI-031)", kind: "RFI", severity: "High", raised: "2026-09-22", ownerId: "e04", status: "Mitigated", impact: "Containment re-route priced as VO-008-03, €22,800 pending." },
  { id: "is3", projectId: "p03", title: "ESB Networks connection date not confirmed", kind: "Delay", severity: "Medium", raised: "2026-10-01", ownerId: "e05", status: "Open", impact: "Energisation and commissioning dates can't be fixed." },
  { id: "is4", projectId: "p01", title: "External bulkheads short-delivered, units 17–18", kind: "Issue", severity: "Low", raised: "2026-10-19", ownerId: "e12", status: "Open", impact: "No programme impact if delivered this week." },
  { id: "is5", projectId: "p08", title: "Client QS disputes second-fix lighting on Floors 2–3", kind: "Issue", severity: "Medium", raised: "2026-10-15", ownerId: "e07", status: "Open", impact: "€6,200 of claim #3 held." },
  { id: "is6", projectId: "p07", title: "Live-environment shutdown window 24–25 Oct", kind: "Safety", severity: "High", raised: "2026-10-12", ownerId: "e05", status: "Open", impact: "Method statement and overtime sign-off needed by Thursday." },
  { id: "is7", projectId: "p06", title: "Nurse call head-end lead time extended", kind: "Delay", severity: "Medium", raised: "2026-10-08", ownerId: "e06", status: "Open", impact: "Second fix on first floor may start a week later." }
];

export const INSPECTIONS: Inspection[] = [
  { id: "in1", projectId: "p05", kind: "Periodic test & certification", standard: "I.S. 10101", date: "2026-10-16", inspectorId: "e32", result: "Pass", actions: 0 },
  { id: "in2", projectId: "p11", kind: "Fire alarm commissioning", standard: "I.S. 3218", date: "2026-10-28", inspectorId: "e12", result: "Booked", actions: 0 },
  { id: "in3", projectId: "p10", kind: "Emergency lighting duration test", standard: "I.S. 3217", date: "2026-11-05", inspectorId: "e15", result: "Booked", actions: 0 },
  { id: "in4", projectId: "p02", kind: "Pre-ceiling-closure inspection, L2", standard: "Client QA", date: "2026-10-14", inspectorId: "e13", result: "Pass with actions", actions: 3 },
  { id: "in5", projectId: "p01", kind: "Safety walk", standard: "Company H&S", date: "2026-10-15", inspectorId: "e02", result: "Pass with actions", actions: 2 },
  { id: "in6", projectId: "p03", kind: "Safety walk", standard: "Company H&S", date: "2026-10-13", inspectorId: "e02", result: "Pass", actions: 0 },
  { id: "in7", projectId: "p07", kind: "Isolation procedure audit", standard: "Client permit-to-work", date: "2026-10-09", inspectorId: "e05", result: "Fail", actions: 4 },
  { id: "in8", projectId: "p04", kind: "First-fix inspection, Block C", standard: "I.S. 10101", date: "2026-10-12", inspectorId: "e15", result: "Pass", actions: 0 }
];

export const DOCUMENTS: DocumentRec[] = [
  { id: "d1", projectId: "p01", title: "Contract schedule & pricing (QUO-2026-031)", kind: "Contract", rev: "Final", added: "2026-04-21", by: "Niall Hennessy", size: "PDF · 14 pages" },
  { id: "d2", projectId: "p01", title: "E-100 Electrical layouts, house types A–C", kind: "Drawing", rev: "Rev B", added: "2026-04-08", by: "Seafield Homes", size: "PDF · 9 sheets" },
  { id: "d3", projectId: "p01", title: "Valuation VAL-014-04 certificate", kind: "Certificate", rev: "—", added: "2026-09-29", by: "Seafield Homes QS", size: "PDF · 2 pages" },
  { id: "d4", projectId: "p01", title: "Client instruction CI-07: EV chargers", kind: "Instruction", rev: "—", added: "2026-08-19", by: "Seafield Homes", size: "PDF · 1 page" },
  { id: "d5", projectId: "p01", title: "RAMS: second fix & testing", kind: "Safety", rev: "v3", added: "2026-09-30", by: "Gráinne Fitzpatrick", size: "PDF · 18 pages" },
  { id: "d6", projectId: "p02", title: "RFI-031 Ceiling services clash L3–L4", kind: "RFI", rev: "—", added: "2026-09-22", by: "Conor Mulvihill", size: "PDF · 3 pages" },
  { id: "d7", projectId: "p02", title: "VO-008-03 pricing breakdown", kind: "Variation", rev: "v2", added: "2026-10-14", by: "Shane Gallagher", size: "XLSX · 3 sheets" },
  { id: "d8", projectId: "p02", title: "M&E coordination drawings L1–L4", kind: "Drawing", rev: "Rev F", added: "2026-10-02", by: "Harcourt Fit-Out Partners", size: "PDF · 12 sheets" },
  { id: "d9", projectId: "p03", title: "LV single line diagram", kind: "Drawing", rev: "Rev D", added: "2026-08-12", by: "Consulting engineer", size: "PDF · 1 sheet" },
  { id: "d10", projectId: "p07", title: "Method statement: weekend shutdown 24–25 Oct", kind: "Safety", rev: "Draft", added: "2026-10-16", by: "Aisling Brennan", size: "PDF · 11 pages" },
  { id: "d11", projectId: "p05", title: "Safe Electric completion certs, units 1–6", kind: "Certificate", rev: "—", added: "2026-10-16", by: "Brian Healy", size: "PDF · 6 files" },
  { id: "d12", projectId: "p06", title: "Nurse call specification", kind: "Specification", rev: "Rev A", added: "2026-07-01", by: "Western Health Partners", size: "PDF · 22 pages" },
  { id: "d13", projectId: null, title: "Countfire export: TO-0431 Cherrywood L2 (simulated)", kind: "Take-off", rev: "Rev C", added: "2026-10-16", by: "Niall Hennessy", size: "CSV · 13 rows" },
  { id: "d14", projectId: null, title: "Fuel card statement import, w/e 18 Oct", kind: "Import", rev: "—", added: "2026-10-19", by: "Ciara Nolan", size: "CSV · 41 rows" }
];

/* Completed public portfolio items from lavelleelectrical.ie, shown as references only.
   No values, dates or financials are attached to these. */
export const PORTFOLIO = [
  "Ringsend Power Station", "Poolbeg Power Station", "Corduff Power Station", "Dublin Airport", "Evergreen Healthfoods, Galway",
  "Residential Development, Kimmage D12", "CastlePark Manor, Dalkey", "St. Joseph's National School", "Howth Residence", "Dartmouth Square"
];

/* ── Work: tasks and the approvals queue ─────────────────────────────── */
export const TASKS: Task[] = [
  { id: "t01", title: "Review Dalkey October valuation (LE-2026-014)", ownerId: "e01", priority: "High", due: "2026-10-22", projectId: "p01", status: "In progress", link: { page: "Claims & Finance", tab: "claims" } },
  { id: "t02", title: "Approve electrical containment PO-2611 (€8,940)", ownerId: "e01", priority: "High", due: "2026-10-20", projectId: "p01", status: "Review", link: { page: "Procurement", tab: "orders" } },
  { id: "t03", title: "Investigate unallocated fuel transaction on card ••3308", ownerId: "e11", priority: "Medium", due: "2026-10-21", projectId: null, status: "Not started", link: { page: "Fleet & Fuel", tab: "transactions" } },
  { id: "t04", title: "Confirm second-fix completion, units 13–18 (SR-1043)", ownerId: "e03", priority: "High", due: "2026-10-20", projectId: "p01", status: "In progress", link: { page: "Site Operations", tab: "reports" } },
  { id: "t05", title: "Review estimator tender submission: Galway Clinic Phase 2", ownerId: "e01", priority: "High", due: "2026-10-22", projectId: null, status: "Review", link: { page: "Estimating", tab: "estimates" } },
  { id: "t06", title: "Approve subcontractor timesheet: Brennan Data Cabling, week 42", ownerId: "e04", priority: "Medium", due: "2026-10-21", projectId: "p02", status: "Not started", link: { page: "Workforce", tab: "timesheets" } },
  { id: "t07", title: "Confirm 4 labour allocations from Mon 19 Oct", ownerId: "e10", priority: "High", due: "2026-10-20", projectId: null, status: "In progress", link: { page: "Workforce", tab: "timesheets" } },
  { id: "t08", title: "Chase Kimmage claim #7 assessment (overdue)", ownerId: "e07", priority: "Medium", due: "2026-10-21", projectId: "p05", status: "Not started", link: { page: "Claims & Finance", tab: "claims" } },
  { id: "t09", title: "Agree cost-to-complete on Grand Canal Dock (18.9% vs 24% target)", ownerId: "e01", priority: "High", due: "2026-10-23", projectId: "p02", status: "Not started", link: { page: "Projects", project: "p02" } },
  { id: "t10", title: "Resolve Docklands claim #3 dispute (€6,200)", ownerId: "e07", priority: "High", due: "2026-10-24", projectId: "p08", status: "In progress", link: { page: "Claims & Finance", tab: "valuations" } },
  { id: "t11", title: "Expedite late LED panel delivery PO-2596", ownerId: "e04", priority: "High", due: "2026-10-21", projectId: "p02", status: "In progress", link: { page: "Procurement", tab: "deliveries" } },
  { id: "t12", title: "Book I.S. 3217 duration test, Clondalkin school", ownerId: "e15", priority: "Low", due: "2026-10-29", projectId: "p10", status: "Not started", link: { page: "Site Operations", tab: "inspections" } },
  { id: "t13", title: "Raise invoice for Santry certified €96,500", ownerId: "e11", priority: "Medium", due: "2026-10-21", projectId: "p07", status: "Not started", link: { page: "Claims & Finance", tab: "invoices" } },
  { id: "t14", title: "VAT return Sep–Oct: pull RCT summary", ownerId: "e11", priority: "Medium", due: "2026-10-16", projectId: null, status: "Done", link: { page: "Claims & Finance", tab: "xero" } }
];

export const APPROVALS: Approval[] = [
  { id: "ap1", kind: "PO", refId: "po-2611", title: "Purchase order PO-2611: EV containment", subject: "Pale Containment Ltd · Dalkey · raised by Marty Doyle", value: 8940, raisedById: "e12", raised: "2026-10-19", projectId: "p01", status: "Awaiting you" },
  { id: "ap2", kind: "PO", refId: "po-2618", title: "Purchase order PO-2618: LSZH cable", subject: "Dublin Cable Supplies · Grand Canal Dock · raised by Declan Ryan", value: 12600, raisedById: "e13", raised: "2026-10-20", projectId: "p02", status: "Awaiting you" },
  { id: "ap3", kind: "Claim", refId: "cm-p02-9", title: "Claim VAL-008-09 internal review", subject: "Grand Canal Dock · October · drafted by Shane Gallagher", value: 186400, raisedById: "e07", raised: "2026-10-19", projectId: "p02", status: "Awaiting you" },
  { id: "ap4", kind: "Timesheet", refId: "s11", title: "Subcontractor timesheet: Brennan Data Cabling, week 42", subject: "3-person crew · 6 days · Grand Canal Dock", value: 6480, raisedById: "e04", raised: "2026-10-19", projectId: "p02", status: "Awaiting you" },
  { id: "ap5", kind: "Variation", refId: "vo4", title: "Variation VO-008-03: containment re-route", subject: "Grand Canal Dock · priced by Shane Gallagher", value: 22800, raisedById: "e07", raised: "2026-10-14", projectId: "p02", status: "Awaiting you" },
  { id: "ap6", kind: "Estimate", refId: "en103", title: "Tender submission: Galway Clinic Phase 2", subject: "Western Health Partners · estimated by Sinéad Corcoran", value: 310000, raisedById: "e09", raised: "2026-10-18", projectId: null, status: "Awaiting you" },
  { id: "ap7", kind: "Overtime", refId: "p07", title: "Overtime: Santry weekend shutdown 24–25 Oct", subject: "6 operatives × 10 hours · raised by Aisling Brennan", value: 4320, raisedById: "e05", raised: "2026-10-17", projectId: "p07", status: "Awaiting you" }
];

/* ── Activity seed (newest first) ─────────────────────────────────────── */
export const ACTIVITY: ActivityEvent[] = [
  { id: "a01", at: "2026-10-20", time: "09:12", stream: "ai", title: "Commercial Agent raised a margin warning", note: "Grand Canal Dock forecast 18.9% against a 24% target. Labour +€38.6k over budget.", actor: "Commercial Agent", rel: "LE-2026-008", src: "Agent", status: "awaiting" },
  { id: "a02", at: "2026-10-20", time: "08:41", stream: "people", title: "Declan Ryan raised PO-2618", note: "€12,600 LSZH cable for the L3 re-route. Over the €5,000 site limit, routed to Martin.", actor: "Declan Ryan", rel: "LE-2026-008", src: "Pulse", status: "awaiting" },
  { id: "a03", at: "2026-10-20", time: "08:05", stream: "ai", title: "Fuel Agent categorised 41 imported transactions", note: "37 auto-allocated by van and site. 4 need someone.", actor: "Fuel Agent", rel: "Fuel import w/e 18 Oct", src: "Agent", status: "completed" },
  { id: "a04", at: "2026-10-20", time: "07:30", stream: "ai", title: "Briefing Agent posted the morning brief", note: "3 valuations to review, €61,200 committed on Dalkey, 4 fuel lines to allocate.", actor: "Briefing Agent", rel: "Martin Lavelle", src: "Agent", status: "completed" },
  { id: "a05", at: "2026-10-20", time: "07:12", stream: "data", title: "Sync clock-ins imported", note: "36 clock-ins from 6 sites. Matched against yesterday's WhatsApp submissions.", actor: "Sync import (simulated)", rel: "Workforce", src: "Sync", status: "completed" },
  { id: "a06", at: "2026-10-19", time: "16:48", stream: "people", title: "Marty Doyle submitted site report SR-1043", note: "Second fix complete on units 13–18. 14 photos attached.", actor: "Marty Doyle", rel: "LE-2026-014", src: "Pulse", status: "awaiting" },
  { id: "a07", at: "2026-10-19", time: "16:05", stream: "data", title: "WhatsApp hours posted: Lavelle Projects group", note: "5 PMs posted 29 allocations. Orla reviews before they reach LiveCosts.", actor: "WhatsApp (existing)", rel: "Workforce", src: "WhatsApp", status: "completed" },
  { id: "a08", at: "2026-10-19", time: "14:20", stream: "people", title: "Shane Gallagher drafted claim VAL-008-09", note: "€186,400 for October, sent to Martin for internal review.", actor: "Shane Gallagher", rel: "LE-2026-008", src: "Pulse", status: "awaiting" },
  { id: "a09", at: "2026-10-19", time: "11:02", stream: "ai", title: "Ops Watchdog flagged a late delivery", note: "PO-2596 LED panels six days late. L4 ceiling closure at risk.", actor: "Ops Watchdog", rel: "LE-2026-008", src: "Agent", status: "completed" },
  { id: "a10", at: "2026-10-19", time: "09:40", stream: "data", title: "Xero demo sync: payment matched", note: "INV-LE-1190 Swords €41,800 matched to bank line (simulated).", actor: "Xero (demo connection)", rel: "LE-2026-019", src: "Xero", status: "completed" },
  { id: "a11", at: "2026-10-16", time: "15:10", stream: "people", title: "Client certified Santry claim VAL-005-04", note: "€96,500 of €102,000. €5,500 held on PDU commissioning.", actor: "Northside Data Centres QS", rel: "LE-2026-005", src: "Pulse", status: "completed" },
  { id: "a12", at: "2026-10-15", time: "12:30", stream: "people", title: "Docklands claim VAL-012-03 disputed", note: "Client QS disputes €6,200 on second-fix lighting.", actor: "Liffey Quay Hotels QS", rel: "LE-2026-012", src: "Pulse", status: "awaiting" },
  { id: "a13", at: "2026-10-12", time: "10:05", stream: "people", title: "Purchase order PO-2609 committed", note: "€5,850 detectors for Dalkey. Delivered 15 Oct, not yet invoiced.", actor: "Colm Kinsella", rel: "LE-2026-014", src: "Pulse", status: "completed" }
];

export const XERO_LOG: SyncEvent[] = [
  { id: "x1", at: "20 Oct 08:00", kind: "Contacts", text: "12 customer records compared, no changes (simulated)", state: "ok" },
  { id: "x2", at: "19 Oct 09:40", kind: "Payment", text: "INV-LE-1190 €41,800 matched to bank line 'PAVILION RETAIL GRP' (simulated)", state: "ok" },
  { id: "x3", at: "16 Oct 17:15", kind: "Reconcile", text: "INV-LE-1195 part payment €7,290 doesn't match any open amount. Needs review.", state: "warn" },
  { id: "x4", at: "09 Oct 16:02", kind: "Invoice", text: "INV-LE-1201 Galway Medical €71,600 created as draft, then approved (simulated)", state: "ok" },
  { id: "x5", at: "02 Oct 11:30", kind: "Invoice", text: "INV-LE-1190 Swords €41,800 pushed (simulated)", state: "ok" }
];

/* ── Build the mutable project list ──────────────────────────────────── */
const CTC_WEIGHTS: Record<ProjectType, Record<CostCat, number>> = {
  residential: { labour: 0.5, materials: 0.3, subcontract: 0.08, plant: 0.02, prelims: 0.1 },
  commercial: { labour: 0.46, materials: 0.32, subcontract: 0.12, plant: 0.02, prelims: 0.08 },
  industrial: { labour: 0.4, materials: 0.4, subcontract: 0.1, plant: 0.03, prelims: 0.07 },
  small: { labour: 0.55, materials: 0.35, subcontract: 0, plant: 0.03, prelims: 0.07 }
};

export function buildProjects(): Project[] {
  return PROJECT_SEEDS.map(s => {
    const openPO = PURCHASE_ORDERS.filter(p => p.projectId === s.id && p.status === "Committed");
    const poByCat: Record<CostCat, number> = { labour: 0, materials: 0, subcontract: 0, plant: 0, prelims: 0 };
    openPO.forEach(p => { poByCat[p.category] += p.value; });
    const actualTotal = CATS.reduce((n, c) => n + s.actual[c], 0);
    const poTotal = openPO.reduce((n, p) => n + p.value, 0);
    const ctcTotal = s.ftc - actualTotal - poTotal;
    const w = CTC_WEIGHTS[s.type];
    const ctc = s.ctcOverride ? { ...s.ctcOverride } : Object.fromEntries(CATS.map(c => [c, Math.round(ctcTotal * w[c])])) as Record<CostCat, number>;
    // keep the split exact after rounding
    if (!s.ctcOverride) ctc.labour += ctcTotal - CATS.reduce((n, c) => n + ctc[c], 0);
    const variations = VARIATIONS.filter(v => v.projectId === s.id && v.status === "Approved").reduce((n, v) => n + v.value, 0);
    const target = DEFAULT_TARGET[s.type];
    const forecastByCat = Object.fromEntries(CATS.map(c => [c, s.actual[c] + poByCat[c] + ctc[c]])) as Record<CostCat, number>;
    const budgetTotal = (s.originalValue + variations) * (1 - target);
    const budget = s.budgetOverride ? { ...s.budgetOverride }
      : Object.fromEntries(CATS.map(c => [c, Math.round(forecastByCat[c] / s.ftc * budgetTotal)])) as Record<CostCat, number>;
    const { ftc: _f, budgetOverride: _b, ctcOverride: _c, ...rest } = s;
    return { ...rest, actual: { ...s.actual }, ctc, budget, targetMargin: target };
  });
}
