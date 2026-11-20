import { Link, NavLink, Outlet, useMatch } from "react-router-dom";
import { SEASON_BD_V1, type BdShowcase } from "@poe2-regex/data";
import LedgerHero from "../components/LedgerHero.tsx";
import { useLocale } from "../i18n.tsx";
import { ShowcaseProvider } from "./showcaseState.tsx";

export default function ShowcaseLayout({ snapshot = SEASON_BD_V1 }: { snapshot?: BdShowcase }) {
  const { locale, t } = useLocale();
  const memorial = useMatch({ path: "/showcase/memorial", end: false });
  const recommended = useMatch({ path: "/showcase/recommended", end: false });
  const english = locale === "en";
  const selected = Boolean(memorial || recommended);
  const season = (english ? snapshot.leagueEn : snapshot.leagueZh) || snapshot.leagueEn || snapshot.titleEn;

  return (
    <ShowcaseProvider snapshot={snapshot}>
      <main className="ledger-page ledger-season">
        <LedgerHero title={t.showcaseNav}>
          {english ? "Choose a season to revisit its characters and builds." : "選擇賽季，回顧角色與流派配置。"}
        </LedgerHero>
        <section className="ledger-season-select" aria-labelledby="season-choice-title">
          <h2 id="season-choice-title">{english ? "Choose a season" : "選擇賽季"}</h2>
          <Link className="ledger-season-card" to="/showcase/memorial" data-selected={selected}>
            <span>{season}</span>
            <span aria-hidden="true">›</span>
          </Link>
        </section>
        {selected ? (
          <>
            <div role="tablist" aria-label={t.showcaseTabsAria} className="mb-6 flex flex-wrap gap-1 border-b border-line pb-3">
              <ShowcaseTab id="showcase-tab-memorial" to="/showcase/memorial" selected={Boolean(memorial)} label={t.showcaseTabMemorial} />
              <ShowcaseTab id="showcase-tab-recommended" to="/showcase/recommended" selected={Boolean(recommended)} label={t.showcaseTabRecommended} />
            </div>
            <div role="tabpanel" aria-labelledby={recommended ? "showcase-tab-recommended" : "showcase-tab-memorial"}>
              <Outlet />
            </div>
          </>
        ) : null}
      </main>
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
      className="ledger-tab"
    >
      {label}
    </NavLink>
  );
}
