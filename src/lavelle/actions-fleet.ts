/* Fleet actions on top of the core store. Overhead keeps a fill off every
   project (office cars, pool card) and records who decided it. */

import { fuelOverhead, getState, logEvent, toast, update } from "./store";

export function markOverhead(id: string) {
  const t = getState().fuel.find(f => f.id === id);
  if (!t) return;
  fuelOverhead(id);
  logEvent({ stream: "people", title: "Fuel transaction set to overhead", note: "€" + t.total.toFixed(2) + " " + t.station + " (" + t.date + ") kept off project cost as company overhead.",
    actor: "Martin Lavelle", rel: "Fleet & Fuel", src: "Pulse", status: "completed" });
  if (t.cardId === "fc18") update(s => ({ tasks: s.tasks.map(x => x.id === "t03" ? { ...x, status: "Done" as const } : x) }));
  toast("€" + t.total.toFixed(2) + " set to overhead. No project cost changed.");
}
