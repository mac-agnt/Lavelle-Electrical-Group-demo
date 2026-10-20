/* Claims & Finance. The flagship flow lives here:
   contract schedule → monthly claim → review → client certification →
   invoice from the certified amount → Xero (demo connection). */

import { useState } from "react";
import {
  useLv, getState, finOf, project as projectOf, client as clientOf, createMonthlyClaim, setClaimPct, setClaimNote, applySuggestions,
  resetClaimLines, claimStep, generateInvoice, setInvoiceVat, pushToXero, approveInXero, simulatePayment, resolveReconcile, syncContacts,
  navigate, openProject, decide, toast, personName, update, type LvState
} from "../../lavelle/store";
import { claimTotals, vat, VAT_LABEL, VAT_SHORT, totals } from "../../lavelle/calc";
import { CONTRACT_LINES, DALKEY_HISTORY, CLIENTS, EMPLOYEES, SUBCONTRACTORS, ALLOCATIONS, CAT_LABEL, CATS } from "../../lavelle/seed";
import { eur, eur2, eurShort, pct, date, dateShort, addDays, daysBetween, TODAY } from "../../lavelle/format";
import type { Claim, Invoice, VatMode } from "../../lavelle/types";
import {
  Page, Head, Card, Stat, Badge, StatusBadge, DemoTag, Btn, Bar, Table, HBars, Cols, Legend, Note, KV, Steps, ProjectLink, Rows, Li, Drawer, Split, type Col
} from "./ui";

const OPEN = ["Not started", "Draft", "Internal review"];
const FLOW = ["Contract schedule", "Monthly claim", "Review", "Client certification", "Invoice", "Xero"];

function stepOf(c: Claim, inv: Invoice | undefined) {
  if (c.status === "Not started") return 0;
  if (c.status === "Draft") return 1;
  if (c.status === "Internal review") return 2;
  if (c.status === "Submitted" || c.status === "Disputed") return 3;
  if (!inv) return 4;
  return inv.xero === "Paid" ? 6 : 5;
}

export default function Claims({ tab }: { tab: string }) {
  const s = useLv();
  if (tab === "claims") return <MonthlyClaims s={s} />;
  if (tab === "valuations") return <Valuations s={s} />;
  if (tab === "invoices") return <Invoices s={s} />;
  if (tab === "cost") return <CostControl s={s} />;
  if (tab === "cashflow") return <CashFlow s={s} />;
  if (tab === "xero") return <XeroSync s={s} />;
  return <Overview s={s} />;
}

/* ── Overview ─────────────────────────────────────────────────────────── */
function Overview({ s }: { s: LvState }) {
  const oct = s.claims.filter(c => c.period === "2026-10");
  const drafts = oct.filter(c => c.status === "Draft" || c.status === "Internal review");
  const submitted = oct.filter(c => c.status === "Submitted");
  const toInvoice = s.claims.filter(c => (c.status === "Certified" || c.status === "Partially certified") && !c.invoiceId);
  const t = totals(s.projects, { pos: s.pos, variations: s.variations });
  const overdue = submitted.filter(c => c.assessmentDue && c.assessmentDue < TODAY);
  const dalkey = s.claims.find(c => c.id === "cm-p01-5")!;
  const statusOrder = ["Not started", "Draft", "Internal review", "Submitted", "Disputed", "Partially certified", "Certified", "Invoiced", "Paid"];
  const colour: Record<string, string> = { "Not started": "var(--lv-c5)", Draft: "var(--warn)", "Internal review": "var(--lv-c4)", Submitted: "var(--lv-c3)", Disputed: "var(--bad)", "Partially certified": "var(--lv-c1)", Certified: "var(--lv-c1)", Invoiced: "var(--lv-c2)", Paid: "var(--ok)" };
  const attention = [
    ...oct.filter(c => c.status === "Not started").map(c => ({ c, why: "Valuation due " + dateShort(projectOf(c.projectId)!.nextValuation) + ". Not started.", tone: "warn" as const })),
    ...drafts.map(c => ({ c, why: c.status + ": " + eur(c.amount) + " this period, not yet submitted.", tone: "warn" as const })),
    ...overdue.map(c => ({ c, why: "Assessment overdue since " + dateShort(c.assessmentDue) + ".", tone: "bad" as const })),
    ...oct.filter(c => c.status === "Disputed").map(c => ({ c, why: "Disputed: " + c.note, tone: "bad" as const })),
    ...toInvoice.map(c => ({ c, why: eur(c.certified || 0) + " certified, not yet invoiced.", tone: "accent" as const }))
  ];
  return (
    <Page>
      <Head eyebrow="Claims & Finance" title="Monthly claims, certificates and cash"
        sub="Claims are built from the contract schedule, valued cumulatively and claimed as the movement since the last certificate. Invoices come from what the client certifies."
        actions={<><DemoTag /><Btn kind="primary" onClick={() => createMonthlyClaim("p01")}>Create Monthly Claim: Dalkey</Btn></>} />
      <div className="lv-grid lv-g6" style={{ marginBottom: 14 }}>
        <Stat hero label="Unsubmitted (Oct)" value={eur(drafts.reduce((n, c) => n + c.amount, 0))} hint={drafts.length + " drafts or in review"} onClick={() => navigate({ page: "Claims & Finance", tab: "claims" })} />
        <Stat label="Awaiting assessment" value={eur(submitted.reduce((n, c) => n + c.amount, 0))} hint={submitted.length + " submitted · " + overdue.length + " overdue"} tone={overdue.length ? "warn" : ""} />
        <Stat label="Certified, not invoiced" value={eur(toInvoice.reduce((n, c) => n + (c.certified || 0), 0))} hint={toInvoice.length + " to invoice"} tone={toInvoice.length ? "accent" : ""} onClick={() => navigate({ page: "Claims & Finance", tab: "invoices" })} />
        <Stat label="Certified to date" value={eurShort(t.certified)} hint={pct(t.certified / t.revised, 0) + " of revised contract value"} />
        <Stat label="Debtors" value={eur(t.outstanding)} hint="invoiced, not yet paid" />
        <Stat label="Paid to date" value={eurShort(t.paid)} hint="across 12 live contracts" tone="ok" />
      </div>
      <div className="lv-grid lv-g-3-2">
        <div className="lv-stack">
          <DalkeyCard s={s} claim={dalkey} />
          <Card title="Claims requiring attention" sub="Ready for submission, overdue assessments, drafts and anything certified but not invoiced" flush>
            <Rows>
              {attention.map(({ c, why, tone }) => {
                const p = projectOf(c.projectId)!;
                return <Li key={c.id + why} title={<>{p.name} <span className="lv-faint lv-mono" style={{ fontSize: 11 }}>{c.ref}</span></>} sub={why}
                  left={<Badge tone={tone} dot>{c.status}</Badge>}
                  right={<span className="num">{c.amount ? eur(c.amount) : "—"}</span>}
                  onClick={() => c.lines || c.projectId === "p01" ? navigate({ page: "Claims & Finance", tab: "claims", claim: c.projectId === "p01" ? c.id : null }) : navigate({ page: "Claims & Finance", tab: "claims" })} />;
              })}
            </Rows>
          </Card>
        </div>
        <div className="lv-stack">
          <Card title="October pipeline" sub="Value claimed this period, by status">
            <HBars items={statusOrder.map(st => {
              const list = oct.filter(c => c.status === st);
              return { label: st + " (" + list.length + ")", value: list.reduce((n, c) => n + c.amount, 0), max: Math.max(...statusOrder.map(x => oct.filter(c => c.status === x).reduce((n, c) => n + c.amount, 0)), 1), right: eurShort(list.reduce((n, c) => n + c.amount, 0)) };
            }).filter(r => r.label.indexOf("(0)") < 0)} />
          </Card>
          <Card title="Claimed vs certified" sub="Where the client QS agreed less than claimed">
            <Rows>
              {s.claims.filter(c => c.certified != null && c.period === "2026-10").map(c => (
                <Li key={c.id} title={projectOf(c.projectId)!.name} sub={c.ref + (c.certified! < c.amount ? " · held " + eur(c.amount - c.certified!) : "")}
                  right={<span className="num">{eur(c.certified!)} <span className="lv-faint">/ {eur(c.amount)}</span></span>} />
              ))}
            </Rows>
          </Card>
          <Card title="Status colours"><Legend items={statusOrder.map(x => [x, colour[x]] as [string, string])} /></Card>
        </div>
      </div>
    </Page>
  );
}

function DalkeyCard({ s, claim }: { s: LvState; claim: Claim }) {
  const p = projectOf("p01")!;
  const f = finOf(p, s);
  const vo = s.variations.find(v => v.id === "vo1")!;
  const report = s.reports.find(r => r.id === "sr1043")!;
  return (
    <Card tone="accent" title={<>LE-2026-014 · Dalkey Residential Development</>} sub={clientOf(p.clientId).name + " · residential · valuation due " + date(p.nextValuation)}
      right={<StatusBadge s={claim.status} />}>
      <div className="lv-grid lv-g4" style={{ marginBottom: 12 }}>
        <Stat label="Contract schedule" value={eur(p.originalValue)} hint="10 electrical headings" />
        <Stat label="Approved variation" value={eur(vo.value)} hint={vo.ref + " EV chargers"} />
        <Stat label="Certified to date" value={eur(p.certifiedToDate)} hint={pct(f.progress, 0) + " of " + eur(f.revised)} />
        <Stat label="Site report" value={report.ref} hint={report.status === "Approved" ? "Approved: units 13–18 second fixed" : "Submitted: units 13–18 second fixed"} tone={report.status === "Approved" ? "ok" : "warn"} />
      </div>
      <div className="lv-row">
        {claim.status === "Not started"
          ? <Btn kind="primary" size="lg" onClick={() => createMonthlyClaim("p01")}>Create Monthly Claim</Btn>
          : <Btn kind="primary" size="lg" onClick={() => navigate({ page: "Claims & Finance", tab: "claims", claim: claim.id })}>Open {claim.ref}</Btn>}
        <Btn kind="ghost" onClick={() => openProject("p01", "contract")}>View contract schedule</Btn>
        <span className="lv-small lv-muted">Every quote line, description and price carries into the claim. You enter the percentages.</span>
      </div>
    </Card>
  );
}

/* ── Monthly claims (list + builder) ──────────────────────────────────── */
function MonthlyClaims({ s }: { s: LvState }) {
  const focus = s.claims.find(c => c.id === s.focusClaim && c.lines);
  if (focus) return <ClaimBuilder s={s} claim={focus} />;
  const oct = s.claims.filter(c => c.period === "2026-10").sort((a, b) => OPEN.indexOf(b.status) - OPEN.indexOf(a.status));
  const dalkey = s.claims.find(c => c.id === "cm-p01-5")!;
  const cols: Col<Claim>[] = [
    { key: "p", label: "Project", render: c => <ProjectLink id={c.projectId} />, cls: "strong" },
    { key: "ref", label: "Claim", cls: "m", render: c => c.ref + " · #" + c.number },
    { key: "per", label: "Period", hideMobile: true, render: c => c.periodLabel.replace(/ \(.*\)/, "") },
    { key: "st", label: "Status", render: c => <StatusBadge s={c.status} /> },
    { key: "amt", label: "This period", align: "r", render: c => c.amount ? eur(c.amount) : "—" },
    { key: "cert", label: "Certified", align: "r", hideMobile: true, render: c => c.certified != null ? eur(c.certified) : "—" },
    { key: "due", label: "Assessment due", hideMobile: true, render: c => c.assessmentDue ? <span className={c.status === "Submitted" && c.assessmentDue < TODAY ? "lv-bad" : ""}>{dateShort(c.assessmentDue)}</span> : "—" },
    { key: "act", label: "", align: "r", render: c => <ClaimAction c={c} s={s} /> }
  ];
  return (
    <Page>
      <Head eyebrow="Monthly Claims · October 2026" title="Monthly claims"
        sub="Open a contract, create the claim from its schedule, enter cumulative percentages, then review, submit, certify and invoice."
        actions={<><DemoTag /><Btn kind="primary" onClick={() => createMonthlyClaim("p01")}>{dalkey.status === "Not started" ? "Create Monthly Claim: Dalkey" : "Open Dalkey claim"}</Btn></>} />
      <Card title="Quote → Claim → Invoice" sub="How a claim moves through Pulse" style={{ marginBottom: 14 }}>
        <Steps steps={FLOW} at={stepOf(dalkey, s.invoices.find(i => i.id === dalkey.invoiceId))} />
      </Card>
      <Card title="October claims" sub={oct.length + " contracts with a claim this month"} flush>
        <Table cols={cols} rows={oct} onRow={c => c.projectId === "p01" ? (c.status === "Not started" ? createMonthlyClaim("p01") : navigate({ page: "Claims & Finance", tab: "claims", claim: c.id })) : openProject(c.projectId, "claims")} />
      </Card>
      <div style={{ marginTop: 14 }}>
        <Note>Only LE-2026-014 carries its full line schedule in this demo. The other contracts show the QS's summary claim, as they would after an import from LiveCosts or the QS workbook.</Note>
      </div>
    </Page>
  );
}

function ClaimAction({ c, s }: { c: Claim; s: LvState }) {
  if (c.projectId === "p01") return <Btn size="sm" kind={c.status === "Not started" ? "primary" : ""} onClick={() => c.status === "Not started" ? createMonthlyClaim("p01") : navigate({ page: "Claims & Finance", tab: "claims", claim: c.id })}>{c.status === "Not started" ? "Create claim" : "Open"}</Btn>;
  if (c.status === "Internal review") {
    const ap = s.approvals.find(a => a.refId === c.id && a.status === "Awaiting you");
    return <Btn size="sm" kind="primary" onClick={() => ap ? decide(ap.id, true) : claimStep(c.id, "submit")}>Approve & submit</Btn>;
  }
  if (c.status === "Draft") return <Btn size="sm" onClick={() => claimStep(c.id, "review")}>Send to review</Btn>;
  if (c.status === "Submitted") return <Btn size="sm" onClick={() => toast("Chase email drafted for " + clientOf(projectOf(c.projectId)!.clientId).name + ". Not sent.")}>Draft chase</Btn>;
  if ((c.status === "Certified" || c.status === "Partially certified") && !c.invoiceId) return <Btn size="sm" kind="primary" onClick={() => { generateInvoice(c.id); navigate({ page: "Claims & Finance", tab: "invoices" }); }}>Generate invoice</Btn>;
  if (c.status === "Disputed") return <Btn size="sm" onClick={() => openProject(c.projectId, "claims")}>View dispute</Btn>;
  return null;
}

function PctInput({ value, onChange, disabled, min }: { value: number; onChange: (v: number) => void; disabled?: boolean; min?: number }) {
  return (
    <span className="lv-pct">
      <input className="lv-input lv-num" type="number" min={0} max={100} step={1} value={Math.round(value * 1000) / 10} disabled={disabled}
        onChange={(e) => onChange((parseFloat(e.target.value) || 0) / 100)} aria-label="Cumulative percent complete" />
      <span className="lv-faint">%</span>
      <input className="lv-mob-hide" type="range" min={0} max={100} step={5} value={Math.round(value * 100)} disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value) / 100)} aria-label="Percent complete slider" style={{ opacity: min !== undefined && value < min ? .5 : 1 }} />
    </span>
  );
}

function ClaimBuilder({ s, claim }: { s: LvState; claim: Claim }) {
  const p = projectOf(claim.projectId)!;
  const cl = clientOf(p.clientId);
  const t = claimTotals(claim, CONTRACT_LINES, s.variations);
  const inv = s.invoices.find(i => i.id === claim.invoiceId);
  const editable = claim.status === "Draft";
  const step = stepOf(claim, inv);
  const report = s.reports.find(r => r.id === "sr1043")!;
  const [showHistory, setShowHistory] = useState(false);
  const lineRows = (claim.lines || []).map((l, i) => ({ l, c: t.contract[i], def: CONTRACT_LINES.find(x => x.id === l.lineId)! }));
  const varRows = (claim.varLines || []).map((l, i) => ({ l, c: t.vars[i], def: s.variations.find(v => v.id === l.lineId)! }));
  const back = () => update({ focusClaim: null });

  type Row = typeof lineRows[number];
  const cols: Col<Row>[] = [
    { key: "code", label: "#", cls: "m lv-faint", render: r => r.def.code, hideMobile: true },
    { key: "item", label: "Contract item", cls: "wrap", render: r => <><div className="lv-ink" style={{ fontWeight: 500 }}>{r.def.heading}</div><div className="lv-small lv-faint lv-mob-hide">{r.def.description}</div></> },
    { key: "val", label: "Contract value", align: "r", render: r => eur(r.c.value), foot: eur(t.contractValue) },
    { key: "pp", label: "Prev cert. %", align: "r", render: r => pct(r.c.prevPct, 0) },
    { key: "pv", label: "Prev cert. value", align: "r", hideMobile: true, render: r => eur(r.c.prevValue), foot: eur(t.contract.reduce((n, x) => n + x.prevValue, 0)) },
    { key: "cp", label: "Current cumulative %", render: r => <PctInput value={r.l.curPct} min={r.l.prevPct} disabled={!editable} onChange={v => setClaimPct(claim.id, r.l.lineId, v)} /> },
    { key: "cv", label: "Cumulative valuation", align: "r", render: r => eur(r.c.cumValue), foot: eur(t.contract.reduce((n, x) => n + x.cumValue, 0)) },
    { key: "tp", label: "This period", align: "r", cls: "strong", render: r => <span className={r.c.thisPeriod < 0 ? "lv-bad" : r.c.thisPeriod > 0 ? "lv-acc" : "lv-faint"}>{eur(r.c.thisPeriod)}</span>, foot: eur(t.contractThis) },
    { key: "note", label: "Notes / evidence", hideMobile: true, render: r => editable
        ? <input className="lv-input" style={{ width: 170 }} value={r.l.note} placeholder="e.g. SR-1043 photos" onChange={e => setClaimNote(claim.id, r.l.lineId, e.target.value)} />
        : <span className="lv-small lv-muted">{r.l.note || "—"}</span> }
  ];
  type VRow = typeof varRows[number];
  const vcols: Col<VRow>[] = [
    { key: "code", label: "#", cls: "m lv-faint", render: r => r.def.ref, hideMobile: true },
    { key: "item", label: "Approved variation", cls: "wrap", render: r => <><div className="lv-ink" style={{ fontWeight: 500 }}>{r.def.title}</div><div className="lv-small lv-faint">{r.def.ref} · {r.def.reason}</div></> },
    { key: "val", label: "Value", align: "r", render: r => eur(r.c.value) },
    { key: "pp", label: "Prev cert. %", align: "r", render: r => pct(r.c.prevPct, 0) },
    { key: "pv", label: "Prev cert. value", align: "r", hideMobile: true, render: r => eur(r.c.prevValue) },
    { key: "cp", label: "Current cumulative %", render: r => <PctInput value={r.l.curPct} disabled={!editable} onChange={v => setClaimPct(claim.id, r.l.lineId, v, true)} /> },
    { key: "cv", label: "Cumulative valuation", align: "r", render: r => eur(r.c.cumValue) },
    { key: "tp", label: "This period", align: "r", cls: "strong", render: r => <span className={r.c.thisPeriod > 0 ? "lv-acc" : "lv-faint"}>{eur(r.c.thisPeriod)}</span> },
    { key: "note", label: "Notes / evidence", hideMobile: true, render: () => <span className="lv-small lv-muted">Claimed separately from the schedule</span> }
  ];

  return (
    <Page>
      <Head eyebrow={<><span className="lv-link" onClick={back}>Monthly Claims</span> / {p.ref}</>}
        title={<>{claim.ref} · {p.name}</>}
        sub={<>{cl.name} · valuation period {claim.periodLabel} · created from contract schedule {p.quoteRef}</>}
        actions={<><StatusBadge s={claim.status} /><DemoTag /><Btn kind="ghost" onClick={() => openProject(p.id, "contract")}>Project</Btn><Btn kind="ghost" onClick={back}>All claims</Btn></>} />

      <Card style={{ marginBottom: 14 }}><Steps steps={FLOW} at={step} /></Card>

      <div className="lv-grid lv-g6" style={{ marginBottom: 14 }}>
        <Stat label="Contract + approved VO" value={eur(t.contractValue + t.varValue)} hint={eur(t.contractValue) + " + " + eur(t.varValue)} />
        <Stat label="Previously certified" value={eur(t.prevCertified)} hint="to end of September" />
        <Stat label="Cumulative valuation" value={eur(t.cumulative)} hint={pct(t.cumulative / (t.contractValue + t.varValue), 1) + " complete"} />
        <Stat hero label="Claimed this period" value={eur(t.thisPeriod)} hint="cumulative − previously certified" />
        <Stat label="Certified" value={claim.certified != null ? eur(claim.certified) : "—"} hint={claim.certified != null ? (claim.certified < claim.amount ? "held " + eur(claim.amount - claim.certified) : "in full") : "awaiting client QS"} tone={claim.certified != null ? "ok" : ""} />
        <Stat label="Invoiced" value={inv ? eur(inv.net) : "—"} hint={inv ? inv.ref + " · " + inv.xero : "from certified amount"} tone={inv ? "accent" : ""} />
      </div>

      {editable && (
        <Card tone="accent" style={{ marginBottom: 14 }}>
          <div className="lv-row">
            <div style={{ flex: 1, minWidth: 220 }}>
              <div className="lv-ink" style={{ fontWeight: 600, fontSize: 13.5 }}>Site report {report.ref} suggests a valuation update</div>
              <div className="lv-small lv-muted" style={{ marginTop: 3 }}>{personName(report.foremanId)}, {dateShort(report.date)}: {report.done} {report.status === "Approved" ? "Approved by the PM." : "Not yet approved by the PM, so treat as a suggestion."}</div>
            </div>
            <Btn kind="primary" onClick={() => applySuggestions(claim.id)}>Apply suggested percentages</Btn>
            <Btn kind="ghost" onClick={() => resetClaimLines(claim.id)}>Reset to previous</Btn>
          </div>
        </Card>
      )}

      {t.belowPrev > 0 && <div style={{ marginBottom: 14 }}><Note tone="bad">{t.belowPrev} line{t.belowPrev > 1 ? "s are" : " is"} below the previously certified percentage, which would claim a negative amount. Check before saving.</Note></div>}

      <Card className="lv-mob-hide" title="Contract schedule" sub={"Prepopulated from " + p.quoteRef + ": " + lineRows.length + " lines. Enter the cumulative percentage complete; the claim is the movement since the last certificate."} flush
        right={<span className="lv-small lv-faint lv-mob-hide">{editable ? "Editable" : "Locked: " + claim.status}</span>}>
        <Table cols={cols} rows={lineRows} foot dense />
      </Card>

      <div className="lv-mob-only">
        <div className="lv-card-t" style={{ margin: "4px 2px 10px" }}>Contract schedule · {lineRows.length} lines</div>
        <div className="lv-stack" style={{ gap: 10 }}>
          {[...lineRows.map(r => ({ id: r.l.lineId, title: r.def.heading, c: r.c, cur: r.l.curPct, v: false })), ...varRows.map(r => ({ id: r.l.lineId, title: r.def.ref + " " + r.def.title, c: r.c, cur: r.l.curPct, v: true }))].map(r => (
            <div key={r.id} className="lv-card" style={{ padding: "12px 14px" }}>
              <div className="lv-row" style={{ justifyContent: "space-between" }}>
                <span className="lv-ink" style={{ fontWeight: 600, fontSize: 14 }}>{r.title}</span>
                <span className="lv-small lv-faint">{eur(r.c.value)}</span>
              </div>
              <div className="lv-row" style={{ marginTop: 10, justifyContent: "space-between" }}>
                <span className="lv-small lv-muted">Prev {pct(r.c.prevPct, 0)} · {eur(r.c.prevValue)}</span>
                <PctInput value={r.cur} disabled={!editable} onChange={v => setClaimPct(claim.id, r.id, v, r.v)} />
              </div>
              <div style={{ marginTop: 8 }}><Bar value={r.cur} target={r.c.prevPct} thin /></div>
              <div className="lv-row" style={{ marginTop: 8, justifyContent: "space-between", fontSize: 12.5 }}>
                <span className="lv-muted">Cumulative {eur(r.c.cumValue)}</span>
                <span className={r.c.thisPeriod < 0 ? "lv-bad" : "lv-acc"} style={{ fontWeight: 600 }}>This period {eur(r.c.thisPeriod)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Card className="lv-mob-hide" title="Approved variations" sub="Valued separately so the original schedule stays clean" flush style={{ marginTop: 14 }}>
        <Table cols={vcols} rows={varRows} dense empty={<><b>No approved variations</b>Pending variations aren't claimable until instructed.</>} />
      </Card>

      <div className="lv-grid lv-g-3-2" style={{ marginTop: 14 }}>
        <Card title="Claim summary">
          <table className="lv-table dense" style={{ fontSize: 13 }}>
            <tbody>
              <tr><td>Contract works this period</td><td className="r">{eur2(t.contractThis)}</td></tr>
              <tr><td>Approved variations this period</td><td className="r">{eur2(t.varThis)}</td></tr>
              <tr><td>Cumulative valuation</td><td className="r">{eur2(t.cumulative)}</td></tr>
              <tr><td>Less previously certified</td><td className="r">−{eur2(t.prevCertified)}</td></tr>
              <tr><td className="strong">Amount claimed this period (net)</td><td className="r strong" style={{ fontSize: 16 }}>{eur2(t.thisPeriod)}</td></tr>
            </tbody>
          </table>
          <div className="lv-small lv-faint" style={{ marginTop: 10 }}>Retention isn't applied in this demo. Client-submitted claims aren't treated as certified: certification is recorded separately.</div>
        </Card>
        <StageActions s={s} claim={claim} inv={inv} showHistory={() => setShowHistory(true)} />
      </div>

      {(claim.certified != null) && <InvoicePanel s={s} claim={claim} inv={inv} />}

      <Drawer open={showHistory} onClose={() => setShowHistory(false)} title={claim.ref + " history"} eyebrow="Audit trail">
        <Rows>
          {[...claim.history].reverse().map((h, i) => <Li key={i} title={h.text} sub={h.at.replace(TODAY, "Today")} />)}
          {DALKEY_HISTORY.slice().reverse().map(h => <Li key={h.ref} title={h.ref + " · " + h.period + " · certified " + eur(h.certified)} sub={h.invoice + (h.paid ? " · paid" : " · awaiting payment")} />)}
        </Rows>
      </Drawer>
    </Page>
  );
}

function StageActions({ s, claim, inv, showHistory }: { s: LvState; claim: Claim; inv?: Invoice; showHistory: () => void }) {
  const p = projectOf(claim.projectId)!;
  const cl = clientOf(p.clientId);
  const body = (() => {
    switch (claim.status) {
      case "Draft": return (<>
        <div className="lv-small lv-muted">Save as you go. When the percentages are right, send it for internal review (Shane, QS) or straight to the client.</div>
        <div className="lv-row" style={{ marginTop: 12 }}>
          <Btn onClick={() => claimStep(claim.id, "save")}>Save draft</Btn>
          <Btn kind="primary" disabled={claim.amount <= 0} onClick={() => claimStep(claim.id, "review")}>Send for internal review</Btn>
        </div></>);
      case "Internal review": return (<>
        <div className="lv-small lv-muted">Reviewed internally. Submitting sends the valuation to {cl.name} ({cl.contact}). Simulated: no email leaves this demo.</div>
        <div className="lv-row" style={{ marginTop: 12 }}>
          <Btn kind="ghost" onClick={() => claimStep(claim.id, "back")}>Back to draft</Btn>
          <Btn kind="primary" onClick={() => claimStep(claim.id, "submit")}>Submit to client</Btn>
        </div></>);
      case "Submitted": return (<>
        <div className="lv-small lv-muted">Awaiting assessment by the client QS, due {date(claim.assessmentDue)}. Simulate their response:</div>
        <div className="lv-row" style={{ marginTop: 12 }}>
          <Btn kind="primary" onClick={() => claimStep(claim.id, "certify-full")}>Certified in full</Btn>
          <Btn onClick={() => claimStep(claim.id, "certify-partial")}>Partially certified</Btn>
          <Btn kind="danger" onClick={() => claimStep(claim.id, "dispute")}>Disputed</Btn>
        </div></>);
      case "Disputed": return (<>
        <Note tone="bad">The client disputed part of this valuation. Agree the lines, then re-open as a draft.</Note>
        <div className="lv-row" style={{ marginTop: 12 }}><Btn onClick={() => claimStep(claim.id, "back")}>Re-open as draft</Btn></div></>);
      default: return (<>
        <div className="lv-small lv-muted">{claim.status === "Partially certified" ? "Certified for less than claimed. The invoice uses the certified figure, not the claim." : claim.status === "Certified" ? "Certified in full." : claim.status + "."}</div>
        {!inv && <div className="lv-row" style={{ marginTop: 12 }}><Btn kind="primary" size="lg" onClick={() => generateInvoice(claim.id)}>Generate Invoice from Certified Claim</Btn></div>}
      </>);
    }
  })();
  return (
    <Card title="Next step" right={<Btn size="sm" kind="ghost" onClick={showHistory}>History</Btn>}>
      <div className="lv-grid lv-g3" style={{ marginBottom: 12 }}>
        <div><div className="lv-small lv-faint">Submitted</div><div className="lv-ink" style={{ fontWeight: 600, marginTop: 3 }}>{claim.submitted ? eur(claim.amount) : "—"}</div></div>
        <div><div className="lv-small lv-faint">Certified</div><div className="lv-ink" style={{ fontWeight: 600, marginTop: 3 }}>{claim.certified != null ? eur(claim.certified) : "—"}</div></div>
        <div><div className="lv-small lv-faint">Invoiced</div><div className="lv-ink" style={{ fontWeight: 600, marginTop: 3 }}>{inv ? eur(inv.net) : "—"}</div></div>
      </div>
      {body}
    </Card>
  );
}

function InvoicePanel({ s, claim, inv }: { s: LvState; claim: Claim; inv?: Invoice }) {
  const p = projectOf(claim.projectId)!;
  const cl = clientOf(p.clientId);
  if (!inv) return null;
  const v = vat(inv);
  const locked = inv.xero !== "Not sent";
  return (
    <div className="lv-grid lv-g-3-2" style={{ marginTop: 14 }}>
      <Card title={"Draft invoice " + inv.ref} sub={"Linked to " + claim.ref + " · prefilled from the certified amount"} right={<StatusBadge s={inv.status} />}>
        <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 18, background: "var(--surface-2)" }}>
          <div className="lv-row" style={{ alignItems: "flex-start" }}>
            <img src="/brand/lavelle-logo-wordmark.png" alt="Lavelle Electrical" style={{ height: 30, width: "auto", background: "#fff", borderRadius: 6, padding: "4px 6px" }} />
            <span className="lv-spacer" />
            <div style={{ textAlign: "right" }}>
              <div className="lv-ink" style={{ fontWeight: 600 }}>{inv.ref}</div>
              <div className="lv-small lv-faint">Issued {date(inv.issued)} · due {date(inv.due)}</div>
            </div>
          </div>
          <div className="lv-grid lv-g2" style={{ marginTop: 14 }}>
            <div><div className="lv-small lv-faint">Bill to</div><div className="lv-ink">{cl.name}</div><div className="lv-small lv-muted">{cl.contact} · {cl.terms}</div></div>
            <div><div className="lv-small lv-faint">Project</div><div className="lv-ink">{p.ref} {p.name}</div><div className="lv-small lv-muted">Valuation period: {claim.periodLabel}</div></div>
          </div>
          <table className="lv-table dense" style={{ marginTop: 14 }}>
            <thead><tr><th>Description</th><th className="r">Amount</th></tr></thead>
            <tbody>
              <tr><td className="wrap">Valuation {claim.ref} as certified{claim.certified! < claim.amount ? " (claimed " + eur(claim.amount) + ")" : ""}</td><td className="r">{eur2(inv.net)}</td></tr>
              <tr><td>{VAT_SHORT[inv.vatMode]}{inv.vatMode === "rct" ? " (0%)" : ""}</td><td className="r">{eur2(v.vat)}</td></tr>
              <tr><td className="strong">Total due</td><td className="r strong">{eur2(v.gross)}</td></tr>
            </tbody>
          </table>
          {inv.vatMode === "rct" && <div className="lv-small lv-faint" style={{ marginTop: 8 }}>VAT on construction services: reverse charge applies. The principal contractor accounts for VAT.</div>}
        </div>
        <div className="lv-row" style={{ marginTop: 12 }}>
          <span className="lv-small lv-muted">VAT treatment</span>
          <select className="lv-select" value={inv.vatMode} disabled={locked} onChange={e => setInvoiceVat(inv.id, e.target.value as VatMode)}>
            {(Object.keys(VAT_LABEL) as VatMode[]).map(k => <option key={k} value={k}>{VAT_LABEL[k]}</option>)}
          </select>
        </div>
      </Card>
      <XeroCard inv={inv} />
    </div>
  );
}

function XeroCard({ inv }: { inv: Invoice }) {
  const states = ["Not sent", "Queued", "Draft in Xero", "Awaiting payment", "Paid"];
  const at = Math.max(0, states.indexOf(inv.xero));
  return (
    <Card title="Xero" sub="Accounting stays in Xero. This is a simulated, two-way sync." right={<DemoTag sim>Demo connection</DemoTag>}>
      <div className="lv-stack" style={{ gap: 8 }}>
        {states.map((st, i) => (
          <div key={st} className="lv-row" style={{ gap: 10 }}>
            <span style={{ width: 20, height: 20, borderRadius: 99, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10.5,
              background: i < at || inv.xero === "Paid" ? "var(--ok-soft)" : i === at ? "var(--accent-soft)" : "var(--track)", color: i < at || inv.xero === "Paid" ? "var(--ok)" : i === at ? "var(--accent)" : "var(--faint)" }}>{i < at || inv.xero === "Paid" ? "✓" : i + 1}</span>
            <span className={i === at ? "lv-ink" : "lv-muted"} style={{ fontSize: 13, fontWeight: i === at ? 600 : 400 }}>{st}{st === "Draft in Xero" && inv.xeroRef ? " · " + inv.xeroRef : ""}</span>
            {inv.xero === "Queued" && i === 1 && <span className="lv-small lv-faint">sending…</span>}
          </div>
        ))}
      </div>
      <div className="lv-row" style={{ marginTop: 14 }}>
        {inv.xero === "Not sent" && <Btn kind="primary" onClick={() => pushToXero(inv.id)}>Push draft invoice to Xero</Btn>}
        {inv.xero === "Draft in Xero" && <Btn kind="primary" onClick={() => approveInXero(inv.id)}>Approve & send in Xero</Btn>}
        {inv.xero === "Awaiting payment" && <Btn kind="okb" onClick={() => simulatePayment(inv.id)}>Simulate payment received</Btn>}
        {inv.xero === "Paid" && <Badge tone="ok" dot>Paid and reconciled</Badge>}
        <Btn kind="ghost" onClick={() => navigate({ page: "Claims & Finance", tab: "xero" })}>Sync history</Btn>
      </div>
      <div className="lv-small lv-faint" style={{ marginTop: 10 }}>No real API call is made. In production this would use Xero's invoice and payment endpoints once the connection is built and tested.</div>
    </Card>
  );
}

/* ── Valuations register ──────────────────────────────────────────────── */
function Valuations({ s }: { s: LvState }) {
  const rows = s.projects.map(p => ({ p, f: finOf(p, s), c: s.claims.find(c => c.projectId === p.id && c.period === "2026-10") || null }));
  const cols: Col<typeof rows[number]>[] = [
    { key: "p", label: "Project", render: r => <ProjectLink id={r.p.id} />, cls: "strong" },
    { key: "rv", label: "Revised contract", align: "r", render: r => eur(r.f.revised), foot: eur(rows.reduce((n, r) => n + r.f.revised, 0)) },
    { key: "ct", label: "Certified to date", align: "r", render: r => eur(r.f.certified), foot: eur(rows.reduce((n, r) => n + r.f.certified, 0)) },
    { key: "pc", label: "% certified", render: r => <div style={{ width: 110 }}><Bar value={r.f.progress} thin /></div>, hideMobile: true },
    { key: "oc", label: "October claim", align: "r", render: r => r.c && r.c.amount ? eur(r.c.amount) : "—" },
    { key: "st", label: "Status", render: r => r.c ? <StatusBadge s={r.c.status} /> : <Badge tone="ghost">No claim</Badge> },
    { key: "nv", label: "Next valuation", hideMobile: true, render: r => <>{dateShort(r.p.nextValuation)} <span className="lv-faint lv-small">{r.p.valuationDay}</span></> },
    { key: "tr", label: "Remaining to value", align: "r", hideMobile: true, render: r => eur(r.f.revised - r.f.certified) }
  ];
  const docklands = s.claims.find(c => c.id === "cm-p08-3")!;
  return (
    <Page>
      <Head eyebrow="Valuations" title="Valuation register" sub="Where each contract stands against its revised value, and when the next valuation falls." actions={<DemoTag />} />
      <Card flush><Table cols={cols} rows={rows} foot onRow={r => openProject(r.p.id, "claims")} /></Card>
      <div className="lv-grid lv-g2" style={{ marginTop: 14 }}>
        <Card title="Dalkey valuation history" sub="LE-2026-014 · cumulative certified" flush>
          <Rows>
            {DALKEY_HISTORY.map(h => <Li key={h.ref} title={h.ref + " · " + h.period} sub={h.invoice + (h.paid ? " · paid" : " · awaiting payment")} right={<span className="num">{eur(h.certified)}</span>} />)}
            <Li title={<b>Certified to date</b>} right={<span className="num">{eur(DALKEY_HISTORY.reduce((n, h) => n + h.certified, 0))}</span>} />
          </Rows>
        </Card>
        <Card title="Disputed: Docklands Hotel claim #3" tone="bad" sub={docklands.ref + " · submitted " + dateShort(docklands.submitted)}>
          <KV items={[["Claimed", eur(docklands.amount)], ["QS position", eur(docklands.certified || 0)], ["In dispute", eur(docklands.amount - (docklands.certified || 0))], ["Owner", "Shane Gallagher"]]} />
          <div style={{ marginTop: 12 }}><Note tone="bad">{docklands.note} Evidence: SR reports for Floors 2–3 and the lighting schedule. Task due 24 Oct.</Note></div>
        </Card>
      </div>
    </Page>
  );
}

/* ── Invoices ─────────────────────────────────────────────────────────── */
function Invoices({ s }: { s: LvState }) {
  const toInvoice = s.claims.filter(c => (c.status === "Certified" || c.status === "Partially certified") && !c.invoiceId);
  const cols: Col<Invoice>[] = [
    { key: "ref", label: "Invoice", cls: "m strong", render: i => i.ref },
    { key: "p", label: "Project", render: i => <ProjectLink id={i.projectId} /> },
    { key: "per", label: "Period", hideMobile: true, render: i => i.period },
    { key: "iss", label: "Issued", hideMobile: true, render: i => dateShort(i.issued) },
    { key: "due", label: "Due", render: i => <span className={i.paid < i.net && i.due < TODAY ? "lv-bad" : ""}>{dateShort(i.due)}</span> },
    { key: "net", label: "Net", align: "r", render: i => eur(i.net), foot: eur(s.invoices.reduce((n, i) => n + i.net, 0)) },
    { key: "vat", label: "VAT", hideMobile: true, render: i => <span className="lv-small">{VAT_SHORT[i.vatMode]}</span> },
    { key: "gr", label: "Gross", align: "r", hideMobile: true, render: i => eur(vat(i).gross) },
    { key: "out", label: "Outstanding", align: "r", render: i => eur(i.net - i.paid), foot: eur(s.invoices.reduce((n, i) => n + i.net - i.paid, 0)) },
    { key: "x", label: "Xero (demo)", render: i => <StatusBadge s={i.xero} /> },
    { key: "a", label: "", align: "r", render: i => i.xero === "Not sent" ? <Btn size="sm" kind="primary" onClick={() => pushToXero(i.id)}>Push to Xero</Btn>
        : i.xero === "Draft in Xero" ? <Btn size="sm" onClick={() => approveInXero(i.id)}>Approve</Btn>
        : i.xero === "Awaiting payment" ? <Btn size="sm" onClick={() => simulatePayment(i.id)}>Simulate payment</Btn>
        : i.xero === "Reconcile warning" ? <Btn size="sm" kind="danger" onClick={() => resolveReconcile(i.id)}>Resolve</Btn> : null }
  ];
  return (
    <Page>
      <Head eyebrow="Invoices" title="Invoices" sub="Every invoice is generated from a certified amount and pushed to Xero. Submitted, certified and invoiced amounts are tracked separately." actions={<><DemoTag /><DemoTag sim>Xero demo connection</DemoTag></>} />
      {toInvoice.length > 0 && (
        <Card tone="accent" title="Certified, ready to invoice" style={{ marginBottom: 14 }} flush>
          <Rows>
            {toInvoice.map(c => (
              <Li key={c.id} title={<><ProjectLink id={c.projectId} /> · {c.ref}</>} sub={"Claimed " + eur(c.amount) + " · certified " + eur(c.certified || 0) + (c.certified! < c.amount ? " (partial)" : "")}
                right={<Btn kind="primary" size="sm" onClick={() => generateInvoice(c.id)}>Generate invoice</Btn>} />
            ))}
          </Rows>
        </Card>
      )}
      <Card flush><Table cols={cols} rows={s.invoices} foot /></Card>
    </Page>
  );
}

/* ── Cost control ─────────────────────────────────────────────────────── */
function CostControl({ s }: { s: LvState }) {
  const rows = s.projects.map(p => ({ p, f: finOf(p, s) })).sort((a, b) => a.f.gap - b.f.gap);
  const t = totals(s.projects, { pos: s.pos, variations: s.variations });
  const byCat = CATS.map(c => ({ c, actual: rows.reduce((n, r) => n + r.f.actualByCat[c], 0), open: rows.reduce((n, r) => n + r.f.openPOByCat[c], 0), fc: rows.reduce((n, r) => n + r.f.forecastByCat[c], 0) }));
  const cols: Col<typeof rows[number]>[] = [
    { key: "p", label: "Project", render: r => <ProjectLink id={r.p.id} />, cls: "strong" },
    { key: "rv", label: "Revised", align: "r", render: r => eur(r.f.revised), hideMobile: true },
    { key: "ac", label: "Actual", align: "r", render: r => eur(r.f.actual), foot: eur(t.actual) },
    { key: "po", label: "Open POs", align: "r", render: r => eur(r.f.openPO), foot: eur(t.openPO) },
    { key: "cm", label: "Committed", align: "r", cls: "strong", render: r => eur(r.f.committed), foot: eur(t.committed) },
    { key: "ctc", label: "To commit", align: "r", hideMobile: true, render: r => eur(r.f.ctc) },
    { key: "fc", label: "Forecast cost", align: "r", hideMobile: true, render: r => eur(r.f.forecast), foot: eur(t.forecast) },
    { key: "m", label: "Margin vs target", render: r => <div style={{ width: 150 }}><div className="lv-row" style={{ justifyContent: "space-between", fontSize: 11.5, marginBottom: 4 }}><span className={r.f.status === "Below target" ? "lv-bad" : r.f.status === "Watch" ? "lv-warn" : "lv-ok"}>{pct(r.f.margin)}</span><span className="lv-faint">target {pct(r.p.targetMargin, 0)}</span></div><Bar value={r.f.margin / 0.4} target={r.p.targetMargin / 0.4} tone={r.f.status === "Below target" ? "bad" : r.f.status === "Watch" ? "warn" : "ok"} thin /></div> }
  ];
  return (
    <Page>
      <Head eyebrow="Cost Control" title="Cost control" sub="Committed cost is actual cost posted plus open purchase orders. A PO moves from open to actual when its supplier invoice is matched, so nothing is counted twice."
        actions={<><DemoTag /><DemoTag sim>LiveCosts history: proposed import</DemoTag></>} />
      <div className="lv-grid lv-g4" style={{ marginBottom: 14 }}>
        <Stat label="Actual cost posted" value={eurShort(t.actual)} hint={"labour " + eurShort(t.labour)} />
        <Stat label="Open PO commitments" value={eurShort(t.openPO)} hint="approved, not yet invoiced" />
        <Stat hero label="Committed" value={eurShort(t.committed)} hint="actual + open POs" />
        <Stat label="Forecast profit" value={eurShort(t.profit)} hint={pct(t.margin) + " portfolio margin"} tone="ok" />
      </div>
      <div className="lv-grid lv-g-3-2">
        <Card title="Projects by margin gap" sub="Worst first" flush><Table cols={cols} rows={rows} foot onRow={r => openProject(r.p.id, "financials")} /></Card>
        <Card title="Cost by category" sub="All live projects">
          <Cols height={180} fmt={eurShort} data={byCat.map(b => ({ label: CAT_LABEL[b.c].split(" ")[0], parts: [{ v: b.actual, color: "var(--lv-c1)", title: "Actual" }, { v: b.open, color: "var(--lv-c4)", title: "Open POs" }, { v: Math.max(0, b.fc - b.actual - b.open), color: "var(--track)", title: "To commit" }] }))} />
          <div style={{ marginTop: 10 }}><Legend items={[["Actual", "var(--lv-c1)"], ["Open POs", "var(--lv-c4)"], ["Still to commit", "var(--track)"]]} /></div>
        </Card>
      </div>
    </Page>
  );
}

/* ── Cash flow ───────────────────────────────────────────────────────── */
function CashFlow({ s }: { s: LvState }) {
  const weeks = Array.from({ length: 8 }, (_, i) => addDays("2026-10-19", i * 7));
  const wk = (d: string) => Math.max(0, Math.min(7, Math.floor(daysBetween("2026-10-19", d) / 7)));
  const confirmed = new Array(8).fill(0), projected = new Array(8).fill(0), supplier = new Array(8).fill(0), payroll = new Array(8).fill(0);
  s.invoices.filter(i => i.net > i.paid).forEach(i => { if (i.due >= "2026-10-19") confirmed[wk(i.due)] += i.net - i.paid; else confirmed[0] += i.net - i.paid; });
  s.claims.forEach(c => {
    if ((c.status === "Certified" || c.status === "Partially certified") && !c.invoiceId) projected[wk(addDays(c.certifiedDate || TODAY, 30))] += c.certified || 0;
    if (c.status === "Submitted") projected[wk(addDays(c.assessmentDue || TODAY, 30))] += c.amount;
    if (c.status === "Draft" || c.status === "Internal review") projected[wk(addDays(TODAY, 44))] += c.amount;
  });
  s.pos.filter(p => p.status === "Committed").forEach(p => { supplier[wk(addDays(p.due, 45))] += p.value; });
  const staffWeek = EMPLOYEES.reduce((n, e) => n + (e.rate || 34) * 39, 0);
  const subsWeek = ALLOCATIONS.filter(a => a.personId.startsWith("s")).reduce((n, a) => n + (SUBCONTRACTORS.find(x => x.id === a.personId)?.dayRate || 0) * 5, 0);
  weeks.forEach((_, i) => { payroll[i] = staffWeek + subsWeek; });
  const rows = weeks.map((w, i) => ({ w, c: confirmed[i], p: projected[i], s: supplier[i], pay: payroll[i], net: confirmed[i] - supplier[i] - payroll[i] }));
  const cols: Col<typeof rows[number]>[] = [
    { key: "w", label: "Week from", render: r => dateShort(r.w), cls: "strong" },
    { key: "c", label: "Confirmed receipts", align: "r", render: r => eur(r.c), foot: eur(confirmed.reduce((a, b) => a + b, 0)) },
    { key: "p", label: "Projected receipts", align: "r", render: r => <span className="lv-muted">{eur(r.p)}</span>, foot: eur(projected.reduce((a, b) => a + b, 0)) },
    { key: "s", label: "Supplier payments", align: "r", render: r => eur(r.s), foot: eur(supplier.reduce((a, b) => a + b, 0)) },
    { key: "pay", label: "Payroll & subcontract", align: "r", hideMobile: true, render: r => eur(r.pay), foot: eur(payroll.reduce((a, b) => a + b, 0)) },
    { key: "n", label: "Net (confirmed only)", align: "r", render: r => <span className={r.net < 0 ? "lv-bad" : "lv-ok"}>{eur(r.net)}</span> }
  ];
  const proj = s.projects.map(p => ({ p, f: finOf(p, s) })).map(r => ({ ...r, cash: r.f.paid - r.f.actual }));
  return (
    <Page>
      <Head eyebrow="Cash Flow" title="Cash flow, next 8 weeks" sub="Confirmed receipts are invoices already issued. Projected receipts are certified or claimed amounts not yet invoiced, shown separately and never added to the confirmed line."
        actions={<DemoTag />} />
      <div className="lv-grid lv-g4" style={{ marginBottom: 14 }}>
        <Stat label="Outstanding certified (invoiced)" value={eur(confirmed.reduce((a, b) => a + b, 0))} />
        <Stat label="Projected receipts" value={eur(projected.reduce((a, b) => a + b, 0))} hint="not yet invoiced" />
        <Stat label="Supplier payments due" value={eur(supplier.reduce((a, b) => a + b, 0))} hint="open POs on account terms" />
        <Stat label="Weekly payroll exposure" value={eur(staffWeek + subsWeek)} hint={"staff " + eurShort(staffWeek) + " · subcontract " + eurShort(subsWeek)} />
      </div>
      <div className="lv-grid lv-g-3-2">
        <Card title="Weekly position" flush><Table cols={cols} rows={rows} foot /></Card>
        <Card title="Receipts by week">
          <Cols height={200} fmt={eurShort} data={rows.map(r => ({ label: dateShort(r.w), parts: [{ v: r.c, color: "var(--lv-c2)", title: "Confirmed" }, { v: r.p, color: "color-mix(in srgb, var(--lv-c1) 45%, transparent)", title: "Projected" }] }))} />
          <div style={{ marginTop: 10 }}><Legend items={[["Confirmed (invoiced)", "var(--lv-c2)"], ["Projected (not invoiced)", "color-mix(in srgb, var(--lv-c1) 45%, transparent)"]]} /></div>
        </Card>
      </div>
      <Card title="Project cash position" sub="Cash received less cost posted" flush style={{ marginTop: 14 }}>
        <Table rows={proj} onRow={r => openProject(r.p.id, "financials")} cols={[
          { key: "p", label: "Project", render: r => <ProjectLink id={r.p.id} />, cls: "strong" },
          { key: "ce", label: "Certified", align: "r", render: r => eur(r.f.certified) },
          { key: "in", label: "Invoiced", align: "r", render: r => eur(r.f.invoiced), hideMobile: true },
          { key: "pd", label: "Paid", align: "r", render: r => eur(r.f.paid) },
          { key: "ac", label: "Cost posted", align: "r", render: r => eur(r.f.actual) },
          { key: "cs", label: "Cash position", align: "r", render: r => <span className={r.cash < 0 ? "lv-bad" : "lv-ok"}>{eur(r.cash)}</span> }
        ]} />
      </Card>
    </Page>
  );
}

/* ── Xero sync ───────────────────────────────────────────────────────── */
function XeroSync({ s }: { s: LvState }) {
  const warn = s.invoices.filter(i => i.xero === "Reconcile warning");
  const counts = ["Not sent", "Queued", "Draft in Xero", "Awaiting payment", "Paid", "Reconcile warning"].map(x => [x, s.invoices.filter(i => i.xero === x).length] as [string, number]);
  return (
    <Page>
      <Head eyebrow="Xero Sync" title="Xero" sub="Xero stays the accounting system. This page shows how invoices, payments and customer records would sync both ways."
        actions={<><DemoTag sim>Demo connection: no API calls</DemoTag><Btn onClick={syncContacts}>Sync contacts (simulated)</Btn></>} />
      <div className="lv-grid lv-g6" style={{ marginBottom: 14 }}>
        {counts.map(([k, n]) => <Stat key={k} label={k} value={n} tone={k === "Reconcile warning" && n ? "bad" : k === "Paid" ? "ok" : ""} />)}
      </div>
      <div className="lv-grid lv-g-3-2">
        <div className="lv-stack">
          {warn.length > 0 && (
            <Card tone="bad" title="Reconciliation warnings" flush>
              <Rows>{warn.map(i => <Li key={i.id} title={i.ref + " · " + projectOf(i.projectId)!.name} sub="A part payment arrived that doesn't match any open amount." right={<Btn size="sm" onClick={() => resolveReconcile(i.id)}>Mark on-account</Btn>} />)}</Rows>
            </Card>
          )}
          <Card title="Sync history" sub="Newest first. Every entry is simulated." flush>
            <Rows>
              {s.xeroLog.map(e => <Li key={e.id} left={<Badge tone={e.state === "warn" ? "warn" : e.state === "info" ? "info" : "ok"}>{e.kind}</Badge>} title={e.text} sub={e.at} />)}
            </Rows>
          </Card>
        </div>
        <div className="lv-stack">
          <Card title="Customer records" sub="Client ↔ Xero contact mapping" flush>
            <Table dense rows={CLIENTS} cols={[
              { key: "n", label: "Client", render: c => c.name, cls: "strong" },
              { key: "x", label: "Xero contact", cls: "m", render: c => c.xeroContact },
              { key: "t", label: "Terms", hideMobile: true, render: c => c.terms }
            ]} />
          </Card>
          <Card title="What syncs">
            <KV items={[["Invoices", "Pulse → Xero"], ["Status", "Xero → Pulse"], ["Payments", "Xero → Pulse"], ["Contacts", "Both ways"], ["Supplier bills", "Proposed"], ["Tracking", "Project ref"]]} />
            <div style={{ marginTop: 12 }}><Note>Today ServiceM8 pushes invoices to Xero. Pulse would take that over for contract claims, keeping Xero as the ledger. Integration is not built or tested in this demo.</Note></div>
          </Card>
        </div>
      </div>
    </Page>
  );
}

export { Split };
