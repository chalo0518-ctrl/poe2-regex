import { useEffect, useState, type CSSProperties } from "react";
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
  const [bookmarkWidth, setBookmarkWidth] = useState(270);
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
  const showUpdate = Boolean(archiveOverview && updateImage && location.hash === "#season-update");
  const resizeBookmarks = (width: number) => {
    setBookmarkWidth(Math.max(180, Math.min(width, 480, window.innerWidth * 0.42)));
  };
  const seasonName = (item: BdShowcase) => (english ? item.leagueEn : item.leagueZh) || item.leagueEn || item.titleEn;
  const archivePath = (path: string) => seasonHref(path, active.id);

  return (
    <ShowcaseProvider key={active.id} snapshot={snapshot}>
      <main className="ledger-page ledger-season ledger-ruins" data-in-archive={inArchive}>
        <div className="ledger-content ledger-season-layout" data-bookmarks-open={bookmarksOpen}
          style={{ "--bookmarks-width": `${bookmarkWidth}px` } as CSSProperties}>
          <button type="button" className="ledger-bookmarks-toggle" aria-expanded={bookmarksOpen}
            aria-controls="season-bookmarks" onClick={() => setBookmarksOpen((open) => !open)}>
            <span className="ledger-bookmark-arrow" aria-hidden="true" />
            <span className="sr-only">{english ? (bookmarksOpen ? "Hide bookmarks" : "Show bookmarks") : (bookmarksOpen ? "收合書籤" : "展開書籤")}</span>
          </button>
          <nav id="season-bookmarks" hidden={!bookmarksOpen} className="ledger-bookmarks" aria-label={english ? "Season bookmarks" : "賽季書籤"}>
            <div className="ledger-bookmark-title">
              <span>{english ? "Bookmarks" : "書籤"}</span>
            </div>
            <Link className="ledger-bookmark" to="/"><span aria-hidden="true">⌂</span>{english ? "Home" : "首頁"}</Link>
            {inArchive ? (
              <details className="ledger-bookmark-folder" open>
                <summary>{seasonName(snapshot)}</summary>
                {updateImage ? <Link className="ledger-bookmark ledger-bookmark-update" aria-current={location.hash === "#season-update" ? "location" : undefined} to={archivePath("/showcase/memorial") + "#season-update"}>
                  {english ? "Season update" : "版本更新"}
                </Link> : null}
                <div role="tablist" aria-label={t.showcaseTabsAria} className="ledger-bookmark-sections">
                  <ShowcaseTab id="showcase-tab-memorial" to={archivePath("/showcase/memorial") + "#season-build"} selected={Boolean(memorial) && location.hash !== "#season-update"} label={t.showcaseTabMemorial} />
                  <ShowcaseTab id="showcase-tab-recommended" to={archivePath("/showcase/recommended") + "#season-build"} selected={Boolean(recommended)} label={t.showcaseTabRecommended} />
                </div>
              </details>
            ) : null}
            <div className="ledger-bookmark-resize" role="separator" tabIndex={0}
              aria-label={english ? "Resize bookmarks" : "調整書籤寬度"} aria-orientation="vertical"
              aria-valuemin={180} aria-valuemax={480} aria-valuenow={bookmarkWidth}
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
                const panel = event.currentTarget.parentElement;
                if (panel) resizeBookmarks(event.clientX - panel.getBoundingClientRect().left);
              }}
              onKeyDown={(event) => {
                if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                event.preventDefault();
                resizeBookmarks(bookmarkWidth + (event.key === "ArrowRight" ? 16 : -16));
              }}
            />
          </nav>
          <div className="ledger-season-main">
          {showUpdate && updateImage ? (
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
          {inArchive && !showUpdate ? (
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
      className="ledger-bookmark"
    >
      {label}
    </NavLink>
  );
}
