import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  CAMPAIGN_GAPS,
  campaignChapters,
  defaultPicksForChapter,
  getChapter,
  shopFamilies,
  type ChapterId,
} from "@poe2-regex/data";
import { ChroniclesModBuilder } from "./ChroniclesModBuilder.tsx";

const shopFamiliesList = shopFamilies();

export function ChapterTabs({
  value,
  onChange,
}: {
  value: ChapterId;
  onChange: (id: ChapterId) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="章節">
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
          {chapter.labelZh}
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
  const chapter = getChapter(chapterId);
  const defaultPicks = defaultPicksForChapter(chapterId);

  return (
    <div>
      <ChapterTabs value={chapterId} onChange={onChapterChange} />
      <p className="mb-2 max-w-2xl text-sm text-muted">{chapter.summaryZh}</p>
      {chapter.maps.length === 0 && (
        <p className="mb-4 text-xs text-gold-dim">
          此章尚無獨立地圖／商店節點資料，預設套用整章商店裝備正則。
        </p>
      )}
      {extra}
      <ChroniclesModBuilder
        key={chapterId}
        kicker={kicker}
        title={title}
        description="預設已勾選該章通用商店詞綴。點列可改為排除或取消；也可加選清單中的能力值／能量護盾／施法速度。"
        statsNote={`${shopFamiliesList.length} 組商店詞綴 · ${chapter.defaultPicks.length} 項預設包含`}
        sourceNote="match／matchZh 核對 shields.json 與 poe2db.tw 靴／飾品／護甲"
        families={shopFamiliesList}
        defaultPicks={defaultPicks}
        showTags={false}
        showFilter
        showImport={false}
        showHideToggle={false}
        prefixTitle="商店前綴"
        suffixTitle="商店後綴"
      />
    </div>
  );
}

export function CampaignGapsNote() {
  return (
    <details className="mb-4 rounded-sm border border-line bg-panel px-3 py-2 text-xs text-muted">
      <summary className="cursor-pointer text-gold-dim">已知缺口</summary>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {CAMPAIGN_GAPS.map((gap) => (
          <li key={gap}>{gap}</li>
        ))}
      </ul>
    </details>
  );
}

export function VendorChapterLink({ chapterId }: { chapterId: ChapterId }) {
  return (
    <Link
      to={`/early/vendor?chapter=${chapterId}`}
      className="mb-4 inline-flex w-fit rounded-sm border border-gold px-3 py-2 text-sm text-gold hover:bg-gold/10"
    >
      在商店頁編輯此章正則
    </Link>
  );
}
