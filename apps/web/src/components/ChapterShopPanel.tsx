import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  CAMPAIGN_GAPS_I18N,
  campaignChapters,
  chapterLabel,
  chapterSummary,
  defaultPicksForChapter,
  getChapter,
  shopFamilies,
  type ChapterId,
} from "@poe2-regex/data";
import { ChroniclesModBuilder } from "./ChroniclesModBuilder.tsx";
import { useLocale } from "../i18n.tsx";

const shopFamiliesList = shopFamilies();

export function ChapterTabs({
  value,
  onChange,
}: {
  value: ChapterId;
  onChange: (id: ChapterId) => void;
}) {
  const { locale, t } = useLocale();
  return (
    <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label={t.chapterAria}>
      {campaignChapters.map((chapter, index) => (
        <button
          key={chapter.id}
          type="button"
          role="tab"
          aria-selected={value === chapter.id}
          onClick={() => onChange(chapter.id)}
          className={`rounded-sm border px-3 py-2 text-sm ${
            chapter.id === value
              ? "border-gold bg-gold/15 text-gold"
              : "border-line text-muted hover:text-paper"
          }`}
        >
          <span className="mr-2 font-mono text-xs text-gold-dim">
            {String(index + 1).padStart(2, "0")}
          </span>
          {chapterLabel(chapter, locale)}
        </button>
      ))}
    </div>
  );
}

export function ChapterShopPanel({
  chapterId,
  onChapterChange,
  kicker,
  title,
  extra,
}: {
  chapterId: ChapterId;
  onChapterChange: (id: ChapterId) => void;
  kicker: string;
  title: string;
  extra?: ReactNode;
}) {
  const { locale, t } = useLocale();
  const chapter = getChapter(chapterId);
  const defaultPicks = defaultPicksForChapter(chapterId);

  return (
    <div>
      <ChapterTabs value={chapterId} onChange={onChapterChange} />
      <p className="mb-2 max-w-2xl text-sm text-muted">{chapterSummary(chapter, locale)}</p>
      {chapter.maps.length === 0 && (
        <p className="mb-4 text-xs text-gold-dim">{t.chapterNoMaps}</p>
      )}
      {extra}
      <ChroniclesModBuilder
        key={chapterId}
        kicker={kicker}
        title={title}
        description={t.chapterShopDesc}
        statsNote={t.shopStats(shopFamiliesList.length, chapter.defaultPicks.length)}
        sourceNote={t.sourceShop}
        families={shopFamiliesList}
        defaultPicks={defaultPicks}
        showTags={false}
        showFilter
        showImport={false}
        showHideToggle={false}
        prefixTitle={t.shopPrefix}
        suffixTitle={t.shopSuffix}
      />
    </div>
  );
}

export function CampaignGapsNote() {
  const { locale, t } = useLocale();
  const gaps = CAMPAIGN_GAPS_I18N[locale];
  return (
    <details className="mb-4 rounded-sm border border-line bg-panel px-3 py-2 text-xs text-muted">
      <summary className="cursor-pointer text-gold-dim">{t.knownGaps}</summary>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {gaps.map((gap) => (
          <li key={gap}>{gap}</li>
        ))}
      </ul>
    </details>
  );
}

export function VendorChapterLink({ chapterId }: { chapterId: ChapterId }) {
  const { t } = useLocale();
  return (
    <Link
      to={`/early/vendor?chapter=${chapterId}`}
      className="mb-4 inline-flex w-fit rounded-sm border border-gold px-3 py-2 text-sm text-gold hover:bg-gold/10"
    >
      {t.vendorEditLink}
    </Link>
  );
}
