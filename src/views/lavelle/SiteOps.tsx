/* Site Operations: daily reports, progress, first & second fix, issues and
   inspections. The point is that Martin can see what happened on every site
   today without phoning a foreman. */

import { useState } from "react";
import "../../styles/lv-siteops.css";
import {
  Page, Head, Card, Stat, Badge, StatusBadge, DemoTag, Btn, Seg, Bar, Table, HBars, Note, Drawer, Rows, Li, KV, ProjectLink, Legend
} from "./ui";
import { useLv, approveReport, createMonthlyClaim, openProject, navigate, finOf, personName, project as projectOf, type LvState } from "../../lavelle/store";
import { ISSUES, INSPECTIONS, SECTION_PROGRESS, TYPE_LABEL } from "../../lavelle/seed";
import { date, dateShort, dateDay, pctInt, TODAY, daysBetween } from "../../lavelle/format";
import { shortName, headsToday, latestReports, missingToday, activeToday } from "../../lavelle/actions-siteops";
import type { Issue, Inspection, SiteReport, Unit } from "../../lavelle/types";

const RES_PROJECTS = ["p01", "p04", "p05"] as const;
type ResId = typeof RES_PROJECTS[number];
const COM_PROJECTS = Array.from(new Set(SECTION_PROGRESS.map(s => s.projectId)));
const STAGES: [keyof Pick<Unit, "firstFix" | "secondFix" | "testing" | "snagging">, string][] = [
  ["firstFix", "First fix"], ["secondFix", "Second fix"], ["testing", "Testing"], ["snagging", "Snagging"]
];
const STANDARDS: [string, string, string][] = [
  ["I.S. 10101", "National Rules for Electrical Installations", "Inspection, testing and certification before handover"],
  ["I.S. 3217", "Emergency lighting", "Duration tests and certification of emergency luminaires"],
  ["I.S. 3218", "Fire detection and alarm systems", "Commissioning and handover of fire alarm systems"]
];

const sevTone = (s: Issue["severity"]) => (s === "High" ? "bad" : s === "Medium" ? "warn" : "ghost");
const openIssues = () => ISSUES.filter(i => i.status !== "Closed");
const dueInspections = () => INSPECTIONS.filter(i => i.result === "Booked" && i.date >= TODAY && daysBetween(TODAY, i.date) <= 21);

export default function SiteOps({ tab }: { tab: string }) {
  const s = useLv();
  const [report, setReport] = useState<string | null>(null);
  const [issue, setIssue] = useState<Issue | null>(null);
  const r = s.reports.find(x => x.id === report) || null;

  const SUBS: Record<string, string> = {
    overview: "Every site at a glance: who is on, what got done yesterday, and what needs a decision.",
    reports: "Foremen's daily reports. Approve them here instead of chasing them on the phone.",
    progress: "Physical progress from site against what has been valued and certified.",
    fix: "Unit-by-unit status on the housing schemes, section status on commercial jobs.",
    issues: "Delays, RFIs, safety items and supply problems, with an owner on each.",
    inspections: "Testing, certification and safety inspections against the Irish standards."
  };
  const TITLES: Record<string, string> = {
    overview: "Site operations", reports: "Daily reports", progress: "Project progress", fix: "First & second fix",
    issues: "Issues & delays", inspections: "Site inspections"
  };

  return (
    <Page>
      <Head eyebrow={"Site Operations · " + dateDay(TODAY)} title={TITLES[tab] || "Site operations"} sub={SUBS[tab]} actions={<DemoTag />} />
      {tab === "overview" && <Overview s={s} openReport={setReport} openIssue={setIssue} />}
      {tab === "reports" && <Reports s={s} openReport={setReport} />}
      {tab === "progress" && <Progress s={s} />}
      {tab === "fix" && <Fix s={s} />}
      {tab === "issues" && <Issues openIssue={setIssue} />}
      {tab === "inspections" && <Inspections />}
      <ReportDrawer r={r} onClose={() => setReport(null)} />
      <IssueDrawer i={issue} onClose={() => setIssue(null)} />
    </Page>
  );
}

/* ── Overview ─────────────────────────────────────────────────────────── */
function Overview({ s, openReport, openIssue }: { s: LvState; openReport: (id: string) => void; openIssue: (i: Issue) => void }) {
  const heads = headsToday();
  const active = activeToday(s);
  const latest = latestReports(s);
  const missing = missingToday(s);
  const lastDay = s.reports.reduce((m, r) => (r.date > m ? r.date : m), "");
  const inLast = s.reports.filter(r => r.date === lastDay);
  const toApprove = s.reports.filter(r => r.status === "Submitted");
  const totalHeads = Object.values(heads).reduce((n, h) => n + h.total, 0);
  const open = openIssues();
  const due = dueInspections();
  const failed = INSPECTIONS.filter(i => i.result === "Fail");
  const rows = active.map(p => ({ p, r: latest[p.id] || null }));

  return (
    <>
      <div className="lv-grid lv-g6" style={{ marginBottom: 14 }}>
        <Stat label="Sites active today" value={active.length} hint={totalHeads + " people booked across them"} />
        <Stat label={"Reports in, " + dateShort(lastDay)} value={inLast.length + " of " + active.length} hint={(active.length - inLast.length) + " sites sent nothing"} tone={inLast.length < active.length ? "warn" : "ok"} onClick={() => navigate({ page: "Site Operations", tab: "reports" })} />
        <Stat label="Missing today" value={missing.length} hint="Booked today, no report yet" tone={missing.length ? "warn" : "ok"} onClick={() => navigate({ page: "Site Operations", tab: "reports" })} />
        <Stat label="Awaiting approval" value={toApprove.length} hint={toApprove.map(x => x.ref).join(", ") || "None"} tone={toApprove.length ? "accent" : ""} onClick={() => navigate({ page: "Site Operations", tab: "reports" })} />
        <Stat label="Open issues" value={open.length} hint={open.filter(i => i.severity === "High").length + " high severity"} tone="bad" onClick={() => navigate({ page: "Site Operations", tab: "issues" })} />
        <Stat label="Inspections due" value={due.length} hint={"Next 3 weeks · " + failed.length + " failed"} onClick={() => navigate({ page: "Site Operations", tab: "inspections" })} />
      </div>

      <div className="lv-grid lv-g-2-1" style={{ marginBottom: 14 }}>
        <Card title="Latest report per site" sub="Click a row for the full report" flush>
          <Table
            rows={rows}
            onRow={x => x.r ? openReport(x.r.id) : openProject(x.p.id)}
            cols={[
              { key: "p", label: "Site", render: x => <ProjectLink id={x.p.id} /> },
              { key: "f", label: "Foreman", hideMobile: true, render: x => personName(x.p.foremanId) },
              { key: "h", label: "On site", align: "r", render: x => heads[x.p.id]?.total || 0 },
              { key: "d", label: "Last report", render: x => x.r ? <span className="lv-mono">{dateShort(x.r.date)}</span> : <span className="lv-warn">None on file</span> },
              { key: "pg", label: "Progress", hideMobile: true, render: x => x.r ? <div className="lvx-progress" style={{ minWidth: 120 }}><Bar value={x.r.progress} thin /><span>{pctInt(x.r.progress)}</span></div> : <span className="lv-faint">No data</span> },
              { key: "dl", label: "Delays", cls: "wrap", hideMobile: true, render: x => x.r ? (x.r.delays === "None." ? <span className="lv-faint">None</span> : x.r.delays) : <span className="lv-faint">Ask {personName(x.p.foremanId).split(" ")[0]}</span> },
              { key: "st", label: "Status", render: x => x.r ? <StatusBadge s={x.r.status} /> : <Badge tone="warn">No report</Badge> }
            ]}
          />
        </Card>
        <Card title="Needs a decision" sub="Pulled from reports, issues and inspections">
          <Rows>
            {toApprove.map(x => (
              <Li key={x.id} onClick={() => openReport(x.id)} title={x.ref + " waiting for approval"} sub={shortName(projectOf(x.projectId)) + ": " + x.done.split(".")[0] + "."} right={<Badge tone="accent">Approve</Badge>} />
            ))}
            {missing.length > 0 && (
              <Li onClick={() => navigate({ page: "Site Operations", tab: "reports" })} title={missing.length + " sites with nobody's report today"} sub={missing.map(p => shortName(p)).join(", ")} right={<Badge tone="warn">Missing</Badge>} />
            )}
            {open.filter(i => i.severity === "High").map(i => (
              <Li key={i.id} onClick={() => openIssue(i)} title={i.title} sub={shortName(projectOf(i.projectId)) + ": " + i.impact} right={<Badge tone="bad">{i.kind}</Badge>} />
            ))}
            {failed.map(i => (
              <Li key={i.id} onClick={() => navigate({ page: "Site Operations", tab: "inspections" })} title={i.kind + " failed"} sub={shortName(projectOf(i.projectId)) + ": " + i.actions + " actions to close out"} right={<Badge tone="bad">Fail</Badge>} />
            ))}
          </Rows>
        </Card>
      </div>

      <div className="lv-grid lv-g2">
        <Card title="Progress highlights" sub="Physical progress from each site's latest report">
          <HBars items={Object.values(latest).sort((a, b) => b.progress - a.progress).map(x => {
            const p = projectOf(x.projectId)!;
            return { label: shortName(p), value: x.progress, max: 1, right: pctInt(x.progress), onClick: () => openReport(x.id) };
          })} />
          <div className="lv-small lv-muted" style={{ marginTop: 12 }}>
            {(() => {
              const top = Object.values(latest).sort((a, b) => b.progress - a.progress)[0];
              return top ? shortName(projectOf(top.projectId)) + " is furthest on at " + pctInt(top.progress) + ". " : "";
            })()}
            Next activities: {Object.values(latest).slice(0, 3).map(x => shortName(projectOf(x.projectId)) + " (" + x.next.replace(/\.$/, "").toLowerCase() + ")").join("; ")}.
          </div>
        </Card>
        <Card title="Housing schemes by stage" sub="Homes complete at each stage" right={<Btn size="sm" kind="ghost" onClick={() => navigate({ page: "Site Operations", tab: "fix" })}>Unit grid</Btn>} flush>
          <Table
            rows={RES_PROJECTS.map(id => ({ id, units: s.units.filter(u => u.projectId === id) }))}
            onRow={x => navigate({ page: "Site Operations", tab: "fix" })}
            cols={[
              { key: "p", label: "Scheme", render: x => <ProjectLink id={x.id} /> },
              { key: "n", label: "Homes", align: "r", render: x => x.units.length },
              ...STAGES.map(([k, l]) => ({ key: k, label: l, align: "r" as const, render: (x: { units: Unit[] }) => {
                const c = x.units.filter(u => u[k] === 1).length;
                return <span className={c === x.units.length ? "lv-ok" : ""}>{c}</span>;
              } }))
            ]}
          />
        </Card>
      </div>
    </>
  );
}

/* ── Daily reports ────────────────────────────────────────────────────── */
function Photos({ n, max = 8 }: { n: number; max?: number }) {
  const show = Math.min(n, max);
  return (
    <div className="lvx-photos">
      {Array.from({ length: show }, (_, i) => (
        i === show - 1 && n > max
          ? <div key={i} className="lvx-photo more">+{n - max + 1}</div>
          : <div key={i} className="lvx-photo">IMG {String(i + 1).padStart(2, "0")}</div>
      ))}
    </div>
  );
}

function ReportBody({ r }: { r: SiteReport }) {
  return (
    <dl>
      <dt>Work done</dt><dd>{r.done}</dd>
      <dt>Progress</dt><dd><div className="lvx-progress"><Bar value={r.progress} /><span className="lv-ink">{pctInt(r.progress)}</span></div></dd>
      <dt>Delays</dt><dd className={r.delays === "None." ? "lv-faint" : ""}>{r.delays}</dd>
      <dt>Materials</dt><dd>{r.materials}</dd>
      <dt>Next</dt><dd>{r.next}</dd>
    </dl>
  );
}

function ApprovedNote() {
  return (
    <Note tone="accent">
      <div>Proposed valuation update created. Review it before it becomes a claim.</div>
      <div style={{ marginTop: 8 }}><Btn size="sm" kind="primary" onClick={() => createMonthlyClaim("p01")}>Review valuation</Btn></div>
    </Note>
  );
}

function ReportCard({ r, onOpen }: { r: SiteReport; onOpen: () => void }) {
  const p = projectOf(r.projectId)!;
  const flagship = r.id === "sr1043";
  return (
    <Card
      tone={r.status === "Submitted" ? "accent" : undefined}
      onClick={onOpen}
      title={<span>{shortName(p)} <span className="lv-mono lv-faint" style={{ fontWeight: 400 }}>{r.ref}</span></span>}
      sub={personName(r.foremanId) + " · " + dateDay(r.date) + " · " + r.workers + " on site"}
      right={<StatusBadge s={r.status} />}
    >
      <div className="lvx-report">
        <ReportBody r={r} />
        <Photos n={r.photos} />
        <div className="lv-row">
          <span className="lv-small lv-muted">{r.photos} photos attached</span>
          <span className="lv-spacer" />
          {r.status !== "Approved" && <Btn size="sm" kind={r.status === "Submitted" ? "primary" : ""} onClick={() => approveReport(r.id)}>Approve report</Btn>}
        </div>
        {flagship && r.status === "Approved" && <ApprovedNote />}
      </div>
    </Card>
  );
}

function Reports({ s, openReport }: { s: LvState; openReport: (id: string) => void }) {
  const heads = headsToday();
  const latest = latestReports(s);
  const missing = missingToday(s);
  const sorted = [...s.reports].sort((a, b) => (a.status === "Submitted" ? -1 : 0) - (b.status === "Submitted" ? -1 : 0) || b.date.localeCompare(a.date));
  const lastDay = s.reports.reduce((m, r) => (r.date > m ? r.date : m), "");
  const workers = s.reports.filter(r => r.date === lastDay).reduce((n, r) => n + r.workers, 0);
  const photos = s.reports.filter(r => r.date === lastDay).reduce((n, r) => n + r.photos, 0);
  const sub = s.reports.filter(r => r.status === "Submitted");

  return (
    <>
      <div className="lv-grid lv-g4" style={{ marginBottom: 14 }}>
        <Stat label="Awaiting approval" value={sub.length} hint={sub.map(x => x.ref).join(", ") || "All reviewed"} tone={sub.length ? "accent" : "ok"} />
        <Stat label={"Reports, " + dateShort(lastDay)} value={s.reports.filter(r => r.date === lastDay).length} hint={workers + " workers reported on site"} />
        <Stat label="Missing today" value={missing.length} hint="Booked today, nothing in yet" tone={missing.length ? "warn" : "ok"} />
        <Stat label="Photos uploaded" value={photos} hint={"From " + dateShort(lastDay) + " reports"} />
      </div>

      <div className="lv-grid lv-g-2-1">
        <div className="lv-grid lv-g2" style={{ alignContent: "start" }}>
          {sorted.map(r => <ReportCard key={r.id} r={r} onOpen={() => openReport(r.id)} />)}
        </div>
        <div className="lv-stack">
          <Card title="No report today" sub={"Sites with people booked on " + dateShort(TODAY) + " and no report yet"} flush>
            <Table
              dense
              rows={missing}
              onRow={p => openProject(p.id)}
              empty={<><b>Every booked site has reported</b>Nothing to chase.</>}
              cols={[
                { key: "p", label: "Site", render: p => <ProjectLink id={p.id} /> },
                { key: "f", label: "Foreman", render: p => personName(p.foremanId).split(" ")[0] },
                { key: "h", label: "Heads", align: "r", render: p => heads[p.id]?.total || 0 },
                { key: "l", label: "Last", align: "r", render: p => latest[p.id] ? <span className="lv-mono">{dateShort(latest[p.id].date)}</span> : <span className="lv-bad">Never</span> }
              ]}
            />
          </Card>
          <Note>Reports usually land between 16:00 and 17:30. {(() => {
            const never = missing.filter(p => !latest[p.id]);
            return never.length ? "Sites with no report on file at all (" + never.map(p => shortName(p)).join(", ") + ") are flagged so the PM can set the foreman up on the report form." : "Every booked site has at least one report on file.";
          })()}</Note>
          <Card title="Workers reported vs booked" sub={"Report headcount on " + dateShort(lastDay) + " against today's bookings"}>
            <HBars items={Object.values(latest).map(r => {
              const booked = heads[r.projectId]?.total || 0;
              return { label: shortName(projectOf(r.projectId)), value: r.workers, max: Math.max(12, booked), target: booked, right: r.workers + " / " + booked, tone: Math.abs(r.workers - booked) > 2 ? "warn" as const : undefined };
            })} />
            <div className="lv-small lv-faint" style={{ marginTop: 10 }}>Marker shows people booked today. A big gap usually means a subcontract crew wasn't counted.</div>
          </Card>
        </div>
      </div>
    </>
  );
}

function ReportDrawer({ r, onClose }: { r: SiteReport | null; onClose: () => void }) {
  if (!r) return null;
  const p = projectOf(r.projectId)!;
  return (
    <Drawer
      open
      onClose={onClose}
      eyebrow={r.ref + " · " + p.ref}
      title={p.name}
      footer={<>
        <Btn kind="ghost" onClick={() => { onClose(); openProject(p.id); }}>Open project</Btn>
        {r.status !== "Approved" && <Btn kind="primary" onClick={() => approveReport(r.id)}>Approve report</Btn>}
      </>}
    >
      <div className="lv-stack">
        <KV items={[["Foreman", personName(r.foremanId)], ["Date", date(r.date)], ["Workers", r.workers], ["Status", <StatusBadge key="s" s={r.status} />]]} />
        <div className="lvx-report"><ReportBody r={r} /></div>
        {r.unitsSecondFix && <Note tone={r.status === "Approved" ? "ok" : "warn"}>Second fix reported complete on units {r.unitsSecondFix[0]}–{r.unitsSecondFix[r.unitsSecondFix.length - 1]}. {r.status === "Approved" ? "Unit records updated." : "Units update when the report is approved."}</Note>}
        <div>
          <div className="lv-small lv-faint" style={{ marginBottom: 6 }}>{r.photos} photos</div>
          <Photos n={r.photos} max={16} />
        </div>
        {r.id === "sr1043" && r.status === "Approved" && <ApprovedNote />}
      </div>
    </Drawer>
  );
}

/* ── Progress ─────────────────────────────────────────────────────────── */
function Progress({ s }: { s: LvState }) {
  const latest = latestReports(s);
  const rows = s.projects.map(p => {
    const f = finOf(p, s);
    const r = latest[p.id] || null;
    return { p, f, r, phys: r ? r.progress : null as number | null, val: f.progress };
  }).sort((a, b) => (b.phys ?? -1) - (a.phys ?? -1));
  const withR = rows.filter(x => x.phys !== null);
  const lag = withR.filter(x => (x.phys as number) - x.val > 0.05);
  const ahead = withR.filter(x => x.val - (x.phys as number) > 0.05);
  const avg = (ns: number[]) => ns.length ? ns.reduce((n, v) => n + v, 0) / ns.length : 0;

  return (
    <>
      <div className="lv-grid lv-g4" style={{ marginBottom: 14 }}>
        <Stat label="Avg physical progress" value={pctInt(avg(withR.map(x => x.phys as number)))} hint={withR.length + " sites reporting"} />
        <Stat label="Avg valued progress" value={pctInt(avg(withR.map(x => x.val)))} hint="Certified ÷ revised contract" />
        <Stat label="Valuation behind site" value={lag.length} hint={lag.map(x => shortName(x.p)).join(", ") || "None"} tone={lag.length ? "warn" : "ok"} />
        <Stat label="Valued ahead of site" value={ahead.length} hint={ahead.map(x => shortName(x.p)).join(", ") || "None"} tone={ahead.length ? "bad" : "ok"} />
      </div>

      <div className="lv-grid lv-g-3-2" style={{ marginBottom: 14 }}>
        <Card title="Physical vs valued progress" sub="Site progress from the latest report against certified value" right={<Legend items={[["Physical", "var(--lv-c1)"], ["Valued", "var(--lv-c3)"]]} />}>
          <div className="lvx-dual">
            {withR.map(x => (
              <div className="row" key={x.p.id}>
                <span className="lv-link" style={{ justifySelf: "start", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }} onClick={() => openProject(x.p.id)}>{shortName(x.p)}</span>
                <div className="bars"><Bar value={x.phys as number} thin /><div className="bar2"><Bar value={x.val} thin /></div></div>
                <span className="nums"><b>{pctInt(x.phys as number)}</b> site · <b>{pctInt(x.val)}</b> valued</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="What the gap means" sub="Reading the two numbers together">
          <div className="lv-stack" style={{ gap: 10 }}>
            {lag.map(x => (
              <Note key={x.p.id} tone="warn">{shortName(x.p)}: site is at {pctInt(x.phys as number)} but only {pctInt(x.val)} is certified. Make sure the next valuation ({dateShort(x.p.nextValuation)}) captures the work.</Note>
            ))}
            {ahead.map(x => (
              <Note key={x.p.id} tone="bad">{shortName(x.p)}: {pctInt(x.val)} certified against {pctInt(x.phys as number)} on site. Check for front-loaded valuations before the client QS does.</Note>
            ))}
            {!lag.length && !ahead.length && <Note tone="ok">Every reporting site is valued in line with physical progress.</Note>}
            <div className="lv-small lv-muted">Physical progress is the foreman's estimate. Valued progress is certified to date over the revised contract value. Within 5 points is treated as in line.</div>
          </div>
        </Card>
      </div>

      <Card title="All projects" flush>
        <Table
          rows={rows}
          onRow={x => openProject(x.p.id)}
          cols={[
            { key: "p", label: "Project", render: x => <ProjectLink id={x.p.id} /> },
            { key: "t", label: "Type", hideMobile: true, render: x => TYPE_LABEL[x.p.type] },
            { key: "st", label: "Stage", hideMobile: true, render: x => x.p.stage },
            { key: "ph", label: "Physical", align: "r", render: x => x.phys === null ? <span className="lv-faint">No report</span> : pctInt(x.phys) },
            { key: "va", label: "Valued", align: "r", render: x => pctInt(x.val) },
            { key: "g", label: "Gap", align: "r", render: x => x.phys === null ? <span className="lv-faint">n/a</span> : <span className={x.phys - x.val > 0.05 ? "lv-warn" : x.val - x.phys > 0.05 ? "lv-bad" : "lv-ok"}>{(x.phys - x.val >= 0 ? "+" : "") + Math.round((x.phys - x.val) * 100)} pts</span> },
            { key: "nv", label: "Next valuation", align: "r", hideMobile: true, render: x => <span className="lv-mono">{dateShort(x.p.nextValuation)}</span> },
            { key: "fn", label: "Finish", align: "r", hideMobile: true, render: x => <span className="lv-mono">{dateShort(x.p.finish)}</span> }
          ]}
        />
      </Card>

      <div className="lv-grid lv-g3" style={{ marginTop: 14 }}>
        {COM_PROJECTS.map(id => <SectionCard key={id} id={id} />)}
      </div>
    </>
  );
}

function SectionCard({ id }: { id: string }) {
  const p = projectOf(id)!;
  const secs = SECTION_PROGRESS.filter(x => x.projectId === id);
  const moved = secs.reduce((n, x) => n + (x.pct - x.prev), 0) / (secs.length || 1);
  return (
    <Card title={<ProjectLink id={id} />} sub={p.stage + " · avg +" + Math.round(moved * 100) + " pts this month"}>
      <HBars items={secs.map(x => ({ label: x.section, value: x.pct, max: 1, target: x.prev, right: pctInt(x.pct) + (x.pct > x.prev ? " (+" + Math.round((x.pct - x.prev) * 100) + ")" : " (0)") }))} />
      <div className="lv-small lv-faint" style={{ marginTop: 8 }}>Marker shows last month's position.</div>
    </Card>
  );
}

/* ── First & second fix ───────────────────────────────────────────────── */
function Pips({ u }: { u: Unit }) {
  return <div className="pips">{STAGES.map(([k]) => <i key={k} className={u[k] === 1 ? "f" : u[k] > 0 ? "h" : ""} />)}</div>;
}

function Fix({ s }: { s: LvState }) {
  const [mode, setMode] = useState<"res" | "com">("res");
  const [res, setRes] = useState<ResId>("p01");
  const [com, setCom] = useState<string>(COM_PROJECTS[0]);

  return (
    <>
      <div className="lv-row" style={{ marginBottom: 14 }}>
        <Seg options={[["res", "Residential (units)"], ["com", "Commercial & industrial (sections)"]]} value={mode} onChange={setMode} />
        <span className="lv-spacer" />
        {mode === "res"
          ? <Seg options={RES_PROJECTS.map(id => [id, shortName(projectOf(id))] as [ResId, string])} value={res} onChange={setRes} />
          : <Seg options={COM_PROJECTS.map(id => [id, shortName(projectOf(id))] as [string, string])} value={com} onChange={setCom} />}
      </div>
      {mode === "res" ? <Residential s={s} id={res} /> : <Commercial id={com} />}
    </>
  );
}

function Residential({ s, id }: { s: LvState; id: ResId }) {
  const p = projectOf(id)!;
  const units = s.units.filter(u => u.projectId === id);
  const blocks = Array.from(new Set(units.map(u => u.block)));
  const sr = s.reports.find(r => r.id === "sr1043")!;
  const fresh = id === "p01" && sr.status === "Approved" ? new Set(sr.unitsSecondFix || []) : new Set<number>();
  const count = (k: typeof STAGES[number][0]) => units.filter(u => u[k] === 1).length;
  const partial = (k: typeof STAGES[number][0]) => units.filter(u => u[k] > 0 && u[k] < 1).length;

  return (
    <>
      <div className="lv-grid lv-g4" style={{ marginBottom: 14 }}>
        {STAGES.map(([k, l]) => (
          <Stat key={k} label={l + " complete"} value={count(k) + " / " + units.length} hint={partial(k) ? partial(k) + " in progress" : count(k) === units.length ? "All homes done" : "Not started on the rest"} tone={count(k) === units.length ? "ok" : ""} />
        ))}
      </div>
      {id === "p01" && sr.status !== "Approved" && (
        <div style={{ marginBottom: 14 }}>
          <Note tone="warn">
            <div>{sr.ref} from {personName(sr.foremanId)} reports second fix complete on units 13–18. The grid updates once the report is approved.</div>
            <div style={{ marginTop: 8 }}><Btn size="sm" kind="primary" onClick={() => approveReport(sr.id)}>Approve report</Btn></div>
          </Note>
        </div>
      )}
      {id === "p01" && sr.status === "Approved" && <div style={{ marginBottom: 14 }}><ApprovedNote /></div>}
      <div className="lv-grid lv-g-2-1">
        <Card title={p.name} sub={units.length + " homes · " + p.stage} right={<div className="lvx-pipkey"><span><i className="f" />Done</span><span><i className="h" />In progress</span><span><i />Not started</span></div>}>
          {blocks.map(b => (
            <div className="lvx-block" key={b}>
              <h4>{b}</h4>
              <div className="lv-unitgrid">
                {units.filter(u => u.block === b).map(u => (
                  <div key={u.no} className={"lv-unit" + (fresh.has(u.no) ? " new" : "")} title={STAGES.map(([k, l]) => l + " " + Math.round(u[k] * 100) + "%").join(", ")}>
                    <div className="no"><span>{id === "p05" ? "No." : "U"}{u.no}</span>{fresh.has(u.no) && <span className="lv-acc">new</span>}</div>
                    <Pips u={u} />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="lv-small lv-faint">Pips left to right: first fix, second fix, testing, snagging.</div>
        </Card>
        <div className="lv-stack">
          <Card title="Homes by stage">
            <HBars items={STAGES.map(([k, l]) => ({ label: l, value: count(k), max: units.length, right: count(k) + " of " + units.length, tone: count(k) === units.length ? "ok" as const : undefined }))} />
          </Card>
          <Card title="By block" flush>
            <Table dense rows={blocks} cols={[
              { key: "b", label: "Block", render: b => b },
              ...STAGES.map(([k, l]) => ({ key: k, label: l.replace(" fix", ""), align: "r" as const, render: (b: string) => {
                const us = units.filter(u => u.block === b);
                return us.filter(u => u[k] === 1).length + "/" + us.length;
              } }))
            ]} />
          </Card>
          <Card title="Open project" sub={p.summary} onClick={() => openProject(p.id)} />
        </div>
      </div>
    </>
  );
}

function Commercial({ id }: { id: string }) {
  const s = useLv();
  const p = projectOf(id)!;
  const f = finOf(p, s);
  const secs = SECTION_PROGRESS.filter(x => x.projectId === id);
  const avg = secs.reduce((n, x) => n + x.pct, 0) / (secs.length || 1);
  const prev = secs.reduce((n, x) => n + x.prev, 0) / (secs.length || 1);
  const r = latestReports(s)[id];
  return (
    <>
      <div className="lv-grid lv-g4" style={{ marginBottom: 14 }}>
        <Stat label="Average section progress" value={pctInt(avg)} hint={"Up from " + pctInt(prev) + " last month"} />
        <Stat label="Valued progress" value={pctInt(f.progress)} hint="Certified ÷ revised contract" />
        <Stat label="Sections complete" value={secs.filter(x => x.pct >= 1).length + " / " + secs.length} hint={secs.filter(x => x.pct === 0).length + " not started"} />
        <Stat label="Latest report" value={r ? r.ref : "None"} hint={r ? personName(r.foremanId) + ", " + dateShort(r.date) : "No report on file"} tone={r ? "" : "warn"} />
      </div>
      <div className="lv-grid lv-g-2-1">
        <Card title={p.name} sub={TYPE_LABEL[p.type] + " · " + p.stage}>
          <div className="lv-stack" style={{ gap: 14 }}>
            {secs.map(x => (
              <div key={x.section}>
                <div className="lv-row" style={{ marginBottom: 6, fontSize: 12.5 }}>
                  <span className="lv-ink">{x.section}</span>
                  <span className="lv-spacer" />
                  <span className="lv-muted lv-small">{pctInt(x.prev)} last month</span>
                  <b style={{ fontVariantNumeric: "tabular-nums" }}>{pctInt(x.pct)}</b>
                </div>
                <Bar value={x.pct} target={x.prev} tone={x.pct === 0 ? "neutral" : undefined} />
              </div>
            ))}
          </div>
        </Card>
        <div className="lv-stack">
          <Card title="Movement this month">
            <HBars items={secs.map(x => ({ label: x.section, value: x.pct - x.prev, max: 0.3, right: "+" + Math.round((x.pct - x.prev) * 100) + " pts", tone: x.pct - x.prev === 0 ? "neutral" as const : undefined }))} />
          </Card>
          {r && <Card title={"From " + r.ref} sub={personName(r.foremanId) + " · " + dateDay(r.date)}><div className="lv-small lv-muted" style={{ lineHeight: 1.5 }}>{r.done} {r.delays !== "None." && <span className="lv-warn">{r.delays}</span>}</div></Card>}
          <Btn kind="ghost" onClick={() => openProject(p.id)}>Open {shortName(p)}</Btn>
        </div>
      </div>
    </>
  );
}

/* ── Issues ───────────────────────────────────────────────────────────── */
function Issues({ openIssue }: { openIssue: (i: Issue) => void }) {
  const open = openIssues();
  const kinds = Array.from(new Set(ISSUES.map(i => i.kind)));
  const byProject = Array.from(new Set(open.map(i => i.projectId))).map(id => ({ id, n: open.filter(i => i.projectId === id).length })).sort((a, b) => b.n - a.n);
  const sorted = [...ISSUES].sort((a, b) => ["High", "Medium", "Low"].indexOf(a.severity) - ["High", "Medium", "Low"].indexOf(b.severity) || b.raised.localeCompare(a.raised));
  return (
    <>
      <div className="lv-grid lv-g4" style={{ marginBottom: 14 }}>
        <Stat label="Open" value={open.filter(i => i.status === "Open").length} hint={open.filter(i => i.status === "Mitigated").length + " mitigated, still tracked"} tone="warn" />
        <Stat label="High severity" value={open.filter(i => i.severity === "High").length} hint="Needs action this week" tone="bad" />
        <Stat label="Delays" value={open.filter(i => i.kind === "Delay").length} hint="Supply or third party" />
        <Stat label="Safety" value={open.filter(i => i.kind === "Safety").length} hint={open.filter(i => i.kind === "Safety").map(i => shortName(projectOf(i.projectId))).join(", ") || "None"} tone="bad" />
      </div>
      <Card title="Issue log" sub="Click a row for detail" flush>
        <Table
          rows={sorted}
          onRow={openIssue}
          cols={[
            { key: "sv", label: "Severity", render: i => <Badge tone={sevTone(i.severity)} dot>{i.severity}</Badge> },
            { key: "k", label: "Kind", render: i => i.kind },
            { key: "t", label: "Issue", cls: "wrap strong", render: i => i.title },
            { key: "p", label: "Project", render: i => <ProjectLink id={i.projectId} /> },
            { key: "o", label: "Owner", hideMobile: true, render: i => personName(i.ownerId) },
            { key: "im", label: "Impact", cls: "wrap", hideMobile: true, render: i => i.impact },
            { key: "r", label: "Raised", align: "r", hideMobile: true, render: i => <span className="lv-mono">{dateShort(i.raised)}</span> },
            { key: "a", label: "Age", align: "r", hideMobile: true, render: i => daysBetween(i.raised, TODAY) + "d" },
            { key: "s", label: "Status", render: i => <StatusBadge s={i.status} /> }
          ]}
        />
      </Card>
      <div className="lv-grid lv-g2" style={{ marginTop: 14 }}>
        <Card title="Open by project">
          <HBars items={byProject.map(x => ({ label: shortName(projectOf(x.id)), value: x.n, max: Math.max(...byProject.map(b => b.n)), right: x.n, onClick: () => openProject(x.id) }))} />
        </Card>
        <Card title="By kind">
          <HBars items={kinds.map(k => {
            const n = ISSUES.filter(i => i.kind === k && i.status !== "Closed").length;
            return { label: k, value: n, max: ISSUES.length, right: n + " open", tone: k === "Safety" ? "bad" as const : undefined };
          })} />
        </Card>
      </div>
    </>
  );
}

const ISSUE_LINK: Record<string, { label: string; page: string; tab: string }> = {
  is1: { label: "Open deliveries", page: "Procurement", tab: "deliveries" },
  is2: { label: "Open variations", page: "Projects", tab: "variations" },
  is4: { label: "Open purchase orders", page: "Procurement", tab: "orders" },
  is5: { label: "Open valuations", page: "Claims & Finance", tab: "valuations" },
  is7: { label: "Open deliveries", page: "Procurement", tab: "deliveries" }
};

function IssueDrawer({ i, onClose }: { i: Issue | null; onClose: () => void }) {
  if (!i) return null;
  const p = projectOf(i.projectId)!;
  const link = ISSUE_LINK[i.id];
  return (
    <Drawer open onClose={onClose} eyebrow={i.kind + " · " + p.ref} title={i.title}
      footer={<>
        <Btn kind="ghost" onClick={() => { onClose(); openProject(p.id); }}>Open project</Btn>
        {link && <Btn kind="primary" onClick={() => { onClose(); navigate({ page: link.page, tab: link.tab }); }}>{link.label}</Btn>}
      </>}>
      <div className="lv-stack">
        <KV items={[["Severity", <Badge key="s" tone={sevTone(i.severity)} dot>{i.severity}</Badge>], ["Status", <StatusBadge key="t" s={i.status} />], ["Owner", personName(i.ownerId)], ["Raised", date(i.raised)], ["Age", daysBetween(i.raised, TODAY) + " days"], ["Project", shortName(p)]]} />
        <Note tone={i.severity === "High" ? "bad" : "warn"}>{i.impact}</Note>
        <div className="lv-small lv-muted">Foreman: {personName(p.foremanId)}. PM: {personName(p.pmId)}. {p.summary}</div>
      </div>
    </Drawer>
  );
}

/* ── Inspections ──────────────────────────────────────────────────────── */
function Inspections() {
  const sorted = [...INSPECTIONS].sort((a, b) => (a.result === "Booked" ? 0 : 1) - (b.result === "Booked" ? 0 : 1) || (a.result === "Booked" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));
  const booked = INSPECTIONS.filter(i => i.result === "Booked");
  const done = INSPECTIONS.filter(i => i.result !== "Booked");
  const actions = done.reduce((n, i) => n + i.actions, 0);
  const resTone = (r: Inspection["result"]) => (r === "Pass" ? "ok" : r === "Fail" ? "bad" : r === "Booked" ? "info" : "warn");
  return (
    <>
      <div className="lv-grid lv-g4" style={{ marginBottom: 14 }}>
        <Stat label="Booked" value={booked.length} hint={booked.map(i => shortName(projectOf(i.projectId)) + " " + dateShort(i.date)).join(", ")} />
        <Stat label="Passed" value={done.filter(i => i.result === "Pass").length + " / " + done.length} hint="Clean passes in the last month" tone="ok" />
        <Stat label="Open actions" value={actions} hint={done.filter(i => i.actions > 0).length + " inspections with actions"} tone={actions ? "warn" : "ok"} />
        <Stat label="Failed" value={done.filter(i => i.result === "Fail").length} hint={done.filter(i => i.result === "Fail").map(i => shortName(projectOf(i.projectId))).join(", ") || "None"} tone="bad" />
      </div>
      <div className="lv-grid lv-g3" style={{ marginBottom: 14 }}>
        {STANDARDS.map(([code, name, what]) => {
          const list = INSPECTIONS.filter(i => i.standard === code);
          const next = list.filter(i => i.result === "Booked").sort((a, b) => a.date.localeCompare(b.date))[0];
          const last = list.filter(i => i.result !== "Booked").sort((a, b) => b.date.localeCompare(a.date))[0];
          return (
            <Card key={code} title={<span><span className="lv-mono lv-acc">{code}</span> {name}</span>} sub={what}>
              <KV items={[
                ["Inspections", list.length],
                ["Next booked", next ? shortName(projectOf(next.projectId)) + ", " + dateShort(next.date) : "None booked"],
                ["Last result", last ? last.result + " (" + shortName(projectOf(last.projectId)) + ")" : "None yet"]
              ]} />
            </Card>
          );
        })}
      </div>
      <Card title="Inspection register" sub="Upcoming first, then most recent" flush>
        <Table
          rows={sorted}
          onRow={i => openProject(i.projectId)}
          rowClass={i => i.result === "Fail" ? "hl" : ""}
          cols={[
            { key: "d", label: "Date", render: i => <span className="lv-mono">{dateDay(i.date)}</span> },
            { key: "p", label: "Project", render: i => <ProjectLink id={i.projectId} /> },
            { key: "k", label: "Inspection", cls: "wrap strong", render: i => i.kind },
            { key: "s", label: "Standard", render: i => <span className="lv-mono">{i.standard}</span> },
            { key: "by", label: "Inspector", hideMobile: true, render: i => personName(i.inspectorId) },
            { key: "r", label: "Result", render: i => <Badge tone={resTone(i.result)} dot>{i.result}</Badge> },
            { key: "a", label: "Actions", align: "r", render: i => i.result === "Booked" ? <span className="lv-faint">{daysBetween(TODAY, i.date)}d to go</span> : i.actions ? <span className="lv-warn">{i.actions} open</span> : <span className="lv-faint">None</span> }
          ]}
        />
      </Card>
      <div style={{ marginTop: 14 }}>
        <Note tone={done.some(i => i.result === "Fail") ? "warn" : undefined}>{done.filter(i => i.result === "Fail").map(i => shortName(projectOf(i.projectId)) + ": " + i.kind.toLowerCase() + " failed on " + dateShort(i.date) + " with " + i.actions + " actions. Close them out before the next live work on that site. ").join("") || "No failed inspections in the period. "}Test certificates are filed against each project under Documents.</Note>
      </div>
    </>
  );
}
