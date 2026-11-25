import { useState } from "react";
import { campaignChapters, chapterLabel, type ChapterId } from "@poe2-regex/data";
import {
  ChapterShopPanel,
  VendorChapterLink,
} from "../components/ChapterShopPanel.tsx";
import { useLocale } from "../i18n.tsx";
import { CampaignFlow } from "./CampaignFlow.tsx";

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
      after={<CampaignFlow chapterId={chapterId} />}
    />
  );
}
