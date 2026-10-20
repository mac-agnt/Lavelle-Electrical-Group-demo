# Lavelle module build brief (for builders)

Repo: Pulse v4 Glass, re-skinned for **Lavelle Electrical Group** (Dublin/Galway electrical contractor, founder Martin Lavelle). Vite + React 18 + TS. No new dependencies. Frontend only, mock data.

## Read first
- `src/lavelle/types.ts` – all record shapes.
- `src/lavelle/seed.ts` – the dataset (projects p01..p12, employees e01..e40, subcontractors s01..s15, POs, fuel, claims, invoices, reports, units, issues, inspections, documents, enquiries, quote, take-off). `TYPE_LABEL`, `CAT_LABEL`, `CATS`, `DEFAULT_TARGET`, `DEMO_NOTE`, `PORTFOLIO`.
- `src/lavelle/calc.ts` – `fin(project, ctx)` returns every financial figure (revised, actual, openPO, committed, ctc, forecast, profit, margin, target, status, certified/invoiced/paid, progress, by-category maps). `claimTotals`, `lineCalc`, `vat`, `totals`. **Never compute money any other way.**
- `src/lavelle/store.ts` – `useLv()` hook (re-renders on any change), `getState`, lookups (`person`, `sub`, `personName`, `client`, `project`, `finOf(p, s)`), navigation (`navigate({page, tab?, project?, projectTab?, claim?})`, `openProject(id, tab?)`, `setTab`, `setProjectTab`, `closeProject`, `setFilter`), actions (`approvePO`, `rejectPO`, `markDelivered`, `postSupplierInvoice`, `allocateFuel`, `fuelOverhead`, `importFuelCsv`, `approveTimesheet`, `approveAllMatched`, `setProposal`, `labourCost`, `approveReport`, `decide`, `toggleTask`, `setTarget`, `createMonthlyClaim`, quote actions `setQuoteLine/setMarkup/setLabourRate/quoteTotals/setQuoteStatus/resetQuote`, `toast`), and extension points `update(patch | fn)`, `logEvent(...)`, `mapProject`. `MODULE_TABS` lists each module's tab ids.
- `src/lavelle/answers.ts` – `kpis()`, `briefingLines()`, helpers `unsubmitted/pendingApprovals/fuelToAllocate/labourIssues/marginAlerts`.
- `src/lavelle/format.ts` – `eur`, `eur2`, `eurShort`, `pct`, `pctInt`, `date` ("20 Oct 2026"), `dateShort`, `dateDay`, `daysBetween`, `addDays`, `TODAY` = "2026-10-20".
- `src/views/lavelle/ui.tsx` – UI kit: `Page, Head, Card, Stat, Badge, StatusBadge, DemoTag (sim prop = "Simulated"), Btn, Seg, Select, Bar, Table (cols: {key,label,align:"r"|"c",cls,render,foot,hideMobile}), HBars, Cols (stacked columns), Legend, Split, Spark, KV, Note, Empty, Avatar, ProjectLink, Drawer, Steps, SubTabs, Rows, Li, toneForStatus`.
- `src/styles/lavelle.css` – classes: `lv-grid lv-g2 lv-g3 lv-g4 lv-g6 lv-g-2-1 lv-g-1-2 lv-g-3-2 lv-span2 lv-stack lv-row lv-spacer lv-hero lv-unitgrid lv-unit lv-muted lv-faint lv-ink lv-ok lv-warn lv-bad lv-acc lv-mono lv-small lv-mob-hide lv-mob-only lv-input lv-num lv-pct`. Chart colour vars: `--lv-c1..c6`, `--lv-grad`, theme tokens `--accent --ok --warn --bad --dim --faint --ink --surface --surface-2 --border --track`.
- Look at `src/views/lavelle/Claims.tsx` once it exists for a reference of tone/density.

## Rules
- Each module file default-exports `function X({ tab }: { tab: string })` and switches on `tab` ids from `MODULE_TABS` in store.ts. Every tab must be fully populated (no placeholders, no lorem ipsum). Dense but readable; avoid big empty areas. Use `lv-grid` layouts, `Stat` rows (`lv-g6`/`lv-g4`), tables and charts.
- Only edit the files you own. Do NOT edit store.ts, seed.ts, calc.ts, answers.ts, ui.tsx, lavelle.css, PulseLogic.js, AppShell.tsx. If you need extra actions, put them in `src/lavelle/actions-<module>.ts` using `update`/`logEvent`/`mapProject`. If you need extra CSS, create `src/styles/lv-<module>.css` and import it from your tsx.
- Money only via `finOf`/`fin`/`claimTotals`. Committed = actual + open POs; never add a PO to both. Fuel allocation adds to plant & fuel actual.
- Mark fabricated figures: put `<DemoTag />` in each page Head actions; label integrations as simulated (`<DemoTag sim />`) — Sync, Countfire, fuel CSV, Xero are all simulated/proposed, never "live/connected". WhatsApp is the existing workflow.
- Copy: plain, direct Irish-English business tone. No em dashes (use commas, colons, parentheses). No exclamation marks. No "Welcome to", no marketing filler. Irish date format.
- Project names clickable via `ProjectLink` / `openProject`. Rows that represent records should open something (drawer or navigate).
- Mobile (<760px) must work: grids collapse via CSS; wide tables scroll horizontally; use `hideMobile` on non-essential columns.
- Story threads must stay consistent: LE-2026-014 Dalkey (p01) €600,000 contract + €18,400 VO, €61,200 open POs, SR-1043 second fix units 13–18 (Story F); 4 labour allocations to confirm (Story C); 4 fuel transactions to allocate (Story D); Grand Canal Dock (p02) 18.9% vs 24% target (Story E). Read numbers from state, never hardcode them.
- Finish with `npx tsc -b` passing (run from repo root). Don't start a dev server; the lead verifies in the browser.
