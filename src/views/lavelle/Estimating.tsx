/* Estimating: enquiry to contract. Two estimators, a turnaround rule from the
   consultation (under about €30,000 often priced within a day; larger work
   2 days to 2 weeks), a simulated Countfire take-off, and a quote builder that
   converts into a draft contract schedule ready for monthly claims. */

import { useState, type ReactNode } from "react";
import {
  Page, Head, DemoTag, Card, Stat, Badge, StatusBadge, Btn, Seg, Bar, Table, HBars, Note, ProjectLink, Drawer, Steps, KV,
  Rows, Li, Avatar, type Col
} from "./ui";
import {
  useLv, navigate, openProject, setTab, personName, person, project, projectByRef, toast,
  quoteTotals, setQuoteLine, setMarkup, setLabourRate, setQuoteStatus, resetQuote, type LvState
} from "../../lavelle/store";
import { TAKEOFF_DRAWINGS, TAKEOFF_ITEMS, TYPE_LABEL } from "../../lavelle/seed";
import { eur, eurShort, pct, pctInt, date, dateShort } from "../../lavelle/format";
import type { Enquiry, ProjectType } from "../../lavelle/types";
import {
  ESTIMATORS, STAGES, isOpenEnquiry, band, effortLeft, stageIndex, allowedDays, daysLeft, isSameDay, isTight, nextStage,
  advanceEnquiry, generateEstimateFromTakeoff, becameContract
} from "../../lavelle/actions-estimating";
import "../../styles/lv-estimating.css";

const TITLES: Record<string, [string, string]> = {
  overview: ["Estimating", "Enquiry to contract for Niall Hennessy and Sinéad Corcoran. Jobs under about €30,000 are often priced within a day; larger estimates take 2 days to 2 weeks."],
  enquiries: ["Enquiries", "Every live enquiry not yet won or lost. Click one for the detail and next step."],
  estimates: ["Estimates", "Estimates being priced or reviewed, and tenders out with clients."],
  takeoffs: ["Take-offs", "Countfire counts symbols on the drawings. Pulse imports the counts and maps each one to a contract heading."],
  quote: ["Quote Builder", "QUO-2026-061, Cherrywood Office Fit-out Level 2. Edit quantities, rates and labour; totals update as you type."],
  wonlost: ["Won & Lost", "Decided tenders this year: win rate, why we lost, and what we won by type."]
};

const daysLabel = (n: number) => n < 0 ? Math.abs(n) + "d over" : n === 0 ? "Today" : n === 1 ? "1 day" : n + " days";
const daysTone = (n: number): "bad" | "warn" | "" => n <= 0 ? "bad" : n <= 2 ? "warn" : "";

export default function Estimating({ tab }: { tab: string }) {
  const s = useLv();
  const [enq, setEnq] = useState<string | null>(null);
  const [title, sub] = TITLES[tab] || TITLES.overview;
  let body: ReactNode;
  switch (tab) {
    case "enquiries": body = <Enquiries s={s} onEnq={setEnq} />; break;
    case "estimates": body = <Estimates s={s} onEnq={setEnq} />; break;
    case "takeoffs": body = <Takeoffs s={s} />; break;
    case "quote": body = <Quote s={s} />; break;
    case "wonlost": body = <WonLost s={s} onEnq={setEnq} />; break;
    default: body = <Overview s={s} onEnq={setEnq} />;
  }
  return (
    <Page>
      <Head eyebrow={tab === "overview" ? "Lavelle Electrical Group" : "Estimating"} title={title} sub={sub}
        actions={<>{tab === "takeoffs" && <DemoTag sim>Simulated Countfire export</DemoTag>}<DemoTag /></>} />
      {body}
      <EnquiryDrawer id={enq} onClose={() => setEnq(null)} />
    </Page>
  );
}

/* ── shared ───────────────────────────────────────────────────────────── */

function Flags({ e }: { e: Enquiry }) {
  return <>
    {isSameDay(e) && <Badge tone="bad">Same-day job</Badge>}
    {isTight(e) && <Badge tone="warn">Tight deadline</Badge>}
  </>;
}

function queueCols(): Col<Enquiry>[] {
  return [
    { key: "ref", label: "Enquiry", cls: "wrap", render: e => <div><div className="lv-ink" style={{ fontWeight: 500 }}>{e.project}</div><div className="lv-small lv-muted"><span className="lv-mono">{e.ref}</span>, {e.client}</div></div> },
    { key: "est", label: "Estimator", render: e => <span className="lv-row" style={{ gap: 7, flexWrap: "nowrap" }}><Avatar name={personName(e.estimatorId)} />{personName(e.estimatorId).split(" ")[0]}</span>, hideMobile: true },
    { key: "val", label: "Value", align: "r", cls: "strong", render: e => eur(e.value) },
    { key: "band", label: "Size band", render: e => band(e.value).label, hideMobile: true },
    { key: "tt", label: "Expected turnaround", render: e => band(e.value).turnaround, hideMobile: true },
    { key: "due", label: "Due", render: e => dateShort(e.due) },
    { key: "left", label: "Days left", align: "r", render: e => { const d = daysLeft(e); return <span className={daysTone(d) ? "lv-" + daysTone(d) : ""}>{daysLabel(d)}</span>; } },
    { key: "st", label: "Stage", render: e => <div className="lv-row" style={{ gap: 6, flexWrap: "nowrap" }}><StatusBadge s={e.stage} /><Flags e={e} /></div> }
  ];
}

function Workload({ s }: { s: LvState }) {
  const rows = ESTIMATORS.map(id => {
    const mine = s.enquiries.filter(e => e.estimatorId === id && isOpenEnquiry(e)).sort((a, b) => a.due.localeCompare(b.due));
    return { id, mine, value: mine.reduce((n, e) => n + e.value, 0), effort: mine.reduce((n, e) => n + effortLeft(e), 0), next: mine[0] };
  });
  const cap = 10;
  return (
    <Card title="Workload by estimator" sub={"Estimating days left against a " + cap + "-day fortnight. Effort per size band is a demo assumption."} right={<DemoTag />}>
      <div className="lv-stack" style={{ gap: 16 }}>
        {rows.map(r => (
          <div key={r.id}>
            <div className="lv-row" style={{ flexWrap: "nowrap" }}>
              <Avatar name={personName(r.id)} />
              <div style={{ minWidth: 0 }}>
                <div className="lv-ink" style={{ fontWeight: 600, fontSize: 13 }}>{personName(r.id)}</div>
                <div className="lv-small lv-muted">{person(r.id)?.role}</div>
              </div>
              <span className="lv-spacer" />
              <div style={{ textAlign: "right" }}>
                <div className="lv-ink" style={{ fontWeight: 600 }}>{r.effort.toFixed(1)} days</div>
                <div className="lv-small lv-muted">{r.mine.length} open, {eurShort(r.value)}</div>
              </div>
            </div>
            <div style={{ marginTop: 9 }}><Bar value={r.effort / cap} tone={r.effort > cap * 0.8 ? "bad" : r.effort > cap * 0.5 ? "warn" : "ok"} target={0.8} /></div>
            <div className="lv-row lv-small" style={{ marginTop: 8, gap: 6 }}>
              {r.mine.map(e => <Badge key={e.id} tone={isSameDay(e) ? "bad" : daysTone(daysLeft(e)) || "ghost"}>{e.ref.slice(-3)} {dateShort(e.due)}</Badge>)}
            </div>
            {r.next && <div className="lv-small lv-muted" style={{ marginTop: 6 }}>Next due: {r.next.project}, {daysLabel(daysLeft(r.next)).toLowerCase()}.</div>}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── overview ─────────────────────────────────────────────────────────── */

function Overview({ s, onEnq }: { s: LvState; onEnq: (id: string) => void }) {
  const open = s.enquiries.filter(isOpenEnquiry).sort((a, b) => a.due.localeCompare(b.due));
  const submitted = s.enquiries.filter(e => e.stage === "Submitted");
  const won = s.enquiries.filter(e => e.stage === "Won"), lost = s.enquiries.filter(e => e.stage === "Lost");
  const due2 = open.filter(e => daysLeft(e) <= 2);
  const sameDay = s.enquiries.filter(isSameDay);
  const en102 = s.enquiries.find(e => e.id === "en102");
  const review = open.filter(e => e.stage === "Review");
  const qt = quoteTotals(s);

  const counts = STAGES.map((st, i) => {
    const list = s.enquiries.filter(e => stageIndex(e, s) === i);
    return { st, i, n: list.length, v: list.reduce((n, e) => n + e.value, 0) };
  });
  const maxV = Math.max(1, ...counts.map(c => c.v));
  const goTab = (i: number) => setTab("Estimating", i <= 1 ? "enquiries" : i === 2 ? "takeoffs" : i <= 5 ? "estimates" : "wonlost");
  const cherry = s.enquiries.find(e => e.id === "en101");

  return (
    <div className="lv-stack">
      <div className="lv-grid lv-g6">
        <Stat hero label="Open enquiries" value={open.length} hint={eur(open.reduce((n, e) => n + e.value, 0)) + " being priced"} onClick={() => setTab("Estimating", "enquiries")} />
        <Stat label="Due in 2 days" value={due2.length} tone={due2.length ? "warn" : "ok"} hint={due2.map(e => e.ref.slice(-3)).join(", ") || "Nothing urgent"} />
        <Stat label="Same-day jobs" value={sameDay.length} tone={sameDay.length ? "bad" : "ok"} hint={sameDay.length ? "Under €30k, due within a day" : "None open"} onClick={() => sameDay[0] && onEnq(sameDay[0].id)} />
        <Stat label="Awaiting Martin" value={review.length} tone={review.length ? "warn" : "ok"} hint={review.length ? eur(review.reduce((n, e) => n + e.value, 0)) + " in review" : "No reviews waiting"} onClick={() => setTab("Estimating", "estimates")} />
        <Stat label="Out with clients" value={eurShort(submitted.reduce((n, e) => n + e.value, 0))} hint={submitted.length + " submitted, awaiting decision"} />
        <Stat label="Win rate" value={won.length + lost.length ? pctInt(won.length / (won.length + lost.length)) : "0%"} hint={won.length + " won of " + (won.length + lost.length) + " decided"} onClick={() => setTab("Estimating", "wonlost")} />
      </div>

      {en102 && isSameDay(en102) && (
        <Note tone="bad"><b>{en102.ref} {en102.project}</b> is a same-day job: received {dateShort(en102.received)}, due {daysLeft(en102) === 0 ? "today" : dateShort(en102.due)}, {eur(en102.value)} with {personName(en102.estimatorId)}. Under €30k, so it should be priced and out within the day. <span className="lv-link" onClick={() => onEnq(en102.id)}>Open enquiry</span></Note>
      )}

      <Card title="Pipeline" sub="Enquiry, drawings, take-off, cost estimate, review, quote, won or lost, contract. Count and value at each stage.">
        <div className="lv-pipe">
          {counts.map(c => (
            <button key={c.st} className={"lv-pipe-st" + (c.i === 4 && c.n ? " hot" : "") + (c.i >= 6 ? " end" : "")} onClick={() => goTab(c.i)}>
              <div className="k">{c.i + 1}. {c.st}</div>
              <div className="n">{c.n}</div>
              <div className="v">{c.v ? eurShort(c.v) : "None"}</div>
              <div className="b"><i style={{ width: (c.v / maxV) * 100 + "%" }} /></div>
            </button>
          ))}
        </div>
        {cherry && (
          <div style={{ marginTop: 14 }}>
            <div className="lv-small lv-muted" style={{ marginBottom: 6 }}>Following one job through: <b className="lv-ink">{cherry.ref} {cherry.project}</b>, quote {eur(qt.sell)} ({s.quoteStatus.toLowerCase()})</div>
            <Steps steps={STAGES} at={s.quoteStatus === "Contract drafted" ? 8 : stageIndex(cherry, s)} />
          </div>
        )}
      </Card>

      <div className="lv-grid lv-g-2-1">
        <Card title="Estimating queue" sub="Open enquiries by due date, with size band and the turnaround that band usually takes" flush>
          <Table rows={open} cols={queueCols()} onRow={e => onEnq(e.id)} rowClass={e => isSameDay(e) ? "hl" : ""} />
        </Card>
        <Workload s={s} />
      </div>
    </div>
  );
}

/* ── enquiries ────────────────────────────────────────────────────────── */

function Enquiries({ s, onEnq }: { s: LvState; onEnq: (id: string) => void }) {
  const [who, setWho] = useState<string>("all");
  const rows = s.enquiries.filter(e => e.stage !== "Won" && e.stage !== "Lost" && (who === "all" || e.estimatorId === who)).sort((a, b) => a.due.localeCompare(b.due));
  const cols: Col<Enquiry>[] = [
    ...queueCols().slice(0, 3),
    { key: "type", label: "Type", render: e => TYPE_LABEL[e.type], hideMobile: true },
    { key: "reg", label: "Region", render: e => e.region, hideMobile: true },
    { key: "rec", label: "Received", render: e => dateShort(e.received), hideMobile: true },
    ...queueCols().slice(3),
    { key: "src", label: "Source", render: e => e.source, hideMobile: true }
  ];
  cols[2] = { ...cols[2], foot: eur(rows.reduce((n, e) => n + e.value, 0)) };
  cols[0] = { ...cols[0], foot: rows.length + " enquiries" };
  const byBand = ["small", "medium", "large", "major"].map(k => rows.filter(e => band(e.value).key === k));

  return (
    <div className="lv-stack">
      <div className="lv-grid lv-g4">
        {byBand.map((list, i) => {
          const b = band([10000, 60000, 200000, 500000][i]);
          return <Stat key={b.key} label={b.label} value={list.length} hint={"Usual turnaround: " + b.turnaround.toLowerCase()} />;
        })}
      </div>
      <Card title="Live enquiries" sub="Not yet won or lost, soonest due first" flush right={
        <Seg value={who} onChange={setWho} options={[["all", "Both"], ...ESTIMATORS.map(id => [id, personName(id).split(" ")[0]] as [string, string])]} />
      }>
        <Table rows={rows} cols={cols} onRow={e => onEnq(e.id)} foot rowClass={e => isSameDay(e) ? "hl" : ""} />
      </Card>
      <Note tone="accent">Turnaround rule from the consultation: under about €30,000 is often priced within one day; larger estimates take about 2 days to 2 weeks. Pulse flags a job when the client's deadline is shorter than its band usually needs.</Note>
    </div>
  );
}

/* ── estimates ────────────────────────────────────────────────────────── */

function Estimates({ s, onEnq }: { s: LvState; onEnq: (id: string) => void }) {
  const focus = s.enquiries.filter(e => e.stage === "Pricing" || e.stage === "Review" || e.stage === "Submitted").sort((a, b) => a.due.localeCompare(b.due));
  const pricing = focus.filter(e => e.stage === "Pricing"), review = focus.filter(e => e.stage === "Review"), submitted = focus.filter(e => e.stage === "Submitted");
  const sumV = (l: Enquiry[]) => l.reduce((n, e) => n + e.value, 0);
  const g = s.enquiries.find(e => e.id === "en103");
  const ap = s.approvals.find(a => a.refId === "en103");
  const qt = quoteTotals(s);
  const next = (e: Enquiry) => e.stage === "Pricing" ? (isSameDay(e) ? "Price and send today" : "Finish pricing, send to Martin") : e.stage === "Review" ? "Martin to review in Work" : "Awaiting client decision";

  return (
    <div className="lv-stack">
      <div className="lv-grid lv-g4">
        <Stat label="Pricing" value={pricing.length} hint={eur(sumV(pricing))} />
        <Stat label="In review" value={review.length} tone={review.length ? "warn" : "ok"} hint={eur(sumV(review)) + ", waiting on Martin"} />
        <Stat label="Submitted" value={submitted.length} hint={eur(sumV(submitted)) + " out with clients"} />
        <Stat label="Cherrywood L2 quote" value={eurShort(qt.sell)} hint={s.quoteStatus + ", " + pct(qt.margin) + " margin on sell"} onClick={() => setTab("Estimating", "quote")} />
      </div>

      {g && (
        <Card tone={ap?.status === "Awaiting you" ? "warn" : undefined} title={<>{g.project} <span className="lv-mono lv-faint" style={{ fontWeight: 400 }}>{g.ref}</span></>}
          sub={g.client + ", estimated by " + personName(g.estimatorId) + ". Tender due " + date(g.due) + "."}
          right={<StatusBadge s={ap?.status === "Awaiting you" ? "Awaiting Martin's review" : ap?.status === "Rejected" ? "Returned to estimator" : g.stage} />}>
          <div className="lv-stack" style={{ gap: 12 }}>
            <Steps steps={STAGES} at={stageIndex(g, s)} />
            <KV items={[["Tender value", eur(g.value)], ["Size band", band(g.value).label], ["Expected turnaround", band(g.value).turnaround], ["Days to deadline", daysLabel(daysLeft(g))], ["Source", g.source], ["Region", g.region]]} />
            {ap?.status === "Awaiting you" && <Note tone="warn">Waiting on Martin's review since {dateShort(ap.raised)}. Approving it in Work releases the tender to {g.client} and moves it to Submitted here.</Note>}
            {ap?.status === "Approved" && <Note tone="ok">Martin approved the submission. The tender is now at <b>{g.stage}</b> and released to {g.client} (simulated).</Note>}
            {ap?.status === "Rejected" && <Note tone="bad">Martin sent the tender back. It stays at {g.stage} for {personName(g.estimatorId)} to rework.</Note>}
            <div className="lv-row">
              <Btn kind={ap?.status === "Awaiting you" ? "primary" : ""} onClick={() => navigate({ page: "Work" })}>{ap?.status === "Awaiting you" ? "Review in Work approvals" : "Open Work approvals"}</Btn>
              <Btn kind="ghost" onClick={() => onEnq(g.id)}>Enquiry detail</Btn>
            </div>
          </div>
        </Card>
      )}

      <div className="lv-grid lv-g-2-1">
        <Card title="Pricing and review queue" sub="Estimates being priced, in review, or submitted and awaiting a decision" flush>
          <Table rows={focus} onRow={e => onEnq(e.id)} rowClass={e => e.id === "en103" || isSameDay(e) ? "hl" : ""} cols={[
            ...queueCols().filter(c => c.key !== "tt" && c.key !== "band"),
            { key: "next", label: "Next step", render: e => <span className="lv-small lv-muted">{next(e)}</span>, hideMobile: true }
          ]} />
        </Card>
        <Card title="Cherrywood L2 build-up" sub="QUO-2026-061 from take-off TO-0431" right={<StatusBadge s={s.quoteStatus} />}>
          <KV items={[["Materials", eur(qt.materials)], ["Labour hours", Math.round(qt.hours).toLocaleString("en-IE")], ["Labour", eur(qt.labour)], ["Cost", eur(qt.cost)], ["Markup", pct(s.quoteMarkup, 0)], ["Sell", eur(qt.sell)]]} />
          <div className="lv-row" style={{ marginTop: 12 }}>
            <Btn kind="primary" onClick={() => setTab("Estimating", "quote")}>Open Quote Builder</Btn>
            <Btn kind="ghost" onClick={() => setTab("Estimating", "takeoffs")}>Take-off</Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ── take-offs ────────────────────────────────────────────────────────── */

function Takeoffs({ s }: { s: LvState }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const items = TAKEOFF_ITEMS.map(i => ({ ...i, ext: i.qty * i.rate }));
  const total = items.reduce((n, i) => n + i.ext, 0);
  const headings = Array.from(new Set(items.map(i => i.heading))).map(h => ({ h, v: items.filter(i => i.heading === h).reduce((n, i) => n + i.ext, 0), n: items.filter(i => i.heading === h).length })).sort((a, b) => b.v - a.v);
  const done = items.filter(i => checked[i.symbol]).length;
  const all = done === items.length;
  const cherry = s.enquiries.find(e => e.id === "en101");
  const toggle = (sym: string) => setChecked(c => ({ ...c, [sym]: !c[sym] }));
  const lineage = s.projects.slice().sort((a, b) => b.takeoffRef.localeCompare(a.takeoffRef));

  return (
    <div className="lv-stack">
      <Note tone="accent">Pulse does not recognise drawings itself. Countfire counts the symbols on each drawing; Pulse imports those counts, maps each symbol to a contract heading and prices it. This export is simulated for the demo.</Note>
      <div className="lv-grid lv-g6">
        <Stat hero label="Take-off" value="TO-0431" hint={cherry ? cherry.ref + ", " + cherry.project : "EN-2026-101"} />
        <Stat label="Drawings" value={TAKEOFF_DRAWINGS.length} hint={TAKEOFF_DRAWINGS.filter(d => d.status !== "Counted").length + " need review"} />
        <Stat label="Symbol lines" value={items.length} hint={items.reduce((n, i) => n + (i.unit === "no." ? i.qty : 0), 0).toLocaleString("en-IE") + " items counted"} />
        <Stat label="Contract headings" value={headings.length} hint="Mapped from symbols" />
        <Stat label="Take-off value" value={eurShort(total)} hint="Qty x supply rate" />
        <Stat label="Reviewed" value={done + "/" + items.length} tone={all ? "ok" : "warn"} hint={all ? "Ready to generate" : "Tick each line"} />
      </div>

      <div className="lv-grid lv-g-3-2">
        <Card title="Drawings" sub="Uploaded to Countfire by Niall Hennessy" flush right={<DemoTag sim>Simulated</DemoTag>}>
          <Table rows={TAKEOFF_DRAWINGS} dense cols={[
            { key: "r", label: "Drawing", cls: "m", render: d => d.ref },
            { key: "v", label: "Revision", render: d => "Rev " + d.rev },
            { key: "t", label: "Title", cls: "wrap", render: d => d.title },
            { key: "u", label: "Uploaded", render: d => dateShort(d.uploaded), hideMobile: true },
            { key: "s", label: "Status", render: d => <Badge tone={d.status === "Counted" ? "ok" : "warn"} dot>{d.status}</Badge> }
          ]} />
        </Card>
        <Card title="Totals by contract heading" sub="Extended value at take-off supply rates">
          <HBars items={headings.map(h => ({ label: h.h, value: h.v, max: headings[0].v, right: eur(h.v) }))} />
          <div className="lv-small lv-muted" style={{ marginTop: 10 }}>Protective services, testing and preliminaries are added by the estimator in the quote. They do not come from a symbol count.</div>
        </Card>
      </div>

      <Card title="Symbol count summary" sub="Each counted symbol, its mapped heading and rate. The estimator ticks each line once checked against the drawing." flush right={
        <div className="lv-row" style={{ gap: 6 }}>
          <Btn size="sm" kind="ghost" onClick={() => setChecked(all ? {} : Object.fromEntries(items.map(i => [i.symbol, true])))}>{all ? "Clear ticks" : "Tick all"}</Btn>
          <Btn size="sm" kind="primary" disabled={!all} title={all ? "Build the estimate from these counts" : "Review every line first"} onClick={() => generateEstimateFromTakeoff(items.length, total)}>Generate estimate</Btn>
        </div>
      }>
        <Table rows={items} foot onRow={i => toggle(i.symbol)} cols={[
          { key: "ck", label: "Reviewed", align: "c", render: i => <input type="checkbox" className="lv-check" checked={!!checked[i.symbol]} aria-label={"Reviewed " + i.description} onClick={e => e.stopPropagation()} onChange={() => toggle(i.symbol)} />, foot: done + "/" + items.length },
          { key: "sy", label: "Symbol", cls: "m", render: i => i.symbol },
          { key: "d", label: "Description", cls: "wrap", render: i => i.description, foot: "Total" },
          { key: "q", label: "Qty", align: "r", render: i => i.qty.toLocaleString("en-IE") },
          { key: "u", label: "Unit", render: i => i.unit },
          { key: "h", label: "Contract heading", render: i => i.heading, hideMobile: true },
          { key: "r", label: "Rate", align: "r", render: i => eur(i.rate), hideMobile: true },
          { key: "x", label: "Extended", align: "r", cls: "strong", render: i => eur(i.ext), foot: eur(total) }
        ]} />
        {TAKEOFF_DRAWINGS.some(d => d.status !== "Counted") && <div style={{ padding: "4px 18px 12px" }}><Note tone="warn">E-501 data and comms is flagged Needs review: check the Cat6A outlet count against the drawing before generating.</Note></div>}
      </Card>

      <Card title="Take-off lineage" sub="Every live contract traces back to a take-off and a quote" flush>
        <Table rows={lineage} dense maxH={360} cols={[
          { key: "t", label: "Take-off", cls: "m", render: p => p.takeoffRef },
          { key: "q", label: "Quote", cls: "m", render: p => p.quoteRef },
          { key: "c", label: "Contract", cls: "m", render: p => p.ref },
          { key: "p", label: "Project", render: p => <ProjectLink id={p.id} /> },
          { key: "v", label: "Original value", align: "r", render: p => eur(p.originalValue), hideMobile: true }
        ]} />
      </Card>
    </div>
  );
}

/* ── quote builder ────────────────────────────────────────────────────── */

const QSTEPS: LvState["quoteStatus"][] = ["Draft", "Sent", "Won", "Contract drafted"];

function NumIn({ value, onChange, step, disabled, label }: { value: number; onChange: (n: number) => void; step?: number; disabled?: boolean; label: string }) {
  return <input className="lv-input lv-num lv-qin" type="number" min={0} step={step || 1} value={value} disabled={disabled} aria-label={label}
    onClick={e => e.stopPropagation()} onChange={e => { const n = parseFloat(e.target.value); onChange(isFinite(n) ? n : 0); }} />;
}

function Quote({ s }: { s: LvState }) {
  const t = quoteTotals(s);
  const locked = s.quoteStatus !== "Draft";
  const idx = QSTEPS.indexOf(s.quoteStatus);
  const dalkey = project("p01", s);
  const en = s.enquiries.find(e => e.id === "en101");
  type L = typeof t.lines[number];
  const cols: Col<L>[] = [
    { key: "h", label: "Heading", cls: "strong", render: l => l.heading, foot: "Total" },
    { key: "d", label: "Description", cls: "wrap", render: l => <span className="lv-small">{l.description}</span>, hideMobile: true },
    { key: "q", label: "Qty", align: "r", render: l => <NumIn label={"Quantity " + l.heading} value={l.qty} disabled={locked} onChange={n => setQuoteLine(l.id, "qty", n)} /> },
    { key: "u", label: "Unit", render: l => l.unit },
    { key: "m", label: "Material rate", align: "r", render: l => <NumIn label={"Material rate " + l.heading} value={l.matRate} disabled={locked} onChange={n => setQuoteLine(l.id, "matRate", n)} /> },
    { key: "lh", label: "Labour hrs/unit", align: "r", render: l => <NumIn label={"Labour hours per unit " + l.heading} step={0.05} value={l.labHrs} disabled={locked} onChange={n => setQuoteLine(l.id, "labHrs", n)} />, foot: Math.round(t.hours).toLocaleString("en-IE") + " h" },
    { key: "mat", label: "Materials", align: "r", render: l => eur(l.materials), foot: eur(t.materials) },
    { key: "lab", label: "Labour €", align: "r", render: l => eur(l.labour), foot: eur(t.labour) },
    { key: "c", label: "Cost", align: "r", render: l => eur(l.cost), foot: eur(t.cost), hideMobile: true },
    { key: "sell", label: "Sell", align: "r", cls: "strong", render: l => eur(l.sell), foot: eur(t.sell) }
  ];

  const nextAction = s.quoteStatus === "Draft" ? { label: "Mark as sent", to: "Sent" as const, msg: "QUO-2026-061 marked as sent to Harcourt Fit-Out Partners (simulated)." }
    : s.quoteStatus === "Sent" ? { label: "Mark as won", to: "Won" as const, msg: "QUO-2026-061 won. EN-2026-101 moves to Won." }
    : s.quoteStatus === "Won" ? { label: "Convert to contract", to: "Contract drafted" as const, msg: "Draft contract schedule created: 10 headings, ready for monthly claims." } : null;

  return (
    <div className="lv-stack">
      <div className="lv-grid lv-g6">
        <Stat label="Materials" value={eur(t.materials)} />
        <Stat label="Labour hours" value={Math.round(t.hours).toLocaleString("en-IE")} hint={"at " + eur(s.labourRate) + "/h"} />
        <Stat label="Labour" value={eur(t.labour)} />
        <Stat label="Cost" value={eur(t.cost)} />
        <Stat hero label="Sell price" value={eur(t.sell)} hint={"Markup " + pct(s.quoteMarkup, 0) + " on cost"} />
        <Stat label="Margin on sell" value={pct(t.margin)} tone="ok" hint={eur(t.sell - t.cost) + " gross"} />
      </div>

      <div className="lv-grid lv-g-2-1">
        <Card title="Quote status" sub={"QUO-2026-061 for " + (en?.client || "Harcourt Fit-Out Partners") + ", from take-off TO-0431"}>
          <div className="lv-stack" style={{ gap: 12 }}>
            <Steps steps={QSTEPS} at={s.quoteStatus === "Contract drafted" ? 4 : idx} />
            <div className="lv-row">
              {nextAction && <Btn kind="primary" onClick={() => { setQuoteStatus(nextAction.to); toast(nextAction.msg); }}>{nextAction.label}</Btn>}
              {s.quoteStatus === "Contract drafted" && <Badge tone="ok" dot>Contract schedule drafted</Badge>}
              <span className="lv-spacer" />
              <Btn kind="ghost" size="sm" onClick={() => { resetQuote(); toast("Quote reset to the original estimate"); }}>Reset</Btn>
            </div>
            <Note tone={s.quoteStatus === "Contract drafted" ? "ok" : undefined}>
              Convert to contract creates a <b>draft contract schedule</b> with the 10 quote headings as claim lines, ready for monthly claims. It does not create an active project: that happens once the contract is signed and a project manager is assigned.
            </Note>
            {locked && <div className="lv-small lv-muted">Lines are locked once the quote is sent. Reset to edit again.</div>}
          </div>
        </Card>
        <Card title="Rates" sub="Apply to every line">
          <div className="lv-stack" style={{ gap: 12 }}>
            <label className="lv-row" style={{ flexWrap: "nowrap" }}>
              <span className="lv-small lv-muted" style={{ flex: 1 }}>Labour rate (€ per hour)</span>
              <NumIn label="Labour rate" value={s.labourRate} disabled={locked} onChange={n => setLabourRate(n)} />
            </label>
            <label className="lv-row" style={{ flexWrap: "nowrap" }}>
              <span className="lv-small lv-muted" style={{ flex: 1 }}>Markup on cost (%)</span>
              <NumIn label="Markup percent" value={Math.round(s.quoteMarkup * 1000) / 10} disabled={locked} onChange={n => setMarkup(n / 100)} />
            </label>
            <div className="lv-small lv-faint">Markup is capped at 60%. Labour rate and markup are demo assumptions, not Lavelle's rates.</div>
          </div>
        </Card>
      </div>

      <Card title="Quote lines" sub="Materials = qty x material rate. Labour € = qty x hours per unit x labour rate. Sell = cost x (1 + markup)." flush>
        <Table rows={t.lines} cols={cols} foot />
      </Card>

      <div className="lv-grid lv-g2">
        <Card title={s.quoteStatus === "Contract drafted" ? "Draft contract schedule CS-2026-061" : "Contract schedule preview"} sub={s.quoteStatus === "Contract drafted" ? "Created from QUO-2026-061. Ready for monthly claims once the project is set up." : "What converting this quote will create"} flush>
          <Table rows={t.lines} dense foot cols={[
            { key: "n", label: "#", cls: "m", render: (_l, i) => String(i + 1).padStart(2, "0") },
            { key: "h", label: "Claim heading", render: l => l.heading, foot: t.lines.length + " headings" },
            { key: "v", label: "Contract value", align: "r", render: l => eur(l.sell), foot: eur(t.sell) },
            { key: "p", label: "Claimed", align: "r", render: () => <span className="lv-faint">0%</span> }
          ]} />
        </Card>
        <Card title="Lineage: take-off to contract" sub="How a priced take-off becomes a contract you claim against">
          <div className="lv-stack" style={{ gap: 14 }}>
            {dalkey && <>
              <div className="lv-chain">
                <span className="node"><b>{dalkey.takeoffRef}</b><span>Take-off</span></span><span className="arr">→</span>
                <span className="node"><b>{dalkey.quoteRef}</b><span>Quote</span></span><span className="arr">→</span>
                <span className="node on"><b>{dalkey.ref}</b><span>Contract</span></span>
              </div>
              <div className="lv-small lv-muted">Dalkey contract <b className="lv-ink">{dalkey.ref}</b> came from <b className="lv-ink">{dalkey.quoteRef}</b> / take-off <b className="lv-ink">{dalkey.takeoffRef}</b>. Its contract schedule is what the October valuation claims against.</div>
              <div><Btn onClick={() => openProject("p01", "contract")}>Open Dalkey contract schedule</Btn></div>
            </>}
            <div className="lv-chain">
              <span className="node"><b>TO-0431</b><span>Take-off</span></span><span className="arr">→</span>
              <span className={"node" + (s.quoteStatus !== "Contract drafted" ? " on" : "")}><b>QUO-2026-061</b><span>{s.quoteStatus === "Contract drafted" ? "Quote, won" : "Quote, " + s.quoteStatus.toLowerCase()}</span></span><span className="arr">→</span>
              <span className={"node" + (s.quoteStatus === "Contract drafted" ? " on" : "")}><b>CS-2026-061</b><span>{s.quoteStatus === "Contract drafted" ? "Draft schedule" : "Not yet"}</span></span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ── won & lost ───────────────────────────────────────────────────────── */

function WonLost({ s, onEnq }: { s: LvState; onEnq: (id: string) => void }) {
  const decided = s.enquiries.filter(e => e.stage === "Won" || e.stage === "Lost").sort((a, b) => b.due.localeCompare(a.due));
  const won = decided.filter(e => e.stage === "Won"), lost = decided.filter(e => e.stage === "Lost");
  const v = (l: Enquiry[]) => l.reduce((n, e) => n + e.value, 0);
  const rateN = decided.length ? won.length / decided.length : 0;
  const rateV = v(decided) ? v(won) / v(decided) : 0;
  const pending = s.enquiries.filter(e => e.stage === "Submitted");
  const types = (Object.keys(TYPE_LABEL) as ProjectType[]).map(t => ({ t, v: v(won.filter(e => e.type === t)), n: won.filter(e => e.type === t).length })).filter(x => x.n).sort((a, b) => b.v - a.v);
  const contractOf = (e: Enquiry) => { const m = e.note.match(/LE-\d{4}-\d{3}/); return m ? projectByRef(m[0], s) : null; };

  return (
    <div className="lv-stack">
      <div className="lv-grid lv-g6">
        <Stat hero label="Win rate (count)" value={pctInt(rateN)} hint={won.length + " won of " + decided.length + " decided"} />
        <Stat label="Win rate (value)" value={pctInt(rateV)} hint={eurShort(v(won)) + " of " + eurShort(v(decided))} />
        <Stat label="Won" value={eurShort(v(won))} tone="ok" hint={won.length + " tenders"} />
        <Stat label="Lost" value={eurShort(v(lost))} tone="bad" hint={lost.length + " tenders"} />
        <Stat label="Awaiting decision" value={pending.length} hint={eur(v(pending)) + " submitted"} />
        <Stat label="Became contracts" value={won.filter(e => becameContract(e, s)).length} hint="Live or drafted contracts" />
      </div>

      <div className="lv-grid lv-g3">
        <Card title="Value won by type">
          <HBars items={types.map(x => ({ label: TYPE_LABEL[x.t], value: x.v, max: types[0]?.v || 1, right: eur(x.v) + " (" + x.n + ")" }))} />
        </Card>
        <Card title="Why we lost" sub="Reasons recorded at decision" flush>
          <Rows>
            {lost.map(e => <Li key={e.id} onClick={() => onEnq(e.id)} title={e.project} sub={e.note || "No reason recorded"} right={<span className="num">{eurShort(e.value)}</span>} />)}
          </Rows>
        </Card>
        <Card title="By estimator" sub="Decided tenders">
          <div className="lv-stack" style={{ gap: 14 }}>
            {ESTIMATORS.map(id => {
              const d = decided.filter(e => e.estimatorId === id), w = d.filter(e => e.stage === "Won");
              return (
                <div key={id}>
                  <div className="lv-row lv-small" style={{ marginBottom: 6 }}><Avatar name={personName(id)} /><span className="lv-ink">{personName(id)}</span><span className="lv-spacer" /><span>{w.length}/{d.length} won, {eurShort(v(w))}</span></div>
                  <Bar value={d.length ? w.length / d.length : 0} tone="ok" />
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card title="Decision history" sub="Won and lost tenders, newest first" flush>
        <Table rows={decided} onRow={e => onEnq(e.id)} cols={[
          { key: "p", label: "Tender", cls: "wrap", render: e => <div><div className="lv-ink" style={{ fontWeight: 500 }}>{e.project}</div><div className="lv-small lv-muted"><span className="lv-mono">{e.ref}</span>, {e.client}</div></div> },
          { key: "t", label: "Type", render: e => TYPE_LABEL[e.type], hideMobile: true },
          { key: "e", label: "Estimator", render: e => personName(e.estimatorId), hideMobile: true },
          { key: "v", label: "Value", align: "r", cls: "strong", render: e => eur(e.value) },
          { key: "d", label: "Tender due", render: e => dateShort(e.due), hideMobile: true },
          { key: "ta", label: "Turnaround", align: "r", render: e => allowedDays(e) + (allowedDays(e) === 1 ? " day" : " days"), hideMobile: true },
          { key: "o", label: "Outcome", render: e => <StatusBadge s={e.stage} /> },
          { key: "c", label: "Contract / reason", cls: "wrap", render: e => { const p = contractOf(e); return p ? <ProjectLink id={p.id} short /> : e.id === "en101" && becameContract(e, s) ? <span className="lv-mono lv-small">CS-2026-061 (draft)</span> : <span className="lv-small lv-muted">{e.note}</span>; } }
        ]} />
      </Card>
    </div>
  );
}

/* ── enquiry drawer ───────────────────────────────────────────────────── */

function EnquiryDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const s = useLv();
  const e = id ? s.enquiries.find(x => x.id === id) : null;
  if (!e) return null;
  const b = band(e.value);
  const ap = s.approvals.find(a => a.refId === e.id);
  const nx = nextStage(e);
  const left = daysLeft(e);
  return (
    <Drawer open onClose={onClose} eyebrow={e.ref + ", " + TYPE_LABEL[e.type]} title={e.project}
      footer={<>
        {e.id === "en101" && <Btn kind="ghost" onClick={() => { onClose(); setTab("Estimating", "takeoffs"); }}>Take-off TO-0431</Btn>}
        {e.id === "en101" && <Btn onClick={() => { onClose(); setTab("Estimating", "quote"); }}>Quote Builder</Btn>}
        {ap && <Btn kind={ap.status === "Awaiting you" ? "primary" : ""} onClick={() => { onClose(); navigate({ page: "Work" }); }}>{ap.status === "Awaiting you" ? "Review in Work" : "Open Work"}</Btn>}
        {nx && e.id !== "en101" && <Btn kind="primary" onClick={() => advanceEnquiry(e.id)}>{nx === "Review" ? "Send to Martin for review" : "Move to " + nx}</Btn>}
      </>}>
      <div className="lv-stack">
        <Steps steps={STAGES} at={stageIndex(e, s) + (e.stage === "Won" && becameContract(e, s) ? 1 : 0)} />
        <div className="lv-row"><StatusBadge s={e.stage} /><Flags e={e} /><span className="lv-spacer" /><span className="lv-ink" style={{ fontSize: 20, fontWeight: 600 }}>{eur(e.value)}</span></div>
        <KV items={[
          ["Client", e.client], ["Estimator", personName(e.estimatorId)], ["Region", e.region], ["Source", e.source],
          ["Received", date(e.received)], ["Due", date(e.due)], ["Size band", b.label], ["Expected turnaround", b.turnaround],
          ["Client allowed", allowedDays(e) + (allowedDays(e) === 1 ? " day" : " days")], ["Days left", isOpenEnquiry(e) ? daysLabel(left) : "Closed"]
        ]} />
        {isSameDay(e) && <Note tone="bad">Same-day job: under €30k with {allowedDays(e)} day from receipt to deadline. Price from the standard rates and send today.</Note>}
        {isTight(e) && <Note tone="warn">Deadline is shorter than this size band usually needs ({b.turnaround.toLowerCase()}). Agree scope early or ask for an extension.</Note>}
        {ap && <Note tone={ap.status === "Awaiting you" ? "warn" : ap.status === "Approved" ? "ok" : "bad"}>Approval in Work: {ap.title}, <b>{ap.status === "Awaiting you" ? "awaiting Martin" : ap.status.toLowerCase()}</b>.</Note>}
        {e.note && <Card title="Notes"><div className="lv-small">{e.note}</div></Card>}
        {e.stage === "Won" && /LE-\d{4}-\d{3}/.test(e.note) && (() => { const p = projectByRef(e.note.match(/LE-\d{4}-\d{3}/)![0], s); return p ? <Btn onClick={() => { onClose(); openProject(p.id, "contract"); }}>Open contract {p.ref}</Btn> : null; })()}
        <div className="lv-small lv-faint">Turnaround bands follow the consultation: under about €30,000 often within a day, larger estimates 2 days to 2 weeks.</div>
      </div>
    </Drawer>
  );
}
