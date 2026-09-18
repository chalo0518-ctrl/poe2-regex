import { useMemo, useState } from "react";
import {
  waystoneCatalog,
  waystoneFamilies,
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
      description="對齊編年史換界石 ModifiersCalc。低階／中階／高階各為獨立詞綴池；點選詞綴後產生倉庫正則。"
      statsNote={`${count.families} 組詞綴 · ${count.tiers} 階`}
      sourceNote={`來源 poe2db.tw/tw · ${meta?.path}`}
      families={families}
      pools={waystoneTiers}
      pool={tier}
      onPoolChange={(id) => setTier(id as WaystoneTierId)}
      poolAriaLabel="換界石階級"
      showTags={false}
      showFilter={false}
      showImport={false}
      showHideToggle={false}
      showFamilyNames={false}
      showAffixTags={false}
    />
  );
}
