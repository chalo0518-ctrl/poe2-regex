import { useState } from "react";
import { campaignChapters, type ChapterId } from "@poe2-regex/data";
import {
  CampaignGapsNote,
  ChapterShopPanel,
  VendorChapterLink,
} from "../components/ChapterShopPanel.tsx";

export default function ChaptersPage() {
  const [chapterId, setChapterId] = useState<ChapterId>(campaignChapters[0].id);

  return (
    <ChapterShopPanel
      chapterId={chapterId}
      onChapterChange={setChapterId}
      kicker="EARLY · CHAPTERS"
      title={`${campaignChapters.find((c) => c.id === chapterId)?.labelZh ?? "章節"}商店正則`}
      extra={
        <div className="mb-4 flex flex-col gap-3">
          <VendorChapterLink chapterId={chapterId} />
          <CampaignGapsNote />
        </div>
      }
    />
  );
}
