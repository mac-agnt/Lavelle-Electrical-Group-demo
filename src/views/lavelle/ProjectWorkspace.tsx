/* One project, everything about it. Mobile first: the financial snapshot and
   red flags sit above the sub-tabs so a PM on site sees the position without
   scrolling through tables. */

import { useEffect, useState, type ReactNode } from "react";
import "../../styles/lv-projects.css";
import {
  useLv, project as projectOf, finOf, client, person, sub, personName, closeProject, setProjectTab, navigate, setTarget, toast,
  claimFor, createMonthlyClaim, approvePO, rejectPO, markDelivered, postSupplierInvoice, approveTimesheet, labourCost, type LvState
} from "../../lavelle/store";
import type { Fin } from "../../lavelle/calc";
import { lineCalc } from "../../lavelle/calc";
import {
  TYPE_LABEL, CAT_LABEL, CATS, DEFAULT_TARGET, ALLOCATIONS, CONTRACT_LINES, DALKEY_HISTORY, SUPPLIERS, ISSUES, INSPECTIONS,
  DOCUMENTS, SECTION_PROGRESS
} from "../../lavelle/seed";
import type { CostCat, DocumentRec, Project, PurchaseOrder } from "../../lavelle/types";
import { eur, eurShort, pct, pctInt, date, dateShort, dateDay, daysBetween, TODAY } from "../../lavelle/format";
import {
  Page, Card, Stat, Badge, StatusBadge, DemoTag, Btn, Bar, Table, HBars, Legend, Split, KV, Note, Empty, Avatar, Drawer, SubTabs,
  Rows, Li, toneForStatus, type Col
} from "./ui";
import {
  projectFlags, isLatePO, daysLate, marginTone, gapPts, opStatus, timeElapsed, touchesProject, shiftHours
} from "../../lavelle/actions-projects";

/* ── shared bits (also used by Projects.tsx) ─────────────────────────── */

/** Margin bar on a 0 to 40% scale with the target as a marker. */
export function MarginBar({ f, thin }: { f: Fin; thin?: boolean }) {
  const scale = 0.4;
  return <Bar value={Math.max(0, f.margin) / scale} target={f.target / scale} tone={marginTone(f)} thin={thin}
    title={"Forecast " + pct(f.margin) + ", target " + pct(f.target)} />;
}

/** Inline % input for a project's target margin. Commits on blur or Enter. */
export function TargetInput({ p }: { p: Project }) {
  const fmt = (n: number) => (n * 100).toFixed(1);
  const [v, setV] = useState(fmt(p.targetMargin));
  useEffect(() => { setV(fmt(p.targetMargin)); }, [p.targetMargin]);
  const commit = () => {
    const n = parseFloat(v.replace(",", "."));
    if (!isFinite(n)) { setV(fmt(p.targetMargin)); return; }
    const t = Math.max(0, Math.min(60, n)) / 100;
    if (Math.abs(t - p.targetMargin) < 0.00001) { setV(fmt(p.targetMargin)); return; }
    setTarget(p.id, t);
    toast(p.ref + " target margin set to " + (t * 100).toFixed(1) + "%");
  };
  return (
    <span className="lv-pct" onClick={(e) => e.stopPropagation()}>
      <input className="lv-input lv-num" style={{ width: 58, height: 28 }} inputMode="decimal" value={v} aria-label={"Target margin for " + p.ref}
        onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
      <span className="lv-faint lv-small">%</span>
    </span>
  );
}

export function DocDrawer({ doc, onClose }: { doc: DocumentRec | null; onClose: () => void }) {
  const p = doc ? projectOf(doc.projectId) : null;
  return (
    <Drawer open={!!doc} onClose={onClose} eyebrow={doc ? doc.kind + (p ? " · " + p.ref : "") : ""} title={doc?.title || ""}
      footer={<>{p && <Btn onClick={() => { onClose(); navigate({ page: "Projects", project: p.id, projectTab: "documents" }); }}>Open project</Btn>}
        <Btn kind="primary" onClick={() => toast("Document preview simulated. Files aren't stored in this demo.")}>Preview</Btn></>}>
      {doc && (
        <div className="lv-stack">
          <KV items={[["Type", doc.kind], ["Revision", doc.rev], ["Added", date(doc.added)], ["Added by", doc.by], ["File", doc.size], ["Project", p ? p.name : "Company / estimating"]]} />
          <Note>Document records are illustrative. In a live build these would link to the SharePoint or Drive folder the team already uses.</Note>
        </div>
      )}
    </Drawer>
  );
}

const Arrow = () => <svg className="go" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>;
const Line = ({ k, v, tot }: { k: ReactNode; v: ReactNode; tot?: boolean }) => <div className={"lvp-line" + (tot ? " tot" : "")}><span>{k}</span><b>{v}</b></div>;
const supplierName = (id: string) => SUPPLIERS.find(x => x.id === id)?.name || id;

const WS_TABS: [string, string][] = [
  ["overview", "Overview"], ["financials", "Financials"], ["workforce", "Workforce"], ["programme", "Programme"], ["contract", "Contract"],
  ["claims", "Claims"], ["procurement", "Procurement"], ["variations", "Variations"], ["documents", "Documents"], ["activity", "Activity"]
];

interface Ctx { p: Project; f: Fin; s: LvState; }

export default function ProjectWorkspace({ id }: { id: string }) {
  const s = useLv();
  const p = projectOf(id, s);
  if (!p) return null;
  const f = finOf(p, s);
  const tab = WS_TABS.some(([k]) => k === s.projectTab) ? s.projectTab : "overview";
  const ctx: Ctx = { p, f, s };
  const body: Record<string, (c: Ctx) => JSX.Element> = {
    overview: OverviewTab, financials: FinancialsTab, workforce: WorkforceTab, programme: ProgrammeTab, contract: ContractTab,
    claims: ClaimsTab, procurement: ProcurementTab, variations: VariationsTab, documents: DocumentsTab, activity: ActivityTab
  };
  const Body = body[tab];
  return (
    <Page>
      <div className="lvp-top">
        <Btn size="sm" kind="ghost" onClick={closeProject}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
          All projects
        </Btn>
        <span className="lvp-crumb">Projects / {p.ref}</span>
        <DemoTag />
      </div>
      <Header p={p} f={f} />
      <Snapshot p={p} f={f} s={s} />
      <SubTabs tabs={WS_TABS} value={tab} onChange={setProjectTab} />
      <Body {...ctx} />
    </Page>
  );
}

function Header({ p, f }: { p: Project; f: Fin }) {
  const c = client(p.clientId);
  const op = opStatus(p);
  return (
    <div className="lv-hero lvp-hero">
      <div className="idrow">
        <span className="ref">{p.ref}</span>
        <Badge tone="ghost">{TYPE_LABEL[p.type]}</Badge>
        <Badge tone={op.tone}>{op.label}</Badge>
        <StatusBadge s={f.status} />
      </div>
      <h1>{p.name}</h1>
      <div className="where">{c.name} · {p.location}</div>
      <div className="lvp-meta">
        <div><div className="k">Project manager</div><div className="v">{personName(p.pmId)}</div></div>
        <div><div className="k">Foreman</div><div className="v">{personName(p.foremanId)}</div></div>
        <div><div className="k">Stage</div><div className="v">{p.stage}</div></div>
        <div><div className="k">Programme</div><div className="v">{dateShort(p.start)} to {date(p.finish)}</div></div>
      </div>
    </div>
  );
}

function Snapshot({ p, f, s }: Ctx) {
  const flags = projectFlags(p, s);
  const claim = claimFor(p.id, s);
  const due = daysBetween(TODAY, p.nextValuation);
  const tone = marginTone(f);
  const hasLines = CONTRACT_LINES.some(l => l.projectId === p.id);
  return (
    <div className="lvp-snap">
      <Card className="hero" tone={tone === "bad" ? "bad" : tone === "warn" ? "warn" : "accent"} title="Forecast margin" sub="Revised value less forecast total cost">
        <div className={"lvp-big " + tone}>{pct(f.margin)}</div>
        <div className="lvp-tgt">
          <span>Target <b>{pct(f.target)}</b></span>
          <span className={tone === "ok" ? "lv-ok" : tone === "warn" ? "lv-warn" : "lv-bad"}>{gapPts(f)}</span>
        </div>
        <MarginBar f={f} />
        <div style={{ marginTop: 12 }}>
          <Line k="Forecast profit" v={eur(f.profit)} />
          <Line k="Profit at target" v={eur(f.revised * f.target)} />
        </div>
      </Card>
      <Card title="Contract">
        <Line k="Original" v={eur(f.original)} />
        <Line k="Approved variations" v={"+" + eur(f.variations)} />
        <Line k="Revised value" v={eur(f.revised)} tot />
        <Line k="Certified to date" v={eur(f.certified) + " (" + pctInt(f.progress) + ")"} />
      </Card>
      <Card title="Cost">
        <Line k="Actual posted" v={eur(f.actual)} />
        <Line k="Open POs" v={eur(f.openPO)} />
        <Line k="Committed" v={eur(f.committed)} tot />
        <div style={{ marginTop: 10 }}>
          <Split parts={[{ v: f.actual, color: "var(--lv-c1)", label: "Actual" }, { v: f.openPO, color: "var(--lv-c4)", label: "Open POs" }, { v: f.ctc, color: "var(--track)", label: "Still to commit" }]} />
          <div className="lv-small lv-faint" style={{ marginTop: 6 }}>{pctInt(f.forecast ? f.committed / f.forecast : 0)} of {eurShort(f.forecast)} forecast cost committed</div>
        </div>
      </Card>
      <Card title="Monthly claim" right={claim ? <StatusBadge s={claim.status} /> : <Badge tone="ghost">None this month</Badge>}>
        <Line k="Next valuation" v={dateShort(p.nextValuation) + (due >= 0 ? " (" + (due === 0 ? "today" : due + "d") + ")" : "")} />
        <Line k={claim ? claim.ref : "Period"} v={claim ? (claim.amount ? eur(claim.amount) : "Not priced") : "October 2026"} />
        {claim?.certified != null && <Line k="Certified" v={eur(claim.certified)} />}
        <div style={{ marginTop: 10 }}>
          {hasLines
            ? <Btn kind="primary" size="sm" onClick={() => createMonthlyClaim(p.id)}>{claim && claim.status !== "Not started" ? "Open Monthly Claim" : "Create Monthly Claim"}</Btn>
            : <Btn size="sm" onClick={() => navigate({ page: "Claims & Finance", tab: "claims", claim: claim?.id || null })}>Open in Claims & Finance</Btn>}
        </div>
      </Card>
      <Card className="flags" flush title="Red flags" sub={flags.length ? flags.length + " item" + (flags.length === 1 ? "" : "s") + " need someone on this project" : undefined}
        right={flags.length ? <Badge tone={flags.some(x => x.tone === "bad") ? "bad" : "warn"}>{flags.length}</Badge> : <Badge tone="ok" dot>Clear</Badge>}>
        {flags.length === 0
          ? <div style={{ padding: "4px 18px 10px" }} className="lv-small lv-muted">No red flags. Margin on target, deliveries on time and every hour and fuel line allocated.</div>
          : flags.map((x, i) => (
            <div key={i} className={"lvp-flag " + x.tone} onClick={() => navigate(x.nav)}>
              <i /><span className="k">{x.kind}</span>
              <div style={{ minWidth: 0, flex: 1 }}><div className="t">{x.title}</div><div className="s">{x.sub}</div></div>
              <Arrow />
            </div>
          ))}
      </Card>
    </div>
  );
}

/* ── Overview ─────────────────────────────────────────────────────────── */
function OverviewTab({ p, f, s }: Ctx) {
  const c = client(p.clientId);
  const report = s.reports.filter(r => r.projectId === p.id).sort((a, b) => b.date.localeCompare(a.date))[0];
  const issues = ISSUES.filter(i => i.projectId === p.id && i.status !== "Closed");
  const acts = s.activity.filter(a => a.rel === p.ref).slice(0, 4);
  const el = timeElapsed(p);
  return (
    <div className="lv-grid lv-g-3-2">
      <div className="lv-stack">
        <Card title="Summary" sub={c.kind + " · " + c.terms}>
          <div style={{ fontSize: 13, color: "var(--body)", lineHeight: 1.55, marginBottom: 12 }}>{p.summary}</div>
          <KV items={[
            ["Client contact", c.contact], ["Quote", p.quoteRef], ["Take-off", p.takeoffRef], ["Valuation day", p.valuationDay],
            ["Region", p.region], [p.units ? "Units" : "Remaining", p.units ? String(p.units) : daysBetween(TODAY, p.finish) + " days"]
          ]} />
        </Card>
        <Card title="Progress" sub="Value certified, cost spent and time used">
          <HBars items={[
            { label: "Valued (certified ÷ revised)", value: f.progress, max: 1, right: pctInt(f.progress) },
            { label: "Cost (actual ÷ forecast)", value: f.costProgress, max: 1, right: pctInt(f.costProgress), tone: f.costProgress - f.progress > 0.08 ? "warn" : "neutral" },
            { label: "Programme elapsed", value: el, max: 1, right: pctInt(el), tone: "neutral" }
          ]} />
          {f.costProgress - f.progress > 0.08 && <div style={{ marginTop: 12 }}><Note tone="warn">Cost is {Math.round((f.costProgress - f.progress) * 100)} points ahead of certified value. Check the next valuation captures work done.</Note></div>}
        </Card>
        {report && (
          <Card title={"Latest site report " + report.ref} sub={dateDay(report.date) + " · " + personName(report.foremanId) + " · " + report.workers + " on site · " + report.photos + " photos"} right={<StatusBadge s={report.status} />}
            onClick={() => navigate({ page: "Site Operations", tab: "reports" })}>
            <div className="lv-stack" style={{ gap: 8, fontSize: 12.5, lineHeight: 1.5 }}>
              <div><span className="lv-faint">Done: </span>{report.done}</div>
              <div><span className="lv-faint">Delays: </span>{report.delays}</div>
              <div><span className="lv-faint">Next: </span>{report.next}</div>
            </div>
          </Card>
        )}
      </div>
      <div className="lv-stack">
        <Card title="Cost to date by category" sub={eur(f.actual) + " posted"}>
          <HBars items={CATS.filter(k => f.budgetByCat[k] > 0).map(k => ({
            label: CAT_LABEL[k], value: f.actualByCat[k], max: Math.max(f.budgetByCat[k], f.forecastByCat[k]), target: f.budgetByCat[k],
            right: eurShort(f.actualByCat[k]), tone: f.forecastByCat[k] > f.budgetByCat[k] ? "bad" as const : undefined,
            onClick: () => setProjectTab("financials")
          }))} />
          <div className="lv-small lv-faint" style={{ marginTop: 10 }}>Marker shows the estimate budget for each category.</div>
        </Card>
        <Card title="Issues & delays" flush right={<Badge tone={issues.length ? "warn" : "ok"}>{issues.length} open</Badge>}>
          {issues.length ? <Rows>{issues.map(i => (
            <Li key={i.id} title={i.title} sub={i.impact + " Owner " + personName(i.ownerId) + "."} right={<Badge tone={i.severity === "High" ? "bad" : i.severity === "Medium" ? "warn" : "ghost"}>{i.kind}</Badge>}
              onClick={() => navigate({ page: "Site Operations", tab: "issues" })} />
          ))}</Rows> : <Empty title="No open issues">Nothing logged against this project.</Empty>}
        </Card>
        <Card title="Recent activity" flush right={<Btn size="sm" kind="ghost" onClick={() => setProjectTab("activity")}>All</Btn>}>
          {acts.length ? <Rows>{acts.map(a => <Li key={a.id} title={a.title} sub={dateShort(a.at) + " " + a.time + " · " + a.actor} />)}</Rows>
            : <Empty title="No activity yet">Approvals, postings and claims on this project appear here.</Empty>}
        </Card>
      </div>
    </div>
  );
}

/* ── Financials ───────────────────────────────────────────────────────── */
interface CatRow { k: CostCat; budget: number; actual: number; po: number; ctc: number; forecast: number; variance: number; }

function FinancialsTab({ p, f, s }: Ctx) {
  const [drill, setDrill] = useState<CostCat | null>(null);
  const rows: CatRow[] = CATS.map(k => ({ k, budget: f.budgetByCat[k], actual: f.actualByCat[k], po: f.openPOByCat[k], ctc: f.forecastByCat[k] - f.actualByCat[k] - f.openPOByCat[k], forecast: f.forecastByCat[k], variance: f.budgetByCat[k] - f.forecastByCat[k] }));
  const over = rows.filter(r => r.variance < 0).sort((a, b) => a.variance - b.variance);
  const overTotal = over.reduce((n, r) => n - r.variance, 0);
  const atTarget = f.revised * f.target;
  const cols: Col<CatRow>[] = [
    { key: "c", label: "Category", cls: "strong", render: r => <span>{CAT_LABEL[r.k]}{r.variance < 0 && <span className="lv-bad lv-small"> · over</span>}</span>, foot: "Total" },
    { key: "b", label: "Budget", align: "r", render: r => eur(r.budget), foot: eur(f.budget) },
    { key: "a", label: "Actual", align: "r", render: r => eur(r.actual), foot: eur(f.actual) },
    { key: "po", label: "Open POs", align: "r", hideMobile: true, render: r => r.po ? eur(r.po) : <span className="lv-faint">0</span>, foot: eur(f.openPO) },
    { key: "ctc", label: "To complete", align: "r", hideMobile: true, render: r => eur(r.ctc), foot: eur(f.ctc) },
    { key: "f", label: "Forecast", align: "r", cls: "strong", render: r => eur(r.forecast), foot: eur(f.forecast) },
    { key: "v", label: "Variance", align: "r", render: r => <span className={r.variance < 0 ? "lv-bad" : "lv-ok"}>{r.variance < 0 ? "−" : "+"}{eur(Math.abs(r.variance))}</span>, foot: <span className={f.budget - f.forecast < 0 ? "lv-bad" : "lv-ok"}>{f.budget - f.forecast < 0 ? "−" : "+"}{eur(Math.abs(f.budget - f.forecast))}</span> },
    { key: "u", label: "Spent of budget", hideMobile: true, render: r => <div className="lvp-prog"><Bar value={r.budget ? r.actual / r.budget : 0} tone={r.variance < 0 ? "bad" : undefined} thin /><span>{r.budget ? pctInt(r.actual / r.budget) : "-"}</span></div> }
  ];
  return (
    <div className="lv-stack">
      <div className="lv-grid lv-g4">
        <Stat label="Estimate budget" value={eurShort(f.budget)} hint="Cost budget from the estimate" />
        <Stat label="Forecast cost" value={eurShort(f.forecast)} hint={"Actual + open POs + " + eurShort(f.ctc) + " to complete"} />
        <Stat label="Forecast profit" value={eurShort(f.profit)} tone={marginTone(f)} hint={pct(f.margin) + " on " + eurShort(f.revised) + " revised"} />
        <Stat label="Gap to target" value={gapPts(f)} tone={marginTone(f)} hint={(f.profit - atTarget >= 0 ? "+" : "−") + eur(Math.abs(f.profit - atTarget)) + " against profit at target"} />
      </div>
      {over.length > 0 && (
        <Note tone={f.status === "Below target" ? "bad" : "warn"}>
          <b>Where the margin is going.</b>{" "}
          {over.map((r, i) => <span key={r.k}>{i ? " " : ""}{CAT_LABEL[r.k]} is forecast at {eur(r.forecast)} against a {eur(r.budget)} budget, {eur(-r.variance)} over ({pct(-r.variance / r.budget)}).</span>)}
          {" "}Together that's {(overTotal / f.revised * 100).toFixed(1)} points of margin on a {eur(f.revised)} contract.
          {p.id === "p02" && " The L3–L4 ceiling clash forced a containment re-route; VO-008-03 (€22,800) is priced but not yet approved, so it isn't in revised value."}
        </Note>
      )}
      <Card title="Cost breakdown by category" sub="Tap a category to see what's behind it" flush>
        <Table cols={cols} rows={rows} foot onRow={r => setDrill(r.k)} rowClass={r => r.variance < 0 ? "lvp-over" : ""} />
      </Card>
      <div className="lv-grid lv-g2">
        <Card title="Margin target" sub="Demo assumption, editable per contract">
          <div className="lvp-cta">
            <div className="txt">Default for {TYPE_LABEL[p.type].toLowerCase()} is <b>{pct(DEFAULT_TARGET[p.type])}</b>. At the current target, profit should be <b>{eur(atTarget)}</b>; forecast is <b>{eur(f.profit)}</b>.</div>
            <TargetInput p={p} />
          </div>
          <div style={{ marginTop: 14 }}><MarginBar f={f} /></div>
          <div className="lv-row lv-small lv-faint" style={{ marginTop: 6, justifyContent: "space-between" }}><span>0%</span><span>Forecast {pct(f.margin)}</span><span>40%</span></div>
        </Card>
        <Card title="Billing position">
          <Line k="Certified to date" v={eur(f.certified)} />
          <Line k="Invoiced" v={eur(f.invoiced)} />
          <Line k="Paid" v={eur(f.paid)} />
          <Line k="Outstanding" v={eur(f.outstanding)} tot />
          <Line k="Still to certify" v={eur(f.revised - f.certified)} />
        </Card>
      </div>
      <CostDrawer p={p} f={f} s={s} cat={drill} onClose={() => setDrill(null)} />
    </div>
  );
}

function CostDrawer({ p, f, s, cat, onClose }: Ctx & { cat: CostCat | null; onClose: () => void }) {
  if (!cat) return null;
  const pos = s.pos.filter(po => po.projectId === p.id && po.category === cat && po.status !== "Rejected");
  const crew = ALLOCATIONS.filter(a => a.projectId === p.id);
  const ts = s.timesheets.filter(t => touchesProject(t, p.id));
  const fuel = s.fuel.filter(x => x.projectId === p.id && (x.state === "Allocated" || x.state === "Auto-allocated"));
  const figures: [string, string][] = [["Budget", eur(f.budgetByCat[cat])], ["Actual", eur(f.actualByCat[cat])], ["Open POs", eur(f.openPOByCat[cat])],
    ["To complete", eur(f.forecastByCat[cat] - f.actualByCat[cat] - f.openPOByCat[cat])], ["Forecast", eur(f.forecastByCat[cat])], ["Variance", eur(f.budgetByCat[cat] - f.forecastByCat[cat])]];
  const go = (page: string, tab: string) => { onClose(); navigate({ page, tab }); };
  return (
    <Drawer open onClose={onClose} eyebrow={p.ref + " · cost detail"} title={CAT_LABEL[cat]}
      footer={cat === "labour" ? <Btn kind="primary" onClick={() => go("Workforce", "labour")}>Open labour costs</Btn>
        : cat === "plant" ? <Btn kind="primary" onClick={() => go("Fleet & Fuel", "allocation")}>Open fuel allocation</Btn>
          : <Btn kind="primary" onClick={() => go("Procurement", "orders")}>Open purchase orders</Btn>}>
      <div className="lv-stack">
        <KV items={figures} />
        {cat === "labour" && (<>
          <Card title={"On site today, " + dateDay(TODAY)} sub={crew.length + " people allocated"} flush>
            <Rows>{crew.map(a => { const e = person(a.personId), sc = sub(a.personId); return (
              <Li key={a.id} left={<Avatar name={personName(a.personId)} sub={!!sc} />} title={personName(a.personId)} sub={(e ? e.role : sc?.trade || "") + " · " + a.start + " to " + a.end}
                right={<span className="num">{e ? (e.rate ? "€" + e.rate + "/h" : "Salaried") : sc ? "€" + sc.dayRate + "/day" : ""}</span>} />); })}</Rows>
          </Card>
          <Card title="Hours from Mon 19 Oct" flush>
            <Rows>{ts.map(t => <Li key={t.id} title={personName(t.personId)} sub={t.issue || "PM submission matches Sync clock-in."}
              right={<StatusBadge s={t.state} />} />)}</Rows>
          </Card>
          <Note>Labour posts to actual when hours are confirmed. Unconfirmed lines stay out of cost, so the forecast doesn't double up.</Note>
        </>)}
        {cat === "plant" && (
          <Card title="Fuel allocated to this project" sub={fuel.length + " transactions, " + eur(fuel.reduce((n, x) => n + x.total, 0))} flush>
            <Table dense maxH={320} rows={fuel} cols={[
              { key: "d", label: "Date", render: x => dateShort(x.date) },
              { key: "s", label: "Station", render: x => x.station },
              { key: "v", label: "Amount", align: "r", render: x => "€" + x.total.toFixed(2) }
            ]} empty={<><b>No fuel allocated</b>Fills appear here once a transaction is allocated.</>} />
          </Card>
        )}
        {cat !== "labour" && cat !== "plant" && (
          <Card title="Purchase orders" sub={pos.length + " orders in this category"} flush>
            <Rows>{pos.map(po => <Li key={po.id} title={po.ref + " · " + po.description} sub={supplierName(po.supplierId) + " · due " + dateShort(po.due)}
              right={<div className="lvp-po-r"><span className="num">{eur(po.value)}</span><StatusBadge s={po.status === "Committed" ? "Open" : po.status} /></div>} />)}</Rows>
            {pos.length === 0 && <Empty title="No orders">Cost in this category is posted directly (subcontract timesheets, preliminaries).</Empty>}
          </Card>
        )}
      </div>
    </Drawer>
  );
}

/* ── Workforce ────────────────────────────────────────────────────────── */
interface CrewRow { id: string; personId: string; name: string; role: string; staff: boolean; start: string; end: string; hours: number; cost: number; note: string; }

function WorkforceTab({ p, f, s }: Ctx) {
  const crew: CrewRow[] = ALLOCATIONS.filter(a => a.projectId === p.id).map(a => {
    const e = person(a.personId), sc = sub(a.personId);
    const hours = shiftHours(a.start, a.end);
    return { id: a.id, personId: a.personId, name: personName(a.personId), role: e ? e.role : sc ? sc.trade : "", staff: !!e, start: a.start, end: a.end, hours,
      cost: e ? hours * e.rate : sc ? sc.dayRate : 0, note: a.note };
  });
  const ts = s.timesheets.filter(t => touchesProject(t, p.id));
  const open = ts.filter(t => t.state === "Mismatch" || t.state === "Missing hours" || t.state === "No clock-in");
  const dayCost = crew.reduce((n, c) => n + c.cost, 0);
  const lb = f.budgetByCat.labour, lf = f.forecastByCat.labour;
  return (
    <div className="lv-stack">
      <div className="lv-grid lv-g4">
        <Stat label="On site today" value={crew.length} hint={crew.filter(c => c.staff).length + " staff, " + crew.filter(c => !c.staff).length + " subcontract"} />
        <Stat label="Crew cost today" value={eur(dayCost)} hint="Estimate from rates and day rates" />
        <Stat label="Labour posted" value={eurShort(f.actualByCat.labour)} hint={pctInt(lb ? f.actualByCat.labour / lb : 0) + " of " + eurShort(lb) + " budget"} />
        <Stat label="Labour forecast" value={eurShort(lf)} tone={lf > lb ? "bad" : "ok"} hint={(lf > lb ? eur(lf - lb) + " over" : eur(lb - lf) + " under") + " budget"} />
      </div>
      <Card title={"Today's allocations, " + dateDay(TODAY)} sub={"Foreman " + personName(p.foremanId)} flush right={<Btn size="sm" kind="ghost" onClick={() => navigate({ page: "Workforce", tab: "allocations" })}>All sites</Btn>}>
        <Table rows={crew} cols={[
          { key: "n", label: "Name", cls: "strong", render: r => <span className="lv-row" style={{ gap: 8, flexWrap: "nowrap" }}><Avatar name={r.name} sub={!r.staff} />{r.name}</span> },
          { key: "r", label: "Role", hideMobile: true, render: r => r.role },
          { key: "k", label: "Type", render: r => <Badge tone={r.staff ? "accent" : "info"}>{r.staff ? "Staff" : "Subcontract"}</Badge> },
          { key: "h", label: "Hours", align: "r", render: r => r.start + " to " + r.end },
          { key: "c", label: "Day cost", align: "r", hideMobile: true, render: r => r.cost ? eur(r.cost) : <span className="lv-faint">Salaried</span> },
          { key: "x", label: "Note", hideMobile: true, render: r => r.note ? <span className="lv-muted">{r.note}</span> : <span className="lv-faint">-</span> }
        ]} empty={<><b>Nobody allocated today</b>Allocations come from the PM's daily plan.</>} />
      </Card>
      <Card title="Hours from Mon 19 Oct" sub="PM WhatsApp submission compared with Sync clock-ins (simulated import)" flush
        right={open.length ? <Badge tone="warn">{open.length} to confirm</Badge> : <Badge tone="ok" dot>All confirmed</Badge>}>
        <Table rows={ts} cols={[
          { key: "n", label: "Name", cls: "strong", render: t => personName(t.personId) },
          { key: "pm", label: "PM said", hideMobile: true, render: t => t.pm ? (projectOf(t.pm.projectId)?.ref || "-") + ", " + t.pm.hours + "h" + (t.pm.ot ? " + " + t.pm.ot + " OT" : "") : <span className="lv-faint">Not submitted</span> },
          { key: "sy", label: "Sync", hideMobile: true, render: t => t.sync ? (projectOf(t.sync.projectId)?.ref || "-") + ", " + t.sync.in + " to " + t.sync.out : <span className="lv-faint">No clock-in</span> },
          { key: "st", label: "Status", render: t => <StatusBadge s={t.state} /> },
          { key: "c", label: "Cost", align: "r", render: t => t.proposal ? eur(labourCost(t.personId, t.proposal.hours, t.proposal.ot)) : "-" },
          { key: "a", label: "", align: "r", render: t => t.state === "Posted" || t.state === "Approved" ? <span className="lv-faint lv-small">Posted</span>
            : <Btn size="sm" kind={t.state === "Matched" ? "" : "primary"} onClick={() => { approveTimesheet(t.id); toast(personName(t.personId) + ": hours posted to " + (projectOf(t.proposal?.projectId)?.ref || "project")); }}>
              {t.state === "Matched" ? "Post" : "Confirm"}</Btn> }
        ]} />
        {open.length > 0 && <div style={{ padding: "10px 18px 12px" }}><Note tone="warn">{open.map(t => personName(t.personId) + ": " + t.issue).join(" ")}</Note></div>}
      </Card>
    </div>
  );
}

/* ── Programme ────────────────────────────────────────────────────────── */
function ProgrammeTab({ p, f, s }: Ctx) {
  const el = timeElapsed(p);
  const units = s.units.filter(u => u.projectId === p.id);
  const sections = SECTION_PROGRESS.filter(x => x.projectId === p.id);
  const pending = s.reports.filter(r => r.projectId === p.id && r.status !== "Approved" && r.unitsSecondFix).flatMap(r => r.unitsSecondFix || []);
  type M = { d: string; t: string; sub: string; cls: string };
  const ms: M[] = [
    { d: p.start, t: "Start on site", sub: p.quoteRef + " converted to contract", cls: "done" },
    ...s.claims.filter(c => c.projectId === p.id && c.submitted).map(c => ({ d: c.submitted, t: c.ref + " submitted", sub: eur(c.amount) + ", " + c.status.toLowerCase(), cls: "done" })),
    ...INSPECTIONS.filter(i => i.projectId === p.id).map(i => ({ d: i.date, t: i.kind, sub: i.standard + ", " + i.result.toLowerCase() + (i.actions ? ", " + i.actions + " actions" : ""), cls: i.result === "Fail" ? "bad" : i.date <= TODAY ? "done" : "" })),
    { d: TODAY, t: "Today: " + p.stage, sub: pctInt(el) + " of programme elapsed, " + pctInt(f.progress) + " of value certified", cls: "now" },
    { d: p.nextValuation, t: "Next valuation", sub: p.valuationDay, cls: "" },
    { d: p.finish, t: "Practical completion", sub: daysBetween(TODAY, p.finish) + " days remaining", cls: "" }
  ].sort((a, b) => a.d.localeCompare(b.d) || (a.cls === "now" ? 1 : -1));
  const stageCount = (k: "firstFix" | "secondFix" | "testing" | "snagging") => units.filter(u => u[k] >= 1).length;
  const issues = ISSUES.filter(i => i.projectId === p.id);
  return (
    <div className="lv-grid lv-g-1-2">
      <div className="lv-stack">
        <Card title="Programme" sub={date(p.start) + " to " + date(p.finish)}>
          <HBars items={[
            { label: "Time elapsed", value: el, max: 1, right: pctInt(el), tone: "neutral" },
            { label: "Valued progress", value: f.progress, max: 1, right: pctInt(f.progress) }
          ]} />
          <div className="lv-small lv-muted" style={{ marginTop: 10 }}>Stage: <span className="lv-ink">{p.stage}</span>. {daysBetween(TODAY, p.finish)} days to completion.</div>
        </Card>
        <Card title="Milestones">
          <div className="lvp-tl">
            {ms.map((m, i) => <div key={i} className={"lvp-tli " + m.cls}><div className="d">{dateDay(m.d)} {m.d.slice(0, 4)}</div><div className="t">{m.t}</div><div className="s">{m.sub}</div></div>)}
          </div>
        </Card>
      </div>
      <div className="lv-stack">
        {units.length > 0 && (
          <Card title={"Units by stage (" + units.length + ")"} sub="Each unit shows first fix, second fix, testing and snagging"
            right={pending.length ? <Badge tone="warn">{pending.length} awaiting report approval</Badge> : undefined}>
            <div className="lv-grid lv-g4" style={{ marginBottom: 14 }}>
              <Stat label="First fix" value={stageCount("firstFix") + "/" + units.length} />
              <Stat label="Second fix" value={stageCount("secondFix") + "/" + units.length} />
              <Stat label="Tested" value={stageCount("testing") + "/" + units.length} />
              <Stat label="Snagged" value={stageCount("snagging") + "/" + units.length} />
            </div>
            <div className="lv-unitgrid">
              {units.map(u => (
                <div key={u.block + u.no} className={"lv-unit" + (pending.indexOf(u.no) > -1 && u.secondFix < 1 ? " new" : "")} title={u.block + ", unit " + u.no}>
                  <div className="no"><span>{u.no}</span><span className="lv-faint">{u.block.replace("Block ", "")}</span></div>
                  <div className="pips">{[u.firstFix, u.secondFix, u.testing, u.snagging].map((v, i) => <i key={i} className={v >= 1 ? "f" : v > 0 ? "h" : ""} />)}</div>
                </div>
              ))}
            </div>
            {pending.length > 0 && <div style={{ marginTop: 12 }}><Note tone="accent">Highlighted units are reported complete for second fix in an unapproved site report. Approving it in Site Operations updates these units and the valuation suggestion.</Note></div>}
          </Card>
        )}
        {sections.length > 0 && (
          <Card title="Progress by contract section" sub="This month against last month's valuation">
            <HBars items={sections.map(x => ({ label: x.section, value: x.pct, max: 1, target: x.prev, right: pctInt(x.pct) + " (+" + Math.round((x.pct - x.prev) * 100) + ")" }))} />
            <div className="lv-small lv-faint" style={{ marginTop: 10 }}>Marker shows last month's position.</div>
          </Card>
        )}
        {units.length === 0 && sections.length === 0 && (
          <Card title="Progress detail"><Empty title="Summary progress only">This project reports progress at contract level. {pctInt(f.progress)} certified to date.</Empty></Card>
        )}
        <Card title="Issues & delays" flush>
          {issues.length ? <Rows>{issues.map(i => <Li key={i.id} title={i.title} sub={i.impact + " Raised " + dateShort(i.raised) + "."} right={<Badge tone={i.status === "Open" ? (i.severity === "High" ? "bad" : "warn") : "ok"} dot>{i.kind}, {i.status.toLowerCase()}</Badge>} />)}</Rows>
            : <Empty title="No issues logged" />}
        </Card>
      </div>
    </div>
  );
}

/* ── Contract ─────────────────────────────────────────────────────────── */
function ContractTab({ p, f, s }: Ctx) {
  const lines = CONTRACT_LINES.filter(l => l.projectId === p.id);
  const vos = s.variations.filter(v => v.projectId === p.id);
  const claim = claimFor(p.id, s);
  const c = client(p.clientId);
  if (!lines.length) {
    return (
      <div className="lv-stack">
        <Card title="Contract summary" sub={p.quoteRef + " · " + p.takeoffRef}>
          <KV items={[["Original value", eur(f.original)], ["Approved variations", eur(f.variations)], ["Revised value", eur(f.revised)], ["Certified to date", eur(f.certified)],
            ["Valuation day", p.valuationDay], ["Payment terms", c.terms], ["Client", c.name], ["Client contact", c.contact]]} />
          <div style={{ marginTop: 12 }}><Note>Line-by-line contract detail for this project lives in LiveCosts and the QS file in this demo. Only LE-2026-014 Dalkey carries a full schedule, to show how a claim is built from it.</Note></div>
        </Card>
        <Card title="Variations on this contract" flush right={<Btn size="sm" kind="ghost" onClick={() => setProjectTab("variations")}>Variations</Btn>}>
          <VoTable p={p} s={s} />
        </Card>
        <div className="lv-row"><Btn onClick={() => navigate({ page: "Claims & Finance", tab: "claims", claim: claim?.id || null })}>Open claims for this project</Btn></div>
      </div>
    );
  }
  type R = { code: string; heading: string; desc: string; value: number; prevPct: number; prevValue: number; src: string; vo: boolean };
  const approved = vos.filter(v => v.status === "Approved");
  const rows: R[] = [
    ...lines.map(l => ({ code: l.code, heading: l.heading, desc: l.description, value: l.value, prevPct: l.prevPct, prevValue: lineCalc(l.value, l.prevPct, l.prevPct).prevValue, src: p.quoteRef + " line " + l.code + " · " + p.takeoffRef, vo: false })),
    ...approved.map(v => ({ code: v.ref, heading: "Variation", desc: v.title, value: v.value, prevPct: v.prevPct, prevValue: lineCalc(v.value, v.prevPct, v.prevPct).prevValue, src: v.reason, vo: true }))
  ];
  const tv = rows.reduce((n, r) => n + r.value, 0), tp = rows.reduce((n, r) => n + r.prevValue, 0);
  const started = claim && claim.status !== "Not started";
  return (
    <div className="lv-stack">
      <Card tone="accent" title="October valuation" sub={"Valuation due " + date(p.nextValuation) + " · " + p.valuationDay}>
        <div className="lvp-cta">
          <div className="txt">
            {started ? <>Claim <b>{claim!.ref}</b> is {claim!.status.toLowerCase()} at <b>{eur(claim!.amount)}</b> this period.</>
              : <>Builds the claim from these {lines.length} contract lines and {approved.length} approved variation{approved.length === 1 ? "" : "s"}, starting at the {eur(tp)} previously certified. Site report suggestions (SR-1043) can be applied in the claim builder.</>}
          </div>
          <Btn kind="primary" size="lg" onClick={() => createMonthlyClaim(p.id)}>{started ? "Open Monthly Claim" : "Create Monthly Claim"}</Btn>
        </div>
      </Card>
      <Card title="Contract schedule" sub={"From " + p.quoteRef + " and take-off " + p.takeoffRef + " · " + eur(f.original) + " + " + eur(f.variations) + " approved variation"} flush>
        <Table rows={rows} foot rowClass={r => r.vo ? "hl" : ""} cols={[
          { key: "c", label: "Line", cls: "m", render: r => r.code, foot: "" },
          { key: "h", label: "Heading", cls: "strong", render: r => r.heading, foot: "Total" },
          { key: "d", label: "Description", cls: "wrap", hideMobile: true, render: r => <span className="lv-muted">{r.desc}</span> },
          { key: "v", label: "Value", align: "r", render: r => eur(r.value), foot: eur(tv) },
          { key: "p", label: "Prev. cert.", align: "r", render: r => pctInt(r.prevPct), foot: pctInt(tv ? tp / tv : 0) },
          { key: "pv", label: "Prev. value", align: "r", render: r => eur(r.prevValue), foot: eur(tp) },
          { key: "rem", label: "Remaining", align: "r", hideMobile: true, render: r => eur(r.value - r.prevValue), foot: eur(tv - tp) },
          { key: "s", label: "Source", hideMobile: true, render: r => <span className="lv-faint lv-small">{r.src}</span> }
        ]} />
      </Card>
      {p.id === "p01" && (
        <Card title="Certified valuations" sub={"Cumulative " + eur(DALKEY_HISTORY.reduce((n, h) => n + h.certified, 0)) + ", matches previous certified above"} flush>
          <Table rows={DALKEY_HISTORY} cols={[
            { key: "r", label: "Valuation", cls: "m", render: h => h.ref },
            { key: "p", label: "Period", render: h => h.period },
            { key: "c", label: "Certified", align: "r", render: h => eur(h.certified) },
            { key: "i", label: "Invoice", cls: "m", hideMobile: true, render: h => h.invoice },
            { key: "s", label: "Status", render: h => <StatusBadge s={h.paid ? "Paid" : "Awaiting payment"} /> }
          ]} />
        </Card>
      )}
    </div>
  );
}

function VoTable({ p, s }: { p: Project; s: LvState }) {
  const vos = s.variations.filter(v => v.projectId === p.id);
  return (
    <Table rows={vos} cols={[
      { key: "r", label: "Ref", cls: "m", render: v => v.ref },
      { key: "t", label: "Title", cls: "wrap", render: v => v.title },
      { key: "v", label: "Value", align: "r", render: v => eur(v.value) },
      { key: "s", label: "Status", render: v => <StatusBadge s={v.status} /> },
      { key: "d", label: "Raised", hideMobile: true, render: v => dateShort(v.raised) },
      { key: "w", label: "Reason", hideMobile: true, render: v => <span className="lv-muted">{v.reason}</span> },
      { key: "a", label: "", align: "r", render: v => v.status === "Pending approval" ? <Btn size="sm" kind="primary" onClick={() => navigate({ page: "Work" })}>Review in Work</Btn>
        : v.status === "Approved" ? <span className="lv-small lv-ok">In revised value</span> : <span className="lv-small lv-faint">Not in revised value</span> }
    ]} empty={<><b>No variations</b>Nothing raised on this contract yet.</>} />
  );
}

/* ── Claims ───────────────────────────────────────────────────────────── */
function ClaimsTab({ p, f, s }: Ctx) {
  const claims = s.claims.filter(c => c.projectId === p.id).sort((a, b) => b.number - a.number || b.period.localeCompare(a.period));
  const invs = s.invoices.filter(i => i.projectId === p.id).sort((a, b) => b.issued.localeCompare(a.issued));
  const open = (id: string | null) => navigate({ page: "Claims & Finance", tab: "claims", claim: id });
  return (
    <div className="lv-stack">
      <div className="lv-grid lv-g4">
        <Stat label="Certified to date" value={eurShort(f.certified)} hint={pctInt(f.progress) + " of revised value"} />
        <Stat label="Invoiced" value={eurShort(f.invoiced)} />
        <Stat label="Paid" value={eurShort(f.paid)} tone="ok" />
        <Stat label="Outstanding" value={eurShort(f.outstanding)} tone={f.outstanding > 0 ? "warn" : "ok"} hint="Invoiced, not yet paid" />
      </div>
      <Card title="Claims" sub="Tap a claim to open it in Claims & Finance" flush right={<Btn size="sm" onClick={() => open(claimFor(p.id, s)?.id || null)}>Open Claims & Finance</Btn>}>
        <Table rows={claims} onRow={c => open(c.id)} cols={[
          { key: "r", label: "Claim", cls: "m", render: c => c.ref },
          { key: "p", label: "Period", hideMobile: true, render: c => c.periodLabel },
          { key: "st", label: "Status", render: c => <StatusBadge s={c.status} /> },
          { key: "a", label: "Claimed", align: "r", render: c => c.amount ? eur(c.amount) : <span className="lv-faint">-</span> },
          { key: "c", label: "Certified", align: "r", render: c => c.certified != null ? eur(c.certified) : <span className="lv-faint">-</span> },
          { key: "s", label: "Submitted", hideMobile: true, render: c => c.submitted ? dateShort(c.submitted) : <span className="lv-faint">-</span> },
          { key: "d", label: "Assessment due", hideMobile: true, render: c => c.assessmentDue ? <span className={c.status === "Submitted" && c.assessmentDue < TODAY ? "lv-bad" : ""}>{dateShort(c.assessmentDue)}</span> : <span className="lv-faint">-</span> },
          { key: "i", label: "Invoice", cls: "m", hideMobile: true, render: c => c.invoiceId ? s.invoices.find(i => i.id === c.invoiceId)?.ref || c.invoiceId : <span className="lv-faint">-</span> }
        ]} empty={<><b>No claims yet</b>First valuation {date(p.nextValuation)}.</>} />
        {claims.some(c => c.note) && <div style={{ padding: "10px 18px 12px" }}><Note>{claims.filter(c => c.note).map(c => c.ref + ": " + c.note).join(" ")}</Note></div>}
      </Card>
      <Card title="Invoices" sub={<>Xero status shown from the demo connection <DemoTag sim /></>} flush>
        <Table rows={invs} cols={[
          { key: "r", label: "Invoice", cls: "m", render: i => i.ref },
          { key: "p", label: "Period", hideMobile: true, render: i => i.period },
          { key: "n", label: "Net", align: "r", render: i => eur(i.net) },
          { key: "pd", label: "Paid", align: "r", hideMobile: true, render: i => eur(i.paid) },
          { key: "d", label: "Due", render: i => <span className={i.paid < i.net && i.due < TODAY ? "lv-bad" : ""}>{dateShort(i.due)}</span> },
          { key: "x", label: "Xero", hideMobile: true, render: i => <StatusBadge s={i.xero} /> }
        ]} empty={<><b>No invoices yet</b>Invoices are drafted from certified claims.</>} />
      </Card>
    </div>
  );
}

/* ── Procurement ──────────────────────────────────────────────────────── */
function ProcurementTab({ p, f, s }: Ctx) {
  const pos = s.pos.filter(po => po.projectId === p.id);
  const open = pos.filter(po => po.status === "Committed");
  const awaiting = pos.filter(po => po.status === "Awaiting approval");
  const posted = pos.filter(po => po.status === "Posted");
  const sum = (l: PurchaseOrder[]) => l.reduce((n, po) => n + po.value, 0);
  const row = (po: PurchaseOrder) => {
    const late = isLatePO(po);
    return (
      <div key={po.id} className="lv-li lvp-po">
        <div className="grow">
          <div className="t"><span className="lv-mono" style={{ fontSize: 12 }}>{po.ref}</span> · {po.description}</div>
          <div className="s">{supplierName(po.supplierId)} · {CAT_LABEL[po.category]} · ordered {dateShort(po.ordered)}, due {dateShort(po.due)}{late ? ", " + daysLate(po) + " days late" : ""}</div>
        </div>
        <div className="lvp-po-r">
          {po.status !== "Awaiting approval" && <Badge tone={late ? "bad" : toneForStatus(po.delivery)} dot>{late && po.delivery !== "Late" ? "Late" : po.delivery}</Badge>}
          <span className="num">{eur(po.value)}</span>
          {po.status === "Awaiting approval" && <><Btn size="sm" kind="ghost" onClick={() => { rejectPO(po.id); toast(po.ref + " rejected"); }}>Reject</Btn><Btn size="sm" kind="primary" onClick={() => approvePO(po.id)}>Approve</Btn></>}
          {po.status === "Committed" && po.delivery !== "Delivered" && <Btn size="sm" onClick={() => { markDelivered(po.id); toast(po.ref + " marked delivered"); }}>Delivered</Btn>}
          {po.status === "Committed" && <Btn size="sm" kind="okb" onClick={() => postSupplierInvoice(po.id)}>Post invoice</Btn>}
        </div>
      </div>
    );
  };
  return (
    <div className="lv-stack">
      <div className="lv-grid lv-g4">
        <Stat label="Actual posted" value={eurShort(f.actual)} hint={eurShort(f.actualByCat.materials) + " of it materials"} />
        <Stat label="Open POs" value={eurShort(f.openPO)} tone="warn" hint={open.length + " orders committed, not invoiced"} />
        <Stat label="Committed" value={eurShort(f.committed)} hero hint="Actual + open POs" />
        <Stat label="Awaiting approval" value={eurShort(sum(awaiting))} hint={awaiting.length ? awaiting.length + " not yet committed" : "Nothing waiting"} tone={awaiting.length ? "warn" : undefined} />
      </div>
      <Note>Committed = actual posted + open POs = {eur(f.actual)} + {eur(f.openPO)} = <b>{eur(f.committed)}</b>. A PO leaves "open" the moment its supplier invoice is posted to actual, so the same spend is counted once.</Note>
      <Card title="Open committed" sub={eur(sum(open)) + " · " + open.length + " orders"} flush>
        {open.length ? <div className="lv-list">{open.map(row)}</div> : <Empty title="No open orders">Everything ordered has been invoiced and posted.</Empty>}
      </Card>
      <Card title="Awaiting approval" sub={awaiting.length ? eur(sum(awaiting)) + ". Approving commits the order and moves it out of cost to complete." : undefined} flush tone={awaiting.length ? "warn" : undefined}>
        {awaiting.length ? <div className="lv-list">{awaiting.map(row)}</div> : <Empty title="Nothing waiting">No orders on this project need sign-off.</Empty>}
      </Card>
      <Card title="Posted" sub={eur(sum(posted)) + " in actual cost"} flush>
        {posted.length ? <div className="lv-list">{posted.map(row)}</div> : <Empty title="None posted yet in this period" />}
      </Card>
    </div>
  );
}

/* ── Variations ───────────────────────────────────────────────────────── */
function VariationsTab({ p, f, s }: Ctx) {
  const vos = s.variations.filter(v => v.projectId === p.id);
  const pend = vos.filter(v => v.status === "Pending approval" || v.status === "Priced");
  return (
    <div className="lv-stack">
      <div className="lv-grid lv-g4">
        <Stat label="Original" value={eurShort(f.original)} />
        <Stat label="Approved variations" value={"+" + eurShort(f.variations)} tone="ok" hint={vos.filter(v => v.status === "Approved").length + " approved"} />
        <Stat label="Revised value" value={eurShort(f.revised)} hero />
        <Stat label="Pending or priced" value={eurShort(pend.reduce((n, v) => n + v.value, 0))} tone={pend.length ? "warn" : undefined} hint="Not in revised value" />
      </div>
      <Card title="Variations" flush><VoTable p={p} s={s} /></Card>
      <Note>Only approved variations add to revised contract value. Pending and priced variations stay out until the client instructs and Martin approves in Work.</Note>
    </div>
  );
}

/* ── Documents ────────────────────────────────────────────────────────── */
function DocumentsTab({ p }: Ctx) {
  const [doc, setDoc] = useState<DocumentRec | null>(null);
  const docs = DOCUMENTS.filter(d => d.projectId === p.id);
  return (
    <div className="lv-stack">
      <Card title="Project documents" sub={docs.length + " filed"} flush>
        {docs.length ? <Rows>{docs.map(d => <Li key={d.id} onClick={() => setDoc(d)} title={d.title} sub={d.rev + " · " + date(d.added) + " · " + d.by + " · " + d.size} right={<Badge tone="ghost">{d.kind}</Badge>} />)}</Rows>
          : <Empty title="No documents filed in the demo">Quote {p.quoteRef} and take-off {p.takeoffRef} are referenced on the contract.</Empty>}
      </Card>
      <DocDrawer doc={doc} onClose={() => setDoc(null)} />
    </div>
  );
}

/* ── Activity ─────────────────────────────────────────────────────────── */
function ActivityTab({ p, s }: Ctx) {
  const acts = s.activity.filter(a => a.rel === p.ref);
  return (
    <Card title="Activity" sub={"Everything logged against " + p.ref}>
      {acts.length ? (
        <div className="lvp-tl">
          {acts.map(a => (
            <div key={a.id} className={"lvp-tli " + (a.status === "completed" ? "done" : a.status === "failed" ? "bad" : "now")}>
              <div className="d">{dateDay(a.at)} · {a.time} · {a.src}</div>
              <div className="t">{a.title}</div>
              <div className="s">{a.note} {a.actor}.</div>
            </div>
          ))}
        </div>
      ) : <Empty title="No activity yet">Approvals, postings and claims on this project appear here as they happen.</Empty>}
      <div className="lv-row" style={{ marginTop: 8 }}><Legend items={[["Completed", "var(--ok)"], ["Awaiting someone", "var(--accent)"]]} /></div>
    </Card>
  );
}
