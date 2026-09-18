import { Outlet } from "react-router-dom";
import { PageShell, SubNav } from "../components/PageChrome.tsx";
import { useLocale } from "../i18n.tsx";

export default function EarlyLayout() {
  const { t } = useLocale();
  const items = [
    { to: "/early/chapters", label: t.earlyChapters },
    { to: "/early/vendor", label: t.earlyVendor },
    { to: "/early/builds", label: t.earlyBuilds },
    { to: "/early/shields", label: t.earlyShields },
  ];
  return (
    <PageShell kicker="EARLY GAME" title={t.early}>
      <SubNav items={items} />
      <Outlet />
    </PageShell>
  );
}
