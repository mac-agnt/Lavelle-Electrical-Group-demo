/* Records › Relationships. Pick one record and follow it through every record
   it touches: client to cash, people to labour cost, orders to actual cost,
   variations to revised value, fuel to project, drawings to contract. Every
   card reads the live store and opens the module that owns it. */

import { useState, Fragment } from "react";
import "../../styles/lv-siteops.css";
import { Page, Card, Select, DemoTag, KV, Note, Badge } from "./ui";
import {
  useLv, finOf, claimFor, client, person, personName, labourCost, navigate, openProject, project as projectOf, type LvState
} from "../../lavelle/store";
import { CONTRACT_LINES, SUPPLIERS, VEHICLES, FUEL_CARDS, DOCUMENTS, ALLOCATIONS, CAT_LABEL } from "../../lavelle/seed";
import { claimTotals } from "../../lavelle/calc";
import { eur, eur2, eurShort, pctInt, dateShort, TODAY } from "../../lavelle/format";
import { shortName } from "../../lavelle/actions-siteops";
import type { Claim, Project } from "../../lavelle/types";

interface ChainNode { kind: string; id: string; title: string; value?: string; sub?: string; tone?: "warn" | "bad" | "ghost"; focus?: boolean; go: () => void; }
interface Chain { key: string; title: string; sub: string; nodes: ChainNode[]; }

const START: [string, string][] = [
  ["p:p01", "LE-2026-014 · Dalkey Residential Development"],
  ["p:p02", "LE-2026-008 · Grand Canal Dock Office Fit-out"],
  ["p:p07", "LE-2026-005 · Santry Data Hall Power Upgrade"],
  ["f:ft-x1", "Fuel transaction · 17 Oct, Circle K Ballymount, card ••4417"],
  ["po:po-2601", "Purchase order · PO-2601 LED downlights, Dalkey"],
  ["e:e12", "Employee · Marty Doyle, foreman"]
];

const EXCEPTION = ["Mismatch", "Missing hours", "No clock-in"];

/* ── chain builders ───────────────────────────────────────────────────── */
function mainChain(s: LvState, p: Project, focusProject: boolean): Chain {
  const c = client(p.clientId);
  const f = finOf(p, s);
  const lines = CONTRACT_LINES.filter(l => l.projectId === p.id);
  const approvedVars = s.variations.filter(v => v.projectId === p.id && v.status === "Approved");
  const cur = claimFor(p.id, s);
  const certClaims = s.claims.filter(x => x.projectId === p.id && x.certified != null).sort((a, b) => b.period.localeCompare(a.period));
  const cert: Claim | null = certClaims[0] || null;
  const inv = cert?.invoiceId ? s.invoices.find(i => i.id === cert.invoiceId) || null
    : cert ? null : [...s.invoices].filter(i => i.projectId === p.id).sort((a, b) => b.issued.localeCompare(a.issued))[0] || null;
  const toClaim = (id?: string) => () => navigate({ page: "Claims & Finance", tab: "claims", claim: id || null });

  const nodes: ChainNode[] = [];
  nodes.push({ kind: "Client", id: c.xeroContact, title: c.name, value: c.kind, sub: c.terms, go: () => navigate({ page: "Claims & Finance", tab: "xero" }) });
  nodes.push({ kind: "Project", id: p.ref, title: p.name, value: eur(f.revised), sub: p.stage, focus: focusProject, go: () => openProject(p.id) });
  nodes.push({ kind: "Contract", id: p.quoteRef, title: "Revised contract sum", value: eur(f.revised), sub: "Original " + eurShort(f.original) + " + approved VOs " + eurShort(f.variations), go: () => openProject(p.id, "contract") });

  if (lines.length) {
    const moved = [...lines].sort((a, b) => (b.suggestedPct - b.prevPct) * b.value - (a.suggestedPct - a.prevPct) * a.value)[0];
    const cl = cur?.lines?.find(l => l.lineId === moved.id);
    nodes.push({ kind: "Contract line", id: "Line " + moved.code + " of " + lines.length, title: moved.heading, value: eur(moved.value),
      sub: "Certified " + pctInt(moved.prevPct) + (cl ? ", claiming " + pctInt(cl.curPct) : ", site suggests " + pctInt(moved.suggestedPct)), go: () => navigate({ page: "Claims & Finance", tab: "valuations" }) });
  } else {
    nodes.push({ kind: "Contract line", id: p.quoteRef, title: "Single-sum schedule", value: eur(f.original), sub: "Line-by-line schedule not loaded for this contract", tone: "ghost", go: () => openProject(p.id, "contract") });
  }

  if (cur && cur.lines) {
    const t = claimTotals(cur, CONTRACT_LINES, s.variations);
    nodes.push({ kind: "Valuation", id: cur.ref, title: "Cumulative valuation, " + cur.periodLabel.replace(/ \(.*\)/, ""), value: eur(t.cumulative), sub: "Previously certified " + eurShort(t.prevCertified), go: toClaim(cur.id) });
  } else if (cur && lines.length) {
    const draft: Claim = { ...cur,
      lines: lines.map(l => ({ lineId: l.id, prevPct: l.prevPct, curPct: l.suggestedPct, note: "" })),
      varLines: approvedVars.map(v => ({ lineId: v.id, prevPct: v.prevPct, curPct: v.suggestedPct, note: "" })) };
    const t = claimTotals(draft, CONTRACT_LINES, s.variations);
    nodes.push({ kind: "Valuation", id: cur.ref, title: "Suggested from site reports", value: eur(t.cumulative), sub: "Not started. Due " + dateShort(p.nextValuation) + ", " + eurShort(t.thisPeriod) + " this period", tone: "warn", go: toClaim(cur.id) });
  } else if (cur) {
    nodes.push({ kind: "Valuation", id: cur.ref, title: cur.periodLabel, value: eur(cur.amount), sub: "This period. Certified to date " + eurShort(f.certified), go: toClaim(cur.id) });
  } else {
    nodes.push({ kind: "Valuation", id: "Next " + dateShort(p.nextValuation), title: "No October claim yet", value: p.valuationDay, sub: "Certified to date " + eurShort(f.certified), tone: "ghost", go: toClaim() });
  }

  if (cur) {
    const tone = cur.status === "Disputed" ? "bad" as const : ["Not started", "Draft", "Internal review", "Submitted"].indexOf(cur.status) > -1 ? "warn" as const : undefined;
    nodes.push({ kind: "Claim", id: cur.ref + " · #" + cur.number, title: cur.status, value: cur.amount ? eur(cur.amount) : "Not priced", sub: cur.submitted ? "Submitted " + dateShort(cur.submitted) + (cur.assessmentDue ? ", assessment due " + dateShort(cur.assessmentDue) : "") : cur.note || "Not submitted", tone, go: toClaim(cur.id) });
  } else {
    nodes.push({ kind: "Claim", id: "None", title: "No claim this period", value: "", sub: "Next valuation " + dateShort(p.nextValuation), tone: "ghost", go: toClaim() });
  }

  if (cert) {
    const held = cert.amount - (cert.certified || 0);
    nodes.push({ kind: "Certification", id: cert.ref, title: cert.status === "Disputed" ? "Undisputed part" : "Certified " + (cert.certifiedDate ? dateShort(cert.certifiedDate) : ""), value: eur(cert.certified || 0),
      sub: held > 0 ? eur(held) + " held of " + eur(cert.amount) : "Certified in full. To date " + eurShort(f.certified), tone: held > 0 ? "warn" : undefined, go: () => navigate({ page: "Claims & Finance", tab: "valuations" }) });
  } else {
    nodes.push({ kind: "Certification", id: "To date", title: "Cumulative certified", value: eur(f.certified), sub: "No certificate on this year's tracked claims", tone: f.certified ? undefined : "ghost", go: () => navigate({ page: "Claims & Finance", tab: "valuations" }) });
  }

  if (inv) {
    nodes.push({ kind: "Invoice", id: inv.ref, title: inv.status + " · " + inv.xero, value: eur(inv.net), sub: "Issued " + dateShort(inv.issued) + ", due " + dateShort(inv.due), tone: inv.xero === "Reconcile warning" ? "warn" : undefined, go: () => navigate({ page: "Claims & Finance", tab: "invoices" }) });
    const out = inv.net - inv.paid;
    nodes.push({ kind: "Payment", id: inv.xeroRef || inv.ref, title: out <= 0 ? "Paid in full" : inv.paid > 0 ? "Part paid" : inv.due < TODAY ? "Overdue" : "Awaiting payment",
      value: eur(inv.paid) + " of " + eurShort(inv.net), sub: "Paid to date on project " + eurShort(f.paid), tone: out > 0 && inv.due < TODAY ? "bad" : out > 0 ? "warn" : undefined, go: () => navigate({ page: "Claims & Finance", tab: "xero" }) });
  } else if (cert) {
    nodes.push({ kind: "Invoice", id: "Not raised", title: "Invoice not raised yet", value: eur(cert.certified || 0), sub: "Raise from the certified amount", tone: "warn", go: () => navigate({ page: "Claims & Finance", tab: "invoices" }) });
    nodes.push({ kind: "Payment", id: "Not due", title: "Nothing to collect yet", value: eur(0), sub: "Paid to date on project " + eurShort(f.paid), tone: "ghost", go: () => navigate({ page: "Claims & Finance", tab: "cashflow" }) });
  } else {
    nodes.push({ kind: "Invoice", id: "None", title: "No invoice on file", value: "", tone: "ghost", go: () => navigate({ page: "Claims & Finance", tab: "invoices" }) });
    nodes.push({ kind: "Payment", id: "To date", title: "Paid to date", value: eur(f.paid), tone: "ghost", go: () => navigate({ page: "Claims & Finance", tab: "cashflow" }) });
  }
  return { key: "main", title: "Client to cash", sub: "Contract, valuation, claim, certificate, invoice and payment for " + shortName(p), nodes };
}

function labourChain(s: LvState, p: Project, personId?: string): Chain {
  const f = finOf(p, s);
  const rel = (t: LvState["timesheets"][number]) => t.pm?.projectId === p.id || t.sync?.projectId === p.id || t.proposal?.projectId === p.id;
  const ts = personId ? s.timesheets.find(t => t.personId === personId)
    : s.timesheets.find(t => rel(t) && EXCEPTION.indexOf(t.state) > -1) || s.timesheets.find(t => t.personId === p.foremanId && rel(t)) || s.timesheets.find(rel);
  const pid = personId || ts?.personId || p.foremanId;
  const e = person(pid);
  const nodes: ChainNode[] = [
    { kind: "Project", id: p.ref, title: p.name, value: "Foreman " + personName(p.foremanId).split(" ")[0], sub: "PM " + personName(p.pmId), go: () => openProject(p.id) },
    { kind: "Employee", id: e?.syncId || pid, title: e?.name || personName(pid), value: e?.role || "", sub: e && e.rate ? "€" + e.rate + "/h, based " + e.base : "Salaried", focus: !!personId, go: () => navigate({ page: "Workforce", tab: "employees" }) }
  ];
  if (ts) {
    const pr = ts.proposal || (ts.pm ? { projectId: ts.pm.projectId || p.id, hours: ts.pm.hours, ot: ts.pm.ot } : null);
    const exc = EXCEPTION.indexOf(ts.state) > -1;
    nodes.push({ kind: "Timesheet", id: ts.id.toUpperCase() + " · " + dateShort(ts.date), title: ts.state, value: pr ? pr.hours + "h" + (pr.ot ? " + " + pr.ot + "h OT" : "") : "", sub: ts.issue || "WhatsApp submission and Sync clock-in agree", tone: exc ? "warn" : undefined, go: () => navigate({ page: "Workforce", tab: "timesheets" }) });
    const cost = pr ? labourCost(ts.personId, pr.hours, pr.ot) : 0;
    const target = pr?.projectId ? projectOf(pr.projectId) : p;
    nodes.push({ kind: "Labour cost", id: ts.state === "Posted" ? "Posted" : "Not posted", title: ts.state === "Posted" ? "In " + shortName(target) + " labour" : exc ? "Posts to " + shortName(target) + " once confirmed" : "Ready to post to " + shortName(target), value: eur(cost),
      sub: shortName(p) + " labour to date " + eurShort(f.actualByCat.labour), tone: ts.state === "Posted" ? undefined : "warn", go: () => navigate({ page: "Workforce", tab: "labour" }) });
  } else {
    const subs = ALLOCATIONS.filter(a => a.projectId === p.id && a.personId.startsWith("s"));
    nodes.push({ kind: "Timesheet", id: "None", title: "No staff timesheets yesterday", value: subs.length ? subs.length + " subcontractors" : "", sub: subs.length ? "Site is run with subcontract labour on day rates" : "No one booked", tone: "ghost", go: () => navigate({ page: "Workforce", tab: "timesheets" }) });
    nodes.push({ kind: "Labour cost", id: "To date", title: "Labour and subcontract posted", value: eur(f.actualByCat.labour + f.actualByCat.subcontract), sub: "Labour " + eurShort(f.actualByCat.labour) + ", subcontract " + eurShort(f.actualByCat.subcontract), go: () => navigate({ page: "Workforce", tab: "labour" }) });
  }
  return { key: "labour", title: "People to labour cost", sub: "Employee, timesheet and the cost it posts", nodes };
}

function procurementChain(s: LvState, p: Project, poId?: string): Chain {
  const f = finOf(p, s);
  const po = poId ? s.pos.find(x => x.id === poId) : [...s.pos].filter(x => x.projectId === p.id && x.status === "Committed").sort((a, b) => b.value - a.value)[0] || s.pos.find(x => x.projectId === p.id);
  const nodes: ChainNode[] = [{ kind: "Project", id: p.ref, title: p.name, value: eur(f.committed) + " committed", sub: "Actual " + eurShort(f.actual) + " + open POs " + eurShort(f.openPO), go: () => openProject(p.id, "procurement") }];
  if (!po) {
    nodes.push({ kind: "Purchase order", id: "None", title: "No purchase orders raised", tone: "ghost", go: () => navigate({ page: "Procurement", tab: "orders" }) });
    return { key: "po", title: "Order to actual cost", sub: "Purchase order, supplier, delivery and posting", nodes };
  }
  const su = SUPPLIERS.find(x => x.id === po.supplierId);
  nodes.push({ kind: "Purchase order", id: po.ref, title: po.description, value: eur(po.value), sub: po.status + " · " + CAT_LABEL[po.category] + " · raised by " + personName(po.raisedById).split(" ")[0], focus: !!poId, tone: po.status === "Awaiting approval" ? "warn" : undefined, go: () => navigate({ page: "Procurement", tab: "orders" }) });
  nodes.push({ kind: "Supplier", id: su?.account || po.supplierId, title: su?.name || "Supplier", value: su?.terms || "", sub: su ? su.category + " · " + pctInt(su.onTime) + " on time" : "", go: () => navigate({ page: "Procurement", tab: "suppliers" }) });
  nodes.push({ kind: "Delivery", id: "Due " + dateShort(po.due), title: po.delivery, value: po.invoiced ? "Invoiced" : "Not invoiced", sub: po.delivery === "Late" ? "Late by " + Math.round((Date.parse(TODAY) - Date.parse(po.due)) / 86400000) + " days" : "Ordered " + dateShort(po.ordered), tone: po.delivery === "Late" ? "bad" : po.delivery === "Part delivered" ? "warn" : undefined, go: () => navigate({ page: "Procurement", tab: "deliveries" }) });
  if (po.status === "Posted") nodes.push({ kind: "Actual cost", id: "Posted", title: "Supplier invoice posted", value: eur(po.value), sub: CAT_LABEL[po.category] + " actual now " + eurShort(f.actualByCat[po.category]), go: () => navigate({ page: "Procurement", tab: "commitments" }) });
  else if (po.status === "Committed") nodes.push({ kind: "Actual cost", id: "Committed", title: "Open commitment, not yet actual", value: eur(po.value), sub: "Moves to actual when the supplier invoice is posted. Counted once.", tone: "warn", go: () => navigate({ page: "Procurement", tab: "commitments" }) });
  else nodes.push({ kind: "Actual cost", id: po.status, title: po.status === "Rejected" ? "Rejected, no cost" : "Not committed until approved", value: eur(0), sub: "Forecast still holds it in cost to complete", tone: "ghost", go: () => navigate({ page: "Procurement", tab: "commitments" }) });
  return { key: "po", title: "Order to actual cost", sub: "Purchase order, supplier, delivery and posting", nodes };
}

function variationChain(s: LvState, p: Project): Chain {
  const f = finOf(p, s);
  const list = s.variations.filter(v => v.projectId === p.id && v.status !== "Rejected");
  const v = list.find(x => x.status === "Pending approval" || x.status === "Priced") || list[0];
  const nodes: ChainNode[] = [{ kind: "Project", id: p.ref, title: p.name, value: list.length + " variation" + (list.length === 1 ? "" : "s"), go: () => openProject(p.id, "contract") }];
  if (!v) {
    nodes.push({ kind: "Variation", id: "None", title: "No variations raised", tone: "ghost", go: () => navigate({ page: "Projects", tab: "variations" }) });
    nodes.push({ kind: "Approval", id: "None", title: "Nothing to approve", tone: "ghost", go: () => navigate({ page: "Work" }) });
  } else {
    const ap = s.approvals.find(a => a.refId === v.id);
    nodes.push({ kind: "Variation", id: v.ref, title: v.title, value: eur(v.value), sub: v.reason, go: () => navigate({ page: "Projects", tab: "variations" }) });
    nodes.push({ kind: "Approval", id: ap ? "Raised " + dateShort(ap.raised) : "Raised " + dateShort(v.raised), title: v.status, value: ap ? ap.status : "", sub: ap ? "By " + personName(ap.raisedById) + ", decision with Martin" : "Client instruction on file", tone: v.status === "Approved" ? undefined : "warn", go: () => navigate({ page: "Work" }) });
  }
  nodes.push({ kind: "Revised contract value", id: p.ref, title: "Original + approved variations", value: eur(f.revised), sub: v ? (v.status === "Approved" ? "Includes " + v.ref : "Excludes " + v.ref + " until approved") : "Equal to the original contract", go: () => openProject(p.id, "financials") });
  return { key: "vo", title: "Variation to revised value", sub: "Only approved variations change the contract value", nodes };
}

function fuelChain(s: LvState, p: Project, txnId?: string): Chain {
  const f = finOf(p, s);
  const txn = txnId ? s.fuel.find(x => x.id === txnId)
    : s.fuel.find(x => x.suggestedProjectId === p.id && x.state !== "Allocated") || s.fuel.find(x => x.projectId === p.id);
  if (!txn) {
    return { key: "fuel", title: "Fuel to project", sub: "Vehicle, card, transaction and allocation", nodes: [
      { kind: "Fuel", id: "None", title: "No fuel charged to this project in the period", sub: "Plant & fuel to date " + eurShort(f.actualByCat.plant), tone: "ghost", go: () => navigate({ page: "Fleet & Fuel", tab: "allocation" }) }
    ] };
  }
  const v = VEHICLES.find(x => x.id === txn.vehicleId) || null;
  const card = FUEL_CARDS.find(x => x.id === txn.cardId) || null;
  const target = projectOf(txn.projectId || txn.suggestedProjectId, s);
  const tf = target ? finOf(target, s) : null;
  const nodes: ChainNode[] = [
    { kind: "Vehicle", id: v?.reg || "No vehicle", title: v ? v.make + " (" + v.kind.toLowerCase() + ")" : "No vehicle linked to card", value: v ? personName(v.driverId) : "", sub: v ? v.base + " · service " + dateShort(v.nextService) : "", tone: v ? undefined : "ghost", go: () => navigate({ page: "Fleet & Fuel", tab: "vehicles" }) },
    { kind: "Fuel card", id: card ? "••" + card.last4 : txn.cardId, title: card?.holderId ? personName(card.holderId) : "Pool card, no holder", value: card ? "Limit " + eur(card.limit) : "", sub: card?.status, tone: card?.holderId ? undefined : "warn", go: () => navigate({ page: "Fleet & Fuel", tab: "cards" }) },
    { kind: "Fuel transaction", id: dateShort(txn.date) + " " + txn.time, title: txn.station, value: eur2(txn.total), sub: txn.litres + " L at €" + txn.ppl.toFixed(3) + (txn.flag ? ". " + txn.flag : ""), focus: !!txnId,
      tone: txn.state === "Investigate" ? "bad" : txn.state === "Needs allocation" || txn.state === "Missing cardholder" ? "warn" : undefined, go: () => navigate({ page: "Fleet & Fuel", tab: "transactions" }) }
  ];
  if (txn.projectId && target && tf) nodes.push({ kind: "Project allocation", id: target.ref, title: txn.state + " to " + shortName(target), value: eur2(txn.total), sub: "Plant & fuel actual " + eurShort(tf.actualByCat.plant), go: () => openProject(target.id, "financials") });
  else if (target && tf) nodes.push({ kind: "Project allocation", id: "Suggested " + target.ref, title: "Needs allocation, suggested " + shortName(target), value: eur2(txn.total), sub: "Adds to plant & fuel (" + eurShort(tf.actualByCat.plant) + " now) once allocated", tone: "warn", go: () => navigate({ page: "Fleet & Fuel", tab: "allocation" }) });
  else nodes.push({ kind: "Project allocation", id: txn.state, title: "No project suggested", value: eur2(txn.total), sub: "Check with the cardholder before allocating or charging to overhead", tone: "bad", go: () => navigate({ page: "Fleet & Fuel", tab: "allocation" }) });
  return { key: "fuel", title: "Fuel to project", sub: "Vehicle, card, transaction and allocation", nodes };
}

function estimatingChain(s: LvState, p: Project): Chain {
  const f = finOf(p, s);
  const drawing = DOCUMENTS.find(d => d.projectId === p.id && d.kind === "Drawing");
  const enq = s.enquiries.find(e => e.note.indexOf(p.ref) > -1);
  const nodes: ChainNode[] = [
    drawing
      ? { kind: "Drawing", id: drawing.title.split(" ")[0] + " " + drawing.rev, title: drawing.title.replace(/^\S+\s/, ""), value: drawing.size, sub: "From " + drawing.by + ", " + dateShort(drawing.added), go: () => navigate({ page: "Projects", tab: "documents" }) }
      : { kind: "Drawing", id: "Tender set", title: "Tender drawings filed with " + p.takeoffRef, sub: "Not indexed separately", tone: "ghost", go: () => navigate({ page: "Projects", tab: "documents" }) },
    { kind: "Take-off", id: p.takeoffRef, title: "Symbol count and measure", value: "Countfire export", sub: "Simulated import, priced in Pulse", go: () => navigate({ page: "Estimating", tab: "takeoffs" }) },
    enq
      ? { kind: "Estimate", id: enq.ref, title: enq.project, value: eur(enq.value), sub: enq.stage + " · " + personName(enq.estimatorId), go: () => navigate({ page: "Estimating", tab: "enquiries" }) }
      : { kind: "Estimate", id: p.quoteRef.replace("QUO", "EST"), title: "Estimate pre-dates Pulse", sub: "Priced in the old spreadsheet", tone: "ghost", go: () => navigate({ page: "Estimating", tab: "estimates" }) },
    { kind: "Quote", id: p.quoteRef, title: "Quote accepted", value: eur(f.original), sub: "Becomes the contract schedule", go: () => navigate({ page: "Estimating", tab: "quote" }) },
    { kind: "Contract", id: p.ref, title: "Contract with " + client(p.clientId).name, value: eur(f.revised), sub: "Revised value today", go: () => openProject(p.id, "contract") }
  ];
  return { key: "est", title: "Drawing to contract", sub: "How the job was won", nodes };
}

/* ── view ─────────────────────────────────────────────────────────────── */
function Arrow() {
  return <div className="lvx-arrow" aria-hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h15 M13 6l6 6-6 6" /></svg></div>;
}

function ChainView({ c, primary }: { c: Chain; primary?: boolean }) {
  return (
    <Card tone={primary ? "accent" : undefined}>
      <div className="lvx-chain-h"><span className="t">{c.title}</span><span className="s">{c.sub}</span></div>
      <div className="lvx-chain">
        {c.nodes.map((n, i) => (
          <Fragment key={n.kind + i}>
            {i > 0 && <Arrow />}
            <button type="button" className={["lvx-node", n.tone, n.focus ? "focus" : ""].filter(Boolean).join(" ")} onClick={n.go} title={n.kind + ": " + n.title}>
              <span className="k">{n.kind}</span>
              <span className="id">{n.id}</span>
              <span className="t">{n.title}</span>
              {n.value && <span className="v">{n.value}</span>}
              {n.sub && <span className="s">{n.sub}</span>}
            </button>
          </Fragment>
        ))}
      </div>
    </Card>
  );
}

export default function RecordsChain() {
  const s = useLv();
  const [start, setStart] = useState("p:p01");
  const [kind, ref] = start.split(":");

  let focus: Project | null = null;
  if (kind === "f") {
    const t = s.fuel.find(x => x.id === ref);
    focus = projectOf(t?.projectId || t?.suggestedProjectId || "p01", s);
  } else if (kind === "po") {
    focus = projectOf(s.pos.find(x => x.id === ref)?.projectId, s);
  } else if (kind === "e") {
    const al = ALLOCATIONS.find(a => a.personId === ref && a.projectId);
    const ts = s.timesheets.find(t => t.personId === ref);
    focus = projectOf(al?.projectId || ts?.proposal?.projectId || "p01", s);
  } else {
    focus = projectOf(ref, s);
  }
  const p = focus || s.projects[0];
  const f = finOf(p, s);

  const all: Chain[] = [
    mainChain(s, p, kind === "p"),
    labourChain(s, p, kind === "e" ? ref : undefined),
    procurementChain(s, p, kind === "po" ? ref : undefined),
    variationChain(s, p),
    fuelChain(s, p, kind === "f" ? ref : undefined),
    estimatingChain(s, p)
  ];
  const primaryKey = kind === "f" ? "fuel" : kind === "po" ? "po" : kind === "e" ? "labour" : "main";
  const primary = all.find(c => c.key === primaryKey)!;
  const related = all.filter(c => c.key !== primaryKey);
  const records = all.reduce((n, c) => n + c.nodes.filter(x => x.tone !== "ghost").length, 0);
  const attention = all.reduce((n, c) => n + c.nodes.filter(x => x.tone === "warn" || x.tone === "bad").length, 0);

  return (
    <Page>
      <div className="lv-row" style={{ marginBottom: 14 }}>
        <span className="lv-small lv-muted">Start from</span>
        <Select label="Starting record" value={start} onChange={setStart} options={START} />
        <span className="lv-spacer" />
        <Badge tone={attention ? "warn" : "ok"}>{attention} need attention</Badge>
        <DemoTag />
      </div>

      <div className="lv-grid lv-g-2-1" style={{ marginBottom: 14 }}>
        <KV items={[
          ["Project", p.ref + " · " + shortName(p)],
          ["Revised value", eur(f.revised)],
          ["Committed", eur(f.committed)],
          ["Certified", eur(f.certified)],
          ["Paid", eur(f.paid)],
          ["Forecast margin", (f.margin * 100).toFixed(1) + "% vs " + pctInt(f.target)]
        ]} />
        <Note>{records} linked records across {all.length} chains. Every card reads live data: approve SR-1043, a PO or a fuel line and the chain changes. Click any card to open the record where it lives.</Note>
      </div>

      <div className="lvx-chainwrap">
        <ChainView c={primary} primary />
        {related.map(c => <ChainView key={c.key} c={c} />)}
      </div>
    </Page>
  );
}
