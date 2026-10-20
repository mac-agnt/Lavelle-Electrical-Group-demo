/* Formatting helpers. Euro, Irish dates, percentages. */

const EUR0 = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const EUR2 = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const NUM = new Intl.NumberFormat("en-IE");

/** €12,345 */
export const eur = (n: number) => EUR0.format(Math.round(n));
/** €12,345.67 */
export const eur2 = (n: number) => EUR2.format(n);
/** €8.42m / €428.6k / €940 */
export function eurShort(n: number): string {
  const a = Math.abs(n), s = n < 0 ? "-" : "";
  if (a >= 1_000_000) return s + "€" + (a / 1_000_000).toFixed(2) + "m";
  if (a >= 10_000) return s + "€" + (a / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return s + EUR0.format(a);
}
export const num = (n: number) => NUM.format(Math.round(n));
export const pct = (n: number, dp = 1) => (n * 100).toFixed(dp) + "%";
export const pctInt = (n: number) => Math.round(n * 100) + "%";

/** The demo runs on a fixed "today" so every date reads consistently. */
export const TODAY = "2026-10-20";
export const NOW_LABEL = "Tue 20 Oct 2026";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "2026-10-20" → "20 Oct 2026" (Irish order). */
export function date(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return d + " " + MONTHS[m - 1] + " " + y;
}
/** "2026-10-20" → "20 Oct" */
export function dateShort(iso: string): string {
  if (!iso) return "—";
  const [, m, d] = iso.split("-").map(Number);
  return d + " " + MONTHS[m - 1];
}
/** "2026-10-20" → "Tue 20 Oct" */
export function dateDay(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return DAYS[dow] + " " + d + " " + MONTHS[m - 1];
}
/** Whole days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  const pa = a.split("-").map(Number), pb = b.split("-").map(Number);
  return Math.round((Date.UTC(pb[0], pb[1] - 1, pb[2]) - Date.UTC(pa[0], pa[1] - 1, pa[2])) / 86400000);
}
export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}
export const initials = (name: string) => name.split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
