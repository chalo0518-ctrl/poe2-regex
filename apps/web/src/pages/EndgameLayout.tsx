import { Outlet } from "react-router-dom";
import { PageShell, SubNav } from "../components/PageChrome.tsx";
import { useLocale } from "../i18n.tsx";

export default function EndgameLayout() {
  const { t } = useLocale();
  const items = [
    { to: "/endgame/waystones", label: t.endgameWaystones },
    { to: "/endgame/tablets", label: t.endgameTablets },
  ];
  return (
    <PageShell kicker="ENDGAME" title={t.endgame}>
      <SubNav items={items} />
      <Outlet />
    </PageShell>
  );
}
