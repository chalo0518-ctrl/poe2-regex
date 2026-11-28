import { useState } from "react";
import { Link } from "react-router-dom";
import { campaignChapters, chapterLabel, type ChapterId } from "@poe2-regex/data";
import {
  ChapterShopPanel,
  VendorChapterLink,
} from "../components/ChapterShopPanel.tsx";
import { useLocale } from "../i18n.tsx";

export default function ChaptersPage() {
  const { locale, t } = useLocale();
  const [chapterId, setChapterId] = useState<ChapterId>(campaignChapters[0].id);
  const chapter = campaignChapters.find((c) => c.id === chapterId);

  return (
    <ChapterShopPanel
      chapterId={chapterId}
      onChapterChange={setChapterId}
      kicker="EARLY · CHAPTERS"
      title={t.chapterShopTitle(chapter ? chapterLabel(chapter, locale) : t.earlyChapters)}
      extra={<VendorChapterLink chapterId={chapterId} />}
      after={
        <p className="mt-6 text-sm text-muted">
          {t.earlyTipsCueLead}
          <Link
            to="/early/tips"
            className="text-gold underline decoration-gold/40 underline-offset-2 hover:text-paper"
          >
            {t.earlyTips}
          </Link>
          {t.earlyTipsCueEnd}
        </p>
      }
    />
  );
}
