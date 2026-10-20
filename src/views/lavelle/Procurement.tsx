/* Procurement: purchase orders from approval to actual cost. Every figure
   reads the shared store, and committed cost always comes from finOf(), so a
   PO approved or posted here moves the project and dashboard numbers too. */

import { useState, type ReactNode } from "react";
import {
  Page, Head, DemoTag, Card, Stat, Badge, StatusBadge, Btn, Select, Bar, Table, HBars, Cols, Legend, Note, ProjectLink,
  Drawer, Steps, KV, Rows, Li, Split, Avatar, type Col
} from "./ui";
import {
  useLv, finOf, personName, project, openProject, approvePO, rejectPO, markDelivered, postSupplierInvoice, toast, type LvState
} from "../../lavelle/store";
import { SUPPLIERS, CAT_LABEL } from "../../lavelle/seed";
import { kpis } from "../../lavelle/answers";
import { eur, eurShort, pct, pctInt, date, dateShort, daysBetween, addDays, TODAY } from "../../lavelle/format";
import type { PurchaseOrder, Supplier } from "../../lavelle/types";
import {
  LIFECYCLE, supplierOf, supplierShort, sumPO, postedOn, isOpen, isLate, dueThisWeek, dueLater, deliveredNotInvoiced,
  deliveryState, invoiceState, lifecycleAt, materialGroup, chaseDelivery
} from "../../lavelle/actions-procurement";
import "../../styles/lv-procurement.css";

const TITLES: Record<string, [string, string]> = {
  overview: ["Procurement", "Purchase orders from approval to actual cost. A PO counts in committed cost the moment it is approved, and moves to actual cost once when its supplier invoice is posted."],
  orders: ["Purchase orders", "Every PO with its supplier, project, delivery and invoice position. Approve, receive and post from here."],
  materials: ["Materials", "What is on order by material group, and what the foremen say they still need on site."],
  suppliers: ["Suppliers", "Trade accounts, terms, delivery record and spend (posted plus open orders)."],
  deliveries: ["Deliveries", "What is late, what is due this week, what came in short, and what has arrived but is not yet invoiced."],
  commitments: ["Commitments", "Open purchase orders by project, alongside actual materials cost. Committed cost = actual posted + open POs."]
};

const C = { posted: "var(--lv-c2)", open: "var(--lv-c1)", awaiting: "var(--lv-c4)" };

export default function Procurement({ tab }: { tab: string }) {
  const s = useLv();
  const [poId, setPoId] = useState<string | null>(null);
  const [supId, setSupId] = useState<string | null>(null);
  const onPo = (id: string) => { setSupId(null); setPoId(id); };
  const [title, sub] = TITLES[tab] || TITLES.overview;

  let body: ReactNode;
  switch (tab) {
    case "orders": body = <Orders s={s} onPo={onPo} />; break;
    case "materials": body = <Materials s={s} onPo={onPo} />; break;
    case "suppliers": body = <Suppliers s={s} onSup={setSupId} />; break;
    case "deliveries": body = <Deliveries s={s} onPo={onPo} />; break;
    case "commitments": body = <Commitments s={s} onPo={onPo} />; break;
    default: body = <Overview s={s} onPo={onPo} />;
  }

  return (
    <Page>
      <Head eyebrow={tab === "overview" ? "Lavelle Electrical Group" : "Procurement"} title={title} sub={sub} actions={<DemoTag />} />
      {body}
      <PoDrawer id={poId} onClose={() => setPoId(null)} />
      <SupplierDrawer id={supId} onClose={() => setSupId(null)} onPo={onPo} />
    </Page>
  );
}

/* ── shared pieces ────────────────────────────────────────────────────── */

function PoActions({ po, full }: { po: PurchaseOrder; full?: boolean }) {
  if (po.status === "Awaiting approval") return (
    <div className="lv-po-acts">
      <Btn size={full ? "" : "sm"} kind="okb" onClick={() => approvePO(po.id)}>Approve</Btn>
      <Btn size={full ? "" : "sm"} kind="ghost" onClick={() => { rejectPO(po.id); toast(po.ref + " rejected. Nothing committed."); }}>Reject</Btn>
    </div>
  );
  if (po.status === "Committed") return (
    <div className="lv-po-acts">
      {po.delivery !== "Delivered" && <Btn size={full ? "" : "sm"} kind="ghost" onClick={() => { markDelivered(po.id); toast(po.ref + " marked delivered. Still an open commitment until invoiced."); }}>Mark delivered</Btn>}
      <Btn size={full ? "" : "sm"} kind={po.delivery === "Delivered" ? "primary" : ""} onClick={() => postSupplierInvoice(po.id)}
        title={po.delivery === "Delivered" ? "Match the supplier invoice and post to actual cost" : "Invoice received ahead of full delivery"}>Post supplier invoice</Btn>
    </div>
  );
  return <span className="lv-faint lv-small">{po.status === "Posted" ? "In actual cost" : "No action"}</span>;
}

function DeliveryBadge({ po }: { po: PurchaseOrder }) { return <StatusBadge s={deliveryState(po)} />; }

function poCols(withActions = true): Col<PurchaseOrder>[] {
  const cols: Col<PurchaseOrder>[] = [
    { key: "ref", label: "PO", cls: "wrap", render: po => <div className="lv-twoline"><div className="t lv-mono">{po.ref}</div><div className="s">{po.description}</div></div> },
    { key: "sup", label: "Supplier", render: po => supplierOf(po.supplierId).name, hideMobile: true },
    { key: "proj", label: "Project", render: po => <ProjectLink id={po.projectId} short /> },
    { key: "cat", label: "Cost category", render: po => CAT_LABEL[po.category], hideMobile: true },
    { key: "val", label: "Value", align: "r", cls: "strong", render: po => eur(po.value) },
    { key: "ord", label: "Ordered", render: po => dateShort(po.ordered), hideMobile: true },
    { key: "del", label: "Delivery", render: po => <div className="lv-row" style={{ gap: 6, flexWrap: "nowrap" }}><DeliveryBadge po={po} /><span className="lv-faint lv-small">due {dateShort(po.due)}</span></div> },
    { key: "inv", label: "Invoiced", render: po => <Badge tone={po.invoiced ? "ok" : po.delivery === "Delivered" && po.status === "Committed" ? "warn" : "ghost"}>{invoiceState(po)}</Badge>, hideMobile: true },
    { key: "appr", label: "Approver", render: po => personName(po.approverId), hideMobile: true },
    { key: "st", label: "Status", render: po => <StatusBadge s={po.status} /> }
  ];
  if (withActions) cols.push({ key: "act", label: "", align: "r", render: po => <PoActions po={po} /> });
  return cols;
}

/** The four money states, with what is in each right now. */
function Lifecycle({ s }: { s: LvState }) {
  const awaiting = s.pos.filter(p => p.status === "Awaiting approval");
  const open = s.pos.filter(isOpen);
  const received = open.filter(p => p.delivery === "Delivered" || p.delivery === "Part delivered");
  const posted = s.pos.filter(p => p.status === "Posted");
  const st: { n: string; t: string; v: number; c: string; d: string; cls: string }[] = [
    { n: "0", t: "Raised, not approved", v: sumPO(awaiting), c: awaiting.length + " POs", d: "Not counted anywhere yet. Approval commits it and takes the same amount out of forecast cost-to-complete.", cls: "pre" },
    { n: "1", t: LIFECYCLE[0], v: sumPO(open), c: open.length + " open POs", d: "Approved. Counted in committed cost as an open commitment from this moment.", cls: "acc" },
    { n: "2", t: LIFECYCLE[1], v: sumPO(received), c: received.length + " delivered in full or part", d: "Part of the open total above. Still an open commitment: receiving goods does not post cost.", cls: "" },
    { n: "3", t: LIFECYCLE[2], v: sumPO(posted), c: posted.length + " matched to their PO", d: "Supplier invoice checked against PO price and the delivery docket.", cls: "" },
    { n: "4", t: LIFECYCLE[3], v: sumPO(posted), c: "in actual materials cost", d: "Moves from open commitment to actual cost. Counted once, never in both.", cls: "ok" }
  ];
  return (
    <div className="lv-stack" style={{ gap: 10 }}>
      <div className="lv-flow">
        {st.map(x => (
          <div key={x.n} className={"lv-flow-st " + x.cls}>
            <div className="h"><span className="n">{x.n}</span>{x.t}</div>
            <div className="v">{eur(x.v)}</div>
            <div className="c">{x.c}</div>
            <div className="d">{x.d}</div>
          </div>
        ))}
      </div>
      <div className="lv-small lv-muted">Matching a supplier invoice posts it in the same step, so steps 3 and 4 move together. Committed cost = actual posted + open POs (step 1).</div>
    </div>
  );
}

/* ── overview ─────────────────────────────────────────────────────────── */

function Overview({ s, onPo }: { s: LvState; onPo: (id: string) => void }) {
  const k = kpis(s);
  const open = s.pos.filter(isOpen);
  const awaitingDel = open.filter(p => p.delivery !== "Delivered");
  const late = open.filter(isLate);
  const unapproved = s.pos.filter(p => p.status === "Awaiting approval");
  const month = TODAY.slice(0, 7);
  const postedMonth = s.pos.filter(p => (postedOn(p) || "").startsWith(month));
  const postedSep = s.pos.filter(p => (postedOn(p) || "").startsWith("2026-09"));
  const dalkey = project("p01", s)!;
  const df = finOf(dalkey, s);

  const supRows = SUPPLIERS.map(su => {
    const mine = s.pos.filter(p => p.supplierId === su.id);
    return { su, posted: sumPO(mine.filter(p => p.status === "Posted")), open: sumPO(mine.filter(isOpen)), awaiting: sumPO(mine.filter(p => p.status === "Awaiting approval")) };
  }).sort((a, b) => (b.posted + b.open) - (a.posted + a.open));

  const projRows = s.projects.map(p => ({ p, f: finOf(p, s) })).filter(x => x.f.openPO > 0).sort((a, b) => b.f.openPO - a.f.openPO);
  const maxOpen = Math.max(1, ...projRows.map(x => x.f.openPO));
  const dni = open.filter(deliveredNotInvoiced);

  return (
    <div className="lv-stack">
      <div className="lv-grid lv-g6">
        <Stat hero label="Open commitments" value={eur(k.openPO)} hint={open.length + " approved POs not yet posted"} />
        <Stat label="Awaiting delivery" value={eur(sumPO(awaitingDel))} hint={awaitingDel.length + " POs not fully delivered"} />
        <Stat label="Late deliveries" value={late.length} tone={late.length ? "bad" : "ok"} hint={late.length ? eur(sumPO(late)) + " held up" : "Nothing overdue"} onClick={() => late[0] && onPo(late[0].id)} />
        <Stat label="Unapproved POs" value={unapproved.length} tone={unapproved.length ? "warn" : "ok"} hint={unapproved.length ? eur(sumPO(unapproved)) + " waiting on approval" : "All approved"} />
        <Stat label="Posted this month" value={eur(sumPO(postedMonth))} hint={"September: " + eur(sumPO(postedSep)) + " posted"} />
        <Stat label="Dalkey open POs" value={eur(df.openPO)} hint={dalkey.ref + ", from project financials"} onClick={() => openProject("p01", "procurement")} />
      </div>

      <Card title="How a purchase order becomes cost" sub="Four states, each counted once. Figures are live across every PO on the register." right={<DemoTag />}>
        <Lifecycle s={s} />
      </Card>

      <div className="lv-grid lv-g-3-2">
        <Card title="Supplier expenditure" sub="Posted to actual, open commitments and orders still awaiting approval, by supplier">
          <Cols height={190} fmt={eurShort} data={supRows.map(r => ({ label: supplierShort(r.su), parts: [
            { v: r.posted, color: C.posted, title: "Posted " + eur(r.posted) }, { v: r.open, color: C.open, title: "Open " + eur(r.open) }, { v: r.awaiting, color: C.awaiting, title: "Awaiting approval " + eur(r.awaiting) }] }))} />
          <div style={{ marginTop: 12 }}><Legend items={[["Posted to actual", C.posted], ["Open commitment", C.open], ["Awaiting approval", C.awaiting]]} /></div>
        </Card>
        <Card title="Project cost impact" sub="Open POs by project, as counted in each project's committed cost">
          <HBars items={projRows.map(({ p, f }) => ({ label: p.name, value: f.openPO, max: maxOpen, right: eur(f.openPO), onClick: () => openProject(p.id, "procurement") }))} />
          <div style={{ marginTop: 12 }}>
            <Note tone="accent">{dalkey.name} ({dalkey.ref}) has <b>{eur(df.openPO)}</b> in open POs. Same figure as its project financials and the dashboard.</Note>
          </div>
        </Card>
      </div>

      <div className="lv-grid lv-g3">
        <Card title="Waiting on approval" sub="Not counted until approved" flush right={<Badge tone={unapproved.length ? "warn" : "ok"}>{unapproved.length}</Badge>}>
          <Rows>
            {unapproved.map(po => <Li key={po.id} onClick={() => onPo(po.id)} title={<><span className="lv-mono">{po.ref}</span> {eur(po.value)}</>} sub={po.description + ", " + (project(po.projectId, s)?.ref || "")} right={<PoActions po={po} />} />)}
            {!unapproved.length && <Li title="Nothing waiting" sub="Every raised PO has been approved or rejected." />}
          </Rows>
        </Card>
        <Card title="Late deliveries" sub="Past due and not on site" flush right={<Badge tone={late.length ? "bad" : "ok"}>{late.length}</Badge>}>
          <Rows>
            {late.map(po => <Li key={po.id} onClick={() => onPo(po.id)} title={<><span className="lv-mono">{po.ref}</span> {supplierOf(po.supplierId).name}</>} sub={daysBetween(po.due, TODAY) + " days late, " + po.description}
              right={<Btn size="sm" kind="ghost" onClick={() => chaseDelivery(po)}>Chase</Btn>} />)}
            {!late.length && <Li title="Nothing late" sub="All committed orders are on time or delivered." />}
          </Rows>
        </Card>
        <Card title="Delivered, not invoiced" sub="Goods on site, invoice still to match" flush right={<Badge tone={dni.length ? "warn" : "ok"}>{dni.length}</Badge>}>
          <Rows>
            {dni.map(po => <Li key={po.id} onClick={() => onPo(po.id)} title={<><span className="lv-mono">{po.ref}</span> {eur(po.value)}</>} sub={supplierOf(po.supplierId).name + ", " + (project(po.projectId, s)?.ref || "")}
              right={<Btn size="sm" kind="primary" onClick={() => postSupplierInvoice(po.id)}>Post invoice</Btn>} />)}
            {!dni.length && <Li title="All matched" sub="Every delivered order has its invoice posted." />}
          </Rows>
        </Card>
      </div>
    </div>
  );
}

/* ── orders ───────────────────────────────────────────────────────────── */

function Orders({ s, onPo }: { s: LvState; onPo: (id: string) => void }) {
  const [st, setSt] = useState("all");
  const [pj, setPj] = useState("all");
  const [su, setSu] = useState("all");
  const projIds = Array.from(new Set(s.pos.map(p => p.projectId)));
  const rows = s.pos.filter(p =>
    (st === "all" || (st === "late" ? isLate(p) : p.status === st)) &&
    (pj === "all" || p.projectId === pj) &&
    (su === "all" || p.supplierId === su)
  ).sort((a, b) => b.ordered.localeCompare(a.ordered));
  const cols = poCols();
  cols[4] = { ...cols[4], foot: eur(sumPO(rows)) };
  cols[0] = { ...cols[0], foot: rows.length + " orders" };
  const count = (f: (p: PurchaseOrder) => boolean) => s.pos.filter(f).length;

  return (
    <div className="lv-stack">
      <div className="lv-grid lv-g4">
        <Stat label="Awaiting approval" value={count(p => p.status === "Awaiting approval")} tone="warn" hint={eur(sumPO(s.pos.filter(p => p.status === "Awaiting approval"))) + ", not counted"} onClick={() => setSt("Awaiting approval")} />
        <Stat label="Committed (open)" value={count(isOpen)} hint={eur(sumPO(s.pos.filter(isOpen))) + " in committed cost"} onClick={() => setSt("Committed")} />
        <Stat label="Posted to actual" value={count(p => p.status === "Posted")} tone="ok" hint={eur(sumPO(s.pos.filter(p => p.status === "Posted"))) + " in actual cost"} onClick={() => setSt("Posted")} />
        <Stat label="Late" value={count(isLate)} tone={count(isLate) ? "bad" : "ok"} hint={eur(sumPO(s.pos.filter(isLate))) + " overdue"} onClick={() => setSt("late")} />
      </div>
      <Card title="Purchase order register" sub="Click a row for the full trail. Filters combine." flush right={
        <div className="lv-row" style={{ gap: 6 }}>
          <Select label="Status" value={st} onChange={setSt} options={[["all", "All statuses"], ["Awaiting approval", "Awaiting approval"], ["Committed", "Committed (open)"], ["Posted", "Posted"], ["Rejected", "Rejected"], ["late", "Late delivery"]]} />
          <Select label="Project" value={pj} onChange={setPj} options={[["all", "All projects"], ...projIds.map(id => [id, project(id, s)?.ref + " " + project(id, s)?.name] as [string, string])]} />
          <Select label="Supplier" value={su} onChange={setSu} options={[["all", "All suppliers"], ...SUPPLIERS.map(x => [x.id, x.name] as [string, string])]} />
        </div>
      }>
        <Table cols={cols} rows={rows} onRow={po => onPo(po.id)} foot rowClass={po => po.status === "Awaiting approval" ? "hl" : ""}
          empty={<><b>No orders match</b>Clear a filter to see more.</>} />
      </Card>
    </div>
  );
}

/* ── materials ────────────────────────────────────────────────────────── */

function Materials({ s, onPo }: { s: LvState; onPo: (id: string) => void }) {
  const live = s.pos.filter(p => p.status !== "Rejected");
  const groups = Array.from(new Set(live.map(p => materialGroup(p.description)))).map(g => {
    const mine = live.filter(p => materialGroup(p.description) === g);
    return { g, mine, open: sumPO(mine.filter(isOpen)), awaiting: sumPO(mine.filter(p => p.status === "Awaiting approval")), posted: sumPO(mine.filter(p => p.status === "Posted")), total: sumPO(mine) };
  }).sort((a, b) => b.total - a.total);
  const grand = groups.reduce((n, g) => n + g.total, 0);
  const colors = ["var(--lv-c1)", "var(--lv-c2)", "var(--lv-c3)", "var(--lv-c4)", "var(--lv-c5)", "var(--lv-c6)", "var(--neutral)"];

  const needs = s.reports.filter(r => r.materials && !/^none/i.test(r.materials.trim())).map(r => {
    const refs = r.materials.match(/PO-\d{4}/g) || [];
    const linked = refs.map(ref => s.pos.find(p => p.ref === ref)).filter((p): p is PurchaseOrder => !!p);
    const openOnProject = s.pos.filter(p => p.projectId === r.projectId && isOpen(p) && p.delivery !== "Delivered");
    return { r, linked, openOnProject };
  });

  const gcols: Col<typeof groups[number]>[] = [
    { key: "g", label: "Material group", cls: "strong", render: x => <span className="lv-row" style={{ gap: 8, flexWrap: "nowrap" }}><i style={{ width: 9, height: 9, borderRadius: 3, background: colors[groups.indexOf(x) % colors.length], display: "inline-block" }} />{x.g}</span>, foot: "All materials" },
    { key: "n", label: "POs", align: "r", render: x => x.mine.length, foot: live.length },
    { key: "aw", label: "Awaiting approval", align: "r", render: x => x.awaiting ? eur(x.awaiting) : <span className="lv-faint">0</span>, foot: eur(groups.reduce((n, g) => n + g.awaiting, 0)), hideMobile: true },
    { key: "op", label: "Open", align: "r", render: x => eur(x.open), foot: eur(groups.reduce((n, g) => n + g.open, 0)) },
    { key: "po", label: "Posted", align: "r", render: x => eur(x.posted), foot: eur(groups.reduce((n, g) => n + g.posted, 0)), hideMobile: true },
    { key: "t", label: "Total ordered", align: "r", cls: "strong", render: x => eur(x.total), foot: eur(grand) },
    { key: "sh", label: "Share", render: x => <div style={{ width: 90 }}><Bar thin value={grand ? x.total / grand : 0} /></div>, hideMobile: true }
  ];

  const lines = live.slice().sort((a, b) => materialGroup(a.description).localeCompare(materialGroup(b.description)) || b.value - a.value);

  return (
    <div className="lv-stack">
      <div className="lv-grid lv-g-3-2">
        <Card title="Materials on order by group" sub="Grouped from PO descriptions. Rejected orders excluded." flush>
          <div style={{ padding: "0 18px 12px" }}>
            <Split parts={groups.map((g, i) => ({ v: g.total, color: colors[i % colors.length], label: g.g + " " + eur(g.total) }))} />
          </div>
          <Table cols={gcols} rows={groups} foot dense />
        </Card>
        <Card title="Materials needed on site" sub="From the latest foreman reports, matched to purchase orders" flush>
          <Rows>
            {needs.map(({ r, linked, openOnProject }) => (
              <Li key={r.id} title={<><ProjectLink id={r.projectId} /> <span className="lv-faint lv-small">{r.ref}, {dateShort(r.date)}</span></>}
                sub={<>
                  <div>{r.materials}</div>
                  <div className="lv-row" style={{ gap: 6, marginTop: 6 }}>
                    {linked.map(po => <span key={po.id} className="lv-link lv-mono lv-small" onClick={(e) => { e.stopPropagation(); onPo(po.id); }}>{po.ref}</span>)}
                    {linked.map(po => <DeliveryBadge key={"b" + po.id} po={po} />)}
                    {!linked.length && <span className="lv-small lv-muted">No PO named. {openOnProject.length} open order{openOnProject.length === 1 ? "" : "s"} on this project not yet delivered{openOnProject[0] ? ": " : "."}
                      {openOnProject[0] && <span className="lv-link lv-mono" onClick={(e) => { e.stopPropagation(); onPo(openOnProject[0].id); }}>{openOnProject[0].ref}</span>}</span>}
                  </div>
                </>}
                left={<Avatar name={personName(r.foremanId)} />} />
            ))}
          </Rows>
        </Card>
      </div>
      <Card title="Order lines by material" sub="Every live order line with its material group and money state" flush>
        <Table rows={lines} onRow={po => onPo(po.id)} dense maxH={460} cols={[
          { key: "g", label: "Group", render: po => materialGroup(po.description) },
          { key: "d", label: "Description", cls: "wrap", render: po => <><span className="lv-mono lv-faint">{po.ref}</span> {po.description}</> },
          { key: "p", label: "Project", render: po => <ProjectLink id={po.projectId} short /> },
          { key: "s", label: "Supplier", render: po => supplierShort(supplierOf(po.supplierId)), hideMobile: true },
          { key: "v", label: "Value", align: "r", cls: "strong", render: po => eur(po.value) },
          { key: "dl", label: "Delivery", render: po => <DeliveryBadge po={po} />, hideMobile: true },
          { key: "st", label: "Status", render: po => <StatusBadge s={po.status} /> }
        ]} />
      </Card>
    </div>
  );
}

/* ── suppliers ────────────────────────────────────────────────────────── */

function supplierStats(s: LvState, su: Supplier) {
  const mine = s.pos.filter(p => p.supplierId === su.id);
  const open = sumPO(mine.filter(isOpen)), posted = sumPO(mine.filter(p => p.status === "Posted"));
  return { mine, open, posted, spend: open + posted, late: mine.filter(isLate).length, awaiting: sumPO(mine.filter(p => p.status === "Awaiting approval")),
    projects: new Set(mine.filter(p => p.status !== "Rejected").map(p => p.projectId)).size };
}

function Suppliers({ s, onSup }: { s: LvState; onSup: (id: string) => void }) {
  const rows = SUPPLIERS.map(su => ({ su, ...supplierStats(s, su) })).sort((a, b) => b.spend - a.spend);
  const tot = (k: "open" | "posted" | "spend") => rows.reduce((n, r) => n + r[k], 0);
  const onTimeTone = (v: number) => v >= 0.92 ? "ok" : v >= 0.86 ? "warn" : "bad";

  return (
    <div className="lv-stack">
      <div className="lv-grid lv-g3">
        {rows.map(r => (
          <Card key={r.su.id} onClick={() => onSup(r.su.id)} title={r.su.name} sub={r.su.category + ", " + r.su.region}
            right={r.late ? <Badge tone="bad" dot>{r.late} late</Badge> : <Badge tone="ok" dot>On time</Badge>}>
            <div className="lv-grid lv-g3" style={{ gap: 8 }}>
              <div><div className="lv-faint lv-small">Open</div><div className="lv-ink" style={{ fontSize: 16, fontWeight: 600 }}>{eurShort(r.open)}</div></div>
              <div><div className="lv-faint lv-small">Posted</div><div className="lv-ink" style={{ fontSize: 16, fontWeight: 600 }}>{eurShort(r.posted)}</div></div>
              <div><div className="lv-faint lv-small">Spend</div><div className="lv-ink" style={{ fontSize: 16, fontWeight: 600 }}>{eurShort(r.spend)}</div></div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div className="lv-row lv-small" style={{ marginBottom: 5 }}><span className="lv-muted">On-time delivery</span><span className="lv-spacer" /><span className={"lv-" + onTimeTone(r.su.onTime)}>{pctInt(r.su.onTime)}</span></div>
              <Bar thin value={r.su.onTime} tone={onTimeTone(r.su.onTime)} target={0.92} />
            </div>
            <div className="lv-small lv-muted" style={{ marginTop: 10 }}>Account <span className="lv-mono lv-ink">{r.su.account}</span>, {r.su.terms}, {r.projects} project{r.projects === 1 ? "" : "s"}</div>
          </Card>
        ))}
      </div>
      <Card title="Supplier summary" sub="Spend = posted to actual + open commitments. On-time target 92% (demo assumption)." flush>
        <Table rows={rows} onRow={r => onSup(r.su.id)} foot cols={[
          { key: "n", label: "Supplier", cls: "strong", render: r => r.su.name, foot: rows.length + " suppliers" },
          { key: "a", label: "Account", cls: "m", render: r => r.su.account, hideMobile: true },
          { key: "t", label: "Terms", render: r => r.su.terms, hideMobile: true },
          { key: "o", label: "On time", align: "r", render: r => <span className={"lv-" + onTimeTone(r.su.onTime)}>{pct(r.su.onTime, 0)}</span> },
          { key: "c", label: "POs", align: "r", render: r => r.mine.length, foot: s.pos.length, hideMobile: true },
          { key: "op", label: "Open", align: "r", render: r => eur(r.open), foot: eur(tot("open")) },
          { key: "ps", label: "Posted", align: "r", render: r => eur(r.posted), foot: eur(tot("posted")), hideMobile: true },
          { key: "sp", label: "Spend", align: "r", cls: "strong", render: r => eur(r.spend), foot: eur(tot("spend")) },
          { key: "l", label: "Late", align: "r", render: r => r.late ? <span className="lv-bad">{r.late}</span> : <span className="lv-faint">0</span> }
        ]} />
      </Card>
    </div>
  );
}

/* ── deliveries ───────────────────────────────────────────────────────── */

function Deliveries({ s, onPo }: { s: LvState; onPo: (id: string) => void }) {
  const late = s.pos.filter(isLate);
  const week = s.pos.filter(dueThisWeek).sort((a, b) => a.due.localeCompare(b.due));
  const part = s.pos.filter(p => p.status === "Committed" && p.delivery === "Part delivered");
  const dni = s.pos.filter(deliveredNotInvoiced);
  const later = s.pos.filter(dueLater).sort((a, b) => a.due.localeCompare(b.due));

  const item = (po: PurchaseOrder, sub: ReactNode, action: ReactNode) => (
    <Li key={po.id} onClick={() => onPo(po.id)}
      title={<div className="lv-row" style={{ gap: 6, flexWrap: "nowrap" }}><span className="lv-mono">{po.ref}</span><span className="lv-spacer" /><span className="num">{eur(po.value)}</span></div>}
      sub={<><div>{supplierShort(supplierOf(po.supplierId))}, {project(po.projectId, s)?.ref}</div><div style={{ marginTop: 2 }}>{po.description}</div><div className="lv-row" style={{ marginTop: 7, gap: 6 }}>{sub}<span className="lv-spacer" />{action}</div></>} />
  );
  const col = (title: string, tone: "bad" | "warn" | "ok" | "info", list: PurchaseOrder[], hint: string, render: (po: PurchaseOrder) => ReactNode) => (
    <Card title={title} sub={hint} flush right={<Badge tone={list.length ? tone : "ghost"}>{list.length}, {eurShort(sumPO(list))}</Badge>} tone={tone === "bad" && list.length ? "bad" : undefined}>
      <Rows>
        {list.map(render)}
        {!list.length && <Li title="Nothing here" sub="Board updates as orders move." />}
      </Rows>
    </Card>
  );

  return (
    <div className="lv-stack">
      <div className="lv-grid lv-g4">
        <Stat label="Late" value={late.length} tone={late.length ? "bad" : "ok"} hint={eur(sumPO(late)) + " past due date"} />
        <Stat label="Due this week" value={week.length} hint={"By " + dateShort(addDays(TODAY, 7)) + ", " + eur(sumPO(week))} />
        <Stat label="Part delivered" value={part.length} tone={part.length ? "warn" : "ok"} hint={eur(sumPO(part)) + " with balance to come"} />
        <Stat label="Delivered, not invoiced" value={dni.length} tone={dni.length ? "warn" : "ok"} hint={eur(sumPO(dni)) + " still an open commitment"} />
      </div>
      <div className="lv-grid lv-g4">
        {col("Late", "bad", late, "Past due, not on site", po => item(po,
          <Badge tone="bad">{daysBetween(po.due, TODAY)} days late</Badge>, <Btn size="sm" kind="ghost" onClick={() => chaseDelivery(po)}>Chase</Btn>))}
        {col("Due this week", "info", week, "Awaiting delivery, due in 7 days", po => item(po,
          <Badge tone="info">{daysBetween(TODAY, po.due) === 0 ? "Due today" : "Due " + dateShort(po.due)}</Badge>, <Btn size="sm" kind="ghost" onClick={() => { markDelivered(po.id); toast(po.ref + " received. Still open until the invoice posts."); }}>Received</Btn>))}
        {col("Part delivered", "warn", part, "Balance still to come", po => item(po,
          <Badge tone="warn">{po.due < TODAY ? daysBetween(po.due, TODAY) + " days past due" : "Due " + dateShort(po.due)}</Badge>, <Btn size="sm" kind="ghost" onClick={() => { markDelivered(po.id); toast(po.ref + " balance received."); }}>Balance in</Btn>))}
        {col("Delivered, not invoiced", "warn", dni, "On site, invoice to match", po => item(po,
          <Badge tone="ghost">{invoiceState(po)}</Badge>, <Btn size="sm" kind="primary" onClick={() => postSupplierInvoice(po.id)}>Post invoice</Btn>))}
      </div>
      <Card title="Due later" sub="Committed orders due after this week" flush>
        <Table rows={later} onRow={po => onPo(po.id)} dense cols={[
          { key: "r", label: "PO", cls: "m", render: po => po.ref },
          { key: "d", label: "Description", cls: "wrap", render: po => po.description },
          { key: "s", label: "Supplier", render: po => supplierOf(po.supplierId).name, hideMobile: true },
          { key: "p", label: "Project", render: po => <ProjectLink id={po.projectId} short /> },
          { key: "v", label: "Value", align: "r", cls: "strong", render: po => eur(po.value) },
          { key: "due", label: "Due", render: po => date(po.due) },
          { key: "in", label: "In", align: "r", render: po => daysBetween(TODAY, po.due) + " days", hideMobile: true }
        ]} empty={<><b>Nothing due later</b>Every open order is due this week or already in.</>} />
      </Card>
    </div>
  );
}

/* ── commitments ──────────────────────────────────────────────────────── */

function Commitments({ s, onPo }: { s: LvState; onPo: (id: string) => void }) {
  const k = kpis(s);
  const rows = s.projects.map(p => {
    const f = finOf(p, s);
    const mine = s.pos.filter(x => x.projectId === p.id);
    return { p, f, openN: mine.filter(isOpen).length, awaiting: sumPO(mine.filter(x => x.status === "Awaiting approval")), matCommitted: f.actualByCat.materials + f.openPOByCat.materials };
  }).sort((a, b) => b.f.openPO - a.f.openPO);
  const t = (fn: (r: typeof rows[number]) => number) => rows.reduce((n, r) => n + fn(r), 0);
  const register = sumPO(s.pos.filter(isOpen));
  const byProject = t(r => r.f.openPO);
  const ok = Math.round(register) === Math.round(byProject) && Math.round(byProject) === Math.round(k.openPO);
  const [focus, setFocus] = useState<string | null>(null);
  const focusPos = focus ? s.pos.filter(x => x.projectId === focus && x.status !== "Rejected") : [];

  return (
    <div className="lv-stack">
      <Card title="Committed, received, invoiced, posted" sub="What each state means for project cost">
        <Lifecycle s={s} />
      </Card>
      <Card title="Commitments by project" sub="Open POs are approved and not yet posted. Actual materials is cost already posted. Click a project to see its orders." flush>
        <Table rows={rows} foot onRow={r => setFocus(focus === r.p.id ? null : r.p.id)} rowClass={r => r.p.id === focus ? "hl" : ""} cols={[
          { key: "p", label: "Project", render: r => <><span className="lv-mono lv-faint">{r.p.ref}</span> <ProjectLink id={r.p.id} /></>, foot: rows.length + " projects" },
          { key: "n", label: "Open POs", align: "r", render: r => r.openN, foot: s.pos.filter(isOpen).length, hideMobile: true },
          { key: "o", label: "Open PO value", align: "r", cls: "strong", render: r => r.f.openPO ? eur(r.f.openPO) : <span className="lv-faint">{eur(0)}</span>, foot: eur(byProject) },
          { key: "aw", label: "Awaiting approval", align: "r", render: r => r.awaiting ? <span className="lv-warn">{eur(r.awaiting)}</span> : <span className="lv-faint">0</span>, foot: eur(t(r => r.awaiting)), hideMobile: true },
          { key: "am", label: "Actual materials", align: "r", render: r => eur(r.f.actualByCat.materials), foot: eur(t(r => r.f.actualByCat.materials)) },
          { key: "mc", label: "Materials committed", align: "r", render: r => eur(r.matCommitted), foot: eur(t(r => r.matCommitted)), hideMobile: true },
          { key: "mb", label: "vs materials budget", render: r => <div style={{ width: 110 }} title={eur(r.matCommitted) + " of " + eur(r.f.budgetByCat.materials)}><Bar thin value={r.f.budgetByCat.materials ? r.matCommitted / r.f.budgetByCat.materials : 0} tone={r.matCommitted > r.f.budgetByCat.materials ? "bad" : undefined} /></div>, hideMobile: true },
          { key: "c", label: "Committed cost (all)", align: "r", cls: "strong", render: r => eur(r.f.committed), foot: eur(t(r => r.f.committed)) }
        ]} />
      </Card>

      {focus && (
        <Card title={"Orders on " + (project(focus, s)?.name || "")} sub="Open orders count in committed cost; posted orders are already in actual." flush right={<Btn size="sm" kind="ghost" onClick={() => setFocus(null)}>Close</Btn>}>
          <Table rows={focusPos} cols={poCols()} onRow={po => onPo(po.id)} dense />
        </Card>
      )}

      <Card tone={ok ? undefined : "bad"} title="Reconciliation" sub="Open commitments counted once, the same everywhere they appear">
        <div className="lv-grid lv-g4">
          <Stat label="PO register (status Committed)" value={eur(register)} hint={s.pos.filter(isOpen).length + " open orders"} />
          <Stat label="Sum of project open POs" value={eur(byProject)} hint="finOf() per project" />
          <Stat label="Dashboard open POs" value={eur(k.openPO)} hint="kpis().openPO, used in committed cost" />
          <Stat label="Check" value={ok ? "Reconciled" : "Mismatch"} tone={ok ? "ok" : "bad"} hint={ok ? "All three agree to the euro" : "Investigate before month end"} />
        </div>
        <div style={{ marginTop: 12 }}>
          <Note tone={ok ? "ok" : "bad"}>Dashboard committed cost {eur(k.committed)} = actual posted {eur(k.actual)} + open POs {eur(k.openPO)}. A PO leaves the open total when its supplier invoice posts, so it is never in both.</Note>
        </div>
      </Card>
    </div>
  );
}

/* ── drawers ──────────────────────────────────────────────────────────── */

function PoDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const s = useLv();
  const po = id ? s.pos.find(p => p.id === id) : null;
  if (!po) return null;
  const p = project(po.projectId, s)!;
  const f = finOf(p, s);
  const su = supplierOf(po.supplierId);
  const effect = po.status === "Awaiting approval"
    ? "Not yet counted. Approving commits " + eur(po.value) + " against " + p.ref + " and takes the same amount out of forecast cost-to-complete, so the forecast does not double up."
    : po.status === "Committed"
      ? "Counted in " + p.ref + " committed cost as an open commitment. When the supplier invoice is matched it moves to actual materials cost, once."
      : po.status === "Posted"
        ? "Posted to " + p.ref + " actual materials cost" + (postedOn(po) ? " (" + date(postedOn(po)!) + ")" : "") + ". No longer an open commitment."
        : "Rejected. Not counted in committed or forecast cost.";
  return (
    <Drawer open onClose={onClose} eyebrow={"Purchase order, " + su.name} title={<><span className="lv-mono">{po.ref}</span> {po.description}</>} footer={<PoActions po={po} full />}>
      <div className="lv-stack">
        <Steps steps={LIFECYCLE} at={lifecycleAt(po)} />
        <div className="lv-row"><StatusBadge s={po.status} /><DeliveryBadge po={po} /><Badge tone={po.invoiced ? "ok" : "ghost"}>{invoiceState(po)}</Badge><span className="lv-spacer" /><span className="lv-ink" style={{ fontSize: 20, fontWeight: 600 }}>{eur(po.value)}</span></div>
        <KV items={[
          ["Project", <ProjectLink id={p.id} />], ["Supplier", su.name], ["Account", su.account + ", " + su.terms],
          ["Cost category", CAT_LABEL[po.category]], ["Material group", materialGroup(po.description)],
          ["Ordered", date(po.ordered)], ["Delivery due", date(po.due)], ["Raised by", personName(po.raisedById)], ["Approver", personName(po.approverId)]
        ]} />
        <Note tone={po.status === "Awaiting approval" ? "warn" : po.status === "Posted" ? "ok" : "accent"}>{effect}</Note>
        <Card title={"Effect on " + p.name} sub="Live from project financials">
          <KV items={[["Open POs", eur(f.openPO)], ["Actual materials", eur(f.actualByCat.materials)], ["Committed cost", eur(f.committed)], ["Forecast margin", pct(f.margin) + " vs " + pct(f.target)]]} />
        </Card>
      </div>
    </Drawer>
  );
}

function SupplierDrawer({ id, onClose, onPo }: { id: string | null; onClose: () => void; onPo: (id: string) => void }) {
  const s = useLv();
  const su = id ? SUPPLIERS.find(x => x.id === id) : null;
  if (!su) return null;
  const st = supplierStats(s, su);
  return (
    <Drawer open onClose={onClose} eyebrow={su.category} title={su.name}>
      <div className="lv-stack">
        <KV items={[["Account", su.account], ["Terms", su.terms], ["Region", su.region], ["Contact", su.contact], ["On-time delivery", pctInt(su.onTime)], ["Projects", st.projects]]} />
        <div className="lv-grid lv-g3">
          <Stat label="Open" value={eur(st.open)} />
          <Stat label="Posted" value={eur(st.posted)} />
          <Stat label="Spend" value={eur(st.spend)} hint="Posted + open" />
        </div>
        {su.fictional && <div className="lv-small lv-faint">Fictional supplier for the demo.</div>}
        <Card title="Orders" sub="Click to open the PO" flush>
          <Table rows={st.mine} onRow={po => onPo(po.id)} dense cols={[
            { key: "r", label: "PO", cls: "m", render: po => po.ref },
            { key: "p", label: "Project", render: po => <ProjectLink id={po.projectId} short /> },
            { key: "v", label: "Value", align: "r", render: po => eur(po.value) },
            { key: "d", label: "Delivery", render: po => <DeliveryBadge po={po} /> },
            { key: "s", label: "Status", render: po => <StatusBadge s={po.status} /> }
          ]} />
        </Card>
      </div>
    </Drawer>
  );
}
