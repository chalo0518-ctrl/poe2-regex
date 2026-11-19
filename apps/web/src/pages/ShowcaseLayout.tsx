import { NavLink, Outlet, useMatch } from "react-router-dom";
import { SEASON_BD_V1, type BdShowcase } from "@poe2-regex/data";
import { PageShell } from "../components/PageChrome.tsx";
import { useLocale } from "../i18n.tsx";
import { ShowcaseProvider } from "./showcaseState.tsx";

export default function ShowcaseLayout({ snapshot = SEASON_BD_V1 }: { snapshot?: BdShowcase }) {
  const { locale, t } = useLocale();
  const memorial = useMatch({ path: "/showcase/memorial", end: false });
  const recommended = useMatch({ path: "/showcase/recommended", end: false });
  const title = locale === "en" ? snapshot.titleEn : snapshot.titleZh;

  return (
    <ShowcaseProvider snapshot={snapshot}>
      <PageShell kicker="SEASON" title={title}>
        <div role="tablist" aria-label={t.showcaseTabsAria} className="mb-6 flex flex-wrap gap-1 border-b border-line pb-3">
          <ShowcaseTab id="showcase-tab-memorial" to="/showcase/memorial" selected={Boolean(memorial)} label={t.showcaseTabMemorial} />
          <ShowcaseTab id="showcase-tab-recommended" to="/showcase/recommended" selected={Boolean(recommended)} label={t.showcaseTabRecommended} />
        </div>
        <div role="tabpanel" aria-labelledby={recommended ? "showcase-tab-recommended" : "showcase-tab-memorial"}>
          <Outlet />
        </div>
      </PageShell>
    </ShowcaseProvider>
  );
}

function ShowcaseTab({
  id,
  to,
  selected,
  label,
}: {
  id: string;
  to: string;
  selected: boolean;
  label: string;
}) {
  return (
    <NavLink
      id={id}
      to={to}
      role="tab"
      aria-selected={selected}
      className={`rounded-sm px-3 py-1.5 text-sm ${
        selected ? "border border-gold bg-gold/15 text-gold" : "border border-transparent text-muted hover:text-paper"
      }`}
    >
      {label}
    </NavLink>
  );
}
