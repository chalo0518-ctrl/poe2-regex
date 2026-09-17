import { Outlet } from "react-router-dom";
import { PageShell, SubNav } from "../components/PageChrome.tsx";

const ITEMS = [
  { to: "/early/chapters", label: "章節地圖" },
  { to: "/early/vendor", label: "商店裝備篩選" },
  { to: "/early/builds", label: "流派推薦裝備" },
  { to: "/early/shields", label: "實驗：盾牌詞綴" },
];

export default function EarlyLayout() {
  return (
    <PageShell kicker="EARLY GAME" title="開荒／新手">
      <SubNav items={ITEMS} />
      <Outlet />
    </PageShell>
  );
}
