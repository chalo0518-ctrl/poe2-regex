import { useMemo, useState } from "react";
import {
  waystoneCatalog,
  waystoneFamilies,
  waystoneTiers,
  type WaystoneTierId,
} from "@poe2-regex/data";
import { ChroniclesModBuilder } from "../components/ChroniclesModBuilder.tsx";
import { endgameModBuilderChrome } from "../endgameModBuilderChrome.ts";
import { useLocale } from "../i18n.tsx";

export default function WaystonesPage() {
  const { t } = useLocale();
  const [tier, setTier] = useState<WaystoneTierId>("low");
  const families = useMemo(() => waystoneFamilies(tier), [tier]);
  const meta = waystoneTiers.find((item) => item.id === tier);
  const count = waystoneCatalog.counts[tier];

  return (
    <ChroniclesModBuilder
      kicker="CHRONICLES · WAYSTONES"
      title={t.waystonesTitle}
      description={t.waystonesDesc}
      statsNote={t.statsFamilies(count.families, count.tiers)}
      sourceNote={t.sourcePoe2db(meta?.path ?? "")}
      families={families}
      pools={waystoneTiers}
      pool={tier}
      onPoolChange={(id) => setTier(id as WaystoneTierId)}
      poolAriaLabel={t.waystonesPoolAria}
      {...endgameModBuilderChrome}
    />
  );
}
