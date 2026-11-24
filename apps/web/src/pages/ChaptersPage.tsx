import { useState } from "react";
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
      extra={
        <div className="mb-4 flex flex-col gap-3">
          <VendorChapterLink chapterId={chapterId} />
          {["act-1", "act-2", "act-3"].includes(chapterId) && (<section lang="zh-Hant" className="rounded border border-line bg-raised p-4"><h3 className="mb-2 text-gold">隨機地圖辨位</h3>{chapterId === "act-1" && (<ul><li><strong>葛瑞爾森林（Grelwood）</strong>　前往紅谷時，找到河道後沿上游走。尋找靈魂之樹時，改沿發光樹根走。地面出現蘑菇，代表你已靠近 Grim Tangle 入口。</li>
<li><strong>狩獵場（Hunting Grounds）</strong>　前往奧格姆農地時留意路牌。沿途若看到被啄死的牛，這條路通往 Crowbell。要去 Freythorn，先完成祭壇，再跟隨移動的蝗蟲。</li></ul>)}{chapterId === "act-2" && (<ul><li><strong>叛徒通道（Traitor’s Passage）</strong>　在岔路尋找馬拉克斯卷軸標記。找芭芭拉時走有標記的一支；要趕往出口就走另一支。</li>
<li><strong>泰坦之谷（Valley of the Titans）</strong>　進圖先看巨人石像的頭部，再找對應的峽谷。沿峽谷走到底可找到封印，回頭時再選下一尊石像。</li></ul>)}{chapterId === "act-3" && (<p>遇到探險者時先交談。打開小地圖，依對話新增的標記前往下一區。</p>)}<p className="mt-2 text-sm text-gold"><a href="https://www.reddit.com/r/PathOfExile2/comments/1tvk2un/collecting_05_campaign_navigation_cueshintstips/">0.5 版地標紀錄</a>{chapterId === "act-1" && <a className="ml-4" href="https://www.youtube.com/watch?v=G_z8gRdOWqw&amp;t=134s">森林跑圖示範</a>}</p></section>)}
        </div>
      }
    />
  );
}
