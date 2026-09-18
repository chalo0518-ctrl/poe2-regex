import { useMemo, useState } from "react";
import {
  dataMeta,
  harvestTags,
  shieldFamilies,
  type ShieldBaseId,
} from "@poe2-regex/data";
import { ChroniclesModBuilder } from "../components/ChroniclesModBuilder.tsx";
import { useLocale } from "../i18n.tsx";

export default function ShieldsDemo() {
  const { t } = useLocale();
  const [base, setBase] = useState<ShieldBaseId>("str");
  const families = useMemo(
    () => shieldFamilies.filter((f) => f.bases.includes(base)),
    [base],
  );
  const baseMeta = dataMeta.bases.find((b) => b.id === base);

  return (
    <ChroniclesModBuilder
      kicker="CHRONICLES · SHIELDS"
      title={t.shieldsTitle}
      description={t.shieldsDesc}
      statsNote={t.statsFamilies(dataMeta.familyCount, dataMeta.tierCount)}
      sourceNote={t.sourcePoe2db(baseMeta?.path ?? "")}
      harvestTags={harvestTags}
      families={families}
      pools={dataMeta.bases}
      pool={base}
      onPoolChange={(id) => setBase(id as ShieldBaseId)}
      poolAriaLabel={t.shieldsPoolAria}
      importHint={t.shieldsImportHint}
    />
  );
}
