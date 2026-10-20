/* Demo data and pure helpers for Pulse: Lavelle Electrical Group. All business figures are illustrative demo data. */

const INK="var(--ink)", BODY="var(--body)", DIM="var(--dim)", FAINT="var(--faint)";
const LIME="var(--accent)", GREEN="var(--ok)", AMBER="var(--warn)", RED="var(--bad)", NEUTRAL="var(--neutral)";
const MONO="var(--mono)";

const ICONS = {
  navHome:"M12 3.2 3.6 9.1v10a1.5 1.5 0 0 0 1.5 1.5h13.8a1.5 1.5 0 0 0 1.5-1.5v-10L12 3.2Z M8.9 13.1h2l1-2.6 1.5 5 1.1-2.4h1.6",
  navAgents:"M12 2.4v2.3 M12 2.4a.9.9 0 1 0 0-.02 M8.2 6.5h7.6A2.2 2.2 0 0 1 18 8.7v5.1a2.2 2.2 0 0 1-2.2 2.2H8.2A2.2 2.2 0 0 1 6 13.8V8.7a2.2 2.2 0 0 1 2.2-2.2Z M9.9 10.6v1.4 M14.1 10.6v1.4 M6 10h-1.9 M18 10h1.9 M9.2 18.6h5.6 M9.2 21.2h5.6",
  navDash:"M4 5.6h7.2v5.1H4V5.6Z M13.6 5.6H20v8.6h-6.4V5.6Z M4 13.1h7.2v5.3H4v-5.3Z M13.6 16.6H20v1.8h-6.4v-1.8Z",
  navWork:"M9.4 4.4h5.2a1.4 1.4 0 0 1 1.4 1.4v1.1h2.4A1.6 1.6 0 0 1 20 8.5v9.1a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 17.6V8.5a1.6 1.6 0 0 1 1.6-1.6H8V5.8a1.4 1.4 0 0 1 1.4-1.4Z M8 6.9h8 M9.6 13.3l1.8 1.8 3.4-3.6",
  navRecords:"M12 3.6c3.9 0 7 1.1 7 2.5S15.9 8.6 12 8.6 5 7.5 5 6.1 8.1 3.6 12 3.6Z M5 6.1v5.7c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6.1 M5 11.8v5.7c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-5.7",
  navActivity:"M4.6 4.6h14.8A1.6 1.6 0 0 1 21 6.2v11.6a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 17.8V6.2a1.6 1.6 0 0 1 1.6-1.6Z M6 12.4h2.2l1.5-4.1 2.3 8 1.9-5.4 1.2 1.5H18",
  navAdmin:"M12 2.9 5 5.6v5.9c0 4 2.8 7.1 7 8.6 4.2-1.5 7-4.6 7-8.6V5.6L12 2.9Z M12 8.6a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z M8.8 16.3a3.6 3.6 0 0 1 6.4 0",
  helios:"M21 11.5a8.4 8.4 0 0 1-9 8.4 9.9 9.9 0 0 1-4-.8L3 21l1.9-4.9A8.3 8.3 0 0 1 4 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z M8 12h1.6l1.2-2.6 1.6 5 1.4-2.4H16",
  inbox:"M3 13h4l1.5 3h7l1.5-3h4 M3 13l2.4-7A2 2 0 0 1 7.3 4.6h9.4a2 2 0 0 1 1.9 1.4L21 13v4.4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V13Z",
  work:"M6 4.6h12a1.6 1.6 0 0 1 1.6 1.6v12.2A1.6 1.6 0 0 1 18 20H6a1.6 1.6 0 0 1-1.6-1.6V6.2A1.6 1.6 0 0 1 6 4.6Z M8.4 10.4l1.9 1.9 3.9-3.9 M8.4 15.6h7.2",
  approvals:"M12 3.6 19.5 6v6.1c0 4-3.1 6.9-7.5 8.3-4.4-1.4-7.5-4.3-7.5-8.3V6L12 3.6Z M9.2 12.2l2 2 3.6-3.7",
  insights:"M4.5 19.5V13 M9.7 19.5V7.5 M14.9 19.5v-8 M20 19.5V5",
  people:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9",
  orgs:"M4.5 20V6.4A1.4 1.4 0 0 1 5.9 5h6.2a1.4 1.4 0 0 1 1.4 1.4V20 M13.5 10.5h4.6A1.4 1.4 0 0 1 19.5 12v8 M3 20h18 M7.5 8.5h2.5 M7.5 12h2.5 M7.5 15.5h2.5",
  teams:"M9 12a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 12Z M16.5 12.5a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z M2.6 19.6c.8-2.8 3.2-4.4 6.4-4.4s5.6 1.6 6.4 4.4 M17 15.4c2.2.4 3.7 1.8 4.3 4.2",
  locations:"M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z M12 12.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z",
  visits:"M8 4v3 M16 4v3 M4.5 9.5h15 M6.4 6h11.2A1.9 1.9 0 0 1 19.5 8v10a1.9 1.9 0 0 1-1.9 1.9H6.4A1.9 1.9 0 0 1 4.5 18V8A1.9 1.9 0 0 1 6.4 6Z M9 13.5l1.6 1.6 3.4-3.4",
  autos:"M18.5 8.5A5 5 0 0 0 8.9 7.3 3.8 3.8 0 0 0 6 14.6 M8 17.5l3.2 3.2 M11.2 20.7l3.2-3.2 M11.2 20.7V9.6",
  health:"M3 12.5h3.4l2-5 3 10 2.2-5H21",
  modules:"M6.6 4.4h10.8a2.2 2.2 0 0 1 2.2 2.2v10.8a2.2 2.2 0 0 1-2.2 2.2H6.6a2.2 2.2 0 0 1-2.2-2.2V6.6a2.2 2.2 0 0 1 2.2-2.2Z M4.4 9.6h15.2 M9.6 19.6V9.6",
  agents:"M8.5 3.6h7A2.4 2.4 0 0 1 17.9 6v5.6a2.4 2.4 0 0 1-2.4 2.4h-7A2.4 2.4 0 0 1 6.1 11.6V6a2.4 2.4 0 0 1 2.4-2.4Z M9.6 8.2h.01 M14.4 8.2h.01 M12 14v2.6 M7.6 20.4h8.8 M12 16.6c-2.4 0-4.4 1.7-4.4 3.8h8.8c0-2.1-2-3.8-4.4-3.8Z",
  dash:"M4.4 4.4h6v6h-6v-6Z M13.6 4.4h6v3.6h-6V4.4Z M13.6 11.6h6v8h-6v-8Z M4.4 14h6v5.6h-6V14Z",
  files:"M5 7.2a1.8 1.8 0 0 1 1.8-1.8h3l1.8 2.2h5.6A1.8 1.8 0 0 1 19 9.4v7.4a1.8 1.8 0 0 1-1.8 1.8H6.8A1.8 1.8 0 0 1 5 16.8V7.2Z",
  pulseLine:"M2.5 12.5h3.6l2.1-6.4 3.2 12.2 2.6-8.4 1.8 2.6h5.7",
  records:"M6.4 3.6h7.4l4.2 4.2v12.6H6.4V3.6Z M13.4 3.8v4.2h4.2 M9 12.4h6 M9 16h4",
  tree:"M4.5 6h5 M4.5 12h5 M4.5 18h5 M12.5 6h7 M12.5 12h7 M12.5 18h7",
  graph:"M7 7.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M17.6 10.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M9.4 21.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M8.6 6.4l7.6 2.6 M15.8 11.4l-5.6 5.2",
  bell:"M6 8.5a6 6 0 0 1 12 0c0 6.5 2.6 8.5 2.6 8.5H3.4S6 15 6 8.5Z M10.3 20.5a1.94 1.94 0 0 0 3.4 0",
  lvProjects:"M3.5 10.5 12 4l8.5 6.5 M5.5 9v11h13V9 M10 20v-5.5h4V20",
  lvEstimating:"M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5Z M8.5 7h7v3h-7Z M9 13.5h.01 M12 13.5h.01 M15 13.5h.01 M9 16.5h.01 M12 16.5h.01 M15 16.5h.01",
  lvClaims:"M6.5 3.5h8l3.5 3.5v13.5H6.5Z M14.5 3.5V7H18 M14.6 11.4a3 3 0 1 0 0 4.4 M9 12.9h4.6 M9 14.5h4.6",
  lvWorkforce:"M3.5 17.5h17 M5 17.5v-2a7 7 0 0 1 14 0v2 M10 8.7V5.5h4v3.2 M12 5.5v3.4",
  lvSite:"M9 4.5h6v2.5H9Z M7.5 5.6H6a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 6 20.6h12a1.5 1.5 0 0 0 1.5-1.5v-12A1.5 1.5 0 0 0 18 5.6h-1.5 M8.5 13.6l2.2 2.2 4.8-4.8",
  lvProcure:"M12 3.5 20 7.5v9L12 20.5 4 16.5v-9L12 3.5Z M4 7.5l8 4 8-4 M12 11.5v9",
  lvFleet:"M2.5 16.5V7.5A1.5 1.5 0 0 1 4 6h10v10.5 M14 9.5h3.6l3.4 3.6v3.4h-2 M7.6 16.5h7 M5.8 18.4a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z M17 18.4a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z"
};

/* Ontology stays first and is never removed (PulseLogic enforces this too). */
const REC_SECTIONS = [
  {id:"ontology", label:"Ontology", blurb:"How every Lavelle record connects: client to project to contract line, claim, certificate, invoice and payment."},
  {id:"files", label:"Files", blurb:"Contracts, drawings, certificates and valuations, indexed where Pulse can read them."},
  {id:"contacts", label:"Contacts", blurb:"Staff, subcontractors, clients and suppliers in one directory."},
  {id:"chain", label:"Relationships", blurb:"Follow one record through every record it touches."}
];
const CONTACTS = [
  ["Martin Lavelle","Managing Director","martin@lavelleelectrical.ie","Lavelle Electrical Group","staff","var(--accent)"],
  ["Gráinne Fitzpatrick","Contracts Manager","grainne@lavelle.example","Lavelle Electrical Group","staff","#9fd6f0"],
  ["Colm Kinsella","Project Manager","colm@lavelle.example","Lavelle Electrical Group","staff","#9fd6f0"],
  ["Conor Mulvihill","Project Manager","conor@lavelle.example","Lavelle Electrical Group","staff","#9fd6f0"],
  ["Shane Gallagher","Quantity Surveyor","shane@lavelle.example","Lavelle Electrical Group","staff","#e6c78a"],
  ["Niall Hennessy","Senior Electrical Estimator","niall@lavelle.example","Lavelle Electrical Group","staff","#c8b4f0"],
  ["Orla Dempsey","Office Administrator","orla@lavelle.example","Lavelle Electrical Group","staff","#c8b4f0"],
  ["Marty Doyle","Foreman, Dalkey","marty@lavelle.example","Lavelle Electrical Group","staff","#a8e0c0"],
  ["Eimear Hanlon","Development Director","eimear@seafieldhomes.example","Seafield Homes Ltd","client","#9fd6f0"],
  ["Rob Delaney","Project Director","rob.delaney@harcourtfitout.example","Harcourt Fit-Out Partners","client","#e6c78a"],
  ["Karen Moynihan","Facilities Lead","kmoynihan@northsidedc.example","Northside Data Centres Ltd","client","#a8e0c0"],
  ["James Brophy","Projects Manager","projects@liffeyquayhotels.example","Liffey Quay Hotels","dispute","#e2a08c"],
  ["Tadhg Brennan","Electrician (labour only)","tadhg@tbelectrical.example","TB Electrical Services","subcontractor","#c8b4f0"],
  ["Brennan Data Cabling","Structured cabling","office@brennandata.example","Brennan Data Cabling Ltd","subcontractor","#c8b4f0"],
  ["Trade desk","Account LEW-2207","trade@liffeyew.example","Liffey Electrical Wholesale","supplier","#9fd6f0"],
  ["Orders","Account BLD-0418","orders@brightline.example","Brightline Lighting Distributors","late delivery","#e2a08c"]
];
const FILE_TREE = [
  {type:"folder", id:"f-con", name:"Contracts & valuations", depth:0},
  {type:"file", id:"fl-1", name:"LE-2026-014 Dalkey: contract schedule.pdf", depth:1, parent:"f-con", indexed:true,
   path:"Contracts / LE-2026-014 Dalkey", title:"LE-2026-014 Dalkey: contract schedule",
   facts:[["TYPE","PDF · 14 pages"],["ADDED","21 Apr 2026"],["INDEXED","All 14 pages"],["OWNER","Niall Hennessy"]],
   body:["The ten-heading schedule priced from Countfire take-off TO-0412 on drawings E-100 Rev B. Contract sum €600,000 (illustrative demo value).",
     "Valuations are monthly, last Monday of the month, assessed by the client QS within 14 days. Payment 30 days from certificate.",
     "Variation VO-014-01 (EV charger supplies, €18,400) was instructed in August and is valued as its own line, separate from the schedule."],
   links:[["Seafield Homes Ltd","org"],["Eimear Hanlon","person"],["VAL-014-05","claim"]]},
  {type:"file", id:"fl-2", name:"VAL-014-04 certificate, September.pdf", depth:1, parent:"f-con", indexed:true,
   path:"Contracts / LE-2026-014 Dalkey / Valuations", title:"VAL-014-04 certificate, September",
   facts:[["TYPE","PDF · 2 pages"],["ADDED","29 Sep 2026"],["CERTIFIED","€42,850"],["OWNER","Shane Gallagher"]],
   body:["The client QS certified €42,850 for September, taking the cumulative certified value to €191,750 (illustrative).",
     "October's claim starts from these line percentages: containment 40%, general lighting 30%, power distribution 45%."],
   links:[["LE-2026-014","project"],["INV-LE-1187","invoice"]]},
  {type:"file", id:"fl-3", name:"VO-008-03 pricing breakdown.xlsx", depth:1, parent:"f-con", indexed:false,
   path:"Contracts / LE-2026-008 Grand Canal Dock", title:"VO-008-03 pricing breakdown",
   facts:[["TYPE","XLSX · 3 sheets"],["ADDED","14 Oct 2026"],["VALUE","€22,800"],["OWNER","Shane Gallagher"]],
   body:["Containment re-route around the revised ceiling grid on L3–L4, priced from 380 extra hours and LSZH cable.",
     "Spreadsheets are stored but not indexed by default. Pulse quotes the variation record, not this file."],
   links:[["Harcourt Fit-Out Partners","org"],["RFI-031","rfi"]]},
  {type:"folder", id:"f-cert", name:"Certificates & safety", depth:0},
  {type:"file", id:"fl-4", name:"Kimmage units 1–6: Safe Electric certs.pdf", depth:1, parent:"f-cert", indexed:true,
   path:"Certificates / LE-2026-009 Kimmage", title:"Kimmage units 1–6: completion certificates",
   facts:[["TYPE","PDF · 6 files"],["ADDED","16 Oct 2026"],["STANDARD","I.S. 10101"],["OWNER","Brian Healy"]],
   body:["Completion certificates for units 1–6 after testing on 16 Oct. Units 7–12 are in test this week.",
     "Certificates are a precondition for the final valuation on the contract."],
   links:[["LE-2026-009","project"],["Brian Healy","person"]]},
  {type:"file", id:"fl-5", name:"Santry shutdown method statement.pdf", depth:1, parent:"f-cert", indexed:true,
   path:"Safety / LE-2026-005 Santry", title:"Method statement: weekend shutdown 24–25 Oct",
   facts:[["TYPE","PDF · 11 pages"],["ADDED","16 Oct 2026"],["STATUS","Draft"],["OWNER","Aisling Brennan"]],
   body:["Isolation sequence for the UPS output panels in a live data hall. Permit-to-work issued by the client.",
     "The isolation audit on 9 Oct failed with four actions. All four must close before the shutdown goes ahead."],
   links:[["LE-2026-005","project"],["Northside Data Centres Ltd","org"]]},
  {type:"folder", id:"f-fin", name:"Finance & imports", depth:0},
  {type:"file", id:"fl-6", name:"Fuel card statement w/e 18 Oct.csv", depth:1, parent:"f-fin", indexed:true,
   path:"Finance / Fuel imports", title:"Fuel card statement, week ending 18 Oct",
   facts:[["TYPE","CSV · 41 rows"],["ADDED","19 Oct 2026"],["SOURCE","Supplier CSV (simulated)"],["OWNER","Ciara Nolan"]],
   body:["Imported through the supplier-agnostic CSV mapping. No live connector to any fuel card provider.",
     "37 rows auto-allocated by van and site; 4 need someone, including card ••3308 flagged for a second fill inside 24 hours."],
   links:[["Fleet & Fuel","area"],["Fuel Agent","agent"]]},
  {type:"file", id:"fl-7", name:"Countfire export TO-0431 Cherrywood L2.csv", depth:1, parent:"f-fin", indexed:true,
   path:"Estimating / Take-offs", title:"Countfire export TO-0431 (simulated)",
   facts:[["TYPE","CSV · 13 rows"],["ADDED","16 Oct 2026"],["DRAWING","E-201 Rev C"],["OWNER","Niall Hennessy"]],
   body:["Symbol counts from four drawings: 412 downlights, 186 panels, 118 smoke detectors, 352 data outlets.",
     "This is a simulated export to show how Countfire output feeds the estimate. Pulse does not count drawings itself."],
   links:[["EN-2026-101","enquiry"],["QUO-2026-061","quote"]]}
];
const ONTO_NODES = [
  ["Project","entity",500,300,1,"The spine of the business. Every cost, claim, crew and fuel line hangs off a project."],
  ["Client","entity",300,190,1,"Developers, main contractors and owners. One Xero contact each (demo connection)."],
  ["Contract","entity",700,190,1,"The awarded schedule: ten electrical headings plus approved variations."],
  ["Employee","entity",250,430,1,"40 staff and 15 subcontractors. Allocations and timesheets point at projects."],
  ["Claim","entity",690,430,1,"Monthly valuation: cumulative less previously certified, line by line."],
  ["Certificate","entity",850,320,0,"What the client QS agreed. Can be less than claimed."],
  ["Invoice","ledger",390,95,0,"Raised from the certified amount, synced to Xero (demo connection)."],
  ["Purchase order","ledger",620,95,0,"Committed against the project the moment it's approved."],
  ["Fuel transaction","module",860,470,0,"Imported from the card statement CSV and allocated to a project."],
  ["Drawing","entity",140,300,0,"Drawings feed the take-off, estimate and quote that become the contract."],
  ["engages","predicate",395,240,0,"Client → Project."],
  ["governed by","predicate",605,240,0,"Project → Contract."],
  ["allocated to","predicate",360,370,0,"Employee → Project."],
  ["values","predicate",600,370,0,"Claim → Contract line."],
  ["priced from","predicate",140,372,0,"Contract → Drawing."]
];
const ONTO_EDGES = [
  [500,300,300,190],[500,300,700,190],[500,300,250,430],[500,300,690,430],
  [500,300,850,320],[500,300,390,95],[500,300,620,95],[500,300,140,300],
  [300,190,250,430],[700,190,860,470],[690,430,850,320],[690,430,860,470],
  [300,190,140,300],[390,95,620,95]
];

const REC_TEMPLATES = [
  ["Field sheet","Records","Labelled fields in a grid — the default for a person, organisation or location.",
   "M5 5.5h14v13H5v-13Z M5 10h14 M12 10v8.5","grid"],
  ["Contact card","Records","A portrait, key fields and every linked record in one compact panel.",
   "M12 11.5a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z M5.5 19c.8-3 3.3-4.7 6.5-4.7s5.7 1.7 6.5 4.7","card"],
  ["Directory","Records","A sortable table of many records at once, built for lists.",
   "M4.5 6.5h15 M4.5 12h15 M4.5 17.5h15 M4.5 6.5h.01 M4.5 12h.01 M4.5 17.5h.01","rows"],
  ["Timeline","Case work","Ordered events with who did what and when. Good for a case or a claim.",
   "M12 3.5v17 M12 7.5h6 M12 13h-6 M12 18h6","timeline"],
  ["Kanban board","Case work","Cards in columns by status. For anything that moves through stages.",
   "M5 5h4.5v14H5V5Z M9.75 5h4.5v9h-4.5V5Z M14.5 5H19v6h-4.5V5Z","kanban"],
  ["Checklist","Case work","Ticked steps in order, with an owner and a due date on each.",
   "M5 6.5h2l1.4 1.4L11 5.5 M5 12.5h2l1.4 1.4 2.6-2.4 M5 18.5h2l1.4 1.4 2.6-2.4 M15 6.5h4 M15 12.5h4 M15 18.5h4","checklist"],
  ["Ledger","Finance","Rows and running totals. For anything with amounts and dates.",
   "M4 6h16 M4 12h16 M4 18h16 M9 3.5v17","ledger"],
  ["Invoice","Finance","Line items, totals and a status — built to be sent, not just stored.",
   "M7 3.5h10v17H7v-17Z M9.5 8h5 M9.5 11.5h5 M9.5 15h3","invoice"],
  ["Document","Notes","Long-form text with linked records pulled out down the side.",
   "M7 3.5h7l5 5v12H7v-17Z M14 3.7v5h5 M10 13h6 M10 16.5h4","document"],
  ["Gallery","Notes","A wall of images and files with a caption on each — for a site or a job.",
   "M4.5 6h6v6h-6V6Z M13.5 6h6v6h-6V6Z M4.5 14h6v4h-6v-4Z M13.5 14h6v4h-6v-4Z","gallery"],
  ["Map & locations","Ops","A pinboard of places, with the record's fields beside each pin.",
   "M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z M12 12.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z","map"],
  ["Schedule","Ops","A calendar of bookings against this record, with recurring rules.",
   "M8 4v3 M16 4v3 M4.5 9.5h15 M6.4 6h11.2A1.9 1.9 0 0 1 19.5 8v10a1.9 1.9 0 0 1-1.9 1.9H6.4A1.9 1.9 0 0 1 4.5 18V8A1.9 1.9 0 0 1 6.4 6Z","schedule"]
];
const REC_TEMPLATE_CATS = ["All","Records","Case work","Finance","Notes","Ops"];

/* ---- admin hub ---- */
/* ---- admin hub: 13 settings areas in five groups ---- */
const PEOPLE = [
  ["Martin Lavelle","Managing Director","martin@lavelleelectrical.ie","Dublin","active","Admin","Now"],
  ["Gráinne Fitzpatrick","Contracts Manager","grainne@lavelle.example","Dublin","active","Manager","12 min ago"],
  ["Colm Kinsella","Project Manager","colm@lavelle.example","Dublin","active","Manager","34 min ago"],
  ["Shane Gallagher","Quantity Surveyor","shane@lavelle.example","Dublin","active","Manager","1 h ago"],
  ["Orla Dempsey","Office Administrator","orla@lavelle.example","Dublin","active","Standard","8 min ago"],
  ["Ronan Keane","Project Manager (Galway)","ronan@lavelle.example","Galway","active","Manager","2 h ago"],
  ["Rob Delaney","Project Director · Harcourt Fit-Out","rob.delaney@harcourtfitout.example","—","external","External","3 days ago"]
];
const ROLE_LEVELS = ["Admin","Manager","Standard","External"];
const PERM_KEYS = [["view","View records"],["edit","Edit records"],["approve","Approve payments"]];
const GRANT_DEFS = [
  ["view","View records","Read anything in scope"],
  ["edit","Edit records","Create and change records"],
  ["approve","Approve decisions","Say yes to parked work"],
  ["pay","Release payments","Send money out"],
  ["export","Export data","Download and share out"],
  ["agents","Manage agents","Create and grant agents"],
  ["settings","Change settings","Modules, roles, integrations"],
  ["audit","Read the audit log","Every action, everyone"]
];
const ROLE_SCOPES = ["All records","Their location","Assigned only"];
const DEFAULT_PERMS = {Admin:{view:true,edit:true,approve:true}, Manager:{view:true,edit:true,approve:true},
  Standard:{view:true,edit:true,approve:false}, External:{view:true,edit:false,approve:false}};
const INTEGRATIONS = [
  {name:"LiveCosts", blurb:"Project cost management, purchase orders and labour costing. Proposed: connect or migrate cost history into Pulse. Not connected in this demo.", tint:"#16BED6", status:"proposed migration", statusKind:"off",
   glyph:"M4 19.5h16 M6.5 16V10 M11 16V6 M15.5 16v-4 M20 16V8",
   lastSync:"Not connected", usage:"Cost codes, POs, labour", auth:"To be confirmed", scopes:[]},
  {name:"ServiceM8", blurb:"Scheduling, small jobs and invoicing today. Proposed: migrate small works and call-outs into Pulse. Not connected in this demo.", tint:"#e0a64a", status:"proposed migration", statusKind:"off",
   glyph:"M8 4v3 M16 4v3 M4.5 9.5h15 M6.4 6h11.2A1.9 1.9 0 0 1 19.5 8v10a1.9 1.9 0 0 1-1.9 1.9H6.4A1.9 1.9 0 0 1 4.5 18V8A1.9 1.9 0 0 1 6.4 6Z",
   lastSync:"Not connected", usage:"Jobs, schedule, invoices", auth:"To be confirmed", scopes:[]},
  {name:"Xero", blurb:"Stays the accounting system. Invoices, payments and contacts would sync both ways. Simulated in this demo: no API calls are made.", tint:"#13b5ea", status:"simulated sync", statusKind:"warn",
   glyph:"M4.5 12a7.5 7.5 0 0 1 12.8-5.3 M19.5 12a7.5 7.5 0 0 1-12.8 5.3 M17.3 4v3.3h-3.3 M6.7 20v-3.3H10",
   lastSync:"Demo connection", usage:"Invoices, payments, contacts", auth:"Demo only", scopes:["Simulated"]},
  {name:"Countfire", blurb:"The estimators' drawing take-offs. Proposed: import symbol counts into the estimate. Shown here with a simulated export.", tint:"#9d8cf5", status:"proposed import", statusKind:"off",
   glyph:"M5 5h14v14H5Z M9 9h.01 M15 9h.01 M9 15h.01 M15 15h.01 M12 12h.01",
   lastSync:"Not connected", usage:"Symbol counts, quantities", auth:"File export", scopes:[]},
  {name:"Sync", blurb:"Clock-in and location from the staff app. Proposed: import clock-ins to check against PM allocations. Simulated here.", tint:"#52BA62", status:"proposed import", statusKind:"off",
   glyph:"M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7.6V12l3 1.8",
   lastSync:"Not connected", usage:"Clock-ins, locations", auth:"To be confirmed", scopes:[]},
  {name:"WhatsApp", blurb:"The Lavelle Projects group, where PMs post hours at 16:00. It stays as it is; Pulse reads the submissions for review. Existing workflow.", tint:"#25d366", status:"existing workflow", statusKind:"ok",
   glyph:"M4 19.5 5.3 15A7.7 7.7 0 1 1 8.6 18.2L4 19.5Z M8.6 10.3c0 3 2.4 5.4 5.4 5.4",
   lastSync:"Manual today", usage:"Daily hours posts", auth:"None in demo", scopes:[]},
  {name:"Fuel card supplier", blurb:"Supplier name to be confirmed (moving from DCI). Proposed: import the statement CSV, so no provider-specific connector is needed.", tint:"#e2705c", status:"proposed CSV import", statusKind:"off",
   glyph:"M5 20V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14 M4 20h12 M15 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V9l-3-3",
   lastSync:"CSV (simulated)", usage:"Card transactions", auth:"File import", scopes:[]}
];
/* Background catalogue. Each entry is pure CSS so a tile is the real thing at
   thumbnail size, not a picture of it. */
const BG_DEFS = [
  {id:"bloom", name:"Bloom", cat:"Signature",
   css:"background:radial-gradient(60% 48% at 50% 34%, var(--accent-faint), transparent 72%), radial-gradient(44% 38% at 16% 84%, rgba(255,255,255,.05), transparent 70%)",
   thumb:"background:radial-gradient(62% 58% at 46% 34%, var(--accent-soft), transparent 74%), radial-gradient(50% 46% at 82% 84%, rgba(255,255,255,.08), transparent 72%), var(--surface-2)"},
  {id:"mist", name:"Mist", cat:"Signature",
   css:"background:radial-gradient(52% 44% at 24% 22%, rgba(255,255,255,.07), transparent 70%), radial-gradient(56% 46% at 80% 76%, rgba(255,255,255,.05), transparent 72%)",
   thumb:"background:radial-gradient(58% 52% at 24% 22%, rgba(255,255,255,.16), transparent 72%), radial-gradient(60% 54% at 82% 78%, rgba(255,255,255,.10), transparent 74%), var(--surface-2)"},
  {id:"grid", name:"Grid", cat:"Signature",
   css:"background-image:linear-gradient(var(--border) 1px, transparent 1px),linear-gradient(90deg, var(--border) 1px, transparent 1px);background-size:56px 56px;mask-image:radial-gradient(62% 56% at 50% 46%, #000, transparent 78%);-webkit-mask-image:radial-gradient(62% 56% at 50% 46%, #000, transparent 78%)",
   thumb:"background-color:var(--surface-2);background-image:linear-gradient(var(--border-strong) 1px, transparent 1px),linear-gradient(90deg, var(--border-strong) 1px, transparent 1px);background-size:14px 14px"},
  {id:"none", name:"None", cat:"Signature", css:"", thumb:"background:var(--surface-2)"},

  {id:"aurora", name:"Aurora", cat:"Gradient",
   css:"background:radial-gradient(70% 52% at 18% 8%, var(--bloom-a), transparent 66%), radial-gradient(64% 48% at 84% 22%, var(--bloom-b), transparent 68%), radial-gradient(70% 60% at 50% 104%, var(--bloom-c), transparent 70%);filter:blur(24px)",
   thumb:"background:radial-gradient(72% 60% at 16% 6%, var(--bloom-a), transparent 68%), radial-gradient(66% 54% at 86% 24%, var(--bloom-b), transparent 70%), radial-gradient(74% 66% at 50% 108%, var(--bloom-c), transparent 72%), var(--surface-2)"},
  {id:"horizon", name:"Horizon", cat:"Gradient",
   css:"background:linear-gradient(180deg, transparent 0%, var(--accent-faint) 58%, transparent 100%), radial-gradient(90% 40% at 50% 72%, var(--accent-soft), transparent 70%)",
   thumb:"background:linear-gradient(180deg, var(--surface-2) 0%, var(--accent-faint) 58%, var(--surface-2) 100%), radial-gradient(90% 44% at 50% 74%, var(--accent-soft), transparent 70%)"},
  {id:"dusk", name:"Dusk", cat:"Gradient",
   css:"background:linear-gradient(200deg, var(--bloom-c) -10%, transparent 46%), linear-gradient(20deg, var(--bloom-b) -10%, transparent 52%);opacity:.5",
   thumb:"background:linear-gradient(200deg, var(--bloom-c) -12%, transparent 48%), linear-gradient(20deg, var(--bloom-b) -12%, transparent 54%), var(--surface-2)"},
  {id:"ember", name:"Ember", cat:"Gradient",
   css:"background:radial-gradient(60% 70% at 84% 96%, var(--bloom-a), transparent 64%), radial-gradient(50% 60% at 10% 96%, var(--bloom-c), transparent 66%)",
   thumb:"background:radial-gradient(64% 76% at 84% 100%, var(--bloom-a), transparent 66%), radial-gradient(54% 66% at 8% 100%, var(--bloom-c), transparent 68%), var(--surface-2)"},

  {id:"mesh", name:"Mesh", cat:"Abstract",
   css:"background-image:radial-gradient(var(--border-strong) 1px, transparent 1px);background-size:22px 22px;mask-image:radial-gradient(70% 62% at 50% 46%, #000, transparent 76%);-webkit-mask-image:radial-gradient(70% 62% at 50% 46%, #000, transparent 76%)",
   thumb:"background-color:var(--surface-2);background-image:radial-gradient(var(--border-strong) 1px, transparent 1px);background-size:8px 8px"},
  {id:"contour", name:"Contour", cat:"Abstract",
   css:"background:repeating-radial-gradient(circle at 30% 110%, transparent 0 22px, var(--border) 22px 23px);mask-image:radial-gradient(80% 70% at 40% 80%, #000, transparent 78%);-webkit-mask-image:radial-gradient(80% 70% at 40% 80%, #000, transparent 78%)",
   thumb:"background:repeating-radial-gradient(circle at 26% 116%, var(--surface-2) 0 9px, var(--border-strong) 9px 10px)"},
  {id:"weave", name:"Weave", cat:"Abstract",
   css:"background:repeating-linear-gradient(48deg, transparent 0 16px, var(--border) 16px 17px), repeating-linear-gradient(-48deg, transparent 0 16px, var(--border) 16px 17px);opacity:.7",
   thumb:"background-color:var(--surface-2);background-image:repeating-linear-gradient(48deg, transparent 0 7px, var(--border-strong) 7px 8px), repeating-linear-gradient(-48deg, transparent 0 7px, var(--border-strong) 7px 8px)"},
  {id:"halo", name:"Halo", cat:"Abstract",
   css:"background:repeating-radial-gradient(circle at 50% 50%, transparent 0 46px, var(--accent-line) 46px 47px);mask-image:radial-gradient(60% 60% at 50% 50%, #000, transparent 72%);-webkit-mask-image:radial-gradient(60% 60% at 50% 50%, #000, transparent 72%)",
   thumb:"background:repeating-radial-gradient(circle at 50% 50%, var(--surface-2) 0 11px, var(--accent-line) 11px 12px)"},
  {id:"drift", name:"Drift", cat:"Abstract",
   css:"background:conic-gradient(from 210deg at 32% 38%, var(--bloom-b), transparent 38%), conic-gradient(from 20deg at 76% 70%, var(--bloom-a), transparent 34%);filter:blur(30px);opacity:.6",
   thumb:"background:conic-gradient(from 210deg at 32% 38%, var(--bloom-b), transparent 38%), conic-gradient(from 20deg at 76% 70%, var(--bloom-a), transparent 34%), var(--surface-2)"},
  {id:"scan", name:"Scanlines", cat:"Abstract",
   css:"background:repeating-linear-gradient(0deg, var(--border) 0 1px, transparent 1px 7px);mask-image:linear-gradient(180deg, #000, transparent 88%);-webkit-mask-image:linear-gradient(180deg, #000, transparent 88%)",
   thumb:"background-color:var(--surface-2);background-image:repeating-linear-gradient(0deg, var(--border-strong) 0 1px, transparent 1px 5px)"}
];

const THEMES = [
  {id:"dark", label:"Dark", group:"Dark", bg:"#0b0c0b", surface:"#1a1c19", ink:"#f2f3ef", accent:"#c8f04b"},
  {id:"indigo", label:"Indigo", group:"Dark", bg:"#0a0b13", surface:"#1a1b26", ink:"#f0f1fa", accent:"#8b93ff"},
  {id:"slate", label:"Slate", group:"Dark", bg:"#100e0c", surface:"#211c17", ink:"#f4f0ea", accent:"#e8a14a"},
  {id:"plum", label:"Plum", group:"Dark", bg:"#100a10", surface:"#20151f", ink:"#f6eef4", accent:"#f077b0"},
  {id:"ember", label:"Ember", group:"Dark", bg:"#0b0b0b", surface:"#1c1714", ink:"#f7f3ef", accent:"#f4561a"},
  {id:"harbour", label:"Lavelle", group:"Dark", bg:"#0b0e10", surface:"#13171a", ink:"#f3f5f4", accent:"#16BED6"},
  {id:"cargo", label:"Cargo", group:"Dark", bg:"#0a0a0a", surface:"#1a1c1a", ink:"#f2f5f2", accent:"#4ade80"},
  {id:"ocean", label:"Ocean", group:"Dark", bg:"#080e12", surface:"#141f25", ink:"#eaf4f8", accent:"#4fd4d0"},
  {id:"graphite", label:"Graphite", group:"Dark", bg:"#111112", surface:"#212124", ink:"#f4f4f5", accent:"#f4f4f5"},
  {id:"light", label:"Lavelle light", group:"Light", bg:"#f4f2ed", surface:"#ffffff", ink:"#16181c", accent:"#0a8496"},
  {id:"warm", label:"Warm paper", group:"Light", bg:"#faf5ec", surface:"#fffdf9", ink:"#2a2016", accent:"#c9683f"},
  {id:"mist", label:"Mist", group:"Light", bg:"#eef1f4", surface:"#ffffff", ink:"#141e20", accent:"#0e9f6e"},
  {id:"sand", label:"Sand", group:"Light", bg:"#f6f1e6", surface:"#fffdf7", ink:"#221d12", accent:"#7d5fd6"}
];

const ADMIN_ICONS = {
  people:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9",
  teams:"M9 12a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 12Z M16.5 12.5a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z M2.6 19.6c.8-2.8 3.2-4.4 6.4-4.4s5.6 1.6 6.4 4.4 M17 15.4c2.2.4 3.7 1.8 4.3 4.2",
  structure:"M4.5 20V6.4A1.4 1.4 0 0 1 5.9 5h6.2a1.4 1.4 0 0 1 1.4 1.4V20 M13.5 10.5h4.6A1.4 1.4 0 0 1 19.5 12v8 M3 20h18 M7.5 8.5h2.5 M7.5 12h2.5",
  shield:"M12 3.6 19.5 6v6.1c0 4-3.1 6.9-7.5 8.3-4.4-1.4-7.5-4.3-7.5-8.3V6L12 3.6Z M9.2 12.2l2 2 3.6-3.7",
  agent:"M2 12h4l2.5-6 3.5 12 3-8 2 2h5",
  flow:"M18.5 8.5A5 5 0 0 0 8.9 7.3 3.8 3.8 0 0 0 6 14.6 M8 17.5l3.2 3.2 M11.2 20.7l3.2-3.2 M11.2 20.7V9.6",
  plug:"M9 3.5v5 M15 3.5v5 M6.5 8.5h11v3a5.5 5.5 0 0 1-11 0v-3Z M12 17v3.5",
  modules:"M6.6 4.4h10.8a2.2 2.2 0 0 1 2.2 2.2v10.8a2.2 2.2 0 0 1-2.2 2.2H6.6a2.2 2.2 0 0 1-2.2-2.2V6.6a2.2 2.2 0 0 1 2.2-2.2Z M4.4 9.6h15.2 M9.6 19.6V9.6",
  health:"M3 12.5h3.4l2-5 3 10 2.2-5H21",
  lock:"M6.5 10.5h11a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19v-7a1.5 1.5 0 0 1 1.5-1.5Z M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3",
  audit:"M8 3.5h8l3.5 3.5v13a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 6 3.5h2Z M9 12h6 M9 16h4",
  brand:"M12 3.5 14.6 9l6.4.6-4.8 4.2 1.4 6.2-5.6-3.3-5.6 3.3 1.4-6.2L3 9.6 9.4 9 12 3.5Z",
  bell:"M6 8.5a6 6 0 0 1 12 0c0 6.5 2.6 8.5 2.6 8.5H3.4S6 15 6 8.5Z M10.3 20.5a1.94 1.94 0 0 0 3.4 0",
  data:"M4.5 7.5c0-1.7 3.4-3 7.5-3s7.5 1.3 7.5 3-3.4 3-7.5 3-7.5-1.3-7.5-3Z M4.5 7.5v9c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-9 M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"
};

const ADMIN_CARDS = [
  {id:"structure", group:"ORGANISATION", title:"Company structure", icon:"structure", tint:"#16BED6",
   blurb:"Lavelle Electrical Group: who reports to whom, where they work and when.",
   tags:["Founded 2015","Dublin & Galway","EUR"],
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Company","Lavelle Electrical Group"],["Founder","Martin Lavelle"],["Member company","South Dublin Electricians"],["Locations","Dublin (head office) · Galway"],
     ["Staff","40 full-time · 15 subcontractors"],["Office hours","08:00–17:00, Mon–Fri"],["Site hours","07:00–15:30"],
     ["Default currency and timezone","EUR · Europe/Dublin"]]},
  {id:"notif", group:"ORGANISATION", title:"Calendar & working rules", icon:"bell", tint:"#f0994b",
   blurb:"Valuation days, the 16:00 hours post, holidays and quiet hours.",
   tags:["Valuations monthly","16:00 hours post","Quiet 19:00–07:00"],
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Valuation day","per contract (see Claims)"],["Hours submission","16:00 in Lavelle Projects WhatsApp"],["Holidays","Irish public holidays"],
     ["Email","", true],["WhatsApp","", true],["Mobile push","", true],["Quiet hours","19:00–07:00"],["Morning briefing","07:30 weekdays"]]},
  {id:"people", group:"TEAMS", title:"People & access", icon:"people", tint:"#52BA62",
   blurb:"Invite, suspend and offboard the people who use Pulse.",
   tags:["40 staff","15 subcontractors","2 locations"], badge:"2 invites", badgeKind:"warn",
   footer:"Subcontractors get site-report access only", action:"Review invites",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Add, invite or remove employees",""],["Crews and sites","5 foremen"],["Assign project managers","4 PMs"],
     ["Set locations","Dublin · Galway"],["Suspend accounts","0 suspended"],["View last login","40 people tracked"]]},
  {id:"crews", group:"TEAMS", title:"Teams & crews", icon:"teams", tint:"#9d8cf5",
   blurb:"Office, estimating, commercial and the five site crews.",
   tags:["Office 11","Site 29","Galway 5"],
   listLabel:"TEAMS",
   rows:[["Management","Martin Lavelle, Gráinne Fitzpatrick"],["Project management","Colm, Conor, Aisling, Ronan"],["Commercial","Shane Gallagher, Ciara Nolan"],
     ["Estimating","Niall Hennessy, Sinéad Corcoran"],["Site crews","Marty, Declan, Fergal, Pádraig, Eoin"],["Subcontractors","10 labour-only, 5 specialist firms"]]},
  {id:"teams", group:"PERMISSIONS", title:"Roles & permissions", icon:"shield", tint:"var(--accent)",
   blurb:"Permission templates and approval limits, and exactly what each person can reach.",
   tags:["5 roles","€5,000 site PO limit","3 scopes"],
   heroLabel:"THE QUESTION THIS ANSWERS", heroAction:"Show me what someone can access",
   heroText:"Pick a person and see every project, cost and claim they can reach. A foreman sees their own site, not the margins.",
   footer:"Preview Pulse as another user", action:"Open preview",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Who can see project margins","Owner, Contracts Manager, QS"],["Who can submit claims","Owner, QS"],
     ["PO approval limits","Foreman €1,000 · PM €5,000 · Owner unlimited"],["Restrict by project or site","3 scopes"],["Preview Pulse as another user",""]]},
  {id:"modules", group:"SYSTEMS", title:"Modules & configuration", icon:"modules", tint:"#f0c04b",
   blurb:"Turn modules on, and make Pulse use Lavelle's own words.",
   tags:["9 modules","4 renamed terms"],
   heroLabel:"TERMINOLOGY", heroAction:"Edit terminology",
   heroText:"Payment application reads as Claim, cost code as Contract line, and the lads as Crew, everywhere including what agents say back.",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Enable or disable modules","9 installed"],["Rename business terminology","4 overridden"],
     ["Cost categories","Labour, Materials, Subcontract, Plant & fuel, Prelims"],["Margin targets by type","Commercial 24% · Industrial 18% · Residential 13% · Small works 28% (demo assumptions)"],
     ["Claim statuses","Draft → Certified → Invoiced → Paid"],["Contract headings","10 standard electrical"]]},
  {id:"health", group:"SYSTEMS", title:"Data health", icon:"health", tint:"#e2705c",
   blurb:"What's wrong with the data, how bad it is, and the fix.",
   tags:["5 issue types","19 records affected"], badge:"4 fuel lines", badgeKind:"warn",
   footer:"Last scanned 12 minutes ago", action:"Fix 2 automatically",
   listLabel:"ISSUES FOUND",
   trend:[48,41,37,30,26,22,19],
   bySeverity:[["High","5",RED],["Medium","8",AMBER],["Low","6",DIM]],
   issues:[["Fuel transactions without a project","4","high","Allocate in Fleet & Fuel","Review"],
     ["Hours that don't match Sync","4","high","Confirm in Workforce → Timesheets","Review"],
     ["POs delivered but not invoiced","4","medium","Match supplier invoices to post actual cost","Review"],
     ["Subcontractor insurance expiring","2","medium","DQ Electrical 31 Oct, Dolan Electrical 15 Nov","Review"],
     ["Xero reconcile warning (demo)","1","low","INV-LE-1195 part payment","Review"]],
   rows:[]},
  {id:"integrations", group:"INTEGRATIONS", title:"Integrations", icon:"plug", tint:"#6ad0f0",
   blurb:"LiveCosts, ServiceM8, Xero, Countfire, Sync, WhatsApp and fuel cards, with honest status labels.",
   tags:["1 simulated","1 existing","5 proposed"], badge:"Demo", badgeKind:"warn",
   footer:"No live connections in this demo", action:"View",
   listLabel:"CONNECTIONS",
   rows:[["LiveCosts","proposed migration/connection"],["ServiceM8","proposed migration/connection"],["Xero","simulated synchronisation"],["Countfire","proposed estimate import"],
     ["Sync","proposed timesheet import"],["WhatsApp","existing communication workflow"],["Fuel supplier","proposed CSV import"]]},
  {id:"security", group:"GOVERNANCE", title:"Security", icon:"lock", tint:"#8fa6ff",
   blurb:"Sign-in, sessions, devices and the keys that reach the API.",
   tags:["2FA enforced","Mobile sessions 30 days"],
   footer:"0 open recommendations", action:"Review",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Single sign-on","Microsoft 365", true],["Two-factor authentication","enforced", true],
     ["Login policies","30-day session"],["Active sessions","44"],["Approved devices","52 (incl. site phones)"],
     ["IP restrictions","off", false],["Security alerts","on", true],["Data retention rules","7 years"]]},
  {id:"audit", group:"GOVERNANCE", title:"Audit log", icon:"audit", tint:"#9d8cf5",
   blurb:"A locked history of who approved, certified and changed what. Never editable.",
   tags:["Append-only","7-year retention"],
   footer:"Nobody can edit or delete entries", action:"Export",
   listLabel:"WHAT IS RECORDED",
   rows:[["Claims and certifications","every status change"],["PO approvals","with approver and limit"],["Margin target changes","per contract"],
     ["Hours posted","source: Sync or PM"],["Agent actions","drafts only, never sends"],["Integration events","marked simulated"]]},
  {id:"datamgmt", group:"GOVERNANCE", title:"Data management", icon:"data", tint:"#5fe0a8",
   blurb:"Import, export and restore. All demo data resets on reload.",
   tags:["Demo dataset","Resets on reload"],
   footer:"Figures are illustrative, not company performance", action:"Export",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Import data","CSV (fuel, Countfire, Sync)"],["Export data","full or per module"],["Backup status","n/a in demo"],
     ["Restore previous versions","n/a in demo"],["Data retention","7 years"],["Delete company data","requires two admins"]]},
  {id:"agents", group:"AI CONTROLS", title:"Agents & AI controls", icon:"agent", tint:"var(--accent)",
   blurb:"What agents may read, what they may do, and where they must stop.",
   tags:["7 agents","Drafts only","No external sends"],
   heroLabel:"GLOBAL CONTROL", heroAction:"Pause every agent",
   heroText:"One switch stops every agent immediately. Agents draft claims, chases and allocations; a person approves anything that leaves Pulse.",
   footer:"Write and external tools always need a yes", action:"Review limits",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Agent roles","7 approved"],["Can agents read margins?","Commercial and Briefing only"],
     ["Can agents submit claims?","No: draft only", true],["Approval requirements","all write tools", true],
     ["External systems","none connected in demo"],["Memory and retention","90 days"]]},
  {id:"wf", group:"AI CONTROLS", title:"Workflow controls", icon:"flow", tint:"#9d8cf5",
   blurb:"The guardrails, not the builder. That lives under Work.",
   tags:["Managers only","Retry twice"],
   footer:"Building workflows happens in Work", action:"Open Work",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Who can create workflows","Managers only"],["Maximum autonomy","proposes, never sends", true],
     ["Approval rules","POs over €5,000, all claims"],["Failure handling","retry twice, then notify"],["Global pause","all workflows", true]]},
  {id:"brand", group:"EXPERIENCE", title:"Branding", icon:"brand", tint:"var(--accent)",
   blurb:"Logo, accent colours and how agents appear.",
   tags:["Cyan #16BED6","Green #52BA62"],
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Company logo","lavelle-logo-mark.png (from lavelleelectrical.ie)"],["Primary colour","#16BED6 (site --colibri-color-1)"],
     ["Secondary colour","#52BA62 (site --colibri-color-2)"],["Text colour","#414C5C"],["Agent appearance","7 faces"],["Client-facing claim template","on", true]]},
  {id:"appearance", group:"EXPERIENCE", title:"Appearance & themes", icon:"brand", tint:"#6ad0f0",
   blurb:"Pick a light or dark theme for how Pulse looks to you.",
   tags:["Lavelle dark","Light"],
   listLabel:"THEMES", rows:[]}
];
const ADMIN_GROUPS = [
  ["ORGANISATION", "repeat(2,1fr)"],
  ["TEAMS", "repeat(2,1fr)"],
  ["PERMISSIONS", "repeat(1,1fr)"],
  ["SYSTEMS", "repeat(2,1fr)"],
  ["INTEGRATIONS", "repeat(1,1fr)"],
  ["GOVERNANCE", "repeat(3,1fr)"],
  ["AI CONTROLS", "repeat(2,1fr)"],
  ["EXPERIENCE", "repeat(2,1fr)"]
];
/* ---- activity feeds ---- */
const SRC_TINT = {Pulse:"var(--accent)", Sync:"#52BA62", WhatsApp:"#5fe0a8", Xero:"#8fa6ff", Agent:"var(--accent)", LiveCosts:"#16BED6", Countfire:"#9d8cf5"};
const SRC_ABBR = {Pulse:"PL", Sync:"SY", WhatsApp:"WA", Xero:"XR", Agent:"AI", LiveCosts:"LC", Countfire:"CF"};
const DATA_EVENTS = [
  ["Sync clock-ins imported","36 clock-ins from 6 sites matched against yesterday's WhatsApp submissions (simulated).","Sync import","Workforce","Sync","completed"],
  ["Fuel transaction imported","€89.92 Circle K Stillorgan, card ••5521. Van crossed two sites, needs a project.","Fuel CSV import","Fleet & Fuel","Pulse","completed"],
  ["WhatsApp hours posted","Lavelle Projects group: 5 PMs posted 29 allocations at 16:00.","WhatsApp (existing)","Workforce","WhatsApp","completed"],
  ["Invoice synchronised with Xero demo connection","INV-LE-1201 Galway Medical €71,600 created as draft (simulated).","Xero (demo)","LE-2026-017","Xero","completed"],
  ["Countfire export imported","TO-0431 Cherrywood L2: 13 symbol rows from E-201 Rev C (simulated).","Countfire (simulated)","EN-2026-101","Countfire","completed"],
  ["Supplier delivery logged","PO-2609 detectors delivered to Dalkey. Not yet invoiced, still committed.","Marty Doyle","LE-2026-014","Pulse","completed"],
  ["Site report submitted","SR-1043: second fix complete on units 13–18, 14 photos.","Marty Doyle","LE-2026-014","Pulse","completed"],
  ["Payment matched","INV-LE-1190 €41,800 matched to bank line (simulated).","Xero (demo)","LE-2026-019","Xero","completed"],
  ["Reconciliation warning","Part payment on INV-LE-1195 doesn't match an open amount.","Xero (demo)","LE-2026-021","Xero","failed"]
];
const PEOPLE_EVENTS = [
  ["Purchase order committed","PO-2606 €14,300 emergency fittings committed against Galway Medical.","Ronan Keane","LE-2026-017","Pulse","completed"],
  ["Claim submitted","VAL-009-07 Kimmage €48,200 submitted. Assessment now overdue.","Shane Gallagher","LE-2026-009","Pulse","awaiting"],
  ["Staff allocation changed","Liam Carroll moved from Dalkey to Tallaght Block C for Monday.","Pádraig Quinn","LE-2025-041","Pulse","completed"],
  ["Site report approved","SR-1040 Tallaght Block C first fix floors 2–3.","Aisling Brennan","LE-2025-041","Pulse","completed"],
  ["Valuation prepared","VAL-008-09 €186,400 drafted for internal review.","Shane Gallagher","LE-2026-008","Pulse","awaiting"],
  ["Claim certified","Santry VAL-005-04: €96,500 certified of €102,000.","Northside Data Centres QS","LE-2026-005","Pulse","completed"],
  ["Purchase order raised","PO-2618 €12,600 LSZH cable, routed to Martin (over €5,000).","Declan Ryan","LE-2026-008","Pulse","awaiting"],
  ["Overtime requested","Santry weekend shutdown: 6 operatives × 10 hours.","Aisling Brennan","LE-2026-005","Pulse","awaiting"]
];
const AI_EVENTS = [
  ["Commercial Agent raised a forecast margin warning","Grand Canal Dock 18.9% forecast vs 24% target. Labour +€38.6k over budget.","Commercial Agent","LE-2026-008","Agent","working"],
  ["Claims Agent checked October valuations","3 drafts (€428,600) not submitted. Dalkey not started; SR-1043 supports a larger claim.","Claims Agent","Claims & Finance","Agent","working"],
  ["Fuel Agent categorised imported transactions","37 auto-allocated by van and site. 4 need someone.","Fuel Agent","Fleet & Fuel","Agent","working"],
  ["Workforce Agent compared hours","25 matched, 4 mismatches between Sync and PM submissions.","Workforce Agent","Workforce","Agent","working"],
  ["Procurement Agent flagged a late delivery","PO-2596 LED panels six days late. L4 ceiling closure at risk.","Procurement Agent","LE-2026-008","Agent","awaiting"],
  ["Ops Watchdog flagged a missed site update","No daily report from Ballymount yet today.","Ops Watchdog","LE-2026-003","Agent","awaiting"],
  ["Briefing Agent posted the morning brief","3 valuations to review, €61,200 committed on Dalkey, 4 fuel lines to allocate.","Briefing Agent","Martin Lavelle","Agent","completed"],
  ["Claims Agent drafted a chase","Kimmage claim #7 assessment overdue. Draft email parked for Shane.","Claims Agent","LE-2026-009","Agent","awaiting"]
];
const STREAM_DEFS = [
  {id:"data", title:"New data", sub:"Information entering Pulse", pool:DATA_EVENTS, every:3200,
   tint:"#6ad0f0", icon:"M4.5 7.5c0-1.7 3.4-3 7.5-3s7.5 1.3 7.5 3-3.4 3-7.5 3-7.5-1.3-7.5-3Z M4.5 7.5v9c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-9 M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"},
  {id:"people", title:"Employee activity", sub:"Decisions people made", pool:PEOPLE_EVENTS, every:6400,
   tint:"#f0c04b", icon:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9"},
  {id:"ai", title:"AI activity", sub:"Agents at work", pool:AI_EVENTS, every:4600,
   tint:"var(--accent)", icon:"M2 12h4l2.5-6 3.5 12 3-8 2 2h5"}
];

const NAV = [
  {label:"Home", icon:"helios", page:"Home"},
  {label:"Agents", icon:"navAgents", page:"Agents"},
  {label:"Projects", icon:"lvProjects", page:"Projects"},
  {label:"Estimating", icon:"lvEstimating", page:"Estimating"},
  {label:"Claims & Finance", icon:"lvClaims", page:"Claims & Finance", dot:true},
  {label:"Workforce", icon:"lvWorkforce", page:"Workforce"},
  {label:"Site Operations", icon:"lvSite", page:"Site Operations"},
  {label:"Procurement", icon:"lvProcure", page:"Procurement"},
  {label:"Fleet & Fuel", icon:"lvFleet", page:"Fleet & Fuel"},
  {label:"Dashboard", icon:"navDash", page:"Dashboard"},
  {label:"Work", icon:"navWork", page:"Work"},
  {label:"Records", icon:"navRecords", page:"Records"},
  {divider:true},
  {label:"Activity", icon:"pulseLine", page:"Activity", dot:true}
];
/* Inbox items follow the real InboxItem shape: what happened, why it matters, what I can do. */
const ITEMS = {
  claims:{kind:"Approval", importance:"high", icon:ICONS.approvals, age:"1d",
    title:"Three October valuations need review: €428,600",
    why:"Grand Canal Dock is in internal review; Ballymount and Tallaght are drafts. Dalkey hasn't been started.",
    detail:"Claims go to clients only after your review. Each is cumulative valuation less previously certified.",
    actionLabel:"Open claims", secondaryLabel:"Later", group:"Approvals", fields:[], history:[]},
  dalkey:{kind:"Alert", importance:"high", icon:ICONS.health, age:"1d",
    title:"Dalkey: €61,200 committed, 3 orders not delivered",
    why:"Open purchase orders on LE-2026-014 are committed before materials arrive.",
    detail:"", actionLabel:"Open project", secondaryLabel:"Later", group:"Alerts", fields:[], history:[]},
  margin:{kind:"Alert", importance:"critical", icon:ICONS.insights, age:"3h",
    title:"Grand Canal Dock forecast 18.9% vs 24% target",
    why:"Labour +€38.6k, materials +€16.2k and subcontract +€10.2k over budget.",
    detail:"", actionLabel:"Open financials", secondaryLabel:"Later", group:"Alerts", fields:[], history:[]},
  labour:{kind:"Task", importance:"normal", icon:ICONS.people, age:"9h",
    title:"4 staff allocations from Monday need confirming",
    why:"Sync clock-ins and PM WhatsApp submissions don't agree.",
    detail:"", actionLabel:"Review", secondaryLabel:"Later", group:"Work", fields:[], history:[]},
  fuel:{kind:"Task", importance:"normal", icon:ICONS.autos, age:"1d",
    title:"4 fuel transactions need a project",
    why:"€423.49 imported from the card statement without an allocation.",
    detail:"", actionLabel:"Allocate", secondaryLabel:"Later", group:"Work", fields:[], history:[]}
};
const ORDER = ["claims","margin","dalkey","labour","fuel"];

const ANSWERS = {
  fallback:{tool:"core_search", effect:"read",
    text:"I can answer that from the records you have access to: projects, claims, crews, purchase orders and fuel. All figures in this demo are illustrative.",
    actions:[["What's happening across the projects?",0]]}
};
function synthesizeCustomArea(name){
  const trimmed = (name || "").trim();
  if (!trimmed) return null;
  let seed = 0;
  for (let i = 0; i < trimmed.length; i++) seed = (seed * 31 + trimmed.charCodeAt(i)) >>> 0;
  const rnd = (n) => (((seed >>> (n % 24)) ^ (seed << ((n * 7) % 13))) >>> 0) % 997 / 997;
  const low = trimmed.toLowerCase();
  const has = (...words) => words.some(w => low.indexOf(w) > -1);
  const growth = has("expansion","growth","launch","scale","pilot","new site","open","opening","grow");
  const risk = has("risk","issue","delay","problem","complaint","fault","incident","churn","decline");
  const dir = risk ? -1 : (growth ? 1 : (rnd(2) > 0.45 ? 1 : -1));

  let vocab = "generic";
  if (has("scotland","ireland","wales","england","region","dublin","belfast","cork","galway","london","glasgow","edinburgh"))
    vocab = "region";
  else if (has("cost","spend","budget","saving","margin")) vocab = "cost";
  else if (has("staff","hiring","team","recruit","headcount")) vocab = "people";
  else if (has("supplier","stock","inventory","warehouse","fleet")) vocab = "ops";
  else if (has("customer","client","retention","account")) vocab = "customer";

  const V = {
    region:   {labels:["New enquiries","Orders won","Revenue","Site coverage"], unit:"EUR — 30 DAYS"},
    cost:     {labels:["Spend","Cost per job","Savings found","Budget used"], unit:"EUR — 30 DAYS"},
    people:   {labels:["Headcount","Open roles","Time to hire","Retention"], unit:"PEOPLE"},
    ops:      {labels:["Stock cover","Lead time","Stockouts","Reorders raised"], unit:"DAYS"},
    customer: {labels:["Active accounts","Repeat rate","Churn","NPS"], unit:"ACCOUNTS"},
    generic:  {labels:["Volume","Rate","Cost","Coverage"], unit:"ACTIVITY — 30 DAYS"}
  }[vocab];

  const months = ["Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"];
  let v0 = 40 + Math.floor(rnd(1) * 220);
  const chart = months.map((m, i) => {
    v0 = Math.max(8, Math.round(v0 * (1 + dir * (0.03 + rnd(i + 3) * 0.07))));
    return [m, v0, String(v0)];
  });
  const metrics = V.labels.map((label, i) => {
    const val = 20 + Math.floor(rnd(i + 5) * 400);
    const pct = 2 + Math.round(rnd(i + 9) * 18);
    const up = dir > 0 ? rnd(i + 12) > 0.25 : rnd(i + 12) > 0.7;
    const bars = [0,1,2,3,4,5,6,7,8].map(k => 0.3 + rnd(i * 3 + k) * 0.7);
    return [label, i === 1 ? pct + "%" : String(val), (up ? "+" : "\u2212") + pct + (i === 1 ? "pt" : "%"), up ? "up" : "down", "vs last month", bars];
  });
  const capName = trimmed.replace(/\b\w/g, c => c.toUpperCase());
  const split = [
    [capName + " \u2014 direct", String(Math.round(v0 * 0.5)), "48%", 1],
    ["Existing pipeline", String(Math.round(v0 * 0.3)), "31%", 0],
    ["Everything else", String(Math.round(v0 * 0.2)), "21%", 0]
  ];
  const table = [1,2,3].map(w => [capName + " \u2014 week " + w, String(20 + Math.floor(rnd(20 + w) * 200)),
    (dir > 0 ? "+" : "\u2212") + (3 + Math.floor(rnd(23 + w) * 14)) + "%", "Auto-tagged from records mentioning \u201c" + low + "\u201d"]);
  table.push(["Everything else", String(20 + Math.floor(rnd(30) * 200)), "\u2014", "Baseline"]);
  return {
    id: trimmed, label: capName, color: "var(--accent)", owner: "CUSTOM FILTER",
    description: "Generated from \u201c" + trimmed + "\u201d \u2014 a plain-English filter, not a registered metric set. Refine it and Pulse will tighten this up.",
    kind: "columns", chartTitle: capName + " over time", chartUnit: V.unit,
    chart, splitTitle: "Where \u201c" + low + "\u201d shows up", split,
    tableCols: ["Item","Value","Change","Note"], table,
    metrics, legend: [capName, "Pipeline", "Other"]
  };
}

function pickAnswer(q){
  return ANSWERS.fallback;
}

const ORGS = [
  ["Seafield Homes Ltd","Client","€42,850","due 30 Oct","active"],
  ["Harcourt Fit-Out Partners","Client","€86,600","due 30 Oct","active"],
  ["Liffey Quay Hotels","Client","€0","claim disputed","watch"],
  ["Liffey Electrical Wholesale","Supplier","—","—","active"],
  ["Brightline Lighting Distributors","Supplier","—","late delivery","watch"],
  ["Northside Data Centres Ltd","Client","€0","€96,500 to invoice","active"]
];
const TEAMS = [
  ["Commercial","3 members","Shane Gallagher","claims:prepare, invoices:draft"],
  ["Site teams","29 members","Gráinne Fitzpatrick","reports:submit, hours:submit"],
  ["Estimating","2 members","Niall Hennessy","estimates:*"],
  ["Management","2 members","Martin Lavelle","all permissions"]
];
const LOCATIONS = [
  ["Dublin office","Dublin","34 staff","active"],
  ["Galway","Galway","6 staff","active"]
];
const AGENT_DEFS = [
  {id:"valuations", name:"Valuation day", shape:"rim-capsule", tint:"#1b2430", state:"working", group:true,
   members:["claims","commercial","briefing"], role:"Claims, Commercial and Briefing working October's valuations together",
   when:"09:20", preview:"claims: dalkey not started. three drafts waiting.",
   thread:[
     {kind:"stamp", text:"Today 09:14"},
     {kind:"routine", text:"Ran routine", routine:"Valuation reminder"},
     {kind:"agent", from:"claims", text:"three october drafts are waiting on review: grand canal dock €186,400, ballymount €142,800, tallaght €99,400. that's the €428,600."},
     {kind:"agent", from:"commercial", text:"before gcd goes out: forecast margin is 18.9% against 24%. the claim is fine, but the cost-to-complete needs a conversation with conor."},
     {kind:"agent", from:"claims", text:"dalkey hasn't been started. marty's SR-1043 says second fix is done on six more units, so the line percentages should move a good bit this month."},
     {kind:"user", text:"prepare dalkey from the site report"},
     {kind:"agent", from:"claims", text:"drafted from the contract schedule with SR-1043 percentages. it's a draft: nothing goes to seafield until you open it and submit."},
     {kind:"agent", from:"briefing", text:"i'll put dalkey's this-period figure in tomorrow's brief once you've reviewed it."}
   ]},
  {id:"briefing", name:"Briefing Agent", shape:"crown-pebble", tint:"#191c1f", state:"complete", role:"Reads every project each morning and tells you the few things that need you",
   when:"07:30", preview:"three valuations to review. €61,200 committed on dalkey.",
   thread:[
     {kind:"stamp", text:"Today 07:30"},
     {kind:"routine", text:"Ran routine", routine:"Morning briefing"},
     {kind:"agent", text:"good morning, martin.", lines:[
       {k:"Claims", v:"3 valuations to review · €428,600 unsubmitted"},
       {k:"Dalkey", v:"€61,200 committed · 3 orders not delivered"},
       {k:"Margin", v:"Grand Canal Dock 18.9% vs 24% target"},
       {k:"Fuel", v:"4 transactions need a project"}]},
     {kind:"agent", text:"the one decision today is gcd: the claim can go, but the forecast needs agreeing. everything else is admin."},
     {kind:"user", text:"put gcd on thursday with conor"},
     {kind:"agent", text:"task created against LE-2026-008, due thursday, owner you. i'll bring the category variances to it."}
   ]},
  {id:"ops", name:"Ops Watchdog", shape:"shield", tint:"#2b1b1e", state:"attention", role:"Flags missed site updates, delayed progress, missing hours and project issues",
   when:"11:02", preview:"no report from ballymount yet. PO-2596 six days late.",
   thread:[
     {kind:"stamp", text:"Today 11:02"},
     {kind:"agent", text:"two things. ballymount hasn't posted today's site report, and the LED panels on PO-2596 for grand canal dock are six days late. if they're not on site by friday the L4 ceiling closure slips a week."},
     {kind:"agent", text:"santry's isolation audit failed on 9 oct with four actions. the weekend shutdown on 24–25 oct shouldn't go ahead until those close."}
   ]},
  {id:"commercial", name:"Commercial Agent", shape:"executive-capsule", tint:"#2a2118", state:"waiting", role:"Watches margins, cost-to-complete and profitability risk on every contract",
   when:"09:12", preview:"gcd 18.9% vs 24%. labour is the driver.",
   thread:[
     {kind:"stamp", text:"Today 09:12"},
     {kind:"agent", text:"grand canal dock is the only project below its own target: 18.9% forecast against 24%. labour is €38.6k over budget after the L3–L4 containment re-route, materials €16.2k, subcontract €10.2k."},
     {kind:"agent", text:"approving VO-008-03 (€22,800) would recover part of it. that's sitting in your approvals."},
     {kind:"user", text:"which project is best against target"},
     {kind:"agent", text:"clondalkin school small works: 30.2% against 28%. biggest profit in euro is ballymount at €275,300. all illustrative demo figures."}
   ]},
  {id:"claims", name:"Claims Agent", shape:"low-dome", tint:"#241b2e", state:"working", role:"Prepares draft claims, checks them against previous certificates and chases assessments",
   when:"09:20", preview:"dalkey due 26 oct. kimmage assessment overdue.",
   thread:[
     {kind:"stamp", text:"Today 09:20"},
     {kind:"agent", text:"dalkey's october valuation is due monday 26 oct and hasn't been started. kimmage claim #7 (€48,200) went in on 5 oct and the assessment was due 19 oct."},
     {kind:"agent", text:"i check every line against the last certificate, so a claim never asks for cumulative value twice. ask me to prepare dalkey and i'll draft it from SR-1043."}
   ]},
  {id:"procurement", name:"Procurement Agent", shape:"control-cube", tint:"#16241f", state:"thinking", role:"Monitors orders, commitments, suppliers and deliveries",
   when:"08:41", preview:"PO-2618 €12,600 needs you. PO-2596 late.",
   thread:[
     {kind:"stamp", text:"Today 08:41"},
     {kind:"agent", text:"declan raised PO-2618 for €12,600 LSZH cable. it's over the €5,000 site limit so it's with you. it isn't counted as committed until you approve it."},
     {kind:"agent", text:"four POs are delivered but not invoiced. they stay as open commitments until the supplier invoice is matched, then move to actual cost. counted once either way."}
   ]},
  {id:"workforce", name:"Workforce Agent", shape:"offset-pebble", tint:"#191c1f", state:"waiting", role:"Matches Sync clock-ins to the PMs' WhatsApp hours and flags gaps",
   when:"07:12", preview:"25 matched. 4 need someone.",
   thread:[
     {kind:"stamp", text:"Today 07:12"},
     {kind:"agent", text:"yesterday's hours: 25 matched between the whatsapp post and sync. four didn't. liam was clocked in at tallaght but submitted on dalkey, gavin clocked out at 18:10, josh is missing from colm's post, and rory has no clock-in."},
     {kind:"agent", text:"the whatsapp group stays as it is: the lads see each other posting. i just read it and line it up against sync before orla posts to costs."}
   ]},
  {id:"fuel", name:"Fuel Agent", shape:"glass-visor", tint:"#1b2430", state:"working", role:"Categorises card imports and finds diesel spend with no project",
   when:"08:05", preview:"37 auto-allocated. 4 need someone.",
   thread:[
     {kind:"stamp", text:"Today 08:05"},
     {kind:"agent", text:"imported last week's card statement from the CSV: 37 fills auto-allocated by van and site. four need someone: a saturday fill on marty's van, a pool card with no holder, a van that crossed sites, and a second fill on ••3308 inside 24 hours."},
     {kind:"agent", text:"that last one's flagged to check, not to accuse anyone. it could easily be a jerry can for the site generator."}
   ]}
];
const KPI_DEFS = {
  active:{label:"Active projects", value:"12", delta:"10 Dublin · 2 Galway", dir:"up", hint:"live contracts"},
  contract:{label:"Live contract value", value:"€8.42m", delta:"incl. approved variations", dir:"up", hint:"revised", hero:true},
  committed:{label:"Committed costs", value:"€3.18m", delta:"actual + open POs", dir:"up", hint:"to date"},
  labour:{label:"Labour committed to date", value:"€1.26m", delta:"posted hours", dir:"up", hint:"to date"},
  claims:{label:"Unsubmitted claims", value:"€428,600", delta:"3 drafts", dir:"down", hint:"October"},
  approvals:{label:"Pending approvals", value:"7", delta:"waiting on you", dir:"down", hint:"now"},
  profit:{label:"Forecast profit", value:"€1.52m", delta:"at completion", dir:"up", hint:"portfolio"},
  outstanding:{label:"Debtors", value:"€362,730", delta:"invoiced, unpaid", dir:"down", hint:"now"}
};
const ASPECT_DEFS = [
  {id:"sales", label:"Commercial", color:"var(--accent)", owner:"SHANE GALLAGHER", description:"Claims, certificates and invoices across the live contracts.",
   kind:"columns", chartTitle:"Certified value by month", chartUnit:"EUR",
   chart:[["Nov",412,"€0k"],["Dec",388,"€0k"],["Jan",301,"€0k"],["Feb",356,"€0k"],["Mar",402,"€0k"],["Apr",431,"€0k"],["May",468,"€0k"],["Jun",512,"€0k"],["Jul",544,"€0k"],["Aug",498,"€0k"],["Sep",562,"€0k"],["Oct",410,"€0k"]],
   splitTitle:"By sector",
   split:[["Commercial fit-out","€2.76m","33%",1],["Residential","€2.96m","35%",0],["Industrial","€2.62m","31%",0]],
   tableCols:["Project","Claimed","Change","Owner"],
   table:[["Grand Canal Dock","€186,400","+8.1%","Conor Mulvihill"],["Ballymount","€142,800","+12.4%","Aisling Brennan"],["Tallaght","€99,400","+3.2%","Aisling Brennan"],["Kimmage","€48,200","−4.0%","Colm Kinsella"]],
   metrics:[["Certified to date","€3.12m","+€0.17m","up","October",[.4,.55,.44,.62,.5,.7,.6,.78,1]],
     ["Unsubmitted","€428,600","3 drafts","down","October",[.5,.6,.44,.7,.55,.75,.62,.8,.9]],
     ["Debtors","€362,730","6 invoices","down","outstanding",[.6,.58,.62,.6,.66,.64,.7,.68,.74]],
     ["Forecast margin","18.1%","portfolio","up","at completion",[.7,.66,.7,.6,.62,.55,.58,.5,.48]]]},
  {id:"operations", label:"Operations", color:"#52BA62", owner:"GRÁINNE FITZPATRICK", description:"Crews, site reports and progress.",
   kind:"columns", chartTitle:"Site reports by week", chartUnit:"REPORTS",
   chart:[["W31",24,"24"],["W32",26,"26"],["W33",25,"25"],["W34",27,"27"],["W35",28,"28"],["W36",27,"27"],["W37",29,"29"],["W38",30,"30"],["W39",30,"30"],["W40",31,"31"],["W41",29,"29"],["W42",30,"30"]],
   splitTitle:"Crew by site",
   split:[["Dalkey","8","20%",1],["Grand Canal Dock","9","23%",0],["Other sites","23","57%",0]],
   tableCols:["Site","Heads","Report","Foreman"],
   table:[["Dalkey","8","SR-1043","Marty Doyle"],["Grand Canal Dock","9","SR-1042","Declan Ryan"],["Ballymount","7","SR-1041","Fergal Byrne"],["Tallaght","7","SR-1040","Pádraig Quinn"]],
   metrics:[["On site today","40","29 staff + 11 subs","up","today",[.5,.6,.5,.66,.6,.7,.66,.76,.84]],
     ["Hours to confirm","4","allocations","down","yesterday",[.3,.36,.3,.44,.4,.5,.56,.7,.85]],
     ["Reports in","6 of 7","today","up","sites",[.4,.5,.6,.5,.66,.6,.72,.8,.9]],
     ["Open issues","6","delays and RFIs","down","live",[.8,.78,.8,.76,.78,.74,.76,.72,.7]]]},
  {id:"finance", label:"Finance", color:"#7fd8a4", owner:"CIARA NOLAN", description:"Cash in, debtors and supplier payments.",
   kind:"area", chartTitle:"Cash received by month", chartUnit:"EUR",
   chart:[["Nov",360,"€0k"],["Dec",372,"€0k"],["Jan",298,"€0k"],["Feb",318,"€0k"],["Mar",352,"€0k"],["Apr",388,"€0k"],["May",402,"€0k"],["Jun",436,"€0k"],["Jul",470,"€0k"],["Aug",452,"€0k"],["Sep",488,"€0k"],["Oct",241,"€0k"]],
   splitTitle:"Debtors by age",
   split:[["0–30 days","€362.7k","100%",1],["31–60 days","€0","0%",0]],
   tableCols:["Invoice","Net","Status","Due"],
   table:[["INV-LE-1179","€86,600","Awaiting payment","30 Oct"],["INV-LE-1183","€75,700","Awaiting payment","14 Nov"],["INV-LE-1201","€71,600","Awaiting payment","8 Nov"],["INV-LE-1181","€71,400","Awaiting payment","30 Oct"]],
   metrics:[["Debtors","€362,730","6 invoices","down","now",[.5,.56,.5,.62,.58,.68,.66,.74,.8]],
     ["To invoice","€96,500","Santry certified","up","now",[.3,.34,.4,.38,.46,.5,.6,.7,.84]],
     ["Open POs","€423,200","committed","down","now",[.7,.72,.7,.68,.68,.66,.64,.62,.6]],
     ["Labour to date","€1.26m","posted","up","to date",[.4,.44,.42,.5,.52,.6,.62,.7,.76]]]}
];
const FILTER_GROUPS = [
  {title:"AREA", items:["Commercial","Operations","Finance"]},
  {title:"SPINE", items:["Project","Client","Crew","Supplier"]},
  {title:"TIME", items:["This week","This month","This quarter","Year to date"]}
];
const OPS_DEFS = [
  {id:"o1", name:"Morning briefing", kind:"routine", owner:"Briefing Agent", ownerKind:"agent", initials:"BA",
   trigger:"Weekdays, 07:30", triggerKind:"schedule", next:"Tomorrow", last:"Delivered 07:30", status:"healthy", rate:100, on:true,
   what:"Reads every project overnight and tells Martin the few things that need him: valuations, commitments, margin, hours and fuel.",
   why:"Martin was moving between LiveCosts, ServiceM8, Xero and WhatsApp to get one picture.",
   saved:"9 hours a month",
   steps:[["Trigger","Every weekday at 07:30"],["Find","Overnight changes across claims, costs, crews and fuel"],["Check","Drop anything already handled"],["Draft","Write the briefing"],["Send","Post to Home"]],
   runs:[["Today 07:30","22s","ok","1 briefing","€0.02"],["Yesterday 07:30","19s","ok","1 briefing","€0.02"],["Fri 07:30","24s","ok","1 briefing","€0.02"]]},
  {id:"o2", name:"16:00 hours check", kind:"automation", owner:"Workforce Agent", ownerKind:"agent", initials:"WA",
   trigger:"Weekdays, 16:15", triggerKind:"schedule", next:"Today 16:15", last:"4 mismatches", status:"approval", rate:94, on:true,
   what:"Reads the PMs' hours from the Lavelle Projects WhatsApp group, lines them up against Sync clock-ins, and parks mismatches for Orla.",
   why:"Office admin was re-keying every allocation into LiveCosts by hand.",
   saved:"14 hours a month",
   steps:[["Trigger","Weekdays at 16:15"],["Find","Allocations posted in the WhatsApp group"],["Check","Compare with Sync clock-ins"],["Approval","Orla confirms mismatches","gate"],["Update","Post labour cost to projects"]],
   runs:[["Yesterday 16:15","38s","partial","25 matched, 4 to confirm","€0.02","4 allocations need a person"],["Fri 16:15","41s","ok","29 matched","€0.02"],["Thu 16:15","36s","ok","28 matched","€0.02"]]},
  {id:"o3", name:"Valuation reminder", kind:"routine", owner:"Claims Agent", ownerKind:"agent", initials:"CA",
   trigger:"5 days before valuation day", triggerKind:"event", next:"Wed 21 Oct", last:"Dalkey not started", status:"healthy", rate:98, on:true,
   what:"Five days before each contract's valuation day, checks the last certificate and the latest site reports and drafts the claim.",
   why:"Claims were prepared after site visits and phone calls, often the day before.",
   saved:"12 hours a month",
   steps:[["Trigger","5 days before valuation day"],["Find","Last certificate and recent site reports"],["Draft","Prepare the claim lines"],["Approval","Martin reviews before submission","gate"],["Update","Mark ready for submission"]],
   runs:[["Today 09:20","12s","ok","Dalkey flagged","€0.01"],["14 Oct 09:20","10s","ok","GCD drafted","€0.01"]]},
  {id:"o4", name:"Fuel statement import", kind:"automation", owner:"Fuel Agent", ownerKind:"agent", initials:"FA",
   trigger:"Mondays, 08:00", triggerKind:"schedule", next:"Mon 08:00", last:"37 of 41 allocated", status:"approval", rate:90, on:true,
   what:"Imports the fuel card statement CSV, allocates each fill by van and site, and flags anything without a project.",
   why:"Diesel spend couldn't be tied to projects, so it sat in overhead.",
   saved:"6 hours a month",
   steps:[["Trigger","Every Monday at 08:00"],["Find","New rows in the statement CSV"],["Check","Match card to van to site"],["Approval","Someone allocates the leftovers","gate"],["Update","Post to project plant & fuel"]],
   runs:[["Today 08:05","9s","partial","37 of 41 allocated","€0.01","4 transactions need a project"],["12 Oct 08:00","8s","ok","39 of 39","€0.01"]]},
  {id:"o5", name:"Margin watch", kind:"report", owner:"Commercial Agent", ownerKind:"agent", initials:"CO",
   trigger:"Fridays, 12:00", triggerKind:"schedule", next:"Fri 12:00", last:"1 below target", status:"healthy", rate:100, on:true,
   what:"Compares each contract's forecast margin to its own target and explains the variance by cost category.",
   why:"Different contract types carry different margins; one company-wide number hid the problem jobs.",
   saved:"5 hours a month",
   steps:[["Trigger","Every Friday at 12:00"],["Find","Forecast cost to complete per contract"],["Check","Compare to each project's target"],["Draft","Explain variances by category"],["Send","Post to Home"]],
   runs:[["Fri 12:00","31s","ok","1 warning","€0.03"]]},
  {id:"o6", name:"Late delivery check", kind:"task", owner:"Procurement Agent", ownerKind:"agent", initials:"PA",
   trigger:"Daily, 11:00", triggerKind:"schedule", next:"Tomorrow 11:00", last:"1 late", status:"healthy", rate:97, on:true,
   what:"Checks every open PO's due date against deliveries logged on site and warns the PM before it hits the programme.",
   why:"Late fittings were found when the crew went to fit them.",
   saved:"4 hours a month",
   steps:[["Trigger","Daily at 11:00"],["Find","Open POs past their due date"],["Check","Delivery logged on site?"],["Send","Notify the PM"]],
   runs:[["Today 11:00","6s","ok","PO-2596 flagged","€0.00"]]},
  {id:"o7", name:"Xero invoice sync (demo)", kind:"automation", owner:"Ops Watchdog", ownerKind:"agent", initials:"OW",
   trigger:"On invoice approval", triggerKind:"event", next:"Event-based", last:"Simulated", status:"healthy", rate:100, on:true,
   what:"Would post approved invoices to Xero and bring payment status back. Simulated in this demo: no API calls are made.",
   why:"Xero stays the accounting system; claims and invoices shouldn't be re-keyed.",
   saved:"8 hours a month",
   steps:[["Trigger","An invoice is approved"],["Send","Create draft in Xero (simulated)","external"],["Check","Payment status back (simulated)"],["Update","Mark paid and reconciled"]],
   runs:[["09 Oct 16:02","1.1s","ok","INV-LE-1201 (simulated)","€0.00"]]},
  {id:"o8", name:"Subcontractor insurance check", kind:"task", owner:"Ops Watchdog", ownerKind:"agent", initials:"OW",
   trigger:"Mondays, 09:00", triggerKind:"schedule", next:"Mon 09:00", last:"2 expiring", status:"approval", rate:100, on:true,
   what:"Checks insurance and RCT status on every subcontractor before they're allocated to a site.",
   why:"An expired policy on site is an uninsured risk.",
   saved:"2 hours a month",
   steps:[["Trigger","Every Monday at 09:00"],["Find","Policies expiring within 30 days"],["Approval","Gráinne requests renewals","gate"]],
   runs:[["Mon 09:00","4s","partial","2 expiring","€0.00","DQ Electrical 31 Oct · Dolan 15 Nov"]]}
];
const OPS_FILTERS = [
  ["all","All"], ["routine","Agent routines"], ["automation","Automations"],
  ["report","Scheduled reports"], ["task","Recurring tasks"], ["approval","Needs approval"], ["failed","Failed"]
];

const WORK_SECTIONS = [
  {id:"tasks", label:"Tasks", blurb:"Every task has an owner, a date and the project or record it belongs to.",
   views:["All tasks","Due tasks","Review","Done"], filters:["Due date","Any status","Anyone","Any project"]},
  {id:"approvals", label:"Approvals", blurb:"POs, claims, variations, timesheets and tenders waiting on a decision.",
   views:["Awaiting you","Awaiting others","Decided"], filters:["Raised date","Any value","Anyone"]},
  {id:"workflows", label:"Workflows", blurb:"What runs on its own: briefings, checks and imports, and who owns each.",
   views:[], filters:[]},
  {id:"schedules", label:"Schedules", blurb:"When recurring work fires: valuation days, the 16:00 hours check, fuel imports.",
   views:[], filters:[]}
];
const WORK_TASKS = [];
const WORKFLOWS = [];
const SCHEDULES = [
  {id:"s1", name:"Morning briefing", cadence:"Weekdays · 07:30", next:"Tomorrow 07:30", owner:"Briefing Agent", on:true, day:1},
  {id:"s2", name:"16:00 hours check", cadence:"Weekdays · 16:15", next:"Today 16:15", owner:"Workforce Agent", on:true, day:1},
  {id:"s3", name:"Fuel statement import", cadence:"Mondays · 08:00", next:"Mon 08:00", owner:"Fuel Agent", on:true, day:0},
  {id:"s4", name:"Valuation reminder", cadence:"5 days before valuation day", next:"Wed 21 Oct", owner:"Claims Agent", on:true, day:2},
  {id:"s5", name:"Margin review", cadence:"Fridays · 12:00", next:"Fri 12:00", owner:"Commercial Agent", on:true, day:4}
];
const WIDGET_DEFS = [["briefing","Morning briefing"],["kpi","Today's numbers"],["health","Project health"],["claims","Claims"],["labour","Labour today"],["inbox","Action inbox"],["work","My work"],["activity","Activity"]];
const WORK_WIDGETS = [
  {id:"queue", label:"My queue", value:"6", hint:"assigned to Martin", icon:"work", queue:"mine"},
  {id:"late", label:"Due today", value:"3", hint:"Dalkey PO, SR-1043, hours", icon:"health", queue:"overdue"},
  {id:"unassigned", label:"Approvals", value:"7", hint:"waiting on you", icon:"teams", queue:"unassigned"},
  {id:"week", label:"Next 7 days", value:"9", hint:"due this week", icon:"visits", queue:"upcoming"}
];
const PERSONALITIES = ["Straight-talking","Warm","Formal","Dry"];
const ANSWER_STYLES = ["Short answers","Show the working","Ask before acting"];
/* Every context source and every registered tool the agent could be granted —
   the builder shows the whole catalogue, grouped, rather than a sample. */
const CONTEXT_DEFS = [
  ["Projects","records","Contracts, variations, costs, margins"],
  ["Clients","records","Developers, main contractors, owners"],
  ["Files","records","Contracts, drawings, certificates"],
  ["Tasks","work","Owners, due dates, linked records"],
  ["Site reports","work","Daily reports, progress, photos"],
  ["Approvals","work","POs, claims, variations, timesheets"],
  ["Claims","money","Valuations, certificates"],
  ["Invoices","money","Drafts, Xero status (demo)"],
  ["Purchase orders","money","Commitments, deliveries"],
  ["Timesheets","people","Sync clock-ins, PM submissions"],
  ["Fuel","people","Card transactions, allocations"],
  ["Activity log","system","Every event, agent and human"]
];
const CONTEXT_SOURCES = CONTEXT_DEFS.map(c => c[0]);
const SKILL_DEFS = [
  ["Search records","read"],["Summarise activity","read"],["Read project financials","read"],
  ["Read claims","read"],["Read timesheets","read"],
  ["Draft claim","write"],["Create task","write"],["Allocate fuel","write"],
  ["Raise approval","write"],["Draft email","write"],
  ["Send email","external"],["Post to WhatsApp group","external"],["Push to Xero (demo)","external"]
];
/* The two questions the agent asks back once it knows the job. */
const TRAIN_PHASES = [
  ["Reading the whole ontology", "12 projects · 4,860 records"],
  ["Learning how Lavelle words things", "valuation, first fix, the lads"],
  ["Researching Irish electrical contracting", "RCT, I.S. 10101, I.S. 3217"],
  ["Writing its own system prompt", "1,240 tokens"]
];
const BRIEF_QUESTIONS = [
  {title:"What should it cover?", sub:"Pick as many as you like. We can refine later.",
   options:[["Claims","Valuations due, drafts, certifications"],["Costs","Commitments and margin moves"],
            ["Crews","Who's where, missing hours"],["Fuel","Unallocated transactions"],
            ["Something else","Tell me in the next message"]]},
  {title:"When should it land?", sub:"One is enough to start.",
   options:[["Weekdays 07:30","Before sites open"],["16:15 daily","After the WhatsApp hours post"],
            ["Only when something changes","Event-driven, no noise"],["On demand","When you ask for it"]]}
];
/* The words under a name, keyed to the same state the face lights with. */
const STATE_LABELS = {working:"working", thinking:"thinking", waiting:"waiting on you",
  complete:"up to date", attention:"needs you", idle:"idle"};

const FACE_SHAPES = [
  ["crown-pebble","Crown pebble"],["executive-capsule","Executive capsule"],["shield","Shield"],
  ["glass-visor","Glass visor"],["control-cube","Control cube"],["low-dome","Low dome"],
  ["offset-pebble","Offset pebble"],["rim-capsule","Rim capsule"],["wide-eyed","Wide-eyed"],
  ["precision-brow","Precision brow"],["tall-unit","Tall unit"],["soft-asymmetric","Soft asymmetric"]
];
/* Shell colours only — deliberately desaturated so none of them reads as a
   state. The eyes, rim and dots always carry the state colour. */
const FACE_TINTS = [
  ["#191c1f","Graphite"],["#1b2430","Slate"],["#241b2e","Aubergine"],
  ["#2a2118","Bronze"],["#16241f","Pine"],["#2b1b1e","Oxblood"]
];

/* ---- ontology graph: generation, Dijkstra traversal, canvas render ---- */
const CLUSTERS = [
  ["Projects", "#16BED6", 0.00, 0.62, 46],
  ["People & timesheets", "#52BA62", 0.90, 0.70, 52],
  ["Drawings & estimates", "#b06cf0", 1.75, 0.66, 58],
  ["Claims & certificates", "#f0c04b", 2.55, 0.72, 44],
  ["Invoices & payments", "#f0567f", 3.35, 0.60, 38],
  ["Purchase orders", "#5fe0a8", 4.15, 0.70, 40],
  ["Vehicles & fuel", "#f0803a", 4.95, 0.64, 30],
  ["Clients & suppliers", "#5f7cf0", 5.65, 0.72, 34]
];

function mulberry(seed){
  return function(){
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* Hub-and-spoke clusters around a dense phyllotaxis core, in unit space
   (-1..1 on both axes) so the layout is resolution independent. */
const _hexCache = {};
function hexRGB(hex){
  if (_hexCache[hex]) return _hexCache[hex];
  const h = hex.replace("#", "");
  const v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  _hexCache[hex] = v;
  return v;
}


function buildGraph(){
  const rnd = mulberry(20260902);
  const nodes = [], edges = [], adj = [];
  const add = (x, y, z, r, cluster, kind) => {
    nodes.push({x, y, z, r, cluster, kind}); adj.push([]); return nodes.length - 1;
  };
  const link = (a, b) => {
    const dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y, dz = nodes[a].z - nodes[b].z;
    const w = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.004;
    const id = edges.length;
    edges.push({a, b, w});
    adj[a].push([b, w, id]); adj[b].push([a, w, id]);
  };

  // the core is a filled sphere on a Fibonacci lattice, not a disc
  const CORE = 880, coreIds = [];
  for (let i = 0; i < CORE; i++){
    const t = (i + 0.5) / CORE;
    const phi = Math.acos(1 - 2 * t);
    const theta = i * 2.39996;
    const shell = 0.16 + 0.28 * Math.pow(rnd(), 0.5);
    const grade = rnd();
    coreIds.push(add(
      Math.sin(phi) * Math.cos(theta) * shell * 1.04,
      Math.cos(phi) * shell * 0.96,
      Math.sin(phi) * Math.sin(theta) * shell,
      grade < 0.06 ? 3.4 + rnd() * 1.4 : grade < 0.3 ? 2.1 + rnd() * 0.7 : 1.0 + rnd() * 0.8, 0, "core"));
  }
  // lattice neighbours plus a mesh of chords, so the sphere reads as a volume
  for (let i = 1; i < coreIds.length; i++){
    link(coreIds[i], coreIds[i - 1]);
    if (i >= 13) link(coreIds[i], coreIds[i - 13]);
    if (i >= 21 && i % 2 === 0) link(coreIds[i], coreIds[i - 21]);
    if (i >= 34 && i % 3 === 0) link(coreIds[i], coreIds[i - 34]);
    if (i >= 55 && i % 4 === 0) link(coreIds[i], coreIds[i - 55]);
    if (i >= 89 && i % 5 === 0) link(coreIds[i], coreIds[i - 89]);
    if (i % 6 === 0) link(coreIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
  }

  // a mid shell between the nucleus and the lobes: the layer that makes it
  // read as a network rather than a ball with satellites
  const MID = 560, midIds = [];
  for (let i = 0; i < MID; i++){
    const t = (i + 0.5) / MID;
    const phi = Math.acos(1 - 2 * t), theta = i * 2.39996 + 0.7;
    const d = 0.52 + 0.16 * Math.pow(rnd(), 0.6);
    const g2 = rnd();
    midIds.push(add(
      Math.sin(phi) * Math.cos(theta) * d * 1.02,
      Math.cos(phi) * d * 0.96,
      Math.sin(phi) * Math.sin(theta) * d,
      g2 < 0.05 ? 2.6 + rnd() * 1.0 : g2 < 0.3 ? 1.6 + rnd() * 0.6 : 0.8 + rnd() * 0.7, 0, "core"));
  }
  for (let i = 0; i < midIds.length; i++){
    if (i >= 1) link(midIds[i], midIds[i - 1]);
    if (i >= 17) link(midIds[i], midIds[i - 17]);
    if (i >= 29 && i % 2 === 0) link(midIds[i], midIds[i - 29]);
    // radial spokes tying the shell to the nucleus
    if (i % 2 === 0) link(midIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
    if (i % 9 === 0) link(midIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
  }

  // clusters ride a sphere: each hub gets its own latitude as well as longitude
  const hubs = [], clusterLeaves = [];
  const onSphere = (lon, lat, d0) => { const d = d0 * 1.22;
    return [Math.cos(lat) * Math.cos(lon) * d * 1.02, Math.sin(lat) * d * 0.96, Math.cos(lat) * Math.sin(lon) * d]; };
  CLUSTERS.forEach((c, ci) => {
    const [, , ang, dist, leaves] = c;
    const lat = (ci % 2 ? 1 : -1) * (0.26 + rnd() * 0.5);
    const wob = 1.06 + rnd() * 0.16;
    const hp = onSphere(ang, lat, dist * wob);
    const hub = add(hp[0], hp[1], hp[2], 5.4, ci, "hub");
    hubs.push(hub);
    const mine = [];
    clusterLeaves.push(mine);
    for (let k = 0; k < 3; k++) link(hub, coreIds[Math.floor(rnd() * coreIds.length)]);
    for (let k = 0; k < 5; k++) link(hub, midIds[Math.floor(rnd() * midIds.length)]);

    const subs = 5 + Math.floor(rnd() * 4);
    const subIds = [];
    for (let s = 0; s < subs; s++){
      const sa = ang + (rnd() - 0.5) * 0.52, sl = lat + (rnd() - 0.5) * 0.3;
      const sd = dist + 0.08 + rnd() * 0.18;
      const sp = onSphere(sa, sl, sd);
      const sub = add(sp[0], sp[1], sp[2], 3.2, ci, "sub");
      subIds.push(sub);
      link(sub, hub);
      if (s > 0 && rnd() < 0.7) link(sub, subIds[s - 1]);
      const fan = Math.floor((leaves * 7.4) / subs);
      const spread = 0.17 + rnd() * 0.2;
      let prev = -1;
      for (let l = 0; l < fan; l++){
        const la = sa + (rnd() - 0.5) * spread * 2 + (rnd() - 0.5) * 0.06;
        const ll = sl + (rnd() - 0.5) * spread * 1.1;
        const ld = sd + 0.03 + Math.pow(rnd(), 0.8) * 0.17;
        const lp = onSphere(la, ll, ld);
        const lg = rnd();
        const leaf = add(lp[0], lp[1], lp[2],
          lg < 0.08 ? 2.8 + rnd() * 1.2 : lg < 0.34 ? 1.8 + rnd() * 0.6 : 1.0 + rnd() * 0.7, ci, "leaf");
        link(leaf, sub);
        mine.push(leaf);
        if (rnd() < 0.14) link(leaf, hub);
        if (prev >= 0 && rnd() < 0.34) link(leaf, prev);
        if (rnd() < 0.16) link(leaf, midIds[Math.floor(rnd() * midIds.length)]);
        prev = leaf;
      }
    }
  });
  // far satellites hanging off the outer leaves
  CLUSTERS.forEach((c, ci) => {
    const [, , ang, dist] = c;
    for (let s = 0; s < 7; s++){
      const sa = ang + (rnd() - 0.5) * 1.5, sl = (rnd() - 0.5) * 1.3;
      const sd = dist + 0.42 + rnd() * 0.22;
      const ap = onSphere(sa, sl, sd);
      const anchor = add(ap[0], ap[1], ap[2], 2.4, ci, "sub");
      link(anchor, hubs[ci]);
      const n = 14 + Math.floor(rnd() * 18);
      for (let l = 0; l < n; l++){
        const la = sa + (rnd() - 0.5) * 0.9, ll = sl + (rnd() - 0.5) * 0.7;
        const ld = sd + 0.02 + Math.pow(rnd(), 0.8) * 0.18;
        const p = onSphere(la, ll, ld);
        const leaf = add(p[0], p[1], p[2], 0.8 + rnd() * 0.9, ci, "leaf");
        link(leaf, anchor);
        clusterLeaves[ci].push(leaf);
      }
    }
  });

  // two hub rings and long chords across the sphere
  hubs.forEach((h, i) => {
    link(h, hubs[(i + 1) % hubs.length]);
    link(h, hubs[(i + 2) % hubs.length]);
    if (i % 3 === 0) link(h, hubs[(i + 4) % hubs.length]);
  });
  // neighbouring clusters share records, so their leaves cross-link
  for (let ci = 0; ci < clusterLeaves.length; ci++){
    const a = clusterLeaves[ci], b = clusterLeaves[(ci + 1) % clusterLeaves.length];
    const n = 26 + Math.floor(rnd() * 16);
    for (let k = 0; k < n; k++){
      link(a[Math.floor(rnd() * a.length)], b[Math.floor(rnd() * b.length)]);
    }
    // and a good number reach right across to the far side
    for (let k = 0; k < 12; k++){
      const far = clusterLeaves[(ci + 3) % clusterLeaves.length];
      link(a[Math.floor(rnd() * a.length)], far[Math.floor(rnd() * far.length)]);
    }
    for (let k = 0; k < 8; k++){
      const far = clusterLeaves[(ci + 4) % clusterLeaves.length];
      link(a[Math.floor(rnd() * a.length)], far[Math.floor(rnd() * far.length)]);
    }
  }

  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, minZ = 1e9, maxZ = -1e9;
  for (const n of nodes){
    if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y;
    if (n.z < minZ) minZ = n.z; if (n.z > maxZ) maxZ = n.z;
  }
  const bounds = {minX, maxX, minY, maxY, cx:(minX + maxX) / 2, cy:(minY + maxY) / 2,
    cz:(minZ + maxZ) / 2, w:maxX - minX, h:maxY - minY, d:maxZ - minZ,
    radius: Math.max(maxX - minX, maxY - minY, maxZ - minZ) / 2,
    reach: nodes.reduce((m, n) => Math.max(m, Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z)), 0)};
  return {nodes, edges, adj, hubs, coreIds, bounds};
}

export {
  INK,
  BODY,
  DIM,
  FAINT,
  LIME,
  GREEN,
  AMBER,
  RED,
  NEUTRAL,
  MONO,
  ICONS,
  REC_SECTIONS,
  CONTACTS,
  FILE_TREE,
  ONTO_NODES,
  ONTO_EDGES,
  REC_TEMPLATES,
  REC_TEMPLATE_CATS,
  PEOPLE,
  ROLE_LEVELS,
  PERM_KEYS,
  GRANT_DEFS,
  ROLE_SCOPES,
  DEFAULT_PERMS,
  INTEGRATIONS,
  BG_DEFS,
  THEMES,
  ADMIN_ICONS,
  ADMIN_CARDS,
  ADMIN_GROUPS,
  SRC_TINT,
  SRC_ABBR,
  DATA_EVENTS,
  PEOPLE_EVENTS,
  AI_EVENTS,
  STREAM_DEFS,
  NAV,
  ITEMS,
  ORDER,
  ANSWERS,
  synthesizeCustomArea,
  pickAnswer,
  ORGS,
  TEAMS,
  LOCATIONS,
  AGENT_DEFS,
  KPI_DEFS,
  ASPECT_DEFS,
  FILTER_GROUPS,
  OPS_DEFS,
  OPS_FILTERS,
  WORK_SECTIONS,
  WORK_TASKS,
  WORKFLOWS,
  SCHEDULES,
  WIDGET_DEFS,
  WORK_WIDGETS,
  PERSONALITIES,
  ANSWER_STYLES,
  CONTEXT_DEFS,
  CONTEXT_SOURCES,
  SKILL_DEFS,
  TRAIN_PHASES,
  BRIEF_QUESTIONS,
  STATE_LABELS,
  FACE_SHAPES,
  FACE_TINTS,
  CLUSTERS,
  mulberry,
  _hexCache,
  hexRGB,
  buildGraph
};
