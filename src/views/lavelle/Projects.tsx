/* Projects: the portfolio view across all twelve contracts, and the door into
   each project's workspace. Every figure comes from fin() via finOf/totals. */

import { useState, type ReactNode } from "react";
import "../../styles/lv-projects.css";
import { useLv, finOf, client, personName, openProject, setFilter, navigate, claimFor, type LvState } from "../../lavelle/store";
import { totals, invoiceOutstanding, type Fin } from "../../lavelle/calc";
import { TYPE_LABEL, CAT_LABEL, CATS, DEMO_NOTE, PORTFOLIO, DOCUMENTS, SECTION_PROGRESS, INSPECTIONS } from "../../lavelle/seed";
import type { DocumentRec, Project, ProjectType } from "../../lavelle/types";
import { eur, eurShort, pct, pctInt, date, dateShort, daysBetween, TODAY } from "../../lavelle/format";
import {
  Page, Head, Card, Stat, Badge, StatusBadge, DemoTag, Btn, Select, Bar, Table, HBars, Legend, Split, Note, Empty, Rows, Li, ProjectLink, type Col
} from "./ui";
import ProjectWorkspace, { MarginBar, TargetInput, DocDrawer } from "./ProjectWorkspace";
import { isLatePO, daysLate, marginTone, riskKey, gapPts, opStatus, timeElapsed, exportReport } from "../../lavelle/actions-projects";

interface PF { p: Project; f: Fin; }
const TYPES: ProjectType[] = ["residential", "commercial", "industrial", "small"];
const TYPE_COLOR: Record<ProjectType, string> = { residential: "var(--lv-c1)", commercial: "var(--lv-c2)", industrial: "var(--lv-c3)", small: "var(--lv-c4)" };
const SHORT_TYPE: Record<ProjectType, string> = { residential: "Residential", commercial: "Commercial", industrial: "Industrial", small: "Small works" };
const pfs = (s: LvState): PF[] => s.projects.map(p => ({ p, f: finOf(p, s) }));
const ctxOf = (s: LvState) => ({ pos: s.pos, variations: s.variations });
const MarginText = ({ f }: { f: Fin }) => <span className={"lv-" + marginTone(f)} style={{ fontWeight: 600 }}>{pct(f.margin)}</span>;

const HEAD: Record<string, [string, string]> = {
  overview: ["Projects", "Twelve live contracts across Dublin and Galway. Margin, commitments and valuations read from the same records as every other module."],
  all: ["All projects", "Every live contract with its value, progress, committed cost and margin against target. Tap a row to open the project."],
  financials: ["Project financials", "Contract, cost, forecast and billing for every project on one sheet. Target margins are editable."],
  progress: ["Progress & milestones", "Value certified against cost spent and time used, with unit and section progress where it's tracked."],
  variations: ["Variations", "Every variation across the portfolio. Only approved variations add to revised contract value."],
  documents: ["Documents", "Contract documents, drawings, certificates and instructions filed against each project."],
  reports: ["Reports", "Standard reports built from live project data. Exports are simulated in this demo."]
};

export default function Projects({ tab }: { tab: string }) {
  const s = useLv();
  if (s.openProject && s.projects.some(p => p.id === s.openProject)) return <ProjectWorkspace id={s.openProject} />;
  const views: Record<string, (x: { s: LvState }) => JSX.Element> = {
    overview: OverviewTab, all: AllTab, financials: FinancialsTab, progress: ProgressTab, variations: VariationsTab, documents: DocumentsTab, reports: ReportsTab
  };
  const key = views[tab] ? tab : "overview";
  const View = views[key];
  return (
    <Page>
      <Head eyebrow="Projects" title={HEAD[key][0]} sub={HEAD[key][1]} actions={<DemoTag />} />
      <View s={s} />
    </Page>
  );
}

/* ── Overview ─────────────────────────────────────────────────────────── */
function OverviewTab({ s }: { s: LvState }) {
  const rows = pfs(s);
  const t = totals(s.projects, ctxOf(s));
  const wTarget = t.revised ? rows.reduce((n, r) => n + r.f.target * r.f.revised, 0) / t.revised : 0;
  const vos = rows.reduce((n, r) => n + r.f.variations, 0);
  const dublin = s.projects.filter(p => p.region === "Dublin").length;

  type Att = { key: string; kind: string; tone: "bad" | "warn"; title: string; sub: string; right: ReactNode; go: () => void };
  const att: Att[] = [];
  rows.filter(r => r.f.status !== "On target").sort((a, b) => a.f.gap - b.f.gap).forEach(({ p, f }) => att.push({
    key: "m" + p.id, kind: "Margin", tone: f.status === "Below target" ? "bad" : "warn", title: p.name,
    sub: "Forecast " + pct(f.margin) + " against " + pct(f.target) + " target. Profit " + eur(f.profit) + ".", right: <span className={"lv-" + marginTone(f) + " lv-small"}>{gapPts(f)}</span>,
    go: () => openProject(p.id, "financials") }));
  rows.forEach(({ p }) => {
    const d = daysBetween(TODAY, p.nextValuation), c = claimFor(p.id, s);
    if (d < 0 || d > 7) return;
    const ready = c && (c.status === "Submitted" || c.status === "Certified" || c.status === "Partially certified" || c.status === "Invoiced" || c.status === "Paid" || c.status === "Disputed");
    if (ready) return;
    att.push({ key: "v" + p.id, kind: "Valuation", tone: "warn", title: p.name, sub: "Valuation due " + dateShort(p.nextValuation) + ". " + (c ? c.ref + " is " + c.status.toLowerCase() + (c.amount ? " at " + eur(c.amount) : "") + "." : "No claim started."),
      right: <span className="lv-small lv-warn">{d === 0 ? "Today" : d + " days"}</span>, go: () => openProject(p.id, p.id === "p01" ? "contract" : "claims") });
  });
  s.pos.filter(isLatePO).sort((a, b) => daysLate(b) - daysLate(a)).forEach(po => att.push({
    key: "d" + po.id, kind: "Delivery", tone: "bad", title: po.ref + " · " + po.description, sub: (s.projects.find(p => p.id === po.projectId)?.name || "") + ", " + eur(po.value) + ", due " + dateShort(po.due) + ".",
    right: <span className="lv-small lv-bad">{daysLate(po)}d late</span>, go: () => openProject(po.projectId, "procurement") }));

  const byType = TYPES.map(ty => {
    const r = rows.filter(x => x.p.type === ty);
    const rev = r.reduce((n, x) => n + x.f.revised, 0), prof = r.reduce((n, x) => n + x.f.profit, 0);
    return { ty, n: r.length, rev, margin: rev ? prof / rev : 0 };
  });
  const next = [...rows].sort((a, b) => a.p.nextValuation.localeCompare(b.p.nextValuation)).slice(0, 8);

  return (
    <div className="lv-stack">
      <div className="lv-grid lv-g6">
        <Stat label="Active projects" value={t.count} hint={dublin + " Dublin, " + (t.count - dublin) + " Galway"} onClick={() => navigate({ page: "Projects", tab: "all" })} />
        <Stat label="Revised contract value" value={eurShort(t.revised)} hint={"Includes " + eurShort(vos) + " approved variations"} hero />
        <Stat label="Committed cost" value={eurShort(t.committed)} hint={eurShort(t.actual) + " actual + " + eurShort(t.openPO) + " open POs"} />
        <Stat label="Forecast profit" value={eurShort(t.profit)} hint={"On " + eurShort(t.forecast) + " forecast cost"} onClick={() => navigate({ page: "Projects", tab: "financials" })} />
        <Stat label="Portfolio margin" value={pct(t.margin)} tone={t.margin >= wTarget ? "ok" : t.margin >= wTarget - 0.01 ? "warn" : "bad"} hint={"Weighted target " + pct(wTarget)} />
        <Stat label="Certified to date" value={eurShort(t.certified)} hint={pctInt(t.revised ? t.certified / t.revised : 0) + " of revised, " + eurShort(t.outstanding) + " unpaid"} />
      </div>

      <div className="lv-grid lv-g-2-1">
        <Card title="Projects needing attention" sub="Margin below target, valuations due this week, late deliveries" flush right={<Badge tone={att.some(a => a.tone === "bad") ? "bad" : "warn"}>{att.length}</Badge>}>
          {att.length ? <Rows>{att.map(a => (
            <Li key={a.key} onClick={a.go} left={<Badge tone={a.tone} dot>{a.kind}</Badge>} title={a.title} sub={a.sub} right={a.right} />
          ))}</Rows> : <Empty title="Nothing needs attention">Every project is on target with deliveries on time.</Empty>}
        </Card>
        <Card title="Sector split" sub="Revised contract value by type">
          <Split parts={byType.map(b => ({ v: b.rev, color: TYPE_COLOR[b.ty], label: SHORT_TYPE[b.ty] }))} />
          <div style={{ marginTop: 10 }}><Legend items={byType.map(b => [SHORT_TYPE[b.ty], TYPE_COLOR[b.ty]] as [string, string])} /></div>
          <div style={{ marginTop: 12 }}>
            {byType.map(b => (
              <div key={b.ty} className="lvp-line" style={{ cursor: "pointer" }} onClick={() => { setFilter("type", b.ty); navigate({ page: "Projects", tab: "all" }); }}>
                <span>{SHORT_TYPE[b.ty]} <span className="lv-faint">({b.n})</span></span>
                <b>{eurShort(b.rev)} <span className="lv-faint" style={{ fontWeight: 400 }}>· {pct(b.margin)}</span></b>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="lv-grid lv-g-1-2">
        <Card title="Next valuations" flush right={<Btn size="sm" kind="ghost" onClick={() => navigate({ page: "Claims & Finance", tab: "claims" })}>Claims</Btn>}>
          <Rows>{next.map(({ p }) => {
            const c = claimFor(p.id, s), d = daysBetween(TODAY, p.nextValuation);
            return <Li key={p.id} onClick={() => openProject(p.id, "claims")} title={p.name} sub={p.valuationDay + (c ? " · " + c.ref : "")}
              right={<div style={{ textAlign: "right" }}><div className="num">{dateShort(p.nextValuation)}</div><div className={"lv-small " + (d <= 7 ? "lv-warn" : "lv-faint")}>{d === 0 ? "today" : "in " + d + " days"}</div></div>} />;
          })}</Rows>
        </Card>
        <Card title="Forecast margin against target" sub="Bar is forecast margin, marker is target (0 to 40% scale)">
          <HBars items={[...rows].sort((a, b) => a.f.gap - b.f.gap).map(({ p, f }) => ({
            label: p.name, value: Math.max(0, f.margin), max: 0.4, target: f.target, tone: marginTone(f), right: pct(f.margin), onClick: () => openProject(p.id, "financials")
          }))} />
        </Card>
      </div>

      <div className="lvp-cards">
        {rows.map(({ p, f }) => (
          <div key={p.id} className="lvp-pc" onClick={() => openProject(p.id)}>
            <div className="top"><span className="ref">{p.ref}</span><StatusBadge s={f.status} /></div>
            <div className="nm">{p.name}</div>
            <div className="cl">{client(p.clientId).name} · {p.stage}</div>
            <div className="row"><span>Valued progress</span><b>{pctInt(f.progress)}</b></div>
            <Bar value={f.progress} thin />
            <div className="row"><span>Margin {pct(f.margin)}</span><span>target <b>{pct(f.target)}</b></span></div>
            <MarginBar f={f} thin />
            <div className="foot"><span>Revised <b>{eurShort(f.revised)}</b></span><span>Committed <b>{eurShort(f.committed)}</b></span></div>
          </div>
        ))}
      </div>
      <div className="lv-small lv-faint">{DEMO_NOTE}</div>
    </div>
  );
}

/* ── All projects ─────────────────────────────────────────────────────── */
function AllTab({ s }: { s: LvState }) {
  const fl = s.filters;
  const q = fl.q.trim().toLowerCase();
  const all = pfs(s);
  const rows = all.filter(({ p, f }) =>
    (fl.type === "all" || p.type === fl.type) && (fl.region === "all" || p.region === fl.region) && (fl.pm === "all" || p.pmId === fl.pm) &&
    (fl.risk === "all" || riskKey(f) === fl.risk) &&
    (!q || (p.name + " " + p.ref + " " + client(p.clientId).name + " " + p.location).toLowerCase().indexOf(q) > -1));
  const pms = Array.from(new Set(s.projects.map(p => p.pmId)));
  const active = fl.type !== "all" || fl.region !== "all" || fl.pm !== "all" || fl.risk !== "all" || !!q;
  const rev = rows.reduce((n, r) => n + r.f.revised, 0), com = rows.reduce((n, r) => n + r.f.committed, 0), prof = rows.reduce((n, r) => n + r.f.profit, 0);
  const cols: Col<PF>[] = [
    { key: "ref", label: "Ref", cls: "m", hideMobile: true, render: r => r.p.ref, foot: "" },
    { key: "n", label: "Project", cls: "strong", render: r => <div className="lvp-cell"><span>{r.p.name}</span><span className="s">{r.p.stage}</span></div>, foot: rows.length + " projects" },
    { key: "c", label: "Client", hideMobile: true, render: r => client(r.p.clientId).name },
    { key: "t", label: "Type", hideMobile: true, render: r => SHORT_TYPE[r.p.type] },
    { key: "v", label: "Revised value", align: "r", render: r => eur(r.f.revised), foot: eur(rev) },
    { key: "pm", label: "PM", hideMobile: true, render: r => personName(r.p.pmId) },
    { key: "pg", label: "Progress", hideMobile: true, render: r => <div className="lvp-prog"><Bar value={r.f.progress} thin /><span>{pctInt(r.f.progress)}</span></div> },
    { key: "cm", label: "Committed", align: "r", hideMobile: true, render: r => eur(r.f.committed), foot: eur(com) },
    { key: "m", label: "Margin", align: "r", render: r => <div className="lvp-cell" style={{ alignItems: "flex-end" }}><MarginText f={r.f} /><span className="s">target {pct(r.f.target)}</span></div>, foot: rev ? pct(prof / rev) : "-" },
    { key: "nv", label: "Next valuation", hideMobile: true, render: r => dateShort(r.p.nextValuation) },
    { key: "st", label: "Status", render: r => { const o = opStatus(r.p); return <Badge tone={o.tone}>{o.label}</Badge>; } }
  ];
  return (
    <div className="lv-stack">
      <div className="lvp-filters">
        <input className="lv-input" placeholder="Search name, ref, client" value={fl.q} onChange={(e) => setFilter("q", e.target.value)} aria-label="Search projects" />
        <Select label="Type" value={fl.type} onChange={v => setFilter("type", v)} options={[["all", "All types"], ...TYPES.map(t => [t, SHORT_TYPE[t]] as [string, string])]} />
        <Select label="Region" value={fl.region} onChange={v => setFilter("region", v)} options={[["all", "All regions"], ["Dublin", "Dublin"], ["Galway", "Galway"]]} />
        <Select label="Project manager" value={fl.pm} onChange={v => setFilter("pm", v)} options={[["all", "All PMs"], ...pms.map(id => [id, personName(id)] as [string, string])]} />
        <Select label="Margin risk" value={fl.risk} onChange={v => setFilter("risk", v)} options={[["all", "Any margin"], ["below", "Below target"], ["watch", "Watch"], ["on", "On target"]]} />
        {active && <Btn size="sm" kind="ghost" onClick={() => { (["type", "region", "pm", "risk"] as const).forEach(k => setFilter(k, "all")); setFilter("q", ""); }}>Clear</Btn>}
        <span className="lvp-count">{rows.length} of {all.length}</span>
      </div>
      <Card flush>
        <Table cols={cols} rows={rows} foot onRow={r => openProject(r.p.id)} rowClass={r => r.f.status === "Below target" ? "lvp-over" : ""}
          empty={<><b>No projects match</b>Clear a filter to see more.</>} />
      </Card>
    </div>
  );
}

/* ── Financials ───────────────────────────────────────────────────────── */
function FinancialsTab({ s }: { s: LvState }) {
  const rows = pfs(s);
  const t = totals(s.projects, ctxOf(s));
  const sum = (k: keyof Fin) => rows.reduce((n, r) => n + (r.f[k] as number), 0);
  const wTarget = t.revised ? rows.reduce((n, r) => n + r.f.target * r.f.revised, 0) / t.revised : 0;
  const m = (k: keyof Fin, label: string, hide?: boolean, strong?: boolean): Col<PF> =>
    ({ key: k, label, align: "r", hideMobile: hide, cls: strong ? "strong" : undefined, render: r => eur(r.f[k] as number), foot: eur(sum(k)) });
  const cols: Col<PF>[] = [
    { key: "p", label: "Project", cls: "strong", render: r => <div className="lvp-cell"><ProjectLink id={r.p.id} /><span className="s">{r.p.ref}</span></div>, foot: "Portfolio" },
    m("original", "Original", true), m("variations", "Approved VOs", true), m("revised", "Revised", false, true),
    m("actual", "Actual", true), m("openPO", "Open POs", true), m("committed", "Committed"), m("ctc", "Cost to complete", true), m("forecast", "Forecast cost"),
    { key: "pr", label: "Forecast profit", align: "r", render: r => <span className={r.f.profit < 0 ? "lv-bad" : ""}>{eur(r.f.profit)}</span>, foot: eur(t.profit) },
    { key: "mg", label: "Margin", align: "r", render: r => <MarginText f={r.f} />, foot: pct(t.margin) },
    { key: "tg", label: "Target", align: "r", render: r => <TargetInput p={r.p} />, foot: <span className="lv-muted">{pct(wTarget)}</span> },
    m("certified", "Certified", true), m("invoiced", "Invoiced", true), m("paid", "Paid", true)
  ];
  return (
    <div className="lv-stack">
      <div className="lv-grid lv-g4">
        <Stat label="Revised value" value={eurShort(t.revised)} hint={eurShort(sum("original")) + " original + " + eurShort(sum("variations")) + " VOs"} />
        <Stat label="Forecast cost" value={eurShort(t.forecast)} hint={eurShort(t.committed) + " committed so far"} />
        <Stat label="Forecast profit" value={eurShort(t.profit)} tone={t.margin >= wTarget ? "ok" : "warn"} hint={pct(t.margin) + " against " + pct(wTarget) + " weighted target"} />
        <Stat label="Below target" value={rows.filter(r => r.f.status === "Below target").length} tone="bad" hint={rows.filter(r => r.f.status === "Watch").length + " more on watch"} onClick={() => { setFilter("risk", "below"); navigate({ page: "Projects", tab: "all" }); }} />
      </div>
      <Note>
        <b>How these are worked out.</b> Revised value = original + approved variations only. Committed = actual posted + open purchase orders; a PO counts once, moving from open to actual when its supplier invoice is posted.
        Forecast cost = committed + cost still to commit. Forecast profit = revised value less forecast total cost. Margin = forecast profit ÷ revised value. Targets are demo assumptions; edit one and the status updates everywhere.
      </Note>
      <Card flush title="All projects" sub="Scroll sideways for billing columns on smaller screens">
        <Table cols={cols} rows={rows} foot rowClass={r => r.f.status === "Below target" ? "lvp-over" : ""} />
      </Card>
    </div>
  );
}

/* ── Progress & milestones ────────────────────────────────────────────── */
function ProgressTab({ s }: { s: LvState }) {
  const rows = pfs(s);
  const min = rows.reduce((a, r) => r.p.start < a ? r.p.start : a, "9999"), max = rows.reduce((a, r) => r.p.finish > a ? r.p.finish : a, "0000");
  const span = daysBetween(min, max) || 1;
  const pos = (d: string) => (daysBetween(min, d) / span) * 100;
  const ticks: string[] = [];
  { let [y, mo] = min.split("-").map(Number); mo += 1; if (mo > 12) { mo = 1; y++; }
    while ((y + "-" + String(mo).padStart(2, "0") + "-01") < max) { if ((mo - 1) % 3 === 0) ticks.push(y + "-" + String(mo).padStart(2, "0") + "-01"); mo++; if (mo > 12) { mo = 1; y++; } } }
  const resi = s.projects.filter(p => s.units.some(u => u.projectId === p.id));
  const secProjects = s.projects.filter(p => SECTION_PROGRESS.some(x => x.projectId === p.id));
  type MS = { d: string; t: string; sub: string; id: string };
  const upcoming: MS[] = [
    ...s.projects.filter(p => p.finish >= TODAY && daysBetween(TODAY, p.finish) <= 75).map(p => ({ d: p.finish, t: "Completion: " + p.name, sub: p.stage, id: p.id })),
    ...INSPECTIONS.filter(i => i.date >= TODAY).map(i => ({ d: i.date, t: i.kind, sub: (s.projects.find(p => p.id === i.projectId)?.name || "") + ", " + i.standard, id: i.projectId }))
  ].sort((a, b) => a.d.localeCompare(b.d));
  const cols: Col<PF>[] = [
    { key: "n", label: "Project", cls: "strong", render: r => <div className="lvp-cell"><span>{r.p.name}</span><span className="s">{r.p.stage}</span></div> },
    { key: "s", label: "Start", hideMobile: true, render: r => dateShort(r.p.start) + " " + r.p.start.slice(2, 4) },
    { key: "f", label: "Finish", render: r => dateShort(r.p.finish) + " " + r.p.finish.slice(2, 4) },
    { key: "v", label: "Valued", render: r => <div className="lvp-prog"><Bar value={r.f.progress} thin /><span>{pctInt(r.f.progress)}</span></div> },
    { key: "c", label: "Cost", hideMobile: true, render: r => <div className="lvp-prog"><Bar value={r.f.costProgress} tone={r.f.costProgress - r.f.progress > 0.08 ? "warn" : "neutral"} thin /><span>{pctInt(r.f.costProgress)}</span></div> },
    { key: "t", label: "Time", hideMobile: true, render: r => <div className="lvp-prog"><Bar value={timeElapsed(r.p)} tone="neutral" thin /><span>{pctInt(timeElapsed(r.p))}</span></div> },
    { key: "g", label: "Read", render: r => { const d = r.f.costProgress - r.f.progress; return d > 0.08 ? <Badge tone="warn">Cost ahead of value</Badge> : d < -0.08 ? <Badge tone="info">Value ahead of cost</Badge> : <Badge tone="ok">In step</Badge>; } }
  ];
  return (
    <div className="lv-stack">
      <Card title="Valued progress against cost progress" sub="Valued = certified ÷ revised. Cost = actual ÷ forecast cost. Time = programme elapsed." flush>
        <Table cols={cols} rows={rows} onRow={r => openProject(r.p.id, "programme")} />
      </Card>
      <div className="lv-grid lv-g-2-1">
        <Card title="Programme" sub={date(min) + " to " + date(max) + ". Shaded part is time elapsed, line is today."}>
          <div className="lvp-gantt">
            <div className="lvp-grow"><span /><div className="lvp-gaxis">{ticks.map(d => <span key={d} style={{ left: pos(d) + "%" }}>{dateShort(d).split(" ")[1]} {d.slice(2, 4)}</span>)}</div><span /></div>
            {[...rows].sort((a, b) => a.p.finish.localeCompare(b.p.finish)).map(({ p }) => {
              const l = pos(p.start), w = pos(p.finish) - l;
              return (
                <div key={p.id} className="lvp-grow">
                  <span className="l" onClick={() => openProject(p.id, "programme")}>{p.name}</span>
                  <div className="lvp-gtrack">
                    <div className="lvp-gbar" style={{ left: l + "%", width: w + "%" }}><i style={{ width: timeElapsed(p) * 100 + "%" }} /></div>
                    <div className="lvp-gtoday" style={{ left: pos(TODAY) + "%" }} />
                  </div>
                  <span className="r">{dateShort(p.finish)}</span>
                </div>
              );
            })}
          </div>
        </Card>
        <Card title="Coming up" sub="Completions in the next ten weeks and booked inspections" flush>
          <Rows>{upcoming.map((m, i) => <Li key={i} onClick={() => openProject(m.id, "programme")} title={m.t} sub={m.sub} right={<span className="num">{dateShort(m.d)}</span>} />)}</Rows>
        </Card>
      </div>
      <div className="lv-grid lv-g2">
        <Card title="Residential units by stage" sub="Units complete at each stage">
          <div className="lv-stack" style={{ gap: 16 }}>
            {resi.map(p => {
              const u = s.units.filter(x => x.projectId === p.id), n = u.length;
              const c = (k: "firstFix" | "secondFix" | "testing" | "snagging") => u.filter(x => x[k] >= 1).length;
              return (
                <div key={p.id}>
                  <div className="lv-row" style={{ marginBottom: 8 }}><ProjectLink id={p.id} /><span className="lv-spacer" /><span className="lv-small lv-faint">{n} units</span></div>
                  <HBars items={[
                    { label: "First fix", value: c("firstFix"), max: n, right: c("firstFix") + "/" + n },
                    { label: "Second fix", value: c("secondFix"), max: n, right: c("secondFix") + "/" + n },
                    { label: "Tested", value: c("testing"), max: n, right: c("testing") + "/" + n, tone: "neutral" },
                    { label: "Snagged", value: c("snagging"), max: n, right: c("snagging") + "/" + n, tone: "neutral" }
                  ]} />
                </div>
              );
            })}
          </div>
        </Card>
        <Card title="Commercial & industrial sections" sub="Progress by contract section; marker is last month">
          <div className="lv-stack" style={{ gap: 16 }}>
            {secProjects.map(p => (
              <div key={p.id}>
                <div className="lv-row" style={{ marginBottom: 8 }}><ProjectLink id={p.id} /><span className="lv-spacer" /><span className="lv-small lv-faint">{p.stage}</span></div>
                <HBars items={SECTION_PROGRESS.filter(x => x.projectId === p.id).map(x => ({ label: x.section, value: x.pct, max: 1, target: x.prev, right: pctInt(x.pct) }))} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ── Variations ───────────────────────────────────────────────────────── */
function VariationsTab({ s }: { s: LvState }) {
  const vos = [...s.variations].sort((a, b) => b.raised.localeCompare(a.raised));
  const by = (st: string) => vos.filter(v => v.status === st);
  const val = (l: typeof vos) => l.reduce((n, v) => n + v.value, 0);
  const withVo = s.projects.filter(p => vos.some(v => v.projectId === p.id && v.status === "Approved"));
  return (
    <div className="lv-stack">
      <div className="lv-grid lv-g4">
        <Stat label="Approved" value={eurShort(val(by("Approved")))} tone="ok" hint={by("Approved").length + " variations, in revised value"} />
        <Stat label="Pending approval" value={eurShort(val(by("Pending approval")))} tone="warn" hint={by("Pending approval").length + " waiting on Martin"} onClick={() => navigate({ page: "Work" })} />
        <Stat label="Priced" value={eurShort(val(by("Priced")))} hint={by("Priced").length + " awaiting client instruction"} />
        <Stat label="Rejected or withdrawn" value={by("Rejected").length} hint="Not in any figure" />
      </div>
      <Card title="All variations" flush>
        <Table rows={vos} onRow={v => openProject(v.projectId, "variations")} cols={[
          { key: "r", label: "Ref", cls: "m", render: v => v.ref },
          { key: "p", label: "Project", render: v => <ProjectLink id={v.projectId} short /> },
          { key: "t", label: "Title", cls: "wrap", render: v => v.title },
          { key: "v", label: "Value", align: "r", render: v => eur(v.value) },
          { key: "s", label: "Status", render: v => <StatusBadge s={v.status} /> },
          { key: "d", label: "Raised", hideMobile: true, render: v => dateShort(v.raised) },
          { key: "w", label: "Reason", hideMobile: true, render: v => <span className="lv-muted">{v.reason}</span> },
          { key: "a", label: "", align: "r", render: v => v.status === "Pending approval"
            ? <Btn size="sm" kind="primary" onClick={() => navigate({ page: "Work" })}>Review in Work</Btn>
            : v.status === "Approved" ? <span className="lv-small lv-ok">In revised value</span> : <span className="lv-small lv-faint">Excluded</span> }
        ]} />
      </Card>
      <div className="lv-grid lv-g2">
        <Card title="Revised value build-up" sub="Projects with approved variations">
          {withVo.map(p => { const f = finOf(p, s); return (
            <div key={p.id} className="lvp-line"><span><ProjectLink id={p.id} /></span><b>{eur(f.original)} + {eur(f.variations)} = {eur(f.revised)}</b></div>
          ); })}
        </Card>
        <Note tone="accent">
          <b>VO-008-03 on Grand Canal Dock</b> (containment re-route around the revised ceiling grid) is priced and waiting in Work approvals. Approving it adds its value to revised contract value and the matching cost to forecast, so the margin moves on every screen at once.
        </Note>
      </div>
    </div>
  );
}

/* ── Documents ────────────────────────────────────────────────────────── */
function DocumentsTab({ s }: { s: LvState }) {
  const [doc, setDoc] = useState<DocumentRec | null>(null);
  const groups = [...s.projects.filter(p => DOCUMENTS.some(d => d.projectId === p.id)).map(p => ({ id: p.id as string | null, title: p.name, sub: p.ref })),
    { id: null, title: "Company and estimating", sub: "Not filed against a live contract" }];
  return (
    <div className="lv-stack">
      <div className="lv-grid lv-g4">
        <Stat label="Documents" value={DOCUMENTS.length} hint={"Across " + (groups.length - 1) + " projects"} />
        <Stat label="Drawings" value={DOCUMENTS.filter(d => d.kind === "Drawing").length} />
        <Stat label="Certificates" value={DOCUMENTS.filter(d => d.kind === "Certificate").length} />
        <Stat label="Instructions & RFIs" value={DOCUMENTS.filter(d => d.kind === "Instruction" || d.kind === "RFI" || d.kind === "Variation").length} />
      </div>
      <div className="lv-grid lv-g2">
        {groups.map(g => {
          const docs = DOCUMENTS.filter(d => d.projectId === g.id);
          return (
            <Card key={g.id || "co"} title={g.title} sub={g.sub + " · " + docs.length + " document" + (docs.length === 1 ? "" : "s")} flush
              right={g.id ? <Btn size="sm" kind="ghost" onClick={() => openProject(g.id!, "documents")}>Project</Btn> : undefined}>
              <Rows>{docs.map(d => <Li key={d.id} onClick={() => setDoc(d)} title={d.title} sub={d.rev + " · " + dateShort(d.added) + " · " + d.by + " · " + d.size} right={<Badge tone="ghost">{d.kind}</Badge>} />)}</Rows>
            </Card>
          );
        })}
      </div>
      <Card title="Public portfolio reference (no figures)" sub="Completed projects listed publicly by Lavelle Electrical Group">
        <div className="lvp-chips">{PORTFOLIO.map(x => <span key={x} className="lvp-chip">{x}</span>)}</div>
        <div style={{ marginTop: 12 }}><Note>Shown as references only. No values, dates or financials are attached to these, and none of the demo projects above are drawn from them.</Note></div>
      </Card>
      <DocDrawer doc={doc} onClose={() => setDoc(null)} />
    </div>
  );
}

/* ── Reports ──────────────────────────────────────────────────────────── */
function ReportsTab({ s }: { s: LvState }) {
  const rows = pfs(s);
  const t = totals(s.projects, ctxOf(s));
  const ex = (name: string) => <Btn size="sm" onClick={() => exportReport(name)}>Export</Btn>;

  // WIP: earned value = revised × cost progress; over/under billing = certified − earned.
  const wip = rows.map(r => { const earned = r.f.revised * r.f.costProgress; return { ...r, earned, ob: r.f.certified - earned }; });
  const wEarned = wip.reduce((n, r) => n + r.earned, 0), wOb = wip.reduce((n, r) => n + r.ob, 0);

  const margin = [...rows].sort((a, b) => a.f.gap - b.f.gap);
  const cat = CATS.map(k => {
    const g = (key: "budgetByCat" | "actualByCat" | "openPOByCat" | "forecastByCat") => rows.reduce((n, r) => n + r.f[key][k], 0);
    return { k, budget: g("budgetByCat"), actual: g("actualByCat"), po: g("openPOByCat"), forecast: g("forecastByCat") };
  });
  const debt = s.invoices.filter(i => invoiceOutstanding(i) > 0).map(i => ({ i, out: invoiceOutstanding(i), od: daysBetween(i.due, TODAY) })).sort((a, b) => b.od - a.od);
  const debtTot = debt.reduce((n, d) => n + d.out, 0);
  const bucket = (lo: number, hi: number) => debt.filter(d => d.od > lo && d.od <= hi).reduce((n, d) => n + d.out, 0);

  return (
    <div className="lv-stack">
      <div className="lv-grid lv-g4">
        <Stat label="Work in progress" value={eurShort(wEarned)} hint="Earned value on cost progress" />
        <Stat label={wOb >= 0 ? "Over-billed" : "Under-billed"} value={eurShort(Math.abs(wOb))} tone={wOb >= 0 ? "ok" : "warn"} hint="Certified against earned value" />
        <Stat label="Forecast profit" value={eurShort(t.profit)} hint={pct(t.margin) + " portfolio margin"} />
        <Stat label="Debtors" value={eurShort(debtTot)} tone={bucket(0, 9999) > 0 ? "warn" : undefined} hint={eurShort(bucket(0, 9999)) + " past due"} />
      </div>
      <div className="lv-grid lv-g2">
        <Card title="WIP report" sub="Earned value = revised × cost progress. Positive means billed ahead of work." right={ex("WIP report")} flush>
          <Table dense rows={wip} foot onRow={r => openProject(r.p.id, "financials")} cols={[
            { key: "p", label: "Project", cls: "strong", render: r => r.p.ref, foot: "Total" },
            { key: "e", label: "Earned", align: "r", render: r => eur(r.earned), foot: eur(wEarned) },
            { key: "c", label: "Certified", align: "r", render: r => eur(r.f.certified), foot: eur(t.certified) },
            { key: "o", label: "Over / (under)", align: "r", render: r => <span className={r.ob < 0 ? "lv-warn" : ""}>{r.ob < 0 ? "(" + eur(-r.ob) + ")" : eur(r.ob)}</span>, foot: wOb < 0 ? "(" + eur(-wOb) + ")" : eur(wOb) }
          ]} />
        </Card>
        <Card title="Margin report" sub="Forecast against target, worst first" right={ex("Margin report")} flush>
          <Table dense rows={margin} onRow={r => openProject(r.p.id, "financials")} cols={[
            { key: "p", label: "Project", cls: "strong", render: r => r.p.ref },
            { key: "m", label: "Forecast", align: "r", render: r => <MarginText f={r.f} /> },
            { key: "t", label: "Target", align: "r", render: r => pct(r.f.target) },
            { key: "g", label: "Gap", align: "r", render: r => <span className={"lv-" + marginTone(r.f)}>{gapPts(r.f)}</span> },
            { key: "pf", label: "Profit vs target", align: "r", hideMobile: true, render: r => { const d = r.f.profit - r.f.revised * r.f.target; return <span className={d < 0 ? "lv-bad" : "lv-ok"}>{d < 0 ? "−" : "+"}{eur(Math.abs(d))}</span>; } }
          ]} />
        </Card>
        <Card title="Cost report by category" sub="All projects" right={ex("Cost report by category")} flush>
          <Table dense rows={cat} foot cols={[
            { key: "c", label: "Category", cls: "strong", render: r => CAT_LABEL[r.k], foot: "Total" },
            { key: "b", label: "Budget", align: "r", render: r => eur(r.budget), foot: eur(cat.reduce((n, r) => n + r.budget, 0)) },
            { key: "a", label: "Actual", align: "r", render: r => eur(r.actual), foot: eur(t.actual) },
            { key: "po", label: "Open POs", align: "r", hideMobile: true, render: r => eur(r.po), foot: eur(t.openPO) },
            { key: "f", label: "Forecast", align: "r", render: r => eur(r.forecast), foot: eur(t.forecast) },
            { key: "v", label: "Variance", align: "r", hideMobile: true, render: r => <span className={r.budget - r.forecast < 0 ? "lv-bad" : "lv-ok"}>{r.budget - r.forecast < 0 ? "−" : "+"}{eur(Math.abs(r.budget - r.forecast))}</span> }
          ]} />
          <div style={{ padding: "12px 18px 10px" }}>
            <Split parts={cat.map((r, i) => ({ v: r.forecast, color: "var(--lv-c" + (i + 1) + ")", label: CAT_LABEL[r.k] }))} />
            <div style={{ marginTop: 8 }}><Legend items={cat.map((r, i) => [CAT_LABEL[r.k], "var(--lv-c" + (i + 1) + ")"] as [string, string])} /></div>
          </div>
        </Card>
        <Card title="Debtors" sub={"Current " + eur(debtTot - bucket(0, 9999)) + " · 1 to 30 days " + eur(bucket(0, 30)) + " · over 30 days " + eur(bucket(30, 9999))} right={ex("Debtors report")} flush>
          <Table dense rows={debt} foot onRow={d => openProject(d.i.projectId, "claims")} cols={[
            { key: "r", label: "Invoice", cls: "m", render: d => d.i.ref, foot: "" },
            { key: "c", label: "Client", hideMobile: true, render: d => client(d.i.clientId).name, foot: "Total" },
            { key: "d", label: "Due", render: d => dateShort(d.i.due) },
            { key: "o", label: "Age", render: d => d.od > 0 ? <span className="lv-bad">{d.od}d overdue</span> : <span className="lv-faint">{-d.od}d to go</span> },
            { key: "v", label: "Outstanding", align: "r", render: d => eur(d.out), foot: eur(debtTot) }
          ]} empty={<><b>No debtors</b>Every invoice is paid.</>} />
        </Card>
      </div>
      <div className="lv-small lv-faint">{DEMO_NOTE} Reports run on the same records as each project workspace.</div>
    </div>
  );
}
