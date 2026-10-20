/* Small shared building blocks for the Lavelle modules. They sit on the Pulse
   theme tokens (see styles/lavelle.css) so every theme keeps working. */

import { Fragment, useEffect, type CSSProperties, type ReactNode } from "react";
import { clearToast, openProject, useLv, project as projectOf } from "../../lavelle/store";
import { initials } from "../../lavelle/format";

type Tone = "ok" | "warn" | "bad" | "info" | "accent" | "ghost" | "neutral" | "";

export function Page({ children }: { children: ReactNode }) {
  return <div className="lv-page">{children}</div>;
}

export function Head({ eyebrow, title, sub, actions }: { eyebrow?: ReactNode; title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="lv-head">
      <div style={{ minWidth: 0 }}>
        {eyebrow && <div className="lv-eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {sub && <div className="lv-sub">{sub}</div>}
      </div>
      {actions && <div className="lv-actions">{actions}</div>}
    </div>
  );
}

export function Card({ title, sub, right, children, flush, tone, onClick, className, style }: {
  title?: ReactNode; sub?: ReactNode; right?: ReactNode; children?: ReactNode; flush?: boolean; tone?: "accent" | "warn" | "bad";
  onClick?: () => void; className?: string; style?: CSSProperties;
}) {
  return (
    <div className={["lv-card", tone, onClick ? "click" : "", className].filter(Boolean).join(" ")} onClick={onClick} style={style}>
      {(title || right) && (
        <div className="lv-card-h">
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && <div className="lv-card-t">{title}</div>}
            {sub && <div className="lv-card-s">{sub}</div>}
          </div>
          {right}
        </div>
      )}
      {children !== undefined && <div className={"lv-card-b" + (flush ? " flush" : "")}>{children}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, tone, onClick, hero }: { label: ReactNode; value: ReactNode; hint?: ReactNode; tone?: Tone; onClick?: () => void; hero?: boolean }) {
  const cls = ["lv-stat", tone, hero ? "hero" : ""].filter(Boolean).join(" ");
  const inner = (<><div className="k">{label}</div><div className="v">{value}</div>{hint && <div className="h">{hint}</div>}</>);
  return onClick ? <button className={cls} onClick={onClick}>{inner}</button> : <div className={cls}>{inner}</div>;
}

export function Badge({ tone = "", children, dot }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return <span className={"lv-badge " + tone}>{dot && <span className="dot" />}{children}</span>;
}

/** A visible marker that a figure is demo data or an integration is simulated. */
export function DemoTag({ sim, children }: { sim?: boolean; children?: ReactNode }) {
  return <span className={"lv-tag" + (sim ? " sim" : "")} title={sim ? "Simulated: no live connection" : "Illustrative demo data"}>{children || (sim ? "Simulated" : "Demo data")}</span>;
}

export function Btn({ kind = "", size = "", onClick, children, disabled, title, type }: {
  kind?: "primary" | "ghost" | "danger" | "okb" | ""; size?: "sm" | "lg" | ""; onClick?: (e: any) => void; children: ReactNode; disabled?: boolean; title?: string; type?: "button" | "submit";
}) {
  return <button type={type || "button"} className={["lv-btn", kind, size].filter(Boolean).join(" ")} onClick={(e) => { e.stopPropagation(); onClick?.(e); }} disabled={disabled} title={title}>{children}</button>;
}

export function Seg<T extends string>({ options, value, onChange }: { options: [T, string][]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="lv-seg">
      {options.map(([v, l]) => <button key={v} className={v === value ? "on" : ""} onClick={() => onChange(v)}>{l}</button>)}
    </div>
  );
}

export function Select({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: [string, string][]; label?: string }) {
  return (
    <select className="lv-select" value={value} aria-label={label} onChange={(e) => onChange(e.target.value)}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

export function Bar({ value, tone, target, thin, title }: { value: number; tone?: "ok" | "warn" | "bad" | "neutral"; target?: number; thin?: boolean; title?: string }) {
  const w = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={["lv-bar", tone, thin ? "thin" : ""].filter(Boolean).join(" ")} title={title}>
      <i style={{ width: w + "%" }} />
      {target !== undefined && <b style={{ left: "calc(" + Math.max(0, Math.min(1, target)) * 100 + "% - 1px)" }} />}
    </div>
  );
}

export interface Col<R> { key: string; label: ReactNode; align?: "r" | "c"; cls?: string; render: (r: R, i: number) => ReactNode; foot?: ReactNode; hideMobile?: boolean; }
export function Table<R>({ cols, rows, onRow, empty, dense, rowClass, foot, maxH }: {
  cols: Col<R>[]; rows: R[]; onRow?: (r: R) => void; empty?: ReactNode; dense?: boolean; rowClass?: (r: R) => string; foot?: boolean; maxH?: number;
}) {
  return (
    <div className="lv-tablewrap" style={maxH ? { maxHeight: maxH, overflowY: "auto" } : undefined}>
      <table className={"lv-table" + (dense ? " dense" : "")}>
        <thead><tr>{cols.map(c => <th key={c.key} className={[c.align, c.hideMobile ? "lv-mob-hide" : ""].filter(Boolean).join(" ")}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={[onRow ? "click" : "", rowClass?.(r)].filter(Boolean).join(" ")} onClick={onRow ? () => onRow(r) : undefined}>
              {cols.map(c => <td key={c.key} className={[c.align, c.cls, c.hideMobile ? "lv-mob-hide" : ""].filter(Boolean).join(" ")}>{c.render(r, i)}</td>)}
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={cols.length}><div className="lv-empty">{empty || <><b>Nothing here</b>Try a different filter.</>}</div></td></tr>}
        </tbody>
        {foot && <tfoot><tr>{cols.map(c => <td key={c.key} className={[c.align, c.cls, c.hideMobile ? "lv-mob-hide" : ""].filter(Boolean).join(" ")}>{c.foot}</td>)}</tr></tfoot>}
      </table>
    </div>
  );
}

export function HBars({ items }: { items: { label: ReactNode; value: number; max: number; right?: ReactNode; tone?: "ok" | "warn" | "bad" | "neutral"; target?: number; onClick?: () => void }[] }) {
  return (
    <div className="lv-hbars">
      {items.map((it, i) => (
        <div key={i} className={"lv-hbar" + (it.onClick ? " click" : "")} onClick={it.onClick}>
          <span className="l">{it.label}</span>
          <Bar value={it.max ? it.value / it.max : 0} tone={it.tone} target={it.target !== undefined && it.max ? it.target / it.max : undefined} />
          <span className="r">{it.right}</span>
        </div>
      ))}
    </div>
  );
}

/** Stacked column chart built from divs: data[].parts are drawn bottom-up. */
export function Cols({ data, height = 150, max, fmt }: { data: { label: string; parts: { v: number; color: string; title?: string }[] }[]; height?: number; max?: number; fmt?: (n: number) => string }) {
  const top = max || Math.max(1, ...data.map(d => d.parts.reduce((n, p) => n + p.v, 0)));
  return (
    <div className="lv-cols" style={{ ["--h" as any]: height + "px" }}>
      {data.map((d, i) => {
        const tot = d.parts.reduce((n, p) => n + p.v, 0);
        return (
          <div className="lv-col" key={i} title={d.label + (fmt ? ": " + fmt(tot) : "")}>
            {fmt && <span className="val">{fmt(tot)}</span>}
            <div className="stack" style={{ height: Math.max(2, (tot / top) * (height - 40)) + "px" }}>
              {d.parts.map((p, k) => <i key={k} title={p.title} style={{ height: tot ? (p.v / tot) * 100 + "%" : 0, background: p.color, animationDelay: i * 40 + "ms" }} />)}
            </div>
            <span className="lab">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Legend({ items }: { items: [string, string][] }) {
  return <div className="lv-legend">{items.map(([l, c]) => <span key={l}><i style={{ background: c }} />{l}</span>)}</div>;
}

export function Split({ parts }: { parts: { v: number; color: string; label?: string }[] }) {
  const tot = parts.reduce((n, p) => n + p.v, 0) || 1;
  return <div className="lv-split">{parts.map((p, i) => <i key={i} title={p.label} style={{ width: (p.v / tot) * 100 + "%", background: p.color }} />)}</div>;
}

export function Spark({ values, color = "var(--accent)", w = 120, h = 30 }: { values: number[]; color?: string; w?: number; h?: number }) {
  const mx = Math.max(...values), mn = Math.min(...values), rg = mx - mn || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 3 - ((v - mn) / rg) * (h - 6)]);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", overflow: "visible" }}>
      <polyline points={pts.map(p => p.join(",")).join(" ")} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.6" fill={color} />
    </svg>
  );
}

export function KV({ items }: { items: [ReactNode, ReactNode][] }) {
  return <div className="lv-kv">{items.map(([k, v], i) => <div key={i}><div className="k">{k}</div><div className="v">{v}</div></div>)}</div>;
}

export function Note({ tone, children, icon }: { tone?: "warn" | "bad" | "ok" | "accent"; children: ReactNode; icon?: boolean }) {
  return (
    <div className={"lv-note " + (tone || "")}>
      {icon !== false && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ flex: "none", marginTop: 2, opacity: .8 }}><path d="M12 8v5 M12 16.5v.01 M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>}
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  );
}

export function Empty({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return <div className="lv-empty"><b>{title}</b>{children}</div>;
}

export function Avatar({ name, sub }: { name: string; sub?: boolean }) {
  return <span className={"lv-av" + (sub ? " sub" : "")}>{initials(name)}</span>;
}

/** A project name that opens its workspace. */
export function ProjectLink({ id, short }: { id: string | null; short?: boolean }) {
  useLv();
  const p = projectOf(id);
  if (!p) return <span className="lv-faint">Unallocated</span>;
  return <span className="lv-link" onClick={(e) => { e.stopPropagation(); openProject(p.id); }}>{short ? p.ref : p.name}</span>;
}

export function Drawer({ open, onClose, title, eyebrow, children, footer }: { open: boolean; onClose: () => void; title: ReactNode; eyebrow?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  if (!open) return null;
  return (
    <div className="lv-drawer-scrim" onClick={onClose}>
      <div className="lv-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="lv-drawer-h">
          <div style={{ flex: 1, minWidth: 0 }}>
            {eyebrow && <div className="lv-mono lv-faint" style={{ fontSize: 9.5, letterSpacing: ".13em", textTransform: "uppercase" }}>{eyebrow}</div>}
            <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-.4px", marginTop: 6 }}>{title}</div>
          </div>
          <button className="lv-x" onClick={onClose} aria-label="Close"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12 M18 6 6 18" /></svg></button>
        </div>
        <div className="lv-drawer-b">{children}</div>
        {footer && <div style={{ padding: "14px 22px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>{footer}</div>}
      </div>
    </div>
  );
}

export function Steps({ steps, at }: { steps: string[]; at: number }) {
  return (
    <div className="lv-steps">
      {steps.map((s, i) => (
        <div key={s} className={"lv-step" + (i < at ? " done" : i === at ? " on" : "")}>
          <span className="n">{i < at ? "✓" : i + 1}</span>{s}
        </div>
      ))}
    </div>
  );
}

export function SubTabs<T extends string>({ tabs, value, onChange }: { tabs: [T, string][]; value: T; onChange: (t: T) => void }) {
  return <div className="lv-tabs2">{tabs.map(([v, l]) => <button key={v} className={v === value ? "on" : ""} onClick={() => onChange(v)}>{l}</button>)}</div>;
}

export function Toast() {
  const s = useLv();
  useEffect(() => {
    if (!s.toast) return;
    const t = setTimeout(clearToast, 3600);
    return () => clearTimeout(t);
  }, [s.toast?.n]);
  if (!s.toast) return null;
  return <div className="lv-toast" key={s.toast.n} role="status"><i />{s.toast.text}</div>;
}

export function Rows({ children }: { children: ReactNode }) { return <div className="lv-list">{children}</div>; }
export function Li({ title, sub, left, right, onClick }: { title: ReactNode; sub?: ReactNode; left?: ReactNode; right?: ReactNode; onClick?: () => void }) {
  return (
    <div className={"lv-li" + (onClick ? " click" : "")} onClick={onClick}>
      {left}
      <div className="grow"><div className="t">{title}</div>{sub && <div className="s">{sub}</div>}</div>
      {right}
    </div>
  );
}

export const toneForStatus = (s: string): Tone => {
  if (/below|bad|late|dispute|fail|investigate|missing|reject|mismatch|overdue/i.test(s)) return "bad";
  if (/watch|review|await|pending|draft|needs|part|queued|warn|no clock|submitted|booked|actions/i.test(s)) return "warn";
  if (/on target|paid|certified|approved|posted|delivered|pass|matched|allocated|ok|done|won|synced|in xero|complete/i.test(s)) return "ok";
  if (/not started|not due|not sent|overhead/i.test(s)) return "ghost";
  return "info";
};
export function StatusBadge({ s }: { s: string }) { return <Badge tone={toneForStatus(s)} dot>{s}</Badge>; }

export { Fragment };
