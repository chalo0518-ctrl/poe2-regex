import { useMemo, useState } from "react";
import {
  tabletCatalog,
  tabletFamilies,
  tabletHarvestTags,
  tabletKinds,
  type TabletKindId,
} from "@poe2-regex/data";
import { ChroniclesModBuilder } from "../components/ChroniclesModBuilder.tsx";

export default function TabletsPage() {
  const [kind, setKind] = useState<TabletKindId | "">("");
  const families = useMemo(() => (kind ? tabletFamilies(kind) : []), [kind]);
  const meta = tabletKinds.find((k) => k.id === kind);
  const count = kind ? tabletCatalog.counts[kind] : undefined;

  return (
    <div>
      <div className="mb-4">
        <p className="mb-2 text-sm text-gold">碑牌種類</p>
        <p className="mb-3 text-xs text-muted">
          請先選擇碑牌種類。詞綴清單只顯示該種類頁面上可骰出的詞綴，不會把八種碑牌混在一起再假裝篩選。
        </p>
        <div className="flex flex-wrap gap-1.5" role="listbox" aria-label="碑牌種類">
          {tabletKinds.map((item) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={kind === item.id}
              onClick={() => setKind(item.id)}
              className={`rounded-sm border px-2.5 py-1.5 text-sm ${
                kind === item.id
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-line text-muted hover:text-paper"
              }`}
            >
              {item.labelZh}
              <span className="ml-1 text-[11px] text-muted">
                {tabletCatalog.counts[item.id].families}
              </span>
            </button>
          ))}
        </div>
      </div>

      {!kind ? (
        <section className="rounded-sm border border-dashed border-line bg-panel px-5 py-10">
          <h2 className="text-lg font-medium text-gold">尚未選擇碑牌</h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            選一種碑牌後才會載入該頁的前綴／後綴。裂痕碑牌不會看到探險專屬詞綴，以此類推。
          </p>
        </section>
      ) : (
        <ChroniclesModBuilder
          key={kind}
          kicker="CHRONICLES · TABLETS"
          title={`${meta?.labelZh ?? "碑牌"}詞綴正則`}
          description="種類已鎖定目前碑牌。標籤為該種類內的二次篩選；前後綴兩欄與盾牌實驗頁相同。"
          statsNote={`${count?.families ?? 0} 組詞綴 · ${count?.tiers ?? 0} 階`}
          sourceNote={`來源 poe2db.tw/tw · ${meta?.path}`}
          harvestTags={tabletHarvestTags}
          families={families}
          importHint="貼上倉庫複製的碑牌文字，將自動勾選目前種類上對得上的基礎詞綴。"
        />
      )}
    </div>
  );
}
