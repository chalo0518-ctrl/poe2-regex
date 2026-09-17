import { useMemo, useState } from "react";
import {
  waystoneCatalog,
  waystoneFamilies,
  waystoneHarvestTags,
  waystoneTiers,
  type WaystoneTierId,
} from "@poe2-regex/data";
import { ChroniclesModBuilder } from "../components/ChroniclesModBuilder.tsx";

export default function WaystonesPage() {
  const [tier, setTier] = useState<WaystoneTierId>("low");
  const families = useMemo(() => waystoneFamilies(tier), [tier]);
  const meta = waystoneTiers.find((t) => t.id === tier);
  const count = waystoneCatalog.counts[tier];

  return (
    <ChroniclesModBuilder
      kicker="CHRONICLES · WAYSTONES"
      title="換界石詞綴正則"
      description="對齊編年史換界石 ModifiersCalc。低階／中階／高階各為獨立詞綴池；標籤三態篩選、前後綴兩欄，點選後產生倉庫正則。"
      statsNote={`${count.families} 組詞綴 · ${count.tiers} 階`}
      sourceNote={`來源 poe2db.tw/tw · ${meta?.path}`}
      harvestTags={waystoneHarvestTags}
      families={families}
      pools={waystoneTiers}
      pool={tier}
      onPoolChange={(id) => setTier(id as WaystoneTierId)}
      poolAriaLabel="換界石階級"
      importHint="貼上倉庫複製的換界石文字，將自動勾選目前階級上對得上的基礎詞綴。"
    />
  );
}
