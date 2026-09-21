/**
 * Trim a live poe2db ModsView HTML page into the fixture shape used under scripts/fixtures/html.
 * Keeps real affix rows (no invented text). Hover URLs inside `str` are preserved.
 */
import { extractHarvestTags, extractModsView } from "./poe2db.mjs";

const SLIM_KEYS = [
  "Name",
  "Level",
  "ModGenerationTypeID",
  "ModFamilyList",
  "DropChance",
  "str",
  "fossil_no",
  "mod_no",
];

function slimRow(row) {
  const out = {};
  for (const key of SLIM_KEYS) {
    if (key in row) out[key] = row[key];
  }
  return out;
}

function familyName(row) {
  return (row.ModFamilyList || [])[0] || "";
}

/**
 * @param {string} html
 * @param {{ familyLimit?: number, prefer?: string[], locale?: "tw" | "us" }} [opts]
 */
export function trimModsViewHtml(html, opts = {}) {
  const familyLimit = opts.familyLimit ?? 4;
  const prefer = opts.prefer || [];
  const locale = opts.locale || "tw";
  const view = extractModsView(html);
  const tags = extractHarvestTags(html);

  const keep = new Set();
  for (const fam of prefer) {
    if (keep.size >= familyLimit) break;
    if ((view.normal || []).some((row) => familyName(row) === fam)) keep.add(fam);
  }
  for (const row of view.normal || []) {
    if (keep.size >= familyLimit) break;
    const fam = familyName(row);
    if (fam) keep.add(fam);
  }

  const normal = (view.normal || []).filter((row) => keep.has(familyName(row))).map(slimRow);
  const lang = locale === "us" ? "en" : "zh-Hant";
  const tagHtml = tags
    .map(
      (tag) =>
        `<div class="harvest-tag d-inline-block p-1 whatever mr-1 crafting${tag.id}" id="harvest-${tag.id}" data-harvest="${tag.id}">${tag.labelZh}</div>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="${lang}">
<body>
<!-- Trimmed public poe2db.tw ModsView snippet. Real affix rows only; hover URLs stripped. -->
${tagHtml}
<script>
new ModsView(${JSON.stringify({ normal })});
</script>
</body>
</html>
`;
}
