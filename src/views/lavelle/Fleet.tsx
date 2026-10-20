/* Fleet & Fuel: vans, cards and the fuel card statement. Fills are matched
   to a project by van and driver; the ones that can't be matched wait here.
   Allocating a fill adds it to that project's Plant & fuel actual cost
   (allocateFuel), so the project financials move straight away. */

import { useState } from "react";
import {
  Page, Head, Card, Stat, Badge, DemoTag, Btn, Seg, Select, Bar, Table, HBars, Cols, Legend, KV, Note, Spark,
  ProjectLink, Drawer, Rows, Li, type Col
} from "./ui";
import { useLv, finOf, person, personName, project, setTab, allocateFuel, importFuelCsv, type LvState } from "../../lavelle/store";
import { fuelToAllocate } from "../../lavelle/answers";
import { markOverhead } from "../../lavelle/actions-fleet";
import { VEHICLES, FUEL_CARDS } from "../../lavelle/seed";
import { eur, eur2, eurShort, date, dateShort, dateDay, daysBetween, addDays, num, TODAY } from "../../lavelle/format";
import type { FuelTxn, FuelState, Vehicle, FuelCard } from "../../lavelle/types";
import "../../styles/lv-workforce.css";

/* ── helpers ─────────────────────────────────────────────────────────── */
const WEEK_FROM = "2026-10-12", WEEK_TO = "2026-10-18", MONTH_FROM = "2026-10-01";
const LAST30 = addDays(TODAY, -30);
const sum = (l: FuelTxn[], k: "total" | "litres" = "total") => l.reduce((n, f) => n + f[k], 0);
const inRange = (f: FuelTxn, a: string, b: string) => f.date >= a && f.date <= b;
const card = (id: string) => FUEL_CARDS.find(c => c.id === id) || null;
const vehicle = (id: string | null) => VEHICLES.find(v => v.id === id) || null;
const isPool = (c: FuelCard) => !c.holderId && !c.vehicleId;
const holder = (id: string | null) => id ? personName(id) : "No cardholder";
const ACTION: FuelState[] = ["Needs allocation", "Missing cardholder", "Investigate"];
const needsAction = (f: FuelTxn) => ACTION.includes(f.state);
const isAllocated = (f: FuelTxn) => f.state === "Allocated" || f.state === "Auto-allocated";
/** Neutral labels: a flag is something to check, never an accusation. */
const LABEL: Record<FuelState, string> = { "Auto-allocated": "Auto-allocated", "Allocated": "Allocated", "Needs allocation": "Needs a project", "Missing cardholder": "No cardholder", "Investigate": "To check", "Overhead": "Overhead" };
const stateTone = (st: FuelState) => needsAction({ state: st } as FuelTxn) ? "warn" : st === "Overhead" ? "ghost" : "ok";
const alertKind = (f: FuelTxn) => f.state === "Missing cardholder" ? "Missing cardholder" : f.state === "Investigate" ? "Check: unusual fill" : /saturday|sunday/i.test(f.flag) ? "Unexpected spend: weekend fill" : "Unallocated";

function isoWeek(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - day);
  const start = Date.UTC(dt.getUTCFullYear(), 0, 1);
  return Math.ceil(((dt.getTime() - start) / 86400000 + 1) / 7);
}
function mondayOf(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay() || 7;
  return addDays(iso, 1 - day);
}
function byWeek(fuel: FuelTxn[]) {
  const map = new Map<number, { wk: number; mon: string; list: FuelTxn[] }>();
  fuel.forEach(f => { const wk = isoWeek(f.date); const e = map.get(wk) || { wk, mon: mondayOf(f.date), list: [] }; e.list.push(f); map.set(wk, e); });
  return [...map.values()].sort((a, b) => a.wk - b.wk);
}
function groupSum(list: FuelTxn[], key: (f: FuelTxn) => string) {
  const m = new Map<string, number>();
  list.forEach(f => m.set(key(f), (m.get(key(f)) || 0) + f.total));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}
const projKey = (s: LvState) => (f: FuelTxn) => f.projectId ? (project(f.projectId, s)?.name || f.projectId) : f.state === "Overhead" ? "Overhead (office and pool)" : "Not allocated yet";
const C_ALLOC = "var(--lv-c1)", C_OVER = "var(--lv-c5)", C_TODO = "var(--lv-c4)";

export default function Fleet({ tab }: { tab: string }) {
  const s = useLv();
  const [sel, setSel] = useState<string | null>(null);
  const [veh, setVeh] = useState<string | null>(null);
  return (
    <Page>
      {tab === "overview" && <Overview s={s} openTxn={setSel} />}
      {tab === "vehicles" && <Vehicles s={s} openVeh={setVeh} />}
      {tab === "transactions" && <Transactions s={s} openTxn={setSel} />}
      {tab === "cards" && <Cards s={s} />}
      {tab === "allocation" && <Allocation s={s} />}
      {tab === "reports" && <Reports s={s} />}
      <TxnDrawer s={s} id={sel} onClose={() => setSel(null)} />
      <VehicleDrawer s={s} id={veh} onClose={() => setVeh(null)} openTxn={id => { setVeh(null); setSel(id); }} />
    </Page>
  );
}

/* ── the allocate / overhead control, used on several tabs ───────────── */
function FuelAction({ s, f, compact }: { s: LvState; f: FuelTxn; compact?: boolean }) {
  const [pid, setPid] = useState(f.suggestedProjectId || "");
  const sug = project(f.suggestedProjectId, s);
  const v = vehicle(f.vehicleId), c = card(f.cardId);
  return (
    <div className="lvw-fuel">
      <div className="main">
        <div className="t"><Badge tone="warn" dot>{LABEL[f.state]}</Badge><span>{dateDay(f.date)} {f.time}, {f.station}</span></div>
        <div className="s">
          {holder(f.holderId)}, card ••{c?.last4}{v ? ", " + v.reg + " " + v.make : ", no vehicle recorded"}. {f.flag}.
          {sug && <> Suggested: <b className="lv-ink">{sug.name}</b> ({sug.ref}).</>}
          {!compact && f.state === "Investigate" && " Worth a quick word with the cardholder before it's coded."}
        </div>
      </div>
      <span className="amt">{eur2(f.total)}</span>
      <div className="ctl">
        <Select value={pid} onChange={setPid} label="Project" options={[["", "Choose project"], ...s.projects.map(p => [p.id, p.ref + "  " + p.name] as [string, string])]} />
        <Btn kind="primary" size="sm" disabled={!pid} onClick={() => allocateFuel(f.id, pid)}>Allocate</Btn>
        <Btn size="sm" kind="ghost" onClick={() => markOverhead(f.id)}>Overhead</Btn>
      </div>
    </div>
  );
}

function ActionPanel({ s, title }: { s: LvState; title?: string }) {
  const todo = fuelToAllocate(s);
  return (
    <Card title={title || "Needs someone (" + todo.length + ")"} sub={todo.length ? eur2(sum(todo)) + " not on any project yet. Allocate adds it to that project's Plant & fuel cost." : undefined}
      tone={todo.length ? "warn" : undefined} flush>
      {todo.length ? todo.map(f => <FuelAction key={f.id} s={s} f={f} />)
        : <div style={{ padding: "4px 18px 12px" }}><Note tone="ok">Every fuel transaction is allocated to a project or to overhead.</Note></div>}
    </Card>
  );
}

/* ── Overview ────────────────────────────────────────────────────────── */
function Overview({ s, openTxn }: { s: LvState; openTxn: (id: string) => void }) {
  const wk = s.fuel.filter(f => inRange(f, WEEK_FROM, WEEK_TO));
  const mo = s.fuel.filter(f => f.date >= MONTH_FROM);
  const todo = fuelToAllocate(s);
  const weeks = byWeek(s.fuel);
  const nearLimit = FUEL_CARDS.map(c => ({ c, spend: sum(mo.filter(f => f.cardId === c.id)) })).filter(x => x.spend / x.c.limit >= 0.85);
  const byProj = groupSum(mo, projKey(s));
  const maxP = Math.max(1, ...byProj.map(x => x[1]));
  return (
    <>
      <Head eyebrow="Fleet & Fuel" title="Fleet and fuel" sub="Fuel card statement imported weekly and matched to projects by van and driver. Figures are from the simulated statement import."
        actions={<><DemoTag /><DemoTag sim>Card statement import</DemoTag><Btn kind="primary" size="sm" onClick={() => setTab("Fleet & Fuel", "transactions")}>Allocate fuel</Btn></>} />
      <div className="lv-grid lv-g6" style={{ marginBottom: 14 }}>
        <Stat hero label="Spend, 12–18 Oct" value={eur(sum(wk))} hint={wk.length + " fills, " + num(sum(wk, "litres")) + " L"} />
        <Stat label="October to date" value={eur(sum(mo))} hint={mo.length + " fills since 1 Oct"} />
        <Stat label="Litres, October" value={num(sum(mo, "litres"))} hint={VEHICLES.length + " vehicles on cards"} />
        <Stat label="Average €/L" value={"€" + (sum(mo) / (sum(mo, "litres") || 1)).toFixed(3)} hint="October, all stations" />
        <Stat label="To allocate" value={todo.length} tone={todo.length ? "warn" : "ok"} hint={todo.length ? eur2(sum(todo)) + " not on a project" : "All allocated"} onClick={() => setTab("Fleet & Fuel", "transactions")} />
        <Stat label="Active cards" value={FUEL_CARDS.filter(c => c.status === "Active").length} hint={nearLimit.length ? nearLimit.length + " near monthly limit" : "None near limit"} onClick={() => setTab("Fleet & Fuel", "cards")} />
      </div>
      <div className="lv-grid lv-g-2-1" style={{ marginBottom: 14 }}>
        <Card title="Weekly fuel spend" sub="By ISO week. Week 43 is to date." right={<Legend items={[["Projects", C_ALLOC], ["Overhead", C_OVER], ["To allocate", C_TODO]]} />}>
          <Cols height={200} fmt={eurShort} data={weeks.map(w => ({
            label: "Wk " + w.wk,
            parts: [{ v: sum(w.list.filter(isAllocated)), color: C_ALLOC, title: "Projects" }, { v: sum(w.list.filter(f => f.state === "Overhead")), color: C_OVER, title: "Overhead" }, { v: sum(w.list.filter(needsAction)), color: C_TODO, title: "To allocate" }]
          }))} />
        </Card>
        <Card title="Alerts" sub="Things to check, not conclusions" flush>
          <Rows>
            {todo.map(f => (
              <Li key={f.id} title={alertKind(f)} sub={dateShort(f.date) + " " + f.time + ", " + holder(f.holderId) + ", " + f.station + ". " + f.flag + "."}
                right={<span className="lv-num" style={{ width: "auto" }}>{eur2(f.total)}</span>} onClick={() => openTxn(f.id)} />
            ))}
            {nearLimit.map(x => (
              <Li key={x.c.id} title={"Card ••" + x.c.last4 + " near monthly limit"} sub={holder(x.c.holderId) + ": " + eur(x.spend) + " of " + eur(x.c.limit) + " in October."} right={<Badge tone="warn">{Math.round(x.spend / x.c.limit * 100)}%</Badge>} onClick={() => setTab("Fleet & Fuel", "cards")} />
            ))}
            {todo.length === 0 && nearLimit.length === 0 && <Li title="Nothing to check" sub="Every fill is allocated and no card is near its limit." />}
          </Rows>
        </Card>
      </div>
      <div className="lv-grid lv-g-2-1">
        <Card title="October spend by project" sub="Allocated fills land in each project's Plant & fuel cost" right={<Btn size="sm" kind="ghost" onClick={() => setTab("Fleet & Fuel", "allocation")}>Project allocation</Btn>}>
          <HBars items={byProj.map(([k, v]) => ({ label: k, value: v, max: maxP, right: eur(v), tone: k === "Not allocated yet" ? "warn" as const : k.startsWith("Overhead") ? "neutral" as const : undefined }))} />
        </Card>
        <Card title="Fleet" sub={VEHICLES.length + " vehicles, " + FUEL_CARDS.length + " cards"}>
          <KV items={[
            ["Vans", VEHICLES.filter(v => v.kind === "Van").length], ["Cars", VEHICLES.filter(v => v.kind === "Car").length],
            ["Dublin", VEHICLES.filter(v => v.base === "Dublin").length], ["Galway", VEHICLES.filter(v => v.base === "Galway").length],
            ["Service due ≤14 days", VEHICLES.filter(v => daysBetween(TODAY, v.nextService) <= 14).length], ["Pool card", "••" + (FUEL_CARDS.find(isPool)?.last4 || "")]
          ]} />
          <div style={{ marginTop: 12 }}><Btn size="sm" onClick={() => setTab("Fleet & Fuel", "vehicles")}>Vehicles</Btn></div>
        </Card>
      </div>
    </>
  );
}

/* ── Vehicles ────────────────────────────────────────────────────────── */
function Vehicles({ s, openVeh }: { s: LvState; openVeh: (id: string) => void }) {
  const spend30 = (v: Vehicle) => sum(s.fuel.filter(f => f.vehicleId === v.id && f.date >= LAST30));
  const due = (v: Vehicle) => daysBetween(TODAY, v.nextService);
  const total30 = VEHICLES.reduce((n, v) => n + spend30(v), 0);
  const maxS = Math.max(1, ...VEHICLES.map(spend30));
  const cols: Col<Vehicle>[] = [
    { key: "r", label: "Reg", render: v => <span className="lv-mono strong">{v.reg}</span> },
    { key: "m", label: "Vehicle", render: v => v.make, hideMobile: true },
    { key: "d", label: "Driver", render: v => v.driverId ? personName(v.driverId) : <span className="lv-faint">Spare, no driver</span> },
    { key: "c", label: "Card", render: v => <span className="lv-mono">••{card(v.cardId)?.last4}</span> },
    { key: "b", label: "Base", render: v => v.base, hideMobile: true },
    { key: "o", label: "Odometer", align: "r", render: v => num(v.odometer) + " km", hideMobile: true },
    { key: "n", label: "Next service", render: v => due(v) <= 14 ? <span className="lv-row" style={{ gap: 6, flexWrap: "nowrap" }}><span className="lv-warn">{dateShort(v.nextService)}</span><Badge tone="warn">{due(v)} days</Badge></span> : date(v.nextService) },
    { key: "f", label: "Fuel, last 30 days", align: "r", render: v => <span className="lv-row" style={{ gap: 8, justifyContent: "flex-end", flexWrap: "nowrap" }}><span className="lv-mob-hide" style={{ width: 60 }}><Bar value={spend30(v) / maxS} thin /></span>{eur(spend30(v))}</span>, foot: eur(total30) }
  ];
  return (
    <>
      <Head eyebrow="Fleet & Fuel" title="Vehicles" sub={"Fuel spend since " + date(LAST30) + ". Click a vehicle for its fills."} actions={<DemoTag />} />
      <div className="lv-grid lv-g4" style={{ marginBottom: 14 }}>
        <Stat label="Vehicles" value={VEHICLES.length} hint={VEHICLES.filter(v => v.kind === "Van").length + " vans, " + VEHICLES.filter(v => v.kind === "Car").length + " cars"} />
        <Stat label="Fuel, last 30 days" value={eur(total30)} hint={"€" + Math.round(total30 / VEHICLES.length) + " per vehicle on average"} />
        <Stat label="Service due within 14 days" value={VEHICLES.filter(v => due(v) <= 14).length} tone="warn" hint={"Next: " + dateShort(VEHICLES.map(v => v.nextService).sort()[0])} />
        <Stat label="Average odometer" value={num(VEHICLES.reduce((n, v) => n + v.odometer, 0) / VEHICLES.length) + " km"} hint="Readings from the last service" />
      </div>
      <Card title="Fleet register" flush>
        <Table cols={cols} rows={VEHICLES} onRow={v => openVeh(v.id)} foot dense />
      </Card>
    </>
  );
}

/* ── Transactions ────────────────────────────────────────────────────── */
type TxFilter = "all" | "action" | "allocated" | "overhead";
function Transactions({ s, openTxn }: { s: LvState; openTxn: (id: string) => void }) {
  const [flt, setFlt] = useState<TxFilter>("all");
  const todo = fuelToAllocate(s);
  const pass = (f: FuelTxn) => flt === "all" || (flt === "action" ? needsAction(f) : flt === "allocated" ? isAllocated(f) : f.state === "Overhead");
  const rows = s.fuel.filter(pass).sort((a, b) => (needsAction(b) ? 1 : 0) - (needsAction(a) ? 1 : 0) || (b.date + b.time).localeCompare(a.date + a.time));
  const cols: Col<FuelTxn>[] = [
    { key: "d", label: "Date", render: f => dateShort(f.date) },
    { key: "t", label: "Time", render: f => <span className="lv-mono">{f.time}</span>, hideMobile: true },
    { key: "h", label: "Cardholder", render: f => f.holderId ? personName(f.holderId) : <span className="lv-warn">No cardholder</span> },
    { key: "c", label: "Card", render: f => <span className="lv-mono">••{card(f.cardId)?.last4}</span>, hideMobile: true },
    { key: "v", label: "Vehicle", render: f => f.vehicleId ? <span className="lv-mono">{vehicle(f.vehicleId)?.reg}</span> : <span className="lv-faint">None</span>, hideMobile: true },
    { key: "st", label: "Station", render: f => f.station, hideMobile: true },
    { key: "l", label: "Litres", align: "r", render: f => f.litres.toFixed(1), foot: num(sum(rows, "litres")) },
    { key: "p", label: "€/L", align: "r", render: f => f.ppl.toFixed(3), hideMobile: true },
    { key: "tot", label: "Total", align: "r", cls: "strong", render: f => eur2(f.total), foot: eur2(sum(rows)) },
    { key: "pr", label: "Project", render: f => f.projectId ? <ProjectLink id={f.projectId} short /> : f.state === "Overhead" ? <span className="lv-faint">Overhead</span> : <span className="lv-warn">Not allocated</span> },
    { key: "s", label: "Review", render: f => <Badge tone={stateTone(f.state)} dot>{LABEL[f.state]}</Badge> }
  ];
  return (
    <>
      <Head eyebrow="Fleet & Fuel" title="Fuel transactions" sub="Card statement from 14 Sep. Routine fills are auto-allocated to the driver's site; anything that can't be matched waits for a decision."
        actions={<><DemoTag /><DemoTag sim>Statement import</DemoTag></>} />
      <div style={{ marginBottom: 14 }}><ActionPanel s={s} /></div>
      <Card title={"Transactions (" + rows.length + ")"} sub="Flagged lines first, then newest. Click a line for detail." flush
        right={<Seg<TxFilter> options={[["all", "All"], ["action", "Needs action " + todo.length], ["allocated", "Allocated"], ["overhead", "Overhead"]]} value={flt} onChange={setFlt} />}>
        <Table cols={cols} rows={rows} onRow={f => openTxn(f.id)} rowClass={f => needsAction(f) ? "hl" : ""} dense foot maxH={560} />
      </Card>
    </>
  );
}

/* ── Cards ───────────────────────────────────────────────────────────── */
function Cards({ s }: { s: LvState }) {
  const mo = s.fuel.filter(f => f.date >= MONTH_FROM);
  const spend = (c: FuelCard) => sum(mo.filter(f => f.cardId === c.id));
  const totalLimit = FUEL_CARDS.reduce((n, c) => n + c.limit, 0);
  const totalSpend = FUEL_CARDS.reduce((n, c) => n + spend(c), 0);
  // 20 of 31 days gone: a card on pace for its limit sits at about 65%
  const pace = daysBetween("2026-09-30", TODAY) / 31;
  const cols: Col<FuelCard>[] = [
    { key: "c", label: "Card", render: c => <span className="lv-mono strong">••{c.last4}</span> },
    { key: "h", label: "Holder", render: c => c.holderId ? personName(c.holderId) : isPool(c) ? <span className="lv-warn">Pool card, no holder</span> : <span className="lv-faint">Spare van, no driver</span> },
    { key: "v", label: "Vehicle", render: c => c.vehicleId ? <span className="lv-mono">{vehicle(c.vehicleId)?.reg}</span> : <span className="lv-faint">None</span>, hideMobile: true },
    { key: "l", label: "Monthly limit", align: "r", render: c => eur(c.limit), foot: eur(totalLimit) },
    { key: "s", label: "October", align: "r", render: c => eur(spend(c)), foot: eur(totalSpend) },
    { key: "b", label: "Spend vs limit", render: c => { const u = spend(c) / c.limit; return <span className="lv-row" style={{ gap: 8, flexWrap: "nowrap" }}><span style={{ width: 110 }}><Bar value={u} target={pace} tone={u >= 1 ? "bad" : u >= 0.85 ? "warn" : undefined} /></span><span className="lv-small lv-muted">{Math.round(u * 100)}%</span></span>; } },
    { key: "st", label: "Status", render: c => <Badge tone={c.status === "Active" ? "ok" : "bad"} dot>{c.status}</Badge> }
  ];
  const pool = FUEL_CARDS.find(isPool);
  return (
    <>
      <Head eyebrow="Fleet & Fuel" title="Fuel cards" sub="Monthly limits per card. The marker on each bar is where a card on pace for its limit would be today (20 of 31 days)." actions={<DemoTag />} />
      <div className="lv-grid lv-g4" style={{ marginBottom: 14 }}>
        <Stat label="Active cards" value={FUEL_CARDS.filter(c => c.status === "Active").length} hint={FUEL_CARDS.filter(c => c.holderId).length + " with a holder, " + FUEL_CARDS.filter(c => !c.holderId).length + " without"} />
        <Stat label="October spend" value={eur(totalSpend)} hint={"of " + eur(totalLimit) + " combined limit"} />
        <Stat label="Above pace" value={FUEL_CARDS.filter(c => spend(c) / c.limit > pace).length} hint="Spending faster than the month" />
        <Stat label="Pool card" value={pool ? "••" + pool.last4 : "None"} tone="warn" hint="No holder or vehicle recorded. Assign one to stop unattributed fills." />
      </div>
      <Card title="Card register" flush>
        <Table cols={cols} rows={FUEL_CARDS} dense foot />
      </Card>
    </>
  );
}

/* ── Project allocation ──────────────────────────────────────────────── */
function Allocation({ s }: { s: LvState }) {
  const mo = s.fuel.filter(f => f.date >= MONTH_FROM);
  const manual = s.fuel.filter(f => f.state === "Allocated");
  const rows = s.projects.map(p => {
    const f = finOf(p, s);
    const mine = s.fuel.filter(x => x.projectId === p.id && isAllocated(x));
    return { p, oct: sum(mine.filter(x => x.date >= MONTH_FROM)), all: sum(mine), session: sum(mine.filter(x => x.state === "Allocated")), plant: f.actualByCat.plant, budget: f.budgetByCat.plant };
  }).sort((a, b) => b.all - a.all);
  type R = typeof rows[number];
  const cols: Col<R>[] = [
    { key: "p", label: "Project", render: r => <ProjectLink id={r.p.id} />, cls: "strong", foot: "All projects" },
    { key: "o", label: "Fuel, October", align: "r", render: r => eur2(r.oct), foot: eur2(rows.reduce((n, r) => n + r.oct, 0)) },
    { key: "a", label: "Fuel since 14 Sep", align: "r", render: r => eur2(r.all), foot: eur2(rows.reduce((n, r) => n + r.all, 0)), hideMobile: true },
    { key: "s", label: "Allocated today", align: "r", render: r => r.session ? <Badge tone="ok">+{eur2(r.session)}</Badge> : <span className="lv-faint">None</span>, foot: eur2(sum(manual)) },
    { key: "pl", label: "Plant & fuel posted", align: "r", render: r => eur(r.plant), foot: eur(rows.reduce((n, r) => n + r.plant, 0)) },
    { key: "b", label: "of budget", render: r => <span className="lv-row" style={{ gap: 8, flexWrap: "nowrap" }}><span style={{ width: 70 }}><Bar value={r.budget ? r.plant / r.budget : 0} thin /></span><span className="lv-small lv-muted">{eur(r.budget)}</span></span>, hideMobile: true }
  ];
  const log = s.activity.filter(a => a.title === "Fuel transaction allocated" || a.title === "Fuel transaction set to overhead");
  return (
    <>
      <Head eyebrow="Fleet & Fuel" title="Project allocation" sub="Allocating a fill adds it to that project's Plant & fuel actual cost. Check the project's column change after you allocate."
        actions={<DemoTag />} />
      <div className="lv-grid lv-g4" style={{ marginBottom: 14 }}>
        <Stat label="On projects, October" value={eur(sum(mo.filter(isAllocated)))} hint={mo.filter(isAllocated).length + " fills"} />
        <Stat label="Overhead, October" value={eur(sum(mo.filter(f => f.state === "Overhead")))} hint="Office cars and pool card" />
        <Stat label="Still to allocate" value={eur2(sum(fuelToAllocate(s)))} tone={fuelToAllocate(s).length ? "warn" : "ok"} hint={fuelToAllocate(s).length + " transactions"} />
        <Stat hero label="Allocated in this session" value={eur2(sum(manual))} hint={manual.length ? manual.length + (manual.length === 1 ? " fill" : " fills") + " moved into project cost" : "Allocate one below and watch the table"} />
      </div>
      <div className="lv-grid lv-g-3-2">
        <Card title="Fuel and Plant & fuel by project" sub="Plant & fuel posted comes from project financials (finOf), so it includes everything allocated here" flush>
          <Table cols={cols} rows={rows} rowClass={r => r.session ? "hl" : ""} foot dense />
        </Card>
        <div className="lv-stack">
          <ActionPanel s={s} title="Allocate now" />
          <Card title="Decided today" flush>
            <Rows>
              {log.map(a => <Li key={a.id} title={a.title} sub={a.note} right={<span className="lv-mono lv-small lv-faint">{a.time}</span>} />)}
              {!log.length && <Li title="Nothing decided yet" sub="Allocations and overhead decisions show here with the time and who made them." />}
            </Rows>
          </Card>
        </div>
      </div>
    </>
  );
}

/* ── Reports ─────────────────────────────────────────────────────────── */
function Reports({ s }: { s: LvState }) {
  const weeks = byWeek(s.fuel);
  const last30 = s.fuel.filter(f => f.date >= LAST30);
  const sep = s.fuel.filter(f => f.date < MONTH_FROM), oct = s.fuel.filter(f => f.date >= MONTH_FROM);
  const sepDays = daysBetween("2026-09-13", "2026-09-30"), octDays = daysBetween("2026-09-30", "2026-10-19");
  const drivers = groupSum(last30, f => holder(f.holderId)).slice(0, 10);
  const stations = groupSum(last30, f => f.station).slice(0, 10);
  const maxD = Math.max(1, ...drivers.map(d => d[1])), maxSt = Math.max(1, ...stations.map(d => d[1]));
  const imports = s.activity.filter(a => /fuel csv|imported transactions/i.test(a.title));
  const ppl = weeks.map(w => sum(w.list) / (sum(w.list, "litres") || 1));
  return (
    <>
      <Head eyebrow="Fleet & Fuel" title="Fuel reports" sub={"Statement data from 14 Sep to " + date(s.fuel.reduce((m, f) => f.date > m ? f.date : m, "")) + "."} actions={<DemoTag />} />
      <div className="lv-grid lv-g-2-1" style={{ marginBottom: 14 }}>
        <Card title="Weekly spend" sub="ISO weeks, week commencing Monday. Week 43 is to date." right={<Legend items={[["Projects", C_ALLOC], ["Overhead", C_OVER], ["To allocate", C_TODO]]} />}>
          <Cols height={190} fmt={eurShort} data={weeks.map(w => ({
            label: dateShort(w.mon),
            parts: [{ v: sum(w.list.filter(isAllocated)), color: C_ALLOC }, { v: sum(w.list.filter(f => f.state === "Overhead")), color: C_OVER }, { v: sum(w.list.filter(needsAction)), color: C_TODO }]
          }))} />
          <div className="lv-row" style={{ marginTop: 12 }}>
            <span className="lv-small lv-muted">Average €/L by week</span><Spark values={ppl} w={140} h={26} />
            <span className="lv-small lv-mono">€{ppl[0].toFixed(3)} to €{ppl[ppl.length - 1].toFixed(3)}</span>
          </div>
        </Card>
        <Card title="Monthly" sub="September is a part month (data starts 14 Sep)">
          <Cols height={150} fmt={eurShort} data={[
            { label: "Sep (14–30)", parts: [{ v: sum(sep.filter(isAllocated)), color: C_ALLOC }, { v: sum(sep.filter(f => f.state === "Overhead")), color: C_OVER }, { v: sum(sep.filter(needsAction)), color: C_TODO }] },
            { label: "Oct to date", parts: [{ v: sum(oct.filter(isAllocated)), color: C_ALLOC }, { v: sum(oct.filter(f => f.state === "Overhead")), color: C_OVER }, { v: sum(oct.filter(needsAction)), color: C_TODO }] }
          ]} />
          <div style={{ marginTop: 12 }}>
            <KV items={[["Sep per day", eur(sum(sep) / sepDays)], ["Oct per day", eur(sum(oct) / octDays)], ["Sep litres", num(sum(sep, "litres"))], ["Oct litres", num(sum(oct, "litres"))]]} />
          </div>
        </Card>
      </div>
      <div className="lv-grid lv-g2" style={{ marginBottom: 14 }}>
        <Card title="By driver" sub="Last 30 days, top 10">
          <HBars items={drivers.map(([k, v]) => ({ label: k, value: v, max: maxD, right: eur(v), tone: k === "No cardholder" ? "warn" as const : undefined }))} />
        </Card>
        <Card title="By station" sub="Last 30 days, top 10">
          <HBars items={stations.map(([k, v]) => ({ label: k, value: v, max: maxSt, right: eur(v) }))} />
        </Card>
      </div>
      <Card title={<span className="lv-row" style={{ gap: 8 }}><DemoTag sim>Supplier CSV import</DemoTag>Fuel card statement</span>}
        sub="The fuel card supplier is being switched from DCI to a new provider (name to be confirmed), so the import reads any supplier's CSV through a column map rather than a fixed connector."
        right={<Btn kind="primary" size="sm" onClick={importFuelCsv}>Import statement CSV</Btn>}>
        <div className="lvw-map">
          {[["Date", "Transaction date"], ["Time", "Transaction time"], ["Card", "Card number (last 4)"], ["Reg", "Vehicle registration"], ["Site", "Station name"], ["Litres", "Quantity"], ["Price", "Unit price"], ["Total", "Gross amount"]].map(([k, v]) => <div key={k}><b>{k}</b>{v}</div>)}
        </div>
        <div className="lv-small lv-muted" style={{ marginTop: 12 }}>Duplicates are skipped by card, date, time and amount. Matched rows are allocated by van and driver; the rest land in Fuel transactions for a decision.</div>
        {imports.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Rows>{imports.slice(0, 4).map(a => <Li key={a.id} title={a.title} sub={a.note} right={<span className="lv-mono lv-small lv-faint">{dateShort(a.at)} {a.time}</span>} />)}</Rows>
          </div>
        )}
      </Card>
    </>
  );
}

/* ── Drawers ─────────────────────────────────────────────────────────── */
function TxnDrawer({ s, id, onClose }: { s: LvState; id: string | null; onClose: () => void }) {
  const f = id ? s.fuel.find(x => x.id === id) : null;
  if (!f) return null;
  const v = vehicle(f.vehicleId), c = card(f.cardId), h = person(f.holderId);
  return (
    <Drawer open onClose={onClose} eyebrow={"Fuel transaction, " + dateDay(f.date)} title={eur2(f.total) + " at " + f.station}>
      <KV items={[["Date", date(f.date) + " " + f.time], ["Cardholder", h ? h.name : "No cardholder"], ["Card", "••" + (c?.last4 || "")], ["Vehicle", v ? v.reg + " " + v.make : "None recorded"],
        ["Litres", f.litres.toFixed(1)], ["€/L", f.ppl.toFixed(3)], ["Total", eur2(f.total)], ["Review", LABEL[f.state]]]} />
      <div style={{ marginTop: 14 }}>
        {needsAction(f) ? <Card title="Decide" sub={f.flag} flush><FuelAction s={s} f={f} compact /></Card>
          : <Note tone={f.state === "Overhead" ? undefined : "ok"}>{f.projectId ? <>Allocated to <ProjectLink id={f.projectId} /> Plant & fuel{f.state === "Auto-allocated" ? " automatically by van and driver" : ""}.</> : "Kept as company overhead, not on any project."}</Note>}
      </div>
    </Drawer>
  );
}

function VehicleDrawer({ s, id, onClose, openTxn }: { s: LvState; id: string | null; onClose: () => void; openTxn: (id: string) => void }) {
  const v = vehicle(id);
  if (!v) return null;
  const fills = s.fuel.filter(f => f.vehicleId === v.id);
  const c = card(v.cardId);
  return (
    <Drawer open onClose={onClose} eyebrow={v.kind + ", " + v.base} title={v.reg + " " + v.make}>
      <KV items={[["Driver", v.driverId ? personName(v.driverId) : "No driver"], ["Card", "••" + (c?.last4 || "") + ", limit " + eur(c?.limit || 0)], ["Odometer", num(v.odometer) + " km"], ["Next service", date(v.nextService)],
        ["Fills since 14 Sep", fills.length], ["Spend since 14 Sep", eur2(sum(fills))]]} />
      <Card title="Fills" style={{ marginTop: 14 }} flush>
        <Rows>
          {fills.slice(0, 14).map(f => <Li key={f.id} title={dateDay(f.date) + " " + f.time + ", " + f.station} sub={f.litres.toFixed(1) + " L at €" + f.ppl.toFixed(3) + ". " + (f.projectId ? project(f.projectId, s)?.ref : LABEL[f.state])}
            right={<span className="lv-num" style={{ width: "auto" }}>{eur2(f.total)}</span>} onClick={() => openTxn(f.id)} />)}
          {!fills.length && <Li title="No fills recorded" />}
        </Rows>
      </Card>
    </Drawer>
  );
}
