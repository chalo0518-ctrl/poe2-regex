import { useMemo, useState } from "react";
import {
  poolLabel,
  tabletCatalog,
  tabletFamilies,
  tabletKinds,
  type TabletKindId,
} from "@poe2-regex/data";
import { ChroniclesModBuilder } from "../components/ChroniclesModBuilder.tsx";
import { endgameModBuilderChrome } from "../endgameModBuilderChrome.ts";
import { useLocale } from "../i18n.tsx";

export default function TabletsPage() {
  const { locale, t } = useLocale();
  const [kind, setKind] = useState<TabletKindId | "">("");
  const families = useMemo(() => (kind ? tabletFamilies(kind) : []), [kind]);
  const meta = tabletKinds.find((item) => item.id === kind);
  const count = kind ? tabletCatalog.counts[kind] : undefined;

  return (
    <div>
      <div className="mb-4">
        <p className="mb-2 text-sm text-gold">{t.tabletsKindHeading}</p>
        <p className="mb-3 text-xs text-muted">{t.tabletsKindHint}</p>
        <div className="flex flex-wrap gap-1.5" role="listbox" aria-label={t.tabletsKindAria}>
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
              {poolLabel(item, locale)}
              <span className="ml-1 text-[11px] text-muted">
                {tabletCatalog.counts[item.id].families}
              </span>
            </button>
          ))}
        </div>
      </div>

      {!kind ? (
        <section className="rounded-sm border border-dashed border-line bg-panel px-5 py-10">
          <h2 className="text-lg font-medium text-gold">{t.tabletsEmptyTitle}</h2>
          <p className="mt-2 max-w-xl text-sm text-muted">{t.tabletsEmptyBody}</p>
        </section>
      ) : (
        <ChroniclesModBuilder
          key={kind}
          kicker="CHRONICLES · TABLETS"
          title={t.tabletsTitle(meta ? poolLabel(meta, locale) : t.endgameTablets)}
          description={t.tabletsDesc}
          statsNote={t.statsFamilies(count?.families ?? 0, count?.tiers ?? 0)}
          sourceNote={t.sourcePoe2db(meta?.path ?? "")}
          families={families}
          {...endgameModBuilderChrome}
        />
      )}
    </div>
  );
}
