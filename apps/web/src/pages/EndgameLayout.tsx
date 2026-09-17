import { Outlet } from "react-router-dom";
import { PageShell, SubNav } from "../components/PageChrome.tsx";

const ITEMS = [
  { to: "/endgame/waystones", label: "換界石" },
  { to: "/endgame/tablets", label: "碑牌" },
];

export default function EndgameLayout() {
  return (
    <PageShell kicker="ENDGAME" title="終局">
      <SubNav items={ITEMS} />
      <Outlet />
    </PageShell>
  );
}
