import { Link, useSearchParams } from "react-router-dom";
import { isChapterId, type ChapterId } from "@poe2-regex/data";
import { CampaignGapsNote, ChapterShopPanel } from "../components/ChapterShopPanel.tsx";
import { useLocale } from "../i18n.tsx";

export default function VendorPage() {
  const { t } = useLocale();
  const [params, setParams] = useSearchParams();
  const raw = params.get("chapter");
  const chapterId: ChapterId = isChapterId(raw) ? raw : "act-1";

  return (
    <div>
      <ChapterShopPanel
        chapterId={chapterId}
        onChapterChange={(id) => setParams({ chapter: id })}
        kicker="EARLY · VENDOR"
        title={t.vendorTitle}
        extra={
          <div className="mb-4 flex flex-col gap-3">
            <CampaignGapsNote />
            <Link
              to="/early/gear"
              className="inline-flex w-fit rounded-sm border border-line px-3 py-2 text-sm text-muted hover:border-gold hover:text-gold"
            >
              {t.earlyGear}
            </Link>
          </div>
        }
      />
    </div>
  );
}
