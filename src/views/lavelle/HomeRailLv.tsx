/* Lavelle widgets for the Home right rail. The Home centre stays clean
   (greeting, ask box, thread); briefings, numbers and to-dos live here. */

import { useLv, finOf, navigate, openProject, personName } from "../../lavelle/store";
import { kpis, briefingLines, unsubmitted, labourIssues } from "../../lavelle/answers";
import { ALLOCATIONS, EMPLOYEES, SUBCONTRACTORS } from "../../lavelle/seed";
import { eur, eurShort, pct, dateShort, TODAY } from "../../lavelle/format";
import { Bar, Badge } from "./ui";

type Show = { briefing?: boolean; lvKpi?: boolean; health?: boolean; claims?: boolean; labour?: boolean };

function Head({ title, right, onRemove }: { title: string; right?: React.ReactNode; onRemove?: () => void }) {
  return (
    <div className="lv-rail-h">
      <span className="t">{title}</span>{right}
      {onRemove && <button className="lv-x" style={{ width: 24, height: 24 }} onClick={onRemove} title="Remove widget"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12 M18 6 6 18" /></svg></button>}
    </div>
  );
}

export default function HomeRailLv({ show, edit, remove, ask }: { show: Show; edit: boolean; remove: (k: string) => void; ask: (q: string) => void }) {
  const s = useLv();
  const k = kpis(s);
  const rm = (key: string) => edit ? () => remove(key) : undefined;
  const ranked = s.projects.map(p => ({ p, f: finOf(p, s) })).sort((a, b) => a.f.gap - b.f.gap);
  const oct = s.claims.filter(c => c.period === "2026-10");
  const attention = [
    ...oct.filter(c => c.status === "Not started"), ...unsubmitted(s),
    ...oct.filter(c => c.status === "Submitted" && c.assessmentDue < TODAY), ...oct.filter(c => c.status === "Disputed")
  ];
  const staffToday = ALLOCATIONS.filter(a => EMPLOYEES.some(e => e.id === a.personId)).length;
  const subsToday = ALLOCATIONS.length - staffToday;
  const labourToday = ALLOCATIONS.reduce((n, a) => n + (EMPLOYEES.find(e => e.id === a.personId)?.rate || 0) * 8 + (SUBCONTRACTORS.find(x => x.id === a.personId)?.dayRate || 0), 0);
  const issues = labourIssues(s);
  const bySite: Record<string, number> = {};
  ALLOCATIONS.forEach(a => { if (a.projectId) bySite[a.projectId] = (bySite[a.projectId] || 0) + 1; });

  return (
    <>
      {show.briefing && (
        <div className="lv-rail-card" style={{ borderColor: "var(--accent-line)", background: "linear-gradient(160deg,var(--accent-faint),transparent 55%),var(--surface)" }}>
          <Head title="Morning briefing" right={<Badge tone="accent">Briefing Agent · 07:30</Badge>} onRemove={rm("briefing")} />
          <div style={{ padding: "0 16px 6px", fontSize: 13, lineHeight: 1.55, color: "var(--body)" }}>
            Good morning, Martin. Here's what needs you across the {k.active} live projects.
          </div>
          <div className="lv-list">
            {briefingLines(s).map(l => (
              <div key={l.k} className="lv-li click" style={{ padding: "9px 16px", alignItems: "flex-start" }} onClick={() => navigate(l.nav)}>
                <span className="lv-mono lv-faint" style={{ fontSize: 9.5, letterSpacing: ".1em", textTransform: "uppercase", width: 70, flex: "none", paddingTop: 2 }}>{l.k}</span>
                <span className="grow" style={{ fontSize: 12.5, color: "var(--ink)", lineHeight: 1.45 }}>{l.v}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, padding: "10px 16px 14px", flexWrap: "wrap" }}>
            <button className="lv-btn sm primary" onClick={() => ask("What's happening across the projects?")}>Ask for the full picture</button>
          </div>
        </div>
      )}

      {show.lvKpi && (
        <div className="lv-rail-card">
          <Head title="Today's numbers" right={<span className="lv-tag">Demo data</span>} onRemove={rm("kpi")} />
          <div className="lv-mini-kpis">
            <button onClick={() => navigate({ page: "Projects", tab: "all" })}><div className="k">Active projects</div><div className="v">{k.active}</div><div className="h">10 Dublin · 2 Galway</div></button>
            <button onClick={() => navigate({ page: "Projects", tab: "financials" })}><div className="k">Live contract value</div><div className="v">{eurShort(k.contract)}</div><div className="h">incl. approved variations</div></button>
            <button onClick={() => navigate({ page: "Claims & Finance", tab: "cost" })}><div className="k">Committed costs</div><div className="v">{eurShort(k.committed)}</div><div className="h">{eurShort(k.actual)} actual + {eurShort(k.openPO)} POs</div></button>
            <button onClick={() => navigate({ page: "Workforce", tab: "labour" })}><div className="k">Labour to date</div><div className="v">{eurShort(k.labour)}</div><div className="h">posted hours</div></button>
            <button onClick={() => navigate({ page: "Claims & Finance", tab: "claims" })}><div className="k">Unsubmitted claims</div><div className="v" style={{ color: "var(--warn)" }}>{eur(k.unsubmitted)}</div><div className="h">{unsubmitted(s).length} October drafts</div></button>
            <button onClick={() => navigate({ page: "Work" })}><div className="k">Pending approvals</div><div className="v">{k.approvals}</div><div className="h">waiting on you</div></button>
          </div>
        </div>
      )}

      {show.health && (
        <div className="lv-rail-card">
          <Head title="Project financial health" right={<button className="lv-btn sm ghost" onClick={() => navigate({ page: "Dashboard", tab: "profitability" })}>All</button>} onRemove={rm("health")} />
          <div style={{ padding: "0 16px 4px", display: "grid", gridTemplateColumns: "1fr auto auto", gap: "4px 10px", fontSize: 10, color: "var(--faint)", letterSpacing: ".08em", textTransform: "uppercase" }}>
            <span>Project</span><span>Margin</span><span>Target</span>
          </div>
          <div className="lv-list">
            {ranked.slice(0, 6).map(({ p, f }) => (
              <div key={p.id} className="lv-li click" style={{ padding: "8px 16px", display: "block" }} onClick={() => openProject(p.id, "financials")}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, alignItems: "baseline" }}>
                  <span style={{ fontSize: 12.5, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: f.status === "Below target" ? "var(--bad)" : f.status === "Watch" ? "var(--warn)" : "var(--ok)" }}>{pct(f.margin)}</span>
                  <span style={{ fontSize: 11.5, color: "var(--faint)", width: 40, textAlign: "right" }}>{pct(p.targetMargin, 0)}</span>
                </div>
                <div style={{ marginTop: 6 }}><Bar thin value={f.margin / 0.4} target={p.targetMargin / 0.4} tone={f.status === "Below target" ? "bad" : f.status === "Watch" ? "warn" : "ok"} /></div>
                <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 5 }}>{eurShort(f.revised)} contract · {eurShort(f.committed)} committed · {eurShort(f.forecast)} forecast cost · {eurShort(f.profit)} profit</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {show.claims && (
        <div className="lv-rail-card">
          <Head title="Claims requiring attention" right={<Badge tone="warn">{attention.length}</Badge>} onRemove={rm("claims")} />
          <div className="lv-list">
            {attention.map(c => {
              const p = s.projects.find(x => x.id === c.projectId)!;
              const why = c.status === "Not started" ? "Due " + dateShort(p.nextValuation) + ", not started" : c.status === "Submitted" ? "Assessment overdue since " + dateShort(c.assessmentDue) : c.status === "Disputed" ? "Disputed by client QS" : c.status;
              return (
                <div key={c.id} className="lv-li click" style={{ padding: "9px 16px" }} onClick={() => c.projectId === "p01" ? navigate({ page: "Claims & Finance", tab: "claims", claim: c.status === "Not started" ? null : c.id }) : navigate({ page: "Claims & Finance", tab: "claims" })}>
                  <div className="grow"><div className="t" style={{ fontSize: 12.5 }}>{p.name}</div><div className="s">{c.ref} · {why}</div></div>
                  <span className="num" style={{ fontSize: 12 }}>{c.amount ? eur(c.amount) : "—"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {show.labour && (
        <div className="lv-rail-card">
          <Head title="Labour today" right={<span className="lv-small lv-faint">Tue 20 Oct</span>} onRemove={rm("labour")} />
          <div className="lv-mini-kpis" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}>
            <button onClick={() => navigate({ page: "Workforce", tab: "allocations" })}><div className="k">On site</div><div className="v">{staffToday + subsToday}</div><div className="h">{staffToday} staff · {subsToday} subs</div></button>
            <button onClick={() => navigate({ page: "Workforce", tab: "timesheets" })}><div className="k">Unconfirmed</div><div className="v" style={{ color: issues.length ? "var(--warn)" : "var(--ok)" }}>{issues.length}</div><div className="h">from Monday</div></button>
            <button onClick={() => navigate({ page: "Workforce", tab: "labour" })}><div className="k">Est. cost</div><div className="v">{eurShort(labourToday)}</div><div className="h">today</div></button>
          </div>
          <div className="lv-list">
            {Object.entries(bySite).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([pid, n]) => {
              const p = s.projects.find(x => x.id === pid)!;
              return <div key={pid} className="lv-li click" style={{ padding: "7px 16px" }} onClick={() => openProject(pid, "workforce")}>
                <span className="grow" style={{ fontSize: 12.5, color: "var(--ink)" }}>{p.name}</span>
                <span className="lv-small lv-muted">{personName(p.foremanId).split(" ")[0]} + {n - 1}</span>
              </div>;
            })}
          </div>
        </div>
      )}
    </>
  );
}
