import { useMemo, useState } from "react";
import {
  EARLY_TIP_CHAPTERS,
  EARLY_TIPS_COLUMNS,
  EARLY_TIPS_FOOTNOTE,
  EARLY_TIPS_INTRO,
  EARLY_TIPS_TITLE,
  earlyTipRows,
  earlyTipSourceGroups,
  filterEarlyTips,
} from "./earlyTips.ts";

export default function EarlyTipsPage() {
  const [chapter, setChapter] = useState("");
  const [priorityOnly, setPriorityOnly] = useState(false);
  const rows = useMemo(
    () => filterEarlyTips(earlyTipRows, chapter, priorityOnly),
    [chapter, priorityOnly],
  );

  return (
    <section lang="zh-Hant" aria-labelledby="early-tips-title" className="flex flex-col gap-4">
      <div>
        <h2 id="early-tips-title" className="text-lg text-gold">
          {EARLY_TIPS_TITLE}
        </h2>
        <div className="mt-3 max-w-4xl space-y-2 text-sm leading-relaxed text-muted">
          {EARLY_TIPS_INTRO.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-muted">
          章節
          <select
            aria-label="章節"
            value={chapter}
            onChange={(event) => setChapter(event.target.value)}
            className="rounded-sm border border-line bg-ink px-2 py-1.5 text-sm text-paper"
          >
            <option value="">全部</option>
            {EARLY_TIP_CHAPTERS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          aria-pressed={priorityOnly}
          onClick={() => setPriorityOnly((current) => !current)}
          className={`rounded-sm border px-3 py-1.5 text-sm ${
            priorityOnly
              ? "border-gold bg-gold/15 text-gold"
              : "border-line text-muted hover:text-paper"
          }`}
        >
          只看優先
        </button>
      </div>

      <div className="tips-sheet overflow-x-auto rounded border border-line">
        <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
          <thead>
            <tr>
              {EARLY_TIPS_COLUMNS.map((column) => (
                <th key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={EARLY_TIPS_COLUMNS.length} className="text-muted">
                  沒有符合的列
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${row.chapter}:${row.map}:${row.cue}`}>
                  <td className="whitespace-nowrap">{row.chapter}</td>
                  <td className="whitespace-nowrap">{row.map}</td>
                  <td>{row.cue}</td>
                  <td>{row.reward}</td>
                  <td>
                    {row.priority ? (
                      <span className="text-gold" data-priority="">
                        {row.priority}
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-sm leading-relaxed">
        <ul className="space-y-1 text-gold">
          {earlyTipSourceGroups.map((group) => (
            <li key={group.map((source) => source.href).join(" ")}>
              {group.map((source, index) => (
                <span key={source.href}>
                  {index > 0 ? "、" : null}
                  <a
                    href={source.href}
                    className="underline decoration-gold/40 underline-offset-2 hover:text-paper"
                  >
                    {source.label}
                  </a>
                </span>
              ))}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-muted">{EARLY_TIPS_FOOTNOTE}</p>
      </div>
    </section>
  );
}
