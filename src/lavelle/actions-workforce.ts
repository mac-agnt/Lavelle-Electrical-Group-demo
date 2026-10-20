/* Workforce actions that sit on top of the core store. Posting an exception
   goes through approveTimesheet (so project labour moves once), then closes
   Orla's task when the last of yesterday's exceptions is decided. */

import { approveTimesheet, getState, update, toast, personName, project, labourCost, setProposal } from "./store";
import { labourIssues } from "./answers";
import { eur } from "./format";

export function postException(id: string) {
  const t = getState().timesheets.find(x => x.id === id);
  if (!t || !t.proposal || t.state === "Posted") return;
  const pr = t.proposal;
  approveTimesheet(id);
  if (labourIssues(getState()).length === 0) {
    update(s => ({ tasks: s.tasks.map(x => x.id === "t07" ? { ...x, status: "Done" as const } : x) }));
  }
  toast(personName(t.personId) + ": " + pr.hours + "h" + (pr.ot ? " + " + pr.ot + "h OT" : "") + " posted to "
    + (project(pr.projectId)?.ref || "project") + " (" + eur(labourCost(t.personId, pr.hours, pr.ot)) + ")");
}

/** Copy one side of the comparison into the proposal. */
export function takeSide(id: string, side: "pm" | "sync") {
  const t = getState().timesheets.find(x => x.id === id);
  if (!t || t.state === "Posted") return;
  if (side === "pm" && t.pm && t.pm.projectId) setProposal(id, { projectId: t.pm.projectId, hours: t.pm.hours, ot: t.pm.ot });
  if (side === "sync" && t.sync && t.sync.projectId) {
    const std = Math.min(8, t.sync.hours);
    setProposal(id, { projectId: t.sync.projectId, hours: std, ot: Math.max(0, Math.round((t.sync.hours - std) * 2) / 2) });
  }
}
