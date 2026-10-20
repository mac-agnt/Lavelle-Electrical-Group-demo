/* Phone-width navigation: the side rail hides under 760px and this bar takes
   over, with the rest of the modules one tap away in a sheet. */

import { useState } from "react";
import { ICONS } from "../../logic/data";

const MAIN: [string, string, string][] = [["Home", "Home", "helios"], ["Projects", "Projects", "lvProjects"], ["Claims & Finance", "Claims", "lvClaims"], ["Workforce", "Crews", "lvWorkforce"]];
const ALL: [string, string][] = [["Home", "helios"], ["Agents", "navAgents"], ["Projects", "lvProjects"], ["Estimating", "lvEstimating"], ["Claims & Finance", "lvClaims"], ["Workforce", "lvWorkforce"],
  ["Site Operations", "lvSite"], ["Procurement", "lvProcure"], ["Fleet & Fuel", "lvFleet"], ["Dashboard", "navDash"], ["Work", "navWork"], ["Records", "navRecords"], ["Activity", "pulseLine"], ["Settings", "navAdmin"]];
const I = ICONS as Record<string, string>;

function Glyph({ d }: { d: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

export default function MobileNav({ page, go }: { page: string; go: (p: string) => void }) {
  const [open, setOpen] = useState(false);
  const inMain = MAIN.some(m => m[0] === page);
  return (
    <>
      <nav className="lv-mobnav" aria-label="Main">
        {MAIN.map(([p, l, ic]) => (
          <button key={p} className={page === p ? "on" : ""} onClick={() => { setOpen(false); go(p); }}><Glyph d={I[ic]} />{l}</button>
        ))}
        <button className={!inMain ? "on" : ""} onClick={() => setOpen(true)}><Glyph d="M4 6h16 M4 12h16 M4 18h16" />More</button>
      </nav>
      {open && (
        <div className="lv-mobsheet" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 13, fontWeight: 600, padding: "4px 6px 12px" }}>Lavelle Electrical Group</div>
            <div className="grid">
              {ALL.map(([p, ic]) => (
                <button key={p} className={page === p ? "on" : ""} onClick={() => { setOpen(false); go(p); }}><Glyph d={I[ic]} />{p}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
