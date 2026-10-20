/* Workforce: who works for Lavelle, where they are today, and how yesterday's
   hours get from the WhatsApp group and the Sync clock-in onto project labour
   cost. Labour money only moves through approveTimesheet / approveAllMatched. */

import { useState, type ReactNode } from "react";
import {
  Page, Head, Card, Stat, Badge, StatusBadge, DemoTag, Btn, Seg, Select, Bar, Table, HBars, Cols, Legend, Split, KV, Note,
  Avatar, ProjectLink, Drawer, Steps, Rows, Li, type Col
} from "./ui";
import {
  useLv, finOf, person, sub, personName, project, navigate, setTab, setProposal, labourCost, approveAllMatched, type LvState
} from "../../lavelle/store";
import { kpis, labourIssues } from "../../lavelle/answers";
import { postException, takeSide } from "../../lavelle/actions-workforce";
import { EMPLOYEES, SUBCONTRACTORS, ALLOCATIONS, TIMESHEETS, VEHICLES } from "../../lavelle/seed";
import { eur, eurShort, pct, date, dateShort, daysBetween, num, TODAY } from "../../lavelle/format";
import type { Allocation, Employee, Subcontractor, Timesheet, Project } from "../../lavelle/types";
import "../../styles/lv-workforce.css";

/* ── shared derivations ──────────────────────────────────────────────── */
const isSubId = (id: string) => id.startsWith("s");
const allocOf = (id: string) => ALLOCATIONS.find(a => a.personId === id) || null;
const span = (a: { start: string; end: string }) => a.start + "–" + a.end;
const DAY_HOURS = 8;
/** Estimated cost of one allocation today: staff at their internal hourly cost for 8 hours, subcontractors at day rate. */
const allocCost = (a: Allocation) => isSubId(a.personId) ? (sub(a.personId)?.dayRate || 0) : (person(a.personId)?.rate || 0) * DAY_HOURS;
const EXCEPTION_IDS = TIMESHEETS.filter(t => t.state !== "Matched").map(t => t.id);
const SITE_GROUPS: Employee["group"][] = ["Foreman", "Electrician", "Apprentice"];
const vanReg = (id: string | null) => VEHICLES.find(v => v.id === id)?.reg || "";
const ref = (s: LvState, id: string | null | undefined) => project(id, s)?.ref || "Unallocated";
const projectOptions = (s: LvState): [string, string][] => s.projects.map(p => [p.id, p.ref + "  " + p.name]);
const FICTION = "Names other than Martin Lavelle are fictional.";

function todayByProject() {
  const by = new Map<string, Allocation[]>();
  ALLOCATIONS.forEach(a => { if (!a.projectId) return; by.set(a.projectId, [...(by.get(a.projectId) || []), a]); });
  return by;
}

export default function Workforce({ tab }: { tab: string }) {
  const s = useLv();
  const [sel, setSel] = useState<string | null>(null);
  const open = (id: string) => setSel(id);
  return (
    <Page>
      {tab === "overview" && <Overview s={s} open={open} />}
      {tab === "employees" && <Employees s={s} open={open} />}
      {tab === "subcontractors" && <Subcontractors s={s} open={open} />}
      {tab === "allocations" && <Allocations s={s} open={open} />}
      {tab === "timesheets" && <Timesheets s={s} open={open} />}
      {tab === "labour" && <Labour s={s} />}
      <PersonDrawer s={s} id={sel} onClose={() => setSel(null)} />
    </Page>
  );
}

type TabProps = { s: LvState; open: (id: string) => void };

/* ── Overview ────────────────────────────────────────────────────────── */
function Overview({ s, open }: TabProps) {
  const issues = labourIssues(s);
  const staffToday = ALLOCATIONS.filter(a => !isSubId(a.personId));
  const subsToday = ALLOCATIONS.filter(a => isSubId(a.personId));
  const costToday = ALLOCATIONS.reduce((n, a) => n + allocCost(a), 0);
  const staffCost = staffToday.reduce((n, a) => n + allocCost(a), 0);
  const by = todayByProject();
  const heads = [...by.entries()].map(([pid, list]) => ({ pid, list })).sort((a, b) => b.list.length - a.list.length);
  const maxHeads = Math.max(1, ...heads.map(h => h.list.length));
  const groups = (["Office", ...SITE_GROUPS] as Employee["group"][]).map(g => ({ g, n: EMPLOYEES.filter(e => e.group === g).length }));
  const gColor: Record<string, string> = { Office: "var(--lv-c5)", Foreman: "var(--lv-c3)", Electrician: "var(--lv-c1)", Apprentice: "var(--lv-c2)" };
  const insurance = SUBCONTRACTORS.filter(x => daysBetween(TODAY, x.insuranceExpiry) <= 30);
  const brennan = s.approvals.find(a => a.id === "ap4");
  return (
    <>
      <Head eyebrow="Workforce" title="Who's working where" sub={"Tue 20 Oct 2026. Office hours 08:00–17:00, site hours 07:00–15:30. " + FICTION}
        actions={<><DemoTag /><DemoTag sim>Sync clock-in</DemoTag><Btn kind="primary" size="sm" onClick={() => setTab("Workforce", "timesheets")}>Confirm yesterday's hours</Btn></>} />
      <div className="lv-grid lv-g6" style={{ marginBottom: 14 }}>
        <Stat label="Staff" value={EMPLOYEES.length} hint={EMPLOYEES.filter(e => e.group === "Office").length + " office, " + EMPLOYEES.filter(e => e.group !== "Office").length + " on the tools"} onClick={() => setTab("Workforce", "employees")} />
        <Stat label="Subcontractors" value={SUBCONTRACTORS.length} hint={SUBCONTRACTORS.filter(x => x.status === "On site").length + " on site, " + SUBCONTRACTORS.filter(x => x.status === "Booked").length + " booked"} onClick={() => setTab("Workforce", "subcontractors")} />
        <Stat label="On site today" value={ALLOCATIONS.length} hint={staffToday.length + " staff, " + subsToday.length + " subcontractors across " + by.size + " sites"} onClick={() => setTab("Workforce", "allocations")} />
        <Stat label="Unconfirmed allocations" value={issues.length} tone={issues.length ? "warn" : "ok"} hint={issues.length ? "From Mon 19 Oct, held off project cost" : "All of Monday is confirmed"} onClick={() => setTab("Workforce", "timesheets")} />
        <Stat label="Est. labour cost today" value={eur(costToday)} hint={eur(staffCost) + " staff (8h), " + eur(costToday - staffCost) + " subcontract day rates"} />
        <Stat hero label="Labour posted to date" value={eurShort(kpis(s).labour)} hint={"Across all " + s.projects.length + " projects"} onClick={() => setTab("Workforce", "labour")} />
      </div>

      <div className="lv-grid lv-g-2-1" style={{ marginBottom: 14 }}>
        <Card title="Heads on site today" sub="From the allocation board. Brennan Data Cabling counts once but is a 3-person crew." right={<Btn size="sm" kind="ghost" onClick={() => setTab("Workforce", "allocations")}>Allocation board</Btn>}>
          <HBars items={heads.map(h => {
            const p = project(h.pid, s)!;
            const st = h.list.filter(a => !isSubId(a.personId)).length;
            return { label: p.name, value: h.list.length, max: maxHeads, right: h.list.length + " (" + st + " staff)", onClick: () => setTab("Workforce", "allocations") };
          })} />
        </Card>
        <Card title="Needs a decision" sub="Held back until someone confirms" flush>
          <Rows>
            {issues.map(t => (
              <Li key={t.id} left={<Avatar name={personName(t.personId)} />} title={personName(t.personId)}
                sub={t.state + ": " + (t.pm ? ref(s, t.pm.projectId) + " " + t.pm.hours + "h" : "not submitted") + " vs " + (t.sync ? ref(s, t.sync.projectId) + " " + t.sync.hours + "h" : "no clock-in")}
                right={<StatusBadge s={t.state} />} onClick={() => setTab("Workforce", "timesheets")} />
            ))}
            {brennan && <Li left={<Avatar name="Brennan Data" sub />} title="Brennan Data Cabling, week 42" sub={"Subcontractor timesheet, " + eur(brennan.value) + " for Grand Canal Dock"}
              right={<StatusBadge s={brennan.status === "Awaiting you" ? "Awaiting approval" : brennan.status} />} onClick={() => navigate({ page: "Work" })} />}
            {insurance.map(x => (
              <Li key={x.id} left={<Avatar name={x.name} sub />} title={x.company + ": insurance renewal"} sub={"Expires " + date(x.insuranceExpiry) + ", " + daysBetween(TODAY, x.insuranceExpiry) + " days. Ask for the new certificate."}
                right={<Badge tone="warn">Check</Badge>} onClick={() => open(x.id)} />
            ))}
            {issues.length === 0 && <Li title="Monday's hours are all confirmed" sub="Everything from the WhatsApp group and Sync has posted to project labour." right={<Badge tone="ok">Done</Badge>} />}
          </Rows>
        </Card>
      </div>

      <div className="lv-grid lv-g-2-1">
        <Card title="Where the hours come from" sub="Two sources, compared every morning before anything posts">
          <div className="lvw-two">
            <div>
              <div className="lvw-src-h">Sync clock-in <DemoTag sim>Simulated import</DemoTag></div>
              <p className="lvw-p">Each operative clocks in and out on the Sync app at the site. The overnight import brings in the times and the site the phone was at. It's simulated in this demo; no live Sync connection is made.</p>
              <p className="lvw-p">Clock-in location alone doesn't decide which project the hours are charged to. A lad can clock in at Tallaght to pick up materials for Dalkey.</p>
            </div>
            <div>
              <div className="lvw-src-h">PM allocation <Badge tone="ghost">Existing workflow</Badge></div>
              <p className="lvw-p">By 16:00 each PM posts who worked on which job in the Lavelle Projects WhatsApp group. That stays: the lads see each other posting, so gaps get spotted on the day.</p>
              <p className="lvw-p">Pulse reads the submissions, matches them to the clock-ins, and only posts hours to project labour when both agree or Orla decides.</p>
            </div>
          </div>
        </Card>
        <Card title="Team make-up" sub={EMPLOYEES.length + " staff by group"}>
          <Split parts={groups.map(x => ({ v: x.n, color: gColor[x.g], label: x.g + " " + x.n }))} />
          <div style={{ marginTop: 10 }}><Legend items={groups.map(x => [x.g + " " + x.n, gColor[x.g]] as [string, string])} /></div>
          <div style={{ marginTop: 14 }}>
            <KV items={[
              ["Office hours", "08:00–17:00"], ["Site hours", "07:00–15:30"],
              ["Dublin base", EMPLOYEES.filter(e => e.base === "Dublin").length + " staff"], ["Galway base", EMPLOYEES.filter(e => e.base === "Galway").length + " staff"]
            ]} />
          </div>
        </Card>
      </div>
    </>
  );
}

/* ── Employees ───────────────────────────────────────────────────────── */
function Employees({ s, open }: TabProps) {
  const [g, setG] = useState<"all" | Employee["group"]>("all");
  const rows = EMPLOYEES.filter(e => g === "all" || e.group === g);
  const count = (x: Employee["group"]) => EMPLOYEES.filter(e => e.group === x).length;
  const site = (e: Employee) => {
    const a = allocOf(e.id);
    if (a && a.projectId) return <span><ProjectLink id={a.projectId} /> <span className="lv-faint lv-mono" style={{ fontSize: 11 }}>{span(a)}</span></span>;
    if (e.group === "Office") return <span className="lv-muted">Office, 08:00–17:00</span>;
    return <span className="lv-faint">Not allocated</span>;
  };
  const cols: Col<Employee>[] = [
    { key: "n", label: "Name", render: e => <span className="lv-row" style={{ gap: 9, flexWrap: "nowrap" }}><Avatar name={e.name} /><span><span className="strong" style={{ display: "block" }}>{e.name}</span><span className="lv-faint" style={{ fontSize: 11.5 }}>{e.role}</span></span></span> },
    { key: "g", label: "Group", render: e => <Badge tone={e.group === "Office" ? "ghost" : e.group === "Apprentice" ? "info" : "neutral"}>{e.group}</Badge> },
    { key: "b", label: "Base", render: e => e.base, hideMobile: true },
    { key: "r", label: "Rate (€/h cost)", align: "r", render: e => e.rate ? eur(e.rate) : <span className="lv-faint">Salaried</span> },
    { key: "v", label: "Van", render: e => e.vanId ? <span className="lv-mono" style={{ fontSize: 11.5 }}>{vanReg(e.vanId)}</span> : <span className="lv-faint">None</span>, hideMobile: true },
    { key: "t", label: "Today's site", render: e => site(e) },
    { key: "s", label: "Since", render: e => date(e.since), hideMobile: true }
  ];
  const siteStaff = EMPLOYEES.filter(e => e.rate > 0);
  return (
    <>
      <Head eyebrow="Workforce" title="Employees" sub={EMPLOYEES.length + " staff on the books. Rates are internal hourly cost used to post labour to projects, not pay rates. " + FICTION} actions={<DemoTag />} />
      <div className="lv-grid lv-g4" style={{ marginBottom: 14 }}>
        <Stat label="Foremen" value={count("Foreman")} hint="€48/h internal cost" onClick={() => setG("Foreman")} />
        <Stat label="Electricians" value={count("Electrician")} hint="€40–42/h internal cost" onClick={() => setG("Electrician")} />
        <Stat label="Apprentices" value={count("Apprentice")} hint="€18–29/h by year" onClick={() => setG("Apprentice")} />
        <Stat label="Average site rate" value={eur(siteStaff.reduce((n, e) => n + e.rate, 0) / siteStaff.length) + "/h"} hint={EMPLOYEES.filter(e => e.vanId).length + " staff have a company vehicle"} />
      </div>
      <Card title="Staff list" sub="Click a person for their allocation and Monday's hours" flush
        right={<Seg options={[["all", "All " + EMPLOYEES.length], ["Office", "Office " + count("Office")], ["Foreman", "Foremen " + count("Foreman")], ["Electrician", "Electricians " + count("Electrician")], ["Apprentice", "Apprentices " + count("Apprentice")]]} value={g} onChange={setG} />}>
        <Table cols={cols} rows={rows} onRow={e => open(e.id)} dense />
      </Card>
      <div style={{ marginTop: 12 }}><Note tone="accent">{FICTION} Phone numbers and Sync IDs are placeholders for the demo. {s.timesheets.length} timesheets were imported for Mon 19 Oct.</Note></div>
    </>
  );
}

/* ── Subcontractors ──────────────────────────────────────────────────── */
function Subcontractors({ s, open }: TabProps) {
  const soon = (x: Subcontractor) => daysBetween(TODAY, x.insuranceExpiry) <= 30;
  const onSite = ALLOCATIONS.filter(a => isSubId(a.personId));
  const cols: Col<Subcontractor>[] = [
    { key: "c", label: "Company", render: x => <span className="lv-row" style={{ gap: 9, flexWrap: "nowrap" }}><Avatar name={x.company} sub /><span><span className="strong" style={{ display: "block" }}>{x.company}</span><span className="lv-faint" style={{ fontSize: 11.5 }}>{x.name === x.company ? "Crew" : x.name}</span></span></span> },
    { key: "t", label: "Trade", render: x => x.trade, cls: "wrap", hideMobile: true },
    { key: "d", label: "Day rate", align: "r", render: x => eur(x.dayRate) },
    { key: "rct", label: "RCT rate", align: "c", render: x => <Badge tone={x.rctRate === "0%" ? "ok" : x.rctRate === "20%" ? "warn" : "bad"}>{x.rctRate}</Badge> },
    { key: "i", label: "Insurance expiry", render: x => soon(x) ? <span className="lv-row" style={{ gap: 6, flexWrap: "nowrap" }}><span className="lv-warn">{date(x.insuranceExpiry)}</span><Badge tone="warn">{daysBetween(TODAY, x.insuranceExpiry)} days</Badge></span> : date(x.insuranceExpiry) },
    { key: "s", label: "Status", render: x => <StatusBadge s={x.status} /> },
    { key: "p", label: "Today's site", render: x => { const a = allocOf(x.id); return a && a.projectId ? <ProjectLink id={a.projectId} /> : <span className="lv-faint">Not on site</span>; } }
  ];
  const dayTotal = onSite.reduce((n, a) => n + allocCost(a), 0);
  const brennan = s.approvals.find(a => a.id === "ap4");
  return (
    <>
      <Head eyebrow="Workforce" title="Subcontractors" sub="Labour-only electricians, specialist crews and plant. RCT rates as per the Revenue determination on file (demo values)." actions={<DemoTag />} />
      <div className="lv-grid lv-g4" style={{ marginBottom: 14 }}>
        <Stat label="Subcontractors" value={SUBCONTRACTORS.length} hint={SUBCONTRACTORS.filter(x => x.status === "Available").length + " available, " + SUBCONTRACTORS.filter(x => x.status === "Booked").length + " booked"} />
        <Stat label="On site today" value={onSite.length} hint={eur(dayTotal) + " in day rates today"} onClick={() => setTab("Workforce", "allocations")} />
        <Stat label="Insurance within 30 days" value={SUBCONTRACTORS.filter(soon).length} tone={SUBCONTRACTORS.some(soon) ? "warn" : "ok"} hint="Against 20 Oct 2026" />
        <Stat label="On 20% RCT" value={SUBCONTRACTORS.filter(x => x.rctRate === "20%").length} hint="20% deducted at payment and returned to Revenue" />
      </div>
      <div className="lv-grid lv-g-2-1">
        <Card title="Subcontractor register" sub="Click a row for detail" flush>
          <Table cols={cols} rows={SUBCONTRACTORS} onRow={x => open(x.id)} rowClass={x => soon(x) ? "hl" : ""} dense />
        </Card>
        <div className="lv-stack">
          <Card title="Brennan Data Cabling, week 42" sub="Subcontractor timesheet, 3-person crew, Grand Canal Dock" tone={brennan?.status === "Awaiting you" ? "warn" : undefined}>
            <KV items={[["Value", eur(brennan?.value || 0)], ["Status", brennan?.status || "Approved"], ["Day rate", eur(sub("s11")?.dayRate || 0)], ["Posts to", "Subcontract cost"]]} />
            <div className="lv-row" style={{ marginTop: 12 }}>
              <Btn kind="primary" size="sm" onClick={() => navigate({ page: "Work" })}>Open in Work approvals</Btn>
              <span className="lv-small lv-faint">Approved there, it posts to LE-2026-008 subcontract cost.</span>
            </div>
          </Card>
          <Card title="Insurance renewals" sub="Certificates expiring in the next 30 days" flush>
            <Rows>
              {SUBCONTRACTORS.filter(soon).map(x => (
                <Li key={x.id} title={x.company} sub={"Expires " + date(x.insuranceExpiry) + ". " + (x.status === "On site" ? "On site today." : x.status + ".")} right={<Badge tone="warn">{daysBetween(TODAY, x.insuranceExpiry)} days</Badge>} onClick={() => open(x.id)} />
              ))}
              {!SUBCONTRACTORS.some(soon) && <Li title="Nothing expiring" sub="All certificates run past 30 days." />}
            </Rows>
          </Card>
        </div>
      </div>
    </>
  );
}

/* ── Allocations ─────────────────────────────────────────────────────── */
const WEEK: { iso: string; label: string; kind: string }[] = [
  { iso: "2026-10-19", label: "Mon 19", kind: "Worked" }, { iso: "2026-10-20", label: "Tue 20", kind: "Today" },
  { iso: "2026-10-21", label: "Wed 21", kind: "Planned" }, { iso: "2026-10-22", label: "Thu 22", kind: "Planned" }, { iso: "2026-10-23", label: "Fri 23", kind: "Planned" }
];
/* Planned changes against today's board, Wed to Fri. Demo assumptions. */
const PLAN: { pid: string; d: [number, number, number]; why: string }[] = [
  { pid: "p11", d: [1, 0, 0], why: "Marty spends Wednesday at Rathmines on pre-commissioning checks ahead of Kestrel on 28 Oct." },
  { pid: "p01", d: [-1, 0, 0], why: "Dalkey is one down on Wednesday while Marty is at Rathmines." },
  { pid: "p03", d: [0, 1, -1], why: "Midland Core Drilling at Ballymount Thursday for firestopping; two of Fergal's crew move to Santry Friday." },
  { pid: "p07", d: [0, 0, 2], why: "Two staff join Santry Friday to prepare the 24–25 Oct weekend shutdown." },
  { pid: "p10", d: [0, 2, 2], why: "Pádraig takes two from Tallaght to set up Clondalkin before the mid-term break." },
  { pid: "p04", d: [0, -2, -2], why: "Tallaght is two down Thursday and Friday for Clondalkin." }
];
function weekHeads(s: LvState) {
  const today = todayByProject();
  const mon = new Map<string, number>();
  s.timesheets.forEach(t => {
    const pid = t.state === "Posted" ? t.proposal?.projectId : t.pm?.projectId || t.sync?.projectId;
    if (pid) mon.set(pid, (mon.get(pid) || 0) + 1);
  });
  ALLOCATIONS.filter(a => isSubId(a.personId) && a.projectId).forEach(a => mon.set(a.projectId!, (mon.get(a.projectId!) || 0) + 1));
  const ids = new Set<string>([...today.keys(), ...mon.keys(), ...PLAN.map(p => p.pid)]);
  return s.projects.filter(p => ids.has(p.id)).map(p => {
    const t = today.get(p.id)?.length || 0;
    const adj = PLAN.find(x => x.pid === p.id)?.d || [0, 0, 0];
    return { p, days: [mon.get(p.id) || 0, t, Math.max(0, t + adj[0]), Math.max(0, t + adj[1]), Math.max(0, t + adj[2])] };
  });
}

function Allocations({ s, open }: TabProps) {
  const by = todayByProject();
  const projects = s.projects.filter(p => by.has(p.id));
  const office = EMPLOYEES.filter(e => e.group === "Office");
  const free = SUBCONTRACTORS.filter(x => !allocOf(x.id));
  const rows = weekHeads(s);
  const maxCell = Math.max(1, ...rows.flatMap(r => r.days));
  const chip = (a: Allocation) => {
    const odd = a.start !== "07:00";
    const nm = personName(a.personId);
    return (
      <button key={a.id} className={"lvw-chip" + (odd ? " odd" : "")} onClick={() => open(a.personId)} title={a.note || undefined}>
        <Avatar name={nm} sub={isSubId(a.personId)} />
        <span className="lvw-nm">{nm}{a.personId === "s11" ? " (3)" : ""}</span>
        <span className="lvw-tm">{span(a)}</span>
      </button>
    );
  };
  const weekCols: Col<{ p: Project; days: number[] }>[] = [
    { key: "p", label: "Site", render: r => <ProjectLink id={r.p.id} />, cls: "strong" },
    ...WEEK.map((d, i): Col<{ p: Project; days: number[] }> => ({
      key: d.iso, align: "r", label: <span>{d.label}<span className="lv-faint" style={{ display: "block", fontSize: 9, letterSpacing: ".08em" }}>{d.kind}</span></span>,
      render: r => {
        const v = r.days[i], diff = i >= 2 ? v - r.days[1] : 0;
        return <span className={"lvw-cell" + (diff > 0 ? " up" : diff < 0 ? " down" : "")}><Bar value={v / maxCell} thin tone={i >= 2 ? "neutral" : undefined} /><b>{v}</b></span>;
      },
      foot: <b>{rows.reduce((n, r) => n + r.days[i], 0)}</b>
    }))
  ];
  return (
    <>
      <Head eyebrow="Workforce" title="Site allocations, Tue 20 Oct" sub="Site hours 07:00–15:30. Times in amber are off the standard day (occupied floors at Grand Canal Dock, Galway sites on 08:00 starts)."
        actions={<><DemoTag /><Btn size="sm" onClick={() => setTab("Workforce", "timesheets")}>Monday's hours</Btn></>} />
      <div className="lvw-board" style={{ marginBottom: 14 }}>
        {projects.map(p => {
          const list = by.get(p.id)!;
          const cost = list.reduce((n, a) => n + allocCost(a), 0);
          return (
            <div className="lvw-col" key={p.id}>
              <div className="lvw-col-h">
                <div style={{ minWidth: 0 }}>
                  <div className="t"><ProjectLink id={p.id} /></div>
                  <div className="s">{p.ref}, {p.region}. Foreman {personName(p.foremanId)}</div>
                </div>
                <span className="n">{list.length}</span>
              </div>
              <div className="lvw-chips">{list.map(chip)}</div>
              <div className="lvw-col-f"><span>{list.filter(a => !isSubId(a.personId)).length} staff, {list.filter(a => isSubId(a.personId)).length} subs</span><span>est. {eur(cost)}</span></div>
            </div>
          );
        })}
        <div className="lvw-col">
          <div className="lvw-col-h"><div><div className="t">Office</div><div className="s">08:00–17:00, Dublin and Galway</div></div><span className="n">{office.length}</span></div>
          <div className="lvw-chips">{office.map(e => (
            <button key={e.id} className="lvw-chip" onClick={() => open(e.id)}><Avatar name={e.name} /><span className="lvw-nm">{e.name}</span><span className="lvw-tm">08:00–17:00</span></button>
          ))}</div>
        </div>
        <div className="lvw-col">
          <div className="lvw-col-h"><div><div className="t">Not on site today</div><div className="s">Subcontractors booked or available</div></div><span className="n">{free.length}</span></div>
          <div className="lvw-chips">{free.map(x => (
            <button key={x.id} className="lvw-chip" onClick={() => open(x.id)}><Avatar name={x.company} sub /><span className="lvw-nm">{x.company}</span><span className="lvw-tm">{x.status}</span></button>
          ))}</div>
        </div>
      </div>
      <div className="lv-grid lv-g-3-2">
        <Card title="This week, heads per site" sub="Mon from imported hours plus subcontractor bookings; Wed to Fri are planned, not confirmed" right={<DemoTag />} flush>
          <Table cols={weekCols} rows={rows} foot dense />
        </Card>
        <Card title="Planned changes" sub="What moves from today's board, Wed to Fri" flush>
          <Rows>{PLAN.map(x => <Li key={x.pid} title={<ProjectLink id={x.pid} />} sub={x.why} right={<span className="lv-mono lv-small">{x.d.map(n => (n > 0 ? "+" : "") + n).join(" / ")}</span>} />)}</Rows>
        </Card>
      </div>
    </>
  );
}

/* ── Timesheets ──────────────────────────────────────────────────────── */
function Timesheets({ s, open }: TabProps) {
  const exceptions = s.timesheets.filter(t => EXCEPTION_IDS.includes(t.id));
  const matched = s.timesheets.filter(t => !EXCEPTION_IDS.includes(t.id));
  const pendingMatched = matched.filter(t => t.state === "Matched");
  const openEx = exceptions.filter(t => t.state !== "Posted");
  const posted = s.timesheets.filter(t => t.state === "Posted");
  const postedCost = posted.reduce((n, t) => n + (t.proposal ? labourCost(t.personId, t.proposal.hours, t.proposal.ot) : 0), 0);
  const brennan = s.approvals.find(a => a.id === "ap4");
  const step = posted.length === s.timesheets.length ? 5 : openEx.length === 0 ? 4 : 3;
  const mCols: Col<Timesheet>[] = [
    { key: "n", label: "Person", render: t => <span className="lv-row" style={{ gap: 8, flexWrap: "nowrap" }}><Avatar name={personName(t.personId)} /><span className="strong">{personName(t.personId)}</span></span> },
    { key: "p", label: "Project", render: t => <ProjectLink id={t.pm?.projectId || null} /> },
    { key: "pm", label: "PM (WhatsApp)", align: "r", render: t => (t.pm?.hours || 0) + "h" },
    { key: "sy", label: "Sync clock-in", render: t => t.sync ? <span className="lv-mono" style={{ fontSize: 11.5 }}>{t.sync.in}–{t.sync.out}</span> : "None", hideMobile: true },
    { key: "c", label: "Cost", align: "r", render: t => eur(labourCost(t.personId, t.proposal?.hours || 0, t.proposal?.ot || 0)) },
    { key: "s", label: "State", render: t => <StatusBadge s={t.state} /> }
  ];
  return (
    <>
      <Head eyebrow="Workforce" title="Timesheets, Mon 19 Oct" sub="PM submissions from the Lavelle Projects WhatsApp group compared with Sync clock-ins. Nothing reaches project labour until it's confirmed here."
        actions={<><DemoTag /><DemoTag sim>Sync import</DemoTag></>} />
      <div style={{ marginBottom: 14 }}><Steps steps={["WhatsApp submission", "Sync clock-in", "Match", "Decide exceptions", "Post to projects"]} at={step} /></div>
      <div className="lv-grid lv-g6" style={{ marginBottom: 14 }}>
        <Stat label="Allocations" value={s.timesheets.length} hint="Staff hours for Mon 19 Oct" />
        <Stat label="Matched" value={matched.length} tone="ok" hint={pendingMatched.length ? pendingMatched.length + " ready to post" : "All posted"} />
        <Stat label="Exceptions open" value={openEx.length} tone={openEx.length ? "warn" : "ok"} hint={exceptions.length - openEx.length + " of " + exceptions.length + " decided"} />
        <Stat label="Posted" value={posted.length} hint={"of " + s.timesheets.length + " allocations"} />
        <Stat label="Cost posted" value={eur(postedCost)} hint="To project labour, Mon 19 Oct" />
        <Stat label="Subcontract sheets" value={brennan?.status === "Awaiting you" ? 1 : 0} tone={brennan?.status === "Awaiting you" ? "warn" : "ok"} hint="Brennan Data Cabling, wk 42" onClick={() => navigate({ page: "Work" })} />
      </div>

      <div className="lv-grid lv-g2" style={{ marginBottom: 14 }}>
        {exceptions.map(t => <ExceptionCard key={t.id} s={s} t={t} open={open} />)}
      </div>

      <div className="lv-grid lv-g-2-1">
        <Card title={"Matched allocations (" + matched.length + ")"} sub="PM submission and clock-in agree on site and hours" flush
          right={<Btn kind="primary" size="sm" disabled={!pendingMatched.length} onClick={approveAllMatched}>{pendingMatched.length ? "Approve all matched (" + pendingMatched.length + ")" : "All matched posted"}</Btn>}>
          <Table cols={mCols} rows={matched} onRow={t => open(t.personId)} dense maxH={430} />
        </Card>
        <div className="lv-stack">
          <Card title="Brennan Data Cabling, week 42" sub="Subcontractor timesheet: 3-person crew, 6 days at Grand Canal Dock" tone={brennan?.status === "Awaiting you" ? "warn" : undefined}>
            <KV items={[["Value", eur(brennan?.value || 0)], ["Status", brennan?.status === "Awaiting you" ? "Awaiting Martin" : brennan?.status || ""]]} />
            <div style={{ marginTop: 12 }}><Btn size="sm" kind={brennan?.status === "Awaiting you" ? "primary" : ""} onClick={() => navigate({ page: "Work" })}>Open in Work approvals</Btn></div>
          </Card>
          <Note>Hours posted here replace re-keying into LiveCosts. Overtime is costed at time and a half of the internal rate.</Note>
        </div>
      </div>
    </>
  );
}

function ExceptionCard({ s, t, open }: { s: LvState; t: Timesheet; open: (id: string) => void }) {
  const done = t.state === "Posted";
  const pr = t.proposal;
  const rate = person(t.personId)?.rate || 0;
  const pDiff = !!(t.pm && t.sync && t.pm.projectId !== t.sync.projectId);
  const hDiff = !!(t.pm && t.sync && t.pm.hours + t.pm.ot !== t.sync.hours);
  const toNum = (v: string) => { const n = parseFloat(v); return isFinite(n) ? Math.max(0, Math.min(16, n)) : 0; };
  return (
    <Card tone={done ? undefined : "warn"} title={<span className="lv-row" style={{ gap: 9, flexWrap: "nowrap" }}><Avatar name={personName(t.personId)} /><span className="lv-link" onClick={() => open(t.personId)}>{personName(t.personId)}</span></span>}
      sub={person(t.personId)?.role + ", " + eur(rate) + "/h"} right={<StatusBadge s={t.state} />}>
      <div className="lvw-cmp">
        <div className={"lvw-src" + (t.pm ? (pDiff || hDiff ? " diff" : "") : " none")}>
          <div className="k">PM submission (WhatsApp)</div>
          {t.pm ? <><div className="v"><ProjectLink id={t.pm.projectId} /></div><div className="h">{t.pm.hours}h{t.pm.ot ? " + " + t.pm.ot + "h OT" : ""}, posted by {personName(project(t.pm.projectId, s)?.pmId)}</div></>
            : <><div className="v lv-faint">Not in the submission</div><div className="h">No hours posted for this person</div></>}
        </div>
        <div className={"lvw-src" + (t.sync ? (pDiff || hDiff ? " diff" : "") : " none")}>
          <div className="k">Sync clock-in (simulated)</div>
          {t.sync ? <><div className="v"><ProjectLink id={t.sync.projectId} /></div><div className="h">{t.sync.in}–{t.sync.out}, {t.sync.hours}h on site</div></>
            : <><div className="v lv-faint">No clock-in</div><div className="h">Nothing recorded on Sync</div></>}
        </div>
      </div>
      <p className="lvw-issue">{t.issue}</p>
      {pr && (
        <div className="lvw-edit">
          <label>Project{done ? <span className="lv-ink" style={{ fontSize: 13, textTransform: "none", letterSpacing: 0, height: 32, display: "flex", alignItems: "center" }}>{ref(s, pr.projectId)}</span> : <Select value={pr.projectId} onChange={v => setProposal(t.id, { projectId: v })} options={projectOptions(s)} label="Project" />}</label>
          <label>Hours<input className="lv-input lv-num" type="number" step={0.5} min={0} disabled={done} value={pr.hours} onChange={e => setProposal(t.id, { hours: toNum(e.target.value) })} /></label>
          <label>OT<input className="lv-input lv-num" type="number" step={0.5} min={0} disabled={done} value={pr.ot} onChange={e => setProposal(t.id, { ot: toNum(e.target.value) })} /></label>
          <div className="lvw-cost"><div className="v">{eur(labourCost(t.personId, pr.hours, pr.ot))}</div><div className="h">{done ? "Posted to " + ref(s, pr.projectId) : "to " + ref(s, pr.projectId) + " labour"}</div></div>
        </div>
      )}
      <div className="lv-row" style={{ marginTop: 12 }}>
        {done ? <><Badge tone="ok" dot>Posted</Badge><span className="lv-small lv-muted">{pr?.hours}h{pr?.ot ? " + " + pr.ot + "h OT" : ""} on {ref(s, pr?.projectId)}. Project labour updated.</span></>
          : <>
            <Btn kind="primary" size="sm" onClick={() => postException(t.id)} disabled={!pr || pr.hours + pr.ot <= 0}>Approve &amp; post</Btn>
            {t.pm && <Btn size="sm" kind="ghost" onClick={() => takeSide(t.id, "pm")}>Use PM's figures</Btn>}
            {t.sync && <Btn size="sm" kind="ghost" onClick={() => takeSide(t.id, "sync")}>Use clock-in</Btn>}
          </>}
      </div>
    </Card>
  );
}

/* ── Labour costs ────────────────────────────────────────────────────── */
function Labour({ s }: { s: LvState }) {
  const fins = s.projects.map(p => ({ p, f: finOf(p, s) }));
  const posted = fins.reduce((n, x) => n + x.f.actualByCat.labour, 0);
  const budget = fins.reduce((n, x) => n + x.f.budgetByCat.labour, 0);
  const forecast = fins.reduce((n, x) => n + x.f.forecastByCat.labour, 0);
  const subc = fins.reduce((n, x) => n + x.f.actualByCat.subcontract, 0);
  // this week = Mon 19 Oct timesheets (posted and pending), Tue is still being worked
  const withPr = s.timesheets.filter(t => t.proposal);
  const isPosted = (t: Timesheet) => t.state === "Posted";
  const stdPosted = withPr.filter(isPosted).reduce((n, t) => n + t.proposal!.hours, 0);
  const otPosted = withPr.filter(isPosted).reduce((n, t) => n + t.proposal!.ot, 0);
  const stdAll = withPr.reduce((n, t) => n + t.proposal!.hours, 0);
  const otAll = withPr.reduce((n, t) => n + t.proposal!.ot, 0);
  const issues = labourIssues(s);
  const heldHours = issues.reduce((n, t) => n + Math.max((t.pm?.hours || 0) + (t.pm?.ot || 0), t.sync?.hours || 0), 0);
  const santry = s.approvals.find(a => a.id === "ap7");
  const heldCost = issues.reduce((n, t) => n + (t.proposal ? labourCost(t.personId, t.proposal.hours, t.proposal.ot) : 0), 0);

  // weekly expenditure: this week = Monday's hours + today's board estimate; earlier weeks are demo history built from the same daily run-rate
  const monInternal = withPr.reduce((n, t) => n + labourCost(t.personId, t.proposal!.hours, t.proposal!.ot), 0);
  const dayInternal = ALLOCATIONS.filter(a => !isSubId(a.personId)).reduce((n, a) => n + allocCost(a), 0);
  const daySubs = ALLOCATIONS.filter(a => isSubId(a.personId)).reduce((n, a) => n + allocCost(a), 0);
  const factors = [0.93, 0.97, 1.04, 0.98, 1.02];
  const weeks = ["14 Sep", "21 Sep", "28 Sep", "5 Oct", "12 Oct"].map((w, i) => ({ label: w, internal: dayInternal * 5 * factors[i], subs: daySubs * 5 * (2 - factors[i]) }));
  weeks.push({ label: "19 Oct*", internal: monInternal + dayInternal, subs: daySubs * 2 });

  const rows = fins.slice().sort((a, b) => b.f.actualByCat.labour - a.f.actualByCat.labour);
  const cols: Col<{ p: Project; f: ReturnType<typeof finOf> }>[] = [
    { key: "p", label: "Project", render: r => <ProjectLink id={r.p.id} />, cls: "strong", foot: "All projects" },
    { key: "b", label: "Budget labour", align: "r", render: r => eur(r.f.budgetByCat.labour), foot: eur(budget), hideMobile: true },
    { key: "a", label: "Posted", align: "r", render: r => eur(r.f.actualByCat.labour), foot: eur(posted) },
    { key: "bar", label: "Used", render: r => { const u = r.f.budgetByCat.labour ? r.f.actualByCat.labour / r.f.budgetByCat.labour : 0; return <span className="lv-row" style={{ gap: 8, flexWrap: "nowrap" }}><span style={{ width: 80 }}><Bar value={u} thin tone={u > 1 ? "bad" : u > 0.85 ? "warn" : undefined} /></span><span className="lv-small lv-muted">{pct(u, 0)}</span></span>; }, hideMobile: true },
    { key: "fc", label: "Forecast", align: "r", render: r => eur(r.f.forecastByCat.labour), foot: eur(forecast), hideMobile: true },
    { key: "v", label: "vs budget", align: "r", render: r => { const v = r.f.forecastByCat.labour - r.f.budgetByCat.labour; return <span className={v > 0 ? "lv-bad" : "lv-ok"}>{v > 0 ? "+" : ""}{eur(v)}</span>; }, foot: <span className={forecast > budget ? "lv-bad" : "lv-ok"}>{forecast > budget ? "+" : ""}{eur(forecast - budget)}</span> }
  ];
  return (
    <>
      <Head eyebrow="Workforce" title="Labour costs" sub="Labour posted to projects from confirmed hours, against the labour budget from each estimate." actions={<DemoTag />} />
      <div className="lv-grid lv-g6" style={{ marginBottom: 14 }}>
        <Stat hero label="Labour posted to date" value={eurShort(posted)} hint={pct(budget ? posted / budget : 0, 0) + " of labour budget"} />
        <Stat label="Labour budget" value={eurShort(budget)} hint={"Forecast " + eurShort(forecast)} />
        <Stat label="Forecast vs budget" value={(forecast > budget ? "+" : "") + eurShort(forecast - budget)} tone={forecast > budget ? "bad" : "ok"} hint="Posted + open orders + still to spend" />
        <Stat label="Standard hours, this week" value={num(stdAll) + "h"} hint={num(stdPosted) + "h posted, Mon 19 Oct"} />
        <Stat label="Overtime hours, this week" value={otAll + "h"} tone={otAll ? "warn" : undefined} hint={otPosted + "h posted, " + (otAll - otPosted) + "h pending"} />
        <Stat label="Unallocated hours" value={heldHours + "h"} tone={heldHours ? "warn" : "ok"} hint={heldHours ? eur(heldCost) + " held until confirmed" : "Nothing held"} onClick={() => setTab("Workforce", "timesheets")} />
      </div>
      <div className="lv-grid lv-g-3-2" style={{ marginBottom: 14 }}>
        <Card title="Posted labour by project vs budget" sub="Forecast includes cost still to spend; Grand Canal Dock is the one running over" flush>
          <Table cols={cols} rows={rows} foot dense />
        </Card>
        <div className="lv-stack">
          <Card title="Internal vs subcontract" sub="Cost posted to date across all projects">
            <Split parts={[{ v: posted, color: "var(--lv-c1)", label: "Internal labour" }, { v: subc, color: "var(--lv-c3)", label: "Subcontract" }]} />
            <div style={{ marginTop: 10 }}><Legend items={[["Internal " + eurShort(posted), "var(--lv-c1)"], ["Subcontract " + eurShort(subc), "var(--lv-c3)"]]} /></div>
            <div className="lv-small lv-muted" style={{ marginTop: 10 }}>Subcontract is {pct(subc / (posted + subc || 1), 0)} of labour-type cost. Subcontract posts from approved subcontractor timesheets and invoices.</div>
          </Card>
          <Card title="Standard vs overtime" sub="Mon 19 Oct, posted and pending">
            <Split parts={[{ v: stdAll, color: "var(--lv-c2)", label: "Standard" }, { v: otAll, color: "var(--lv-c4)", label: "Overtime" }]} />
            <div style={{ marginTop: 10 }}><Legend items={[["Standard " + num(stdAll) + "h", "var(--lv-c2)"], ["Overtime " + otAll + "h", "var(--lv-c4)"]]} /></div>
            <div style={{ marginTop: 12 }}>
              <KV items={[["Unallocated", heldHours + "h"], ["Held value", eur(heldCost)], ["Santry weekend OT", santry ? (santry.status === "Awaiting you" ? "Awaiting Martin" : santry.status) : "None"]]} />
            </div>
          </Card>
        </div>
      </div>
      <Card title="Weekly labour expenditure" sub="Week commencing. *This week is Monday's hours plus today's allocation estimate; earlier weeks are demo history." right={<DemoTag />}>
        <Cols data={weeks.map(w => ({ label: w.label, parts: [{ v: w.internal, color: "var(--lv-c1)", title: "Internal " + eur(w.internal) }, { v: w.subs, color: "var(--lv-c3)", title: "Subcontract " + eur(w.subs) }] }))} fmt={eurShort} height={190} />
        <div style={{ marginTop: 10 }}><Legend items={[["Internal labour", "var(--lv-c1)"], ["Subcontract labour", "var(--lv-c3)"]]} /></div>
      </Card>
    </>
  );
}

/* ── Person drawer (staff and subcontractors) ────────────────────────── */
function PersonDrawer({ s, id, onClose }: { s: LvState; id: string | null; onClose: () => void }) {
  if (!id) return null;
  const e = person(id), x = sub(id);
  const a = allocOf(id);
  const ts = s.timesheets.find(t => t.personId === id) || null;
  let body: ReactNode = null;
  if (e) {
    body = (
      <>
        <KV items={[["Role", e.role], ["Group", e.group], ["Base", e.base], ["Internal cost", e.rate ? eur(e.rate) + "/h" : "Salaried"], ["Van", e.vanId ? vanReg(e.vanId) : "None"], ["Since", date(e.since)], ["Sync ID", e.syncId], ["Hours", e.group === "Office" ? "08:00–17:00" : "07:00–15:30"]]} />
        <Card title="Today" style={{ marginTop: 14 }}>
          {a && a.projectId ? <div className="lv-row"><ProjectLink id={a.projectId} /><span className="lv-mono lv-small">{span(a)}</span>{a.note && <span className="lv-small lv-muted">{a.note}</span>}<span className="lv-spacer" /><span className="lv-small">est. {eur(allocCost(a))}</span></div>
            : <span className="lv-muted lv-small">{e.group === "Office" ? "In the office." : "Not allocated to a site."}</span>}
        </Card>
        <Card title="Mon 19 Oct" style={{ marginTop: 14 }}>
          {ts ? (
            <div className="lv-stack" style={{ gap: 8 }}>
              <div className="lv-row"><StatusBadge s={ts.state} /><span className="lv-small lv-muted">{ts.issue || "PM submission and clock-in agree."}</span></div>
              <KV items={[["PM said", ts.pm ? ref(s, ts.pm.projectId) + " " + ts.pm.hours + "h" + (ts.pm.ot ? " + " + ts.pm.ot + "h OT" : "") : "Not submitted"], ["Sync said", ts.sync ? ref(s, ts.sync.projectId) + " " + ts.sync.in + "–" + ts.sync.out : "No clock-in"], ["Cost", ts.proposal ? eur(labourCost(id, ts.proposal.hours, ts.proposal.ot)) : "None"]]} />
            </div>
          ) : <span className="lv-muted lv-small">No site hours recorded{e.group === "Office" ? " (office staff are not allocated to projects)" : ""}.</span>}
        </Card>
        {e.fictional && <div style={{ marginTop: 14 }}><Note>{FICTION}</Note></div>}
      </>
    );
  } else if (x) {
    const d = daysBetween(TODAY, x.insuranceExpiry);
    body = (
      <>
        <KV items={[["Trade", x.trade], ["Day rate", eur(x.dayRate)], ["RCT rate", x.rctRate], ["Insurance", date(x.insuranceExpiry)], ["Status", x.status], ["Contact", x.name]]} />
        {d <= 30 && <div style={{ marginTop: 14 }}><Note tone="warn">Insurance expires in {d} days ({dateShort(x.insuranceExpiry)}). Ask for the renewed certificate before the next booking.</Note></div>}
        <Card title="Today" style={{ marginTop: 14 }}>
          {a && a.projectId ? <div className="lv-row"><ProjectLink id={a.projectId} /><span className="lv-mono lv-small">{span(a)}</span>{a.note && <span className="lv-small lv-muted">{a.note}</span>}<span className="lv-spacer" /><span className="lv-small">{eur(x.dayRate)} day rate</span></div>
            : <span className="lv-muted lv-small">Not on site today.</span>}
        </Card>
        <div style={{ marginTop: 14 }}><Note>RCT at {x.rctRate}: {x.rctRate === "0%" ? "paid gross under the Revenue determination." : "Lavelle deducts " + x.rctRate + " at payment and pays it to Revenue."} Subcontractor hours post to project subcontract cost, not labour.</Note></div>
        {id === "s11" && <div className="lv-row" style={{ marginTop: 12 }}><Btn kind="primary" size="sm" onClick={() => navigate({ page: "Work" })}>Week 42 timesheet in Work approvals</Btn></div>}
      </>
    );
  }
  const name = e?.name || x?.company || personName(id);
  return (
    <Drawer open onClose={onClose} eyebrow={e ? "Employee" : "Subcontractor"} title={name}
      footer={a && a.projectId ? <Btn onClick={() => { onClose(); setTab("Workforce", "allocations"); }}>Allocation board</Btn> : undefined}>
      {body}
    </Drawer>
  );
}
