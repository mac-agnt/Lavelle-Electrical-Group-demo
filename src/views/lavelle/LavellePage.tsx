/* Routes a Lavelle module page to its view. The active top-bar tab lives in
   the shared store, so links from anywhere (Home, agents, Work) land on the
   right tab. */

import { useLv } from "../../lavelle/store";
import Projects from "./Projects";
import Estimating from "./Estimating";
import Claims from "./Claims";
import Workforce from "./Workforce";
import SiteOps from "./SiteOps";
import Procurement from "./Procurement";
import Fleet from "./Fleet";
import LvDashboard from "./LvDashboard";

const VIEWS: Record<string, (p: { tab: string }) => JSX.Element> = {
  "Projects": Projects, "Estimating": Estimating, "Claims & Finance": Claims, "Workforce": Workforce,
  "Site Operations": SiteOps, "Procurement": Procurement, "Fleet & Fuel": Fleet, "Dashboard": LvDashboard
};

export default function LavellePage({ page }: { page: string }) {
  const s = useLv();
  const View = VIEWS[page];
  if (!View) return null;
  return <View key={page} tab={s.tabs[page]} />;
}
