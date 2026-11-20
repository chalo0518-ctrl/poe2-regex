import { Link, NavLink, Outlet, useMatch, useNavigate, useSearchParams } from "react-router-dom";
import { type BdShowcase } from "@poe2-regex/data";
import { useLocale } from "../i18n.tsx";
import { SHOWCASE_SEASONS, seasonHref, type ShowcaseSeason } from "./showcaseSeasons.ts";
import { ShowcaseProvider } from "./showcaseState.tsx";

export default function ShowcaseLayout({ snapshot: override, seasonPreviewUrl }: {
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
  const seasons: readonly ShowcaseSeason[] = override
    ? [{ id: "runes-of-aldur", snapshot: override, updateImage: seasonPreviewUrl }]
    : SHOWCASE_SEASONS;
  const requested = params.get("season");
  const selectedSeason = seasons.find((entry) => entry.id === requested)
    ?? (requested === "current" || inArchive ? seasons[0] : undefined);
  const active = selectedSeason ?? seasons[0];
  const { snapshot, updateImage } = active;
  const cardImage = active.previewImage ?? updateImage;
  const canvasPreview = !inArchive && active.previewStyle === "canvas";
  const seasonName = (item: BdShowcase) => (english ? item.leagueEn : item.leagueZh) || item.leagueEn || item.titleEn;
  const archivePath = (path: string) => seasonHref(path, active.id);

  return (
    <ShowcaseProvider snapshot={snapshot}>
      <main className="ledger-page ledger-season ledger-ruins" data-in-archive={inArchive} data-canvas-preview={canvasPreview}>
        <div className="ledger-content">
          {archiveOverview && updateImage ? (
            <figure className="ledger-season-poster">
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
                navigate(event.target.value ? `/showcase?season=${encodeURIComponent(event.target.value)}` : "/showcase");
              }}>
                <option value="">{english ? "Select a season" : "請選擇賽季"}</option>
                {seasons.map((entry) => <option key={entry.id} value={entry.id}>{seasonName(entry.snapshot)}</option>)}
              </select>
            </label>
            </div>
            {selectedSeason && !inArchive ? (
              <Link to={archivePath("/showcase/memorial")} className="ledger-season-card" data-art={canvasPreview ? "canvas" : undefined}>
                {!canvasPreview && cardImage ? <img src={cardImage} alt="" decoding="async" /> : null}
                <div className="ledger-season-copy">
                  <h3>{canvasPreview ? "Runes of Aldur" : seasonName(snapshot)}</h3>
                  <span className="ledger-season-enter">{english ? "Open season recap" : "進入賽季回顧"}</span>
                </div>
              </Link>
            ) : null}
          </section>
          {inArchive ? (
            <>
              <div role="tablist" aria-label={t.showcaseTabsAria} className="ledger-season-tabs">
                <ShowcaseTab id="showcase-tab-memorial" to={archivePath("/showcase/memorial")} selected={Boolean(memorial)} label={t.showcaseTabMemorial} />
                <ShowcaseTab id="showcase-tab-recommended" to={archivePath("/showcase/recommended")} selected={Boolean(recommended)} label={t.showcaseTabRecommended} />
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
