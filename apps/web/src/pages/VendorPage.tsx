import { Link } from "react-router-dom";
import { EmptyState } from "../components/PageChrome.tsx";

export default function VendorPage() {
  return (
    <div className="flex flex-col gap-4">
      <EmptyState
        title="商店裝備篩選"
        description="各章節商人裝備正則稍後填入。之後會深連到詞綴產生器（目前以盾牌實驗頁為底）。"
      />
      <Link
        to="/early/shields"
        className="inline-flex w-fit rounded-sm border border-gold px-3 py-2 text-sm text-gold hover:bg-gold/10"
      >
        實驗：盾牌詞綴
      </Link>
    </div>
  );
}
