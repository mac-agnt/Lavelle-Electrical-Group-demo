/* Dashboard body (the KPI band above is rendered by the shell). Every figure
   comes from finOf / claimTotals over the live store, so approvals and
   allocations elsewhere move these charts. */

import "../../styles/lv-siteops.css";
import {
  Page, Head, Card, Stat, Badge, StatusBadge, DemoTag, Bar, Table, HBars, Cols, Legend, Split, Note, Rows, Li, ProjectLink
} from "./ui";
import { useLv, finOf, navigate, openProject, personName, labourCost, sub as subOf, client, project as projectOf, type LvState } from "../../lavelle/store";
import { ALLOCATIONS, EMPLOYEES, SUBCONTRACTORS, SUPPLIERS, TYPE_LABEL, DEFAULT_TARGET } from "../../lavelle/seed";
import { invoiceOutstanding, type Fin } from "../../lavelle/calc";
import { labourIssues } from "../../lavelle/answers";
import { eur, eurShort, pct, pctInt, dateShort, addDays, daysBetween, TODAY } from "../../lavelle/format";
import { shortName, tinyName, headsToday, bookedHours } from "../../lavelle/actions-siteops";
import type { Claim, ClaimStatus, Project, ProjectType, Enquiry } from "../../lavelle/types";

const C = ["var(--lv-c1)", "var(--lv-c2)", "var(--lv-c3)", "var(--lv-c4)", "var(--lv-c5)", "var(--lv-c6)"];
const TYPES: ProjectType[] = ["commercial", "industrial", "residential", "small"];
const statusTone = (st: Fin["status"]) => (st === "On target" ? "ok" as const : st === "Watch" ? "warn" as const : "bad" as const);

interface Row { p: Project; f: Fin }
const rowsOf = (s: LvState): Row[] => s.projects.map(p => ({ p, f: finOf(p, s) }));

export default function LvDashboard({ tab }: { tab: string }) {
  const s = useLv();
  const TITLES: Record<string, [string, string]> = {
    executive: ["Executive overview", "Where the money is, what it is earning and when it comes in. All twelve live contracts."],
    profitability: ["Project profitability", "Forecast margin on each job against its own target, worst gap first."],
    labour: ["Labour", "Posted labour, who is on site today, overtime and the hours that still need confirming."],
    commercial: ["Commercial", "Claims, certification, variations, tendering and who owes us money."],
    cashflow: ["Cash flow", "The next eight weeks from " + dateShort(TODAY) + ". Confirmed money kept apart from projected."]
  };
  const [title, subTitle] = TITLES[tab] || TITLES.executive;
  return (
    <Page>
      <Head eyebrow="Dashboard" title={title} sub={subTitle} actions={<DemoTag />} />
      {tab === "executive" && <Executive s={s} />}
      {tab === "profitability" && <Profitability s={s} />}
      {tab === "labour" && <Labour s={s} />}
      {tab === "commercial" && <Commercial s={s} />}
      {tab === "cashflow" && <Cashflow s={s} />}
    </Page>
  );
}

/* ── shared pieces ────────────────────────────────────────────────────── */
const PIPE: { label: string; match: ClaimStatus[] }[] = [
  { label: "Draft", match: ["Draft"] },
  { label: "Internal review", match: ["Internal review"] },
  { label: "Submitted", match: ["Submitted"] },
  { label: "Certified", match: ["Certified", "Partially certified"] },
  { label: "Disputed", match: ["Disputed"] },
  { label: "Invoiced", match: ["Invoiced"] },
  { label: "Paid", match: ["Paid"] }
];
const claimValue = (c: Claim) => (c.certified != null && c.status !== "Draft" && c.status !== "Internal review" && c.status !== "Submitted" ? c.certified : c.amount);

function ClaimsPipeline({ s }: { s: LvState }) {
  const stages = PIPE.map(st => {
    const list = s.claims.filter(c => st.match.indexOf(c.status) > -1);
    return { ...st, list, value: list.reduce((n, c) => n + claimValue(c), 0) };
  });
  const max = Math.max(1, ...stages.map(x => x.value));
  return (
    <>
      <Split parts={stages.map((x, i) => ({ v: x.value, color: C[i % C.length], label: x.label + " " + eur(x.value) }))} />
      <div style={{ marginTop: 12 }}>
        <HBars items={stages.map(x => ({
          label: <span>{x.label} <span className="lv-faint">({x.list.length})</span></span>,
          value: x.value, max, right: eurShort(x.value),
          tone: x.label === "Disputed" ? "bad" as const : x.label === "Paid" ? "ok" as const : undefined,
          onClick: () => navigate({ page: "Claims & Finance", tab: "claims" })
        }))} />
      </div>
      <div className="lv-small lv-faint" style={{ marginTop: 10 }}>Certified, invoiced and paid stages show the certified amount. Earlier stages show the amount claimed.</div>
    </>
  );
}

/** Week buckets from today: index 0 = 20–26 Oct. Anything before today lands in week 0. */
const weekOf = (iso: string) => Math.max(0, Math.floor(daysBetween(TODAY, iso) / 7));
const weekLabel = (i: number) => dateShort(addDays(TODAY, i * 7));

/* ── Executive ───────────────────────────────────────────────────────── */
function Executive({ s }: { s: LvState }) {
  const rows = rowsOf(s);
  const byType = TYPES.map(t => ({ t, list: rows.filter(r => r.p.type === t) })).map(x => ({ ...x, value: x.list.reduce((n, r) => n + r.f.revised, 0) }));
  const totalValue = byType.reduce((n, x) => n + x.value, 0);
  const byMargin = [...rows].sort((a, b) => b.f.margin - a.f.margin);
  const byProfit = [...rows].sort((a, b) => b.f.profit - a.f.profit);
  const maxProfit = Math.max(1, ...rows.map(r => r.f.profit));
  const labourTotal = rows.reduce((n, r) => n + r.f.actualByCat.labour, 0);
  const byLabour = [...rows].sort((a, b) => b.f.actualByCat.labour - a.f.actualByCat.labour);
  const OPEN_STAGES: Enquiry["stage"][] = ["New", "Drawings in", "Take-off", "Pricing", "Review", "Submitted"];
  const pipe = OPEN_STAGES.map(st => ({ st, list: s.enquiries.filter(e => e.stage === st) })).map(x => ({ ...x, value: x.list.reduce((n, e) => n + e.value, 0) }));
  const pipeTotal = pipe.reduce((n, x) => n + x.value, 0);
  const outstanding = s.invoices.filter(i => invoiceOutstanding(i) > 0);
  const overdue = outstanding.filter(i => i.due < TODAY);
  const collect = Array.from({ length: 6 }, (_, w) => ({
    label: weekLabel(w),
    v: outstanding.filter(i => i.due >= TODAY && weekOf(i.due) === w).reduce((n, i) => n + invoiceOutstanding(i), 0)
  }));
  const later = outstanding.filter(i => i.due >= TODAY && weekOf(i.due) >= 6).reduce((n, i) => n + invoiceOutstanding(i), 0);

  return (
    <>
      <div className="lv-grid lv-g3" style={{ marginBottom: 14 }}>
        <Card title="Contract value by sector" sub={eur(totalValue) + " revised across " + rows.length + " contracts"}>
          <Split parts={byType.map((x, i) => ({ v: x.value, color: C[i], label: TYPE_LABEL[x.t] }))} />
          <div style={{ marginTop: 12 }}>
            <HBars items={byType.map(x => ({ label: <span>{TYPE_LABEL[x.t]} <span className="lv-faint">({x.list.length})</span></span>, value: x.value, max: totalValue, right: eurShort(x.value) + " · " + pctInt(totalValue ? x.value / totalValue : 0) }))} />
          </div>
        </Card>
        <Card title="Margin by project vs target" sub="Forecast margin. Marker is the contract's target." right={<Badge tone="ghost">0 to 35%</Badge>}>
          <HBars items={byMargin.map(r => ({
            label: shortName(r.p), value: Math.max(0, r.f.margin), max: 0.35, target: r.f.target,
            right: pct(r.f.margin), tone: r.f.status === "On target" ? "ok" as const : r.f.status === "Watch" ? "warn" as const : "bad" as const,
            onClick: () => openProject(r.p.id, "financials")
          }))} />
        </Card>
        <Card title="Forecast profit at completion" sub={eur(rows.reduce((n, r) => n + r.f.profit, 0)) + " across the portfolio"}>
          <HBars items={byProfit.map(r => ({ label: shortName(r.p), value: Math.max(0, r.f.profit), max: maxProfit, right: eurShort(r.f.profit), tone: r.f.profit < 0 ? "bad" as const : undefined, onClick: () => openProject(r.p.id, "financials") }))} />
        </Card>
      </div>

      <div className="lv-grid lv-g-3-2" style={{ marginBottom: 14 }}>
        <Card title="Committed vs actual cost" sub="Actual cost posted plus open purchase orders. Each PO counted once." right={<Legend items={[["Actual", C[0]], ["Open POs", C[3]]]} />}>
          <Cols height={200} fmt={eurShort} data={rows.map(r => ({ label: tinyName(r.p), parts: [
            { v: r.f.actual, color: C[0], title: shortName(r.p) + " actual " + eur(r.f.actual) },
            { v: r.f.openPO, color: C[3], title: shortName(r.p) + " open POs " + eur(r.f.openPO) }
          ] }))} />
          <div className="lv-row lv-small lv-muted" style={{ marginTop: 10 }}>
            <span>Actual {eur(rows.reduce((n, r) => n + r.f.actual, 0))}</span>
            <span>Open POs {eur(rows.reduce((n, r) => n + r.f.openPO, 0))}</span>
            <span className="lv-ink">Committed {eur(rows.reduce((n, r) => n + r.f.committed, 0))}</span>
          </div>
        </Card>
        <Card title="Monthly claims pipeline" sub={s.claims.filter(c => c.status !== "Not started").length + " claims across all stages"}>
          <ClaimsPipeline s={s} />
        </Card>
      </div>

      <div className="lv-grid lv-g3">
        <Card title="Labour distribution" sub={eur(labourTotal) + " labour posted to date"}>
          <Split parts={byLabour.map((r, i) => ({ v: r.f.actualByCat.labour, color: C[i % C.length], label: shortName(r.p) }))} />
          <div style={{ marginTop: 12 }}>
            <HBars items={byLabour.slice(0, 7).map(r => ({ label: shortName(r.p), value: r.f.actualByCat.labour, max: byLabour[0].f.actualByCat.labour, right: pctInt(labourTotal ? r.f.actualByCat.labour / labourTotal : 0), onClick: () => navigate({ page: "Dashboard", tab: "labour" }) }))} />
          </div>
          <div className="lv-small lv-faint" style={{ marginTop: 8 }}>Top seven shown. The other {byLabour.length - 7} hold {pctInt(labourTotal ? byLabour.slice(7).reduce((n, r) => n + r.f.actualByCat.labour, 0) / labourTotal : 0)}.</div>
        </Card>
        <Card title="Revenue pipeline" sub={eur(pipeTotal) + " in open enquiries"}>
          <HBars items={pipe.map(x => ({ label: <span>{x.st} <span className="lv-faint">({x.list.length})</span></span>, value: x.value, max: Math.max(1, ...pipe.map(y => y.value)), right: eurShort(x.value), onClick: () => navigate({ page: "Estimating", tab: "enquiries" }) }))} />
          <div className="lv-small lv-muted" style={{ marginTop: 10 }}>
            Won this year {eurShort(s.enquiries.filter(e => e.stage === "Won").reduce((n, e) => n + e.value, 0))}, lost {eurShort(s.enquiries.filter(e => e.stage === "Lost").reduce((n, e) => n + e.value, 0))}.
          </div>
        </Card>
        <Card title="Cash collection forecast" sub={"Invoices outstanding by due week · " + eur(outstanding.reduce((n, i) => n + invoiceOutstanding(i), 0)) + " total"}>
          <Cols height={150} fmt={eurShort} data={collect.map(x => ({ label: x.label, parts: [{ v: x.v, color: C[1] }] }))} />
          <div className="lv-row lv-small" style={{ marginTop: 8 }}>
            {overdue.length > 0 && <span className="lv-bad">Overdue {eur(overdue.reduce((n, i) => n + invoiceOutstanding(i), 0))}</span>}
            {later > 0 && <span className="lv-muted">Later {eur(later)}</span>}
            <span className="lv-spacer" />
            <span className="lv-link" onClick={() => navigate({ page: "Dashboard", tab: "cashflow" })}>Full cash flow</span>
          </div>
        </Card>
      </div>
    </>
  );
}

/* ── Profitability ───────────────────────────────────────────────────── */
const SCALE = 0.4;
function Profitability({ s }: { s: LvState }) {
  const rows = rowsOf(s).sort((a, b) => a.f.gap - b.f.gap);
  const below = rows.filter(r => r.f.status === "Below target");
  const shortfall = below.reduce((n, r) => n + (r.f.target * r.f.revised - r.f.profit), 0);
  const tot = rows.reduce((n, r) => ({ revised: n.revised + r.f.revised, profit: n.profit + r.f.profit }), { revised: 0, profit: 0 });
  const best = [...rows].sort((a, b) => b.f.gap - a.f.gap)[0];

  return (
    <>
      <div className="lv-grid lv-g4" style={{ marginBottom: 14 }}>
        <Stat label="Portfolio forecast margin" value={pct(tot.revised ? tot.profit / tot.revised : 0)} hint={eur(tot.profit) + " on " + eur(tot.revised)} hero />
        <Stat label="Below target" value={below.length + " of " + rows.length} hint={below.map(r => shortName(r.p)).join(", ") || "None"} tone={below.length ? "bad" : "ok"} />
        <Stat label="Profit short of target" value={eur(shortfall)} hint="Sum across below-target jobs" tone={shortfall > 0 ? "bad" : "ok"} />
        <Stat label="Furthest ahead" value={best ? shortName(best.p) : "None"} hint={best ? pct(best.f.margin) + " vs " + pct(best.f.target) + " target" : ""} tone="ok" onClick={best ? () => openProject(best.p.id, "financials") : undefined} />
      </div>

      <Card title="Project Profitability Comparison" sub="One row per project, sorted by gap to its own target. Click a row to open the project." right={<Legend items={[["Forecast margin", "var(--lv-c1)"], ["Target", "var(--ink)"]]} />} flush>
        <div className="lvx-prof">
          <div className="hd"><span>Project</span><span>Forecast margin vs target</span><span style={{ textAlign: "right" }}>Contract</span><span style={{ textAlign: "right" }}>Profit</span><span>Status</span></div>
          {rows.map(r => (
            <div className="pr" key={r.p.id} onClick={() => openProject(r.p.id, "financials")}>
              <div className="nm"><div className="t">{r.p.name}</div><div className="s">{r.p.ref} · {TYPE_LABEL[r.p.type]}</div></div>
              <div className="mg">
                <Bar value={Math.max(0, r.f.margin) / SCALE} target={r.f.target / SCALE} tone={statusTone(r.f.status)} />
                <span className="n"><b>{pct(r.f.margin)}</b> / {pct(r.f.target, 0)}</span>
              </div>
              <span className="r cv">{eurShort(r.f.revised)}</span>
              <span className="r">{eurShort(r.f.profit)}</span>
              <span><StatusBadge s={r.f.status} /></span>
            </div>
          ))}
          <div className="pr" style={{ cursor: "default", background: "none" }}>
            <span className="lv-small lv-faint">Scale</span>
            <div className="lvx-axis"><div><span>0%</span><span>10%</span><span>20%</span><span>30%</span><span>40%</span></div><span /></div>
            <span /><span /><span />
          </div>
        </div>
      </Card>

      <div className="lv-grid lv-g-3-2" style={{ marginTop: 14 }}>
        <Card title="Margin detail" flush>
          <Table
            foot
            rows={rows}
            onRow={r => openProject(r.p.id, "financials")}
            cols={[
              { key: "p", label: "Project", render: r => <ProjectLink id={r.p.id} />, foot: "Portfolio" },
              { key: "v", label: "Revised", align: "r", render: r => eur(r.f.revised), foot: eur(tot.revised) },
              { key: "fc", label: "Forecast cost", align: "r", hideMobile: true, render: r => eur(r.f.forecast), foot: eur(rows.reduce((n, r) => n + r.f.forecast, 0)) },
              { key: "pr", label: "Profit", align: "r", render: r => eur(r.f.profit), foot: eur(tot.profit) },
              { key: "m", label: "Margin", align: "r", render: r => pct(r.f.margin), foot: pct(tot.revised ? tot.profit / tot.revised : 0) },
              { key: "t", label: "Target", align: "r", hideMobile: true, render: r => pct(r.f.target, 0) },
              { key: "g", label: "Gap", align: "r", render: r => <span className={r.f.gap >= 0 ? "lv-ok" : r.f.status === "Watch" ? "lv-warn" : "lv-bad"}>{(r.f.gap >= 0 ? "+" : "") + (r.f.gap * 100).toFixed(1)} pts</span> },
              { key: "e", label: "vs target", align: "r", hideMobile: true, render: r => <span className={r.f.gap >= 0 ? "lv-ok" : "lv-bad"}>{(r.f.gap >= 0 ? "+" : "") + eur(r.f.gap * r.f.revised)}</span> }
            ]}
          />
        </Card>
        <div className="lv-stack">
          <Note tone="accent">
            Margin targets are demo assumptions set per contract type: {TYPES.map(t => TYPE_LABEL[t].toLowerCase() + " " + pctInt(DEFAULT_TARGET[t])).join(", ")}. They are not Lavelle's actual targets and can be changed on each project's Financials tab.
          </Note>
          {below.map(r => (
            <Card key={r.p.id} tone="bad" title={shortName(r.p) + " is " + Math.abs(r.f.gap * 100).toFixed(1) + " pts below target"} sub={r.p.summary} onClick={() => openProject(r.p.id, "financials")}>
              <div className="lv-small lv-muted">Forecast {pct(r.f.margin)} against {pct(r.f.target, 0)}. Labour forecast {eur(r.f.forecastByCat.labour)} against a budget of {eur(r.f.budgetByCat.labour)}.</div>
            </Card>
          ))}
          <Card title="Status rules">
            <div className="lv-small lv-muted" style={{ lineHeight: 1.55 }}>
              On target: forecast margin at or above target. Watch: within one point below. Below target: more than one point below. Forecast cost = actual + open POs + cost still to commit.
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

/* ── Labour ──────────────────────────────────────────────────────────── */
function Labour({ s }: { s: LvState }) {
  const rows = rowsOf(s);
  const heads = headsToday();
  const posted = rows.reduce((n, r) => n + r.f.actualByCat.labour, 0);
  const subPosted = rows.reduce((n, r) => n + r.f.actualByCat.subcontract, 0);
  const today = ALLOCATIONS.filter(a => a.date === TODAY && a.projectId);
  const costToday = today.reduce((n, a) => {
    const sb = subOf(a.personId);
    return n + (sb ? sb.dayRate : labourCost(a.personId, bookedHours(a.start, a.end), 0));
  }, 0);
  const totalHeads = Object.values(heads).reduce((n, h) => n + h.total, 0);
  const exceptions = labourIssues(s);
  const ot = s.timesheets.filter(t => (t.proposal?.ot || 0) > 0 || (t.pm?.ot || 0) > 0 || (t.sync && t.pm && t.sync.hours > t.pm.hours));
  const otApprovals = s.approvals.filter(a => a.kind === "Overtime");
  const byLabour = [...rows].sort((a, b) => b.f.actualByCat.labour - a.f.actualByCat.labour);
  const siteIds = Object.keys(heads);

  return (
    <>
      <div className="lv-grid lv-g6" style={{ marginBottom: 14 }}>
        <Stat label="Labour posted" value={eurShort(posted)} hint="Direct staff, to date" />
        <Stat label="Subcontract posted" value={eurShort(subPosted)} hint={pctInt(posted + subPosted ? subPosted / (posted + subPosted) : 0) + " of labour + subcontract"} />
        <Stat label="On site today" value={totalHeads} hint={siteIds.length + " sites"} />
        <Stat label="Booked cost today" value={eur(costToday)} hint="Rates × booked hours (estimate)" />
        <Stat label="Timesheet exceptions" value={exceptions.length} hint="From Mon 19 Oct" tone={exceptions.length ? "warn" : "ok"} onClick={() => navigate({ page: "Workforce", tab: "timesheets" })} />
        <Stat label="Overtime to sign off" value={otApprovals.filter(a => a.status === "Awaiting you").length} hint={eur(otApprovals.filter(a => a.status === "Awaiting you").reduce((n, a) => n + a.value, 0)) + " pending"} tone={otApprovals.some(a => a.status === "Awaiting you") ? "warn" : "ok"} onClick={() => navigate({ page: "Work" })} />
      </div>

      <div className="lv-grid lv-g2" style={{ marginBottom: 14 }}>
        <Card title="Posted labour by project" sub="Direct labour cost to date">
          <HBars items={byLabour.map(r => ({ label: shortName(r.p), value: r.f.actualByCat.labour, max: byLabour[0].f.actualByCat.labour, right: eurShort(r.f.actualByCat.labour), onClick: () => openProject(r.p.id, "financials") }))} />
        </Card>
        <Card title="Labour forecast vs budget" sub="Forecast labour at completion. Marker is the estimate's labour budget.">
          <HBars items={[...rows].sort((a, b) => (b.f.forecastByCat.labour - b.f.budgetByCat.labour) - (a.f.forecastByCat.labour - a.f.budgetByCat.labour)).map(r => {
            const mx = Math.max(...rows.map(x => Math.max(x.f.forecastByCat.labour, x.f.budgetByCat.labour)));
            const over = r.f.forecastByCat.labour - r.f.budgetByCat.labour;
            return { label: shortName(r.p), value: r.f.forecastByCat.labour, max: mx, target: r.f.budgetByCat.labour, right: (over > 0 ? "+" : "") + eurShort(over), tone: over > 0 ? "bad" as const : "ok" as const, onClick: () => openProject(r.p.id, "financials") };
          })} />
        </Card>
      </div>

      <div className="lv-grid lv-g-3-2" style={{ marginBottom: 14 }}>
        <Card title="Heads on site today" sub={"Bookings for " + dateShort(TODAY)} right={<Legend items={[["Staff", C[0]], ["Subcontract", C[2]]]} />}>
          <Cols height={180} fmt={n => String(n)} data={siteIds.map(id => ({ label: tinyName(projectOf(id)), parts: [
            { v: heads[id].staff, color: C[0], title: "Staff " + heads[id].staff },
            { v: heads[id].subs, color: C[2], title: "Subcontract " + heads[id].subs }
          ] }))} />
        </Card>
        <Card title="Staff vs subcontract cost" sub="Posted to date per project" flush>
          <Table dense rows={byLabour.filter(r => r.f.actualByCat.labour + r.f.actualByCat.subcontract > 0)} cols={[
            { key: "p", label: "Project", render: r => <ProjectLink id={r.p.id} /> },
            { key: "sp", label: "Split", hideMobile: true, render: r => <div style={{ width: 90 }}><Split parts={[{ v: r.f.actualByCat.labour, color: C[0] }, { v: r.f.actualByCat.subcontract, color: C[2] }]} /></div> },
            { key: "st", label: "Staff", align: "r", render: r => eurShort(r.f.actualByCat.labour) },
            { key: "sb", label: "Subcon.", align: "r", render: r => eurShort(r.f.actualByCat.subcontract) }
          ]} />
        </Card>
      </div>

      <div className="lv-grid lv-g2">
        <Card title="Overtime" sub="From timesheets and overtime requests" flush>
          <Rows>
            {ot.map(t => {
              const extra = t.proposal?.ot || (t.sync && t.pm ? t.sync.hours - t.pm.hours : 0);
              return <Li key={t.id} onClick={() => navigate({ page: "Workforce", tab: "timesheets" })} title={personName(t.personId) + ": " + extra + "h over"} sub={t.issue || "Overtime recorded"} right={<span className="num">{eur(labourCost(t.personId, 0, extra))}</span>} />;
            })}
            {otApprovals.map(a => (
              <Li key={a.id} onClick={() => navigate({ page: "Work" })} title={a.title} sub={a.subject} right={<><span className="num">{eur(a.value)}</span><StatusBadge s={a.status} /></>} />
            ))}
            {ot.length + otApprovals.length === 0 && <Li title="No overtime recorded" sub="Nothing waiting for sign-off." />}
          </Rows>
        </Card>
        <Card title="Timesheet exceptions" sub="WhatsApp submissions that don't match Sync clock-ins (simulated)" right={<DemoTag sim />} flush>
          <Rows>
            {exceptions.map(t => (
              <Li key={t.id} onClick={() => navigate({ page: "Workforce", tab: "timesheets" })} title={personName(t.personId)} sub={t.issue} right={<StatusBadge s={t.state} />} />
            ))}
            {exceptions.length === 0 && <Li title="All hours confirmed" sub="Every allocation from yesterday has posted to project labour." right={<Badge tone="ok">Clear</Badge>} />}
          </Rows>
        </Card>
      </div>
    </>
  );
}

/* ── Commercial ──────────────────────────────────────────────────────── */
function Commercial({ s }: { s: LvState }) {
  const oct = s.claims.filter(c => c.period === "2026-10" && c.status !== "Not started");
  const certifiedClaims = s.claims.filter(c => c.certified != null);
  const vars = s.variations.filter(v => v.value > 0);
  const vSum = (st: string) => vars.filter(v => v.status === st).reduce((n, v) => n + v.value, 0);
  const won = s.enquiries.filter(e => e.stage === "Won"), lost = s.enquiries.filter(e => e.stage === "Lost");
  const winRate = won.length + lost.length ? won.length / (won.length + lost.length) : 0;
  const winValue = won.reduce((n, e) => n + e.value, 0), lostValue = lost.reduce((n, e) => n + e.value, 0);
  const outstanding = s.invoices.filter(i => invoiceOutstanding(i) > 0);
  const debtors = Array.from(new Set(outstanding.map(i => i.clientId))).map(cid => {
    const list = outstanding.filter(i => i.clientId === cid);
    const age = (lo: number, hi: number) => list.filter(i => { const d = daysBetween(i.due, TODAY); return d >= lo && d <= hi; }).reduce((n, i) => n + invoiceOutstanding(i), 0);
    return { cid, list, total: list.reduce((n, i) => n + invoiceOutstanding(i), 0), current: age(-999, 0), d30: age(1, 30), d60: age(31, 9999) };
  }).sort((a, b) => b.total - a.total);
  const debtTotal = debtors.reduce((n, d) => n + d.total, 0);

  return (
    <>
      <div className="lv-grid lv-g6" style={{ marginBottom: 14 }}>
        <Stat label="Claimed in October" value={eurShort(oct.reduce((n, c) => n + c.amount, 0))} hint={oct.length + " claims raised"} />
        <Stat label="Certified in October" value={eurShort(oct.filter(c => c.certified != null).reduce((n, c) => n + (c.certified || 0), 0))} hint={oct.filter(c => c.certified != null).length + " certificates"} tone="ok" />
        <Stat label="Held by client QS" value={eur(certifiedClaims.reduce((n, c) => n + Math.max(0, c.amount - (c.certified || 0)), 0))} hint="Claimed less certified" tone="warn" />
        <Stat label="Variations pending" value={eur(vSum("Pending approval") + vSum("Priced"))} hint={vars.filter(v => v.status === "Pending approval" || v.status === "Priced").length + " awaiting instruction"} tone="warn" onClick={() => navigate({ page: "Projects", tab: "variations" })} />
        <Stat label="Tender win rate" value={pctInt(winRate)} hint={won.length + " won, " + lost.length + " lost this year"} />
        <Stat label="Debtors" value={eurShort(debtTotal)} hint={outstanding.length + " invoices outstanding"} onClick={() => navigate({ page: "Claims & Finance", tab: "invoices" })} />
      </div>

      <div className="lv-grid lv-g-2-1" style={{ marginBottom: 14 }}>
        <Card title="Certified vs claimed" sub="Every claim the client has assessed. Partial certifications and disputes highlighted." flush>
          <Table
            rows={certifiedClaims}
            onRow={c => navigate({ page: "Claims & Finance", tab: "claims", claim: c.id })}
            rowClass={c => c.amount !== c.certified ? "hl" : ""}
            cols={[
              { key: "r", label: "Claim", render: c => <span className="lv-mono">{c.ref}</span> },
              { key: "p", label: "Project", render: c => <ProjectLink id={c.projectId} /> },
              { key: "pe", label: "Period", hideMobile: true, render: c => c.periodLabel.replace(/ \(.*\)/, "") },
              { key: "a", label: "Claimed", align: "r", render: c => eur(c.amount) },
              { key: "c", label: "Certified", align: "r", render: c => eur(c.certified || 0) },
              { key: "h", label: "Held", align: "r", render: c => { const h = c.amount - (c.certified || 0); return h > 0 ? <span className="lv-bad">{eur(h)}</span> : <span className="lv-faint">None</span>; } },
              { key: "s", label: "Status", render: c => <StatusBadge s={c.status} /> }
            ]}
          />
        </Card>
        <Card title="Claims pipeline">
          <ClaimsPipeline s={s} />
        </Card>
      </div>

      <div className="lv-grid lv-g3" style={{ marginBottom: 14 }}>
        <Card title="Variations" sub={eur(vSum("Approved")) + " approved and in revised contract values"} flush>
          <div style={{ padding: "4px 18px 12px" }}>
            <Split parts={[{ v: vSum("Approved"), color: C[1], label: "Approved" }, { v: vSum("Pending approval"), color: C[3], label: "Pending approval" }, { v: vSum("Priced"), color: C[2], label: "Priced" }]} />
            <div style={{ marginTop: 8 }}><Legend items={[["Approved " + eurShort(vSum("Approved")), C[1]], ["Pending " + eurShort(vSum("Pending approval")), C[3]], ["Priced " + eurShort(vSum("Priced")), C[2]]]} /></div>
          </div>
          <Table dense rows={vars} onRow={v => openProject(v.projectId, "contract")} cols={[
            { key: "r", label: "VO", render: v => <span className="lv-mono">{v.ref}</span> },
            { key: "t", label: "Title", cls: "wrap", hideMobile: true, render: v => v.title },
            { key: "v", label: "Value", align: "r", render: v => eur(v.value) },
            { key: "s", label: "Status", render: v => <StatusBadge s={v.status} /> }
          ]} />
        </Card>
        <Card title="Estimating win rate" sub={"By count " + pctInt(winRate) + " · by value " + pctInt(winValue + lostValue ? winValue / (winValue + lostValue) : 0)}>
          <HBars items={TYPES.map(t => {
            const w = won.filter(e => e.type === t).length, l = lost.filter(e => e.type === t).length;
            return { label: <span>{TYPE_LABEL[t]} <span className="lv-faint">({w}/{w + l})</span></span>, value: w, max: Math.max(1, w + l), right: w + l ? pctInt(w / (w + l)) : "None", tone: "ok" as const };
          })} />
          <div style={{ marginTop: 12 }}>
            <Rows>
              {lost.map(e => <Li key={e.id} onClick={() => navigate({ page: "Estimating", tab: "wonlost" })} title={e.project} sub={e.note} right={<span className="num lv-muted">{eurShort(e.value)}</span>} />)}
            </Rows>
          </div>
        </Card>
        <Card title="Debtors" sub={eur(debtTotal) + " outstanding, ex VAT"} flush>
          <Table dense foot rows={debtors} onRow={() => navigate({ page: "Claims & Finance", tab: "invoices" })} cols={[
            { key: "c", label: "Client", cls: "wrap", render: d => client(d.cid).name, foot: "Total" },
            { key: "cu", label: "Not due", align: "r", render: d => d.current ? eurShort(d.current) : "", foot: eurShort(debtors.reduce((n, d) => n + d.current, 0)) },
            { key: "d1", label: "1-30d", align: "r", render: d => d.d30 ? <span className="lv-warn">{eurShort(d.d30)}</span> : "", foot: eurShort(debtors.reduce((n, d) => n + d.d30, 0)) },
            { key: "d2", label: "31d+", align: "r", render: d => d.d60 ? <span className="lv-bad">{eurShort(d.d60)}</span> : "", foot: eurShort(debtors.reduce((n, d) => n + d.d60, 0)) }
          ]} />
        </Card>
      </div>
    </>
  );
}

/* ── Cash flow ───────────────────────────────────────────────────────── */
const WEEKS = 8;
const termsDays = (terms: string) => { const m = /(\d+)/.exec(terms); return m ? Number(m[1]) : 30; };

function Cashflow({ s }: { s: LvState }) {
  const rows = rowsOf(s);
  const zero = () => Array.from({ length: WEEKS }, () => 0);
  const confirmed = zero(), projected = zero(), suppliers = zero(), payroll = zero();
  let laterConfirmed = 0, laterProjected = 0, laterSuppliers = 0;
  const projItems: { label: string; ref: string; when: string; v: number; basis: string; claimId: string }[] = [];

  // Confirmed: invoices issued and not yet paid. Overdue lands in week 1.
  s.invoices.forEach(i => {
    const o = invoiceOutstanding(i); if (o <= 0) return;
    const w = weekOf(i.due);
    if (w < WEEKS) confirmed[w] += o; else laterConfirmed += o;
  });

  // Projected: certified but not invoiced, submitted, disputed (undisputed part) and draft claims.
  s.claims.forEach(c => {
    const p = projectOf(c.projectId); if (!p) return;
    let when = "", basis = "", v = 0;
    if ((c.status === "Certified" || c.status === "Partially certified") && !c.invoiceId) {
      when = addDays(c.certifiedDate && c.certifiedDate > TODAY ? c.certifiedDate : TODAY, 30); v = c.certified || 0; basis = "Certified, not invoiced: invoice now, paid +30 days";
    } else if (c.status === "Submitted") {
      const cert = c.assessmentDue && c.assessmentDue > TODAY ? c.assessmentDue : TODAY;
      when = addDays(cert, 30); v = c.amount; basis = "Submitted: assumed certified by " + dateShort(cert) + ", paid +30 days";
    } else if (c.status === "Disputed") {
      when = addDays(TODAY, 37); v = c.certified || 0; basis = "Disputed: undisputed part assumed certified within a week, paid +30 days";
    } else if (c.status === "Draft" || c.status === "Internal review") {
      const cert = addDays(p.nextValuation > TODAY ? p.nextValuation : TODAY, 14);
      when = addDays(cert, 30); v = c.amount; basis = "Draft: submitted " + dateShort(p.nextValuation) + ", assumed certified " + dateShort(cert) + ", paid +30 days";
    } else return;
    if (v <= 0) return;
    const w = weekOf(when);
    if (w < WEEKS) projected[w] += v; else laterProjected += v;
    projItems.push({ label: shortName(p), ref: c.ref, when, v, basis, claimId: c.id });
  });

  // Suppliers: open POs, paid on the supplier's terms from the delivery due date.
  s.pos.filter(po => po.status === "Committed").forEach(po => {
    const su = SUPPLIERS.find(x => x.id === po.supplierId);
    const pay = addDays(po.due, termsDays(su?.terms || "30"));
    const w = weekOf(pay);
    if (w < WEEKS) suppliers[w] += po.value; else laterSuppliers += po.value;
  });

  // Payroll: site staff at 40 hours a week, plus subcontractors booked today at 5 days.
  const staffWeek = EMPLOYEES.filter(e => e.rate > 0).reduce((n, e) => n + labourCost(e.id, 40, 0), 0);
  const subIds = Array.from(new Set(ALLOCATIONS.filter(a => a.date === TODAY && a.personId.startsWith("s")).map(a => a.personId)));
  const subWeek = subIds.reduce((n, id) => n + (SUBCONTRACTORS.find(x => x.id === id)?.dayRate || 0) * 5, 0);
  for (let w = 0; w < WEEKS; w++) payroll[w] = staffWeek + subWeek;

  const weeks = Array.from({ length: WEEKS }, (_, w) => {
    const out = suppliers[w] + payroll[w];
    return { w, label: weekLabel(w), confirmed: confirmed[w], projected: projected[w], suppliers: suppliers[w], payroll: payroll[w], netConfirmed: confirmed[w] - out, netAll: confirmed[w] + projected[w] - out };
  });
  let runC = 0, runA = 0;
  const cum = weeks.map(x => { runC += x.netConfirmed; runA += x.netAll; return { c: runC, a: runA }; });
  const sum = (k: "confirmed" | "projected" | "suppliers" | "payroll" | "netConfirmed" | "netAll") => weeks.reduce((n, x) => n + x[k], 0);
  const signed = (n: number) => <span className={n < 0 ? "lvx-neg" : "lvx-pos"}>{n < 0 ? "-" + eur(-n) : eur(n)}</span>;

  const cashRows = rows.map(r => ({ ...r, cash: r.f.paid - r.f.actual })).sort((a, b) => a.cash - b.cash);

  return (
    <>
      <div className="lv-grid lv-g6" style={{ marginBottom: 14 }}>
        <Stat label="Confirmed receipts" value={eurShort(sum("confirmed"))} hint="Invoices issued, unpaid" tone="ok" />
        <Stat label="Projected receipts" value={eurShort(sum("projected"))} hint="Claims not yet invoiced (assumed)" />
        <Stat label="Supplier payments" value={eurShort(sum("suppliers"))} hint="Open POs on supplier terms" />
        <Stat label="Payroll exposure" value={eurShort(sum("payroll"))} hint={eur(staffWeek + subWeek) + " a week"} />
        <Stat label="Net, confirmed only" value={eurShort(sum("netConfirmed"))} hint="8 weeks" tone={sum("netConfirmed") < 0 ? "bad" : "ok"} />
        <Stat label="Net incl. projected" value={eurShort(sum("netAll"))} hint="If claims certify on time" tone={sum("netAll") < 0 ? "bad" : "ok"} />
      </div>

      <div className="lv-grid lv-g2" style={{ marginBottom: 14 }}>
        <Card title="Money in by week" sub="Confirmed (invoiced) and projected (claims not yet invoiced) kept apart" right={<Legend items={[["Confirmed", C[1]], ["Projected", C[2]]]} />}>
          <Cols height={190} fmt={eurShort} data={weeks.map(x => ({ label: x.label, parts: [
            { v: x.confirmed, color: C[1], title: "Confirmed " + eur(x.confirmed) },
            { v: x.projected, color: C[2], title: "Projected " + eur(x.projected) }
          ] }))} />
          {(laterConfirmed + laterProjected) > 0 && <div className="lv-small lv-faint" style={{ marginTop: 8 }}>After 8 weeks: {eur(laterConfirmed)} confirmed, {eur(laterProjected)} projected.</div>}
        </Card>
        <Card title="Money out by week" sub="Supplier payments and site payroll" right={<Legend items={[["Suppliers", C[3]], ["Payroll", C[4]]]} />}>
          <Cols height={190} fmt={eurShort} data={weeks.map(x => ({ label: x.label, parts: [
            { v: x.suppliers, color: C[3], title: "Suppliers " + eur(x.suppliers) },
            { v: x.payroll, color: C[4], title: "Payroll " + eur(x.payroll) }
          ] }))} />
          {laterSuppliers > 0 && <div className="lv-small lv-faint" style={{ marginTop: 8 }}>After 8 weeks: {eur(laterSuppliers)} to suppliers on 60-day terms.</div>}
        </Card>
      </div>

      <Card title="Eight-week position" sub="Week commencing. Overdue invoices are counted in the first week." flush>
        <Table
          foot
          rows={weeks}
          cols={[
            { key: "w", label: "Week of", render: x => <span className="lv-mono">{x.label}</span>, foot: "8 weeks" },
            { key: "c", label: "Confirmed in", align: "r", render: x => x.confirmed ? eur(x.confirmed) : <span className="lv-faint">0</span>, foot: eur(sum("confirmed")) },
            { key: "p", label: "Projected in", align: "r", cls: "lvx-proj", render: x => x.projected ? eur(x.projected) : <span className="lv-faint">0</span>, foot: eur(sum("projected")) },
            { key: "s", label: "Suppliers", align: "r", render: x => x.suppliers ? "-" + eur(x.suppliers) : <span className="lv-faint">0</span>, foot: "-" + eur(sum("suppliers")) },
            { key: "pa", label: "Payroll", align: "r", hideMobile: true, render: x => "-" + eur(x.payroll), foot: "-" + eur(sum("payroll")) },
            { key: "nc", label: "Net confirmed", align: "r", render: x => signed(x.netConfirmed), foot: signed(sum("netConfirmed")) },
            { key: "na", label: "Net incl. projected", align: "r", hideMobile: true, render: x => signed(x.netAll), foot: signed(sum("netAll")) },
            { key: "cu", label: "Running (confirmed)", align: "r", hideMobile: true, render: x => signed(cum[x.w].c) },
            { key: "ca", label: "Running (all)", align: "r", hideMobile: true, render: x => signed(cum[x.w].a) }
          ]}
        />
      </Card>

      <div className="lv-grid lv-g-1-2" style={{ marginTop: 14 }}>
        <div className="lv-stack">
          <Card title="Projected receipts" sub="Assumptions, not confirmed money" right={<Badge tone="info">Projected</Badge>} flush>
            <Rows>
              {projItems.sort((a, b) => a.when.localeCompare(b.when)).map(x => (
                <Li key={x.ref} onClick={() => navigate({ page: "Claims & Finance", tab: "claims", claim: x.claimId })} title={x.label + " · " + x.ref} sub={x.basis} right={<div style={{ textAlign: "right" }}><div className="num">{eur(x.v)}</div><div className="lv-small lv-faint">{dateShort(x.when)}</div></div>} />
              ))}
            </Rows>
          </Card>
          <Note>Figures are ex VAT. Payroll covers site staff at 40 hours a week and the subcontractors booked today at five days; office salaries are not included. Supplier terms are read from each account (30, 45 or 60 days) and applied from the PO delivery date.</Note>
        </div>
        <Card title="Project cash position" sub="Cash received less cost posted. Negative means the job is funding itself from the bank." flush>
          <Table
            foot
            rows={cashRows}
            onRow={r => openProject(r.p.id, "financials")}
            cols={[
              { key: "p", label: "Project", render: r => <ProjectLink id={r.p.id} />, foot: "Portfolio" },
              { key: "c", label: "Certified", align: "r", hideMobile: true, render: r => eur(r.f.certified), foot: eur(rows.reduce((n, r) => n + r.f.certified, 0)) },
              { key: "i", label: "Invoiced", align: "r", hideMobile: true, render: r => eur(r.f.invoiced), foot: eur(rows.reduce((n, r) => n + r.f.invoiced, 0)) },
              { key: "pd", label: "Paid", align: "r", render: r => eur(r.f.paid), foot: eur(rows.reduce((n, r) => n + r.f.paid, 0)) },
              { key: "a", label: "Cost to date", align: "r", render: r => eur(r.f.actual), foot: eur(rows.reduce((n, r) => n + r.f.actual, 0)) },
              { key: "cp", label: "Cash position", align: "r", render: r => signed(r.cash), foot: signed(cashRows.reduce((n, r) => n + r.cash, 0)) },
              { key: "b", label: "", hideMobile: true, render: r => <div style={{ width: 70 }}><Bar thin value={r.f.actual ? Math.min(1, r.f.paid / r.f.actual) : 0} tone={r.cash < 0 ? "bad" : "ok"} title={"Paid covers " + pctInt(r.f.actual ? r.f.paid / r.f.actual : 0) + " of cost"} /></div> }
            ]}
          />
        </Card>
      </div>
    </>
  );
}
