import { useMemo, useState } from "react";
import {
  dataMeta,
  harvestTags,
  shieldFamilies,
  type ShieldBaseId,
} from "@poe2-regex/data";
import { ChroniclesModBuilder } from "../components/ChroniclesModBuilder.tsx";

export default function ShieldsDemo() {
  const [base, setBase] = useState<ShieldBaseId>("str");
  const families = useMemo(
    () => shieldFamilies.filter((f) => f.bases.includes(base)),
    [base],
  );
  const baseMeta = dataMeta.bases.find((b) => b.id === base);

  return (
    <ChroniclesModBuilder
      kicker="CHRONICLES · SHIELDS"
      title="盾牌詞綴正則"
      description="對齊編年史 ModifiersCalc：標籤三態篩選、基礎前後綴兩欄。範圍僅限力量塔盾／力敏／力智／輕盾。"
      statsNote={`${dataMeta.familyCount} 組詞綴 · ${dataMeta.tierCount} 階`}
      sourceNote={`來源 poe2db.tw/tw · ${baseMeta?.path}`}
      harvestTags={harvestTags}
      families={families}
      pools={dataMeta.bases}
      pool={base}
      onPoolChange={(id) => setBase(id as ShieldBaseId)}
      poolAriaLabel="盾種"
      importHint="貼上倉庫複製的物品文字，將自動勾選目前盾種上對得上的基礎詞綴。"
    />
  );
}
