import { Route } from "react-router-dom";
import { SEASON_BD_V1, type BdShowcase } from "@poe2-regex/data";
import MemorialDetail from "./MemorialDetail.tsx";
import ShowcaseBoard from "./ShowcaseBoard.tsx";
import ShowcaseEditor from "./ShowcaseEditor.tsx";
import ShowcaseLayout from "./ShowcaseLayout.tsx";

export function showcaseRoute(snapshot: BdShowcase = SEASON_BD_V1) {
  return (
    <Route path="showcase" element={<ShowcaseLayout snapshot={snapshot} />}>
      <Route path="memorial" element={<ShowcaseBoard mode="memorial" />} />
      <Route path="memorial/:slotId" element={<MemorialDetail />} />
      <Route path="recommended" element={<ShowcaseBoard mode="recommended" />} />
      <Route path="recommended/:slotId" element={<ShowcaseEditor />} />
    </Route>
  );
}
