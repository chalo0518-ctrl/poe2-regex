import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useMatch, useNavigate, useSearchParams } from "react-router-dom";
import { type BdShowcase } from "@poe2-regex/data";
import { useLocale } from "../i18n.tsx";
import { SHOWCASE_SEASONS, seasonHref, type ShowcaseSeason } from "./showcaseSeasons.ts";
import { ShowcaseProvider } from "./showcaseState.tsx";

export default function ShowcaseLayout({ snapshot: override, seasonPreviewUrl }: {
  snapshot?: BdShowcase;
  seasonPreviewUrl?: string;
}) {
  const { locale, t } = useLocale();
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (location.hash === "#season-update" || location.hash === "#season-build") {
      document.getElementById(location.hash.slice(1))?.scrollIntoView?.({ block: "start" });
    }
  }, [location.hash, location.key]);
  const [params] = useSearchParams();
  const memorial = useMatch({ path: "/showcase/memorial", end: false });
  const recommended = useMatch({ path: "/showcase/recommended", end: false });
  const memorialOverview = useMatch("/showcase/memorial");
  const recommendedOverview = useMatch("/showcase/recommended");
  const archiveOverview = memorialOverview || recommendedOverview;
  const english = locale === "en";
  const inArchive = Boolean(memorial || recommended);
  const seasons: readonly ShowcaseSeason[] = override
    ? [{ id: "runes-of-aldur", snapshot: override, updateImage: seasonPreviewUrl }]
    : SHOWCASE_SEASONS;
  const requested = params.get("season");
  const selectedSeason = seasons.find((entry) => entry.id === requested)
    ?? (requested === "current" || inArchive ? seasons[0] : undefined);
  const active = selectedSeason ?? seasons[0];
  const { snapshot, updateImage } = active;
  const seasonName = (item: BdShowcase) => (english ? item.leagueEn : item.leagueZh) || item.leagueEn || item.titleEn;
  const archivePath = (path: string) => seasonHref(path, active.id);

  return (
    <ShowcaseProvider key={active.id} snapshot={snapshot}>
      <main className="ledger-page ledger-season ledger-ruins" data-in-archive={inArchive}>
        <div className="ledger-content ledger-season-layout" data-bookmarks-open={bookmarksOpen}>
          <button type="button" className="ledger-bookmarks-toggle" aria-expanded={bookmarksOpen}
            aria-controls="season-bookmarks" onClick={() => setBookmarksOpen((open) => !open)}>
            <span aria-hidden="true">{bookmarksOpen ? "‹" : "›"}</span>
            {english ? (bookmarksOpen ? "Hide bookmarks" : "Show bookmarks") : (bookmarksOpen ? "收合書籤" : "展開書籤")}
          </button>
          <nav id="season-bookmarks" hidden={!bookmarksOpen} className="ledger-bookmarks" aria-label={english ? "Season bookmarks" : "賽季書籤"}>
            <Link className="ledger-bookmark" to="/">{english ? "Home" : "首頁"}</Link>
            {inArchive ? (
              <>
                {updateImage ? <Link className="ledger-bookmark" aria-current={location.hash === "#season-update" ? "location" : undefined} to={archivePath("/showcase/memorial") + "#season-update"}>
                  {english ? "Season update" : "版本更新"}
                </Link> : null}
                <div role="tablist" aria-label={t.showcaseTabsAria} className="ledger-season-tabs">
                  <ShowcaseTab id="showcase-tab-memorial" to={archivePath("/showcase/memorial") + "#season-build"} selected={Boolean(memorial) && location.hash !== "#season-update"} label={t.showcaseTabMemorial} />
                  <ShowcaseTab id="showcase-tab-recommended" to={archivePath("/showcase/recommended") + "#season-build"} selected={Boolean(recommended)} label={t.showcaseTabRecommended} />
                </div>
              </>
            ) : null}
          </nav>
          <div className="ledger-season-main">
          {archiveOverview && updateImage ? (
            <figure className="ledger-season-poster" id="season-update">
              <img src={updateImage} alt={english ? `${seasonName(snapshot)} update overview` : `${seasonName(snapshot)} 更新總覽`} decoding="async" />
            </figure>
          ) : null}
          <section className="ledger-season-select" aria-label={english ? "Choose a season" : "選擇賽季"}>
            <div className="ledger-season-controls">
              {!inArchive ? (
                <h1>{t.showcaseNav}</h1>
              ) : null}
            <label className="ledger-season-filter">
              <span>{english ? "Season" : "賽季"}</span>
              <select value={selectedSeason?.id ?? ""} onChange={(event) => {
                navigate(event.target.value ? seasonHref("/showcase/memorial", event.target.value) : "/showcase");
              }}>
                <option value="">{english ? "Select a season" : "請選擇賽季"}</option>
                {seasons.map((entry) => <option key={entry.id} value={entry.id}>{seasonName(entry.snapshot)}</option>)}
              </select>
            </label>
            </div>
          </section>
          {inArchive ? (
            <>
              <div className="ledger-archive" id="season-build" role="tabpanel" aria-labelledby={recommended ? "showcase-tab-recommended" : "showcase-tab-memorial"}>
                <Outlet />
              </div>
            </>
          ) : null}
          </div>
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
      className="ledger-tab ledger-bookmark"
    >
      {label}
    </NavLink>
  );
}
