import { Link, NavLink, Outlet, useMatch, useNavigate, useSearchParams } from "react-router-dom";
import { SEASON_BD_V1, type BdShowcase } from "@poe2-regex/data";
import { useLocale } from "../i18n.tsx";
import { ShowcaseProvider } from "./showcaseState.tsx";

export default function ShowcaseLayout({ snapshot = SEASON_BD_V1, seasonPreviewUrl }: {
  snapshot?: BdShowcase;
  seasonPreviewUrl?: string;
}) {
  const { locale, t } = useLocale();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const memorial = useMatch({ path: "/showcase/memorial", end: false });
  const recommended = useMatch({ path: "/showcase/recommended", end: false });
  const memorialOverview = useMatch("/showcase/memorial");
  const recommendedOverview = useMatch("/showcase/recommended");
  const archiveOverview = memorialOverview || recommendedOverview;
  const english = locale === "en";
  const inArchive = Boolean(memorial || recommended);
  const selected = inArchive || params.get("season") === "current";
  const canvasPreview = selected && !inArchive && snapshot === SEASON_BD_V1;
  const season = (english ? snapshot.leagueEn : snapshot.leagueZh) || snapshot.leagueEn || snapshot.titleEn;

  return (
    <ShowcaseProvider snapshot={snapshot}>
      <main className="ledger-page ledger-season ledger-ruins" data-in-archive={inArchive} data-canvas-preview={canvasPreview}>
        <div className="ledger-content">
          {archiveOverview && seasonPreviewUrl ? (
            <figure className="ledger-season-poster">
              <img src={seasonPreviewUrl} alt={english ? `${season} update overview` : `${season} 更新總覽`} decoding="async" />
            </figure>
          ) : null}
          <section className="ledger-season-select" aria-label={english ? "Choose a season" : "選擇賽季"}>
            <div className="ledger-season-controls">
              {!inArchive ? (
                <h1>{t.showcaseNav}</h1>
              ) : null}
            <label className="ledger-season-filter">
              <span>{english ? "Season" : "賽季"}</span>
              <select value={selected ? "current" : ""} onChange={(event) => {
                navigate(event.target.value ? "/showcase?season=current" : "/showcase");
              }}>
                <option value="">{english ? "Select a season" : "請選擇賽季"}</option>
                <option value="current">{season}</option>
              </select>
            </label>
            </div>
            {selected && !inArchive ? (
              <Link to="/showcase/memorial" className="ledger-season-card" data-art={canvasPreview ? "canvas" : undefined}>
                {!canvasPreview && seasonPreviewUrl ? <img src={seasonPreviewUrl} alt="" decoding="async" /> : null}
                <h3>{season}</h3>
                <span className="ledger-season-enter">
                  {english ? "Open season recap" : "進入賽季回顧"} <span aria-hidden="true">→</span>
                </span>
              </Link>
            ) : null}
          </section>
          {inArchive ? (
            <>
              <div role="tablist" aria-label={t.showcaseTabsAria} className="ledger-season-tabs">
                <ShowcaseTab id="showcase-tab-memorial" to="/showcase/memorial" selected={Boolean(memorial)} label={t.showcaseTabMemorial} />
                <ShowcaseTab id="showcase-tab-recommended" to="/showcase/recommended" selected={Boolean(recommended)} label={t.showcaseTabRecommended} />
              </div>
              <div className="ledger-archive" role="tabpanel" aria-labelledby={recommended ? "showcase-tab-recommended" : "showcase-tab-memorial"}>
                <Outlet />
              </div>
            </>
          ) : null}
        </div>
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
