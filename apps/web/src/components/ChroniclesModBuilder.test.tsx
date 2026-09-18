import type { ComponentProps } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { AffixFamily, HarvestTag } from "@poe2-regex/data";
import { ChroniclesModBuilder } from "./ChroniclesModBuilder.tsx";
import { endgameModBuilderChrome } from "../endgameModBuilderChrome.ts";
import { LocaleProvider } from "../i18n.tsx";

const harvestTags: HarvestTag[] = [
  { id: "ulaman_mod", labelZh: "Ulaman" },
  { id: "fire", labelZh: "火焰" },
];

function family(overrides: Partial<AffixFamily> = {}): AffixFamily {
  return {
    id: "t1",
    family: "MapAdditionalChests",
    generation: "prefix",
    tags: ["minion"],
    tagsZh: ["召喚物"],
    labelZh: "司庫的",
    labelEn: "Treasurer's",
    textZh: "地圖內含有額外的(2—3)個稀有箱子",
    textEn: "Map contains (2—3) additional Rare Chests",
    match: "Map contains additional Rare Chests",
    matchZh: "地圖內含有額外的個稀有箱子",
    kind: "flag",
    tiers: [
      {
        nameZh: "司庫的",
        nameEn: "Treasurer's",
        level: 1,
        textZh: "地圖內含有額外的(2—3)個稀有箱子",
        textEn: "Map contains (2—3) additional Rare Chests",
        dropChance: 1,
      },
    ],
    minLevel: 1,
    maxLevel: 1,
    tierCount: 1,
    weight: 1,
    ...overrides,
  };
}

const CHEST_ZH = "地圖內含有額外的(2—3)個稀有箱子";
const SUMMON_ZH = "地圖內含有額外的1個召喚法陣";

function summonFamily(): AffixFamily {
  return family({
    id: "t2",
    family: "MapAdditionalSummoningCircle",
    generation: "suffix",
    tags: ["minion"],
    tagsZh: ["召喚物"],
    labelZh: "召喚師的",
    labelEn: "Summoner's",
    textZh: SUMMON_ZH,
    textEn: "Map contains 1 additional Summoning Circle",
    match: "Map contains additional Summoning Circle",
    matchZh: "地圖內含有額外的個召喚法陣",
  });
}

const compactChrome = endgameModBuilderChrome;

function affixRow(text: string): HTMLElement {
  const row = screen.getByText(text).closest("li");
  if (!row) throw new Error(`affix row not found: ${text}`);
  return row as HTMLElement;
}

function polarityButtons(text: string) {
  const row = affixRow(text);
  return {
    row,
    yes: within(row).getByRole("button", { name: "是" }),
    no: within(row).getByRole("button", { name: "否" }),
    off: within(row).getByRole("button", { name: "空" }),
  };
}

function expectPolarity(text: string, selected: "yes" | "no" | "off") {
  const { yes, no, off } = polarityButtons(text);
  expect(yes).toHaveAttribute("aria-pressed", String(selected === "yes"));
  expect(no).toHaveAttribute("aria-pressed", String(selected === "no"));
  expect(off).toHaveAttribute("aria-pressed", String(selected === "off"));
}

function regexOutput(): string {
  return document.querySelector(".font-mono.text-gold")?.textContent ?? "";
}

function renderBuilder(
  overrides: Partial<ComponentProps<typeof ChroniclesModBuilder>> = {},
) {
  return render(
    <LocaleProvider initialLocale="zh-Hant">
      <ChroniclesModBuilder
        kicker="TEST"
        title="測試詞綴正則"
        description="測試"
        statsNote="1 組"
        sourceNote="test"
        harvestTags={harvestTags}
        families={[family()]}
        {...overrides}
      />
    </LocaleProvider>,
  );
}

describe("ChroniclesModBuilder chrome", () => {
  it("shows harvest tags, filter, ilvl, import, and hide toggle by default", () => {
    renderBuilder();

    expect(screen.getByRole("button", { name: "Ulaman" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "火焰" })).toBeInTheDocument();
    expect(screen.getByText("Filter:")).toBeInTheDocument();
    expect(screen.getByText(/Min iLvL/i)).toBeInTheDocument();
    expect(screen.getByText(/Max iLvL/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "匯入物品" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "切換隱藏" })).toBeInTheDocument();
    expect(screen.getByText(/標籤：第一次包含/)).toBeInTheDocument();
  });

  it("hides harvest tags, filter, ilvl, import, and hide toggle in compact chrome", () => {
    renderBuilder(compactChrome);

    expect(screen.queryAllByRole("button", { name: "Ulaman" })).toHaveLength(0);
    expect(screen.queryAllByRole("button", { name: "火焰" })).toHaveLength(0);
    expect(screen.queryAllByText("Filter:")).toHaveLength(0);
    expect(screen.queryAllByText(/Min iLvL/i)).toHaveLength(0);
    expect(screen.queryAllByText(/Max iLvL/i)).toHaveLength(0);
    expect(screen.queryAllByRole("button", { name: "匯入物品" })).toHaveLength(0);
    expect(screen.queryAllByRole("button", { name: "切換隱藏" })).toHaveLength(0);
    expect(screen.queryAllByText(/標籤：第一次包含/)).toHaveLength(0);
  });

  it("builds 繁中 regex by default and can switch to EN match", async () => {
    const user = userEvent.setup();
    renderBuilder({
      defaultPicks: { t1: { polarity: "include", min: "", max: "" } },
    });

    const output = document.querySelector(".font-mono.text-gold");
    expect(output?.textContent).toMatch(/箱子/);
    expect(screen.queryByRole("button", { name: "简中匹配" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "繁中匹配" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "EN match" }));
    expect(output?.textContent).not.toMatch(/箱子/);
    expect(output?.textContent).toMatch(/"/);
  });
});

describe("ChroniclesModBuilder affix rows", () => {
  it("shows effect text only by default, not family names or row tags", () => {
    renderBuilder();

    expect(screen.queryAllByText("司庫的")).toHaveLength(0);
    expect(screen.queryAllByText("Treasurer's", { exact: false })).toHaveLength(0);
    expect(screen.queryAllByText("召喚物")).toHaveLength(0);
    expect(screen.getByText("地圖內含有額外的(2—3)個稀有箱子")).toBeInTheDocument();
    expect(screen.getByText("Map contains (2—3) additional Rare Chests")).toBeInTheDocument();
  });

  it("can still show family names and affix tags when opted in", () => {
    renderBuilder({ showFamilyNames: true, showAffixTags: true });

    expect(screen.getByText("司庫的")).toBeInTheDocument();
    expect(screen.getByText("Treasurer's", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("召喚物")).toBeInTheDocument();
    expect(screen.getByText("地圖內含有額外的(2—3)個稀有箱子")).toBeInTheDocument();
  });

  it("shows effect text only when family names and affix tags are off", () => {
    renderBuilder(compactChrome);

    expect(screen.queryAllByText("司庫的")).toHaveLength(0);
    expect(screen.queryAllByText("Treasurer's", { exact: false })).toHaveLength(0);
    expect(screen.queryAllByText("召喚物")).toHaveLength(0);
    expect(screen.getByText("地圖內含有額外的(2—3)個稀有箱子")).toBeInTheDocument();
    expect(screen.getByText("Map contains (2—3) additional Rare Chests")).toBeInTheDocument();
  });

  it("builds regex from match text, not family names, after 是", async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(polarityButtons(CHEST_ZH).yes);

    const output = regexOutput();
    expect(output).toBeTruthy();
    expect(output).not.toContain("司庫");
    expect(output).not.toContain("Treasurer");
    expect(output).not.toContain("每列選");
    expectPolarity(CHEST_ZH, "yes");
  });

  it("hides family names in expanded tier rows too", async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole("button", { name: "展開階層" }));

    const expanded = screen.getByText(/iLvL 1/).closest("ul");
    expect(expanded).toBeTruthy();
    expect(within(expanded as HTMLElement).queryByText("司庫的")).not.toBeInTheDocument();
    expect(within(expanded as HTMLElement).queryByText("Treasurer's")).not.toBeInTheDocument();
    expect(
      within(expanded as HTMLElement).getByText("地圖內含有額外的(2—3)個稀有箱子"),
    ).toBeInTheDocument();
  });

  it("imports from effect strings, not family names", async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole("button", { name: "匯入物品" }));
    const textarea = screen.getByPlaceholderText(/\+73 最大生命/);
    await user.click(textarea);
    await user.paste("司庫的\nTreasurer's");
    await user.click(screen.getByRole("button", { name: "匯入" }));

    expectPolarity(CHEST_ZH, "off");

    await user.click(screen.getByRole("button", { name: "匯入物品" }));
    const again = screen.getByPlaceholderText(/\+73 最大生命/);
    await user.click(again);
    await user.paste(CHEST_ZH);
    await user.click(screen.getByRole("button", { name: "匯入" }));

    expectPolarity(CHEST_ZH, "yes");
    const output = regexOutput();
    expect(output).not.toContain("司庫");
    expect(output).not.toContain("Treasurer");
  });
});

describe("ChroniclesModBuilder default picks", () => {
  it("preselects defaultPicks as includes and restores them on reset", async () => {
    const user = userEvent.setup();
    renderBuilder({
      defaultPicks: {
        t1: { polarity: "include", min: "", max: "" },
      },
    });

    expectPolarity(CHEST_ZH, "yes");
    const output = regexOutput();
    expect(output).toBeTruthy();
    expect(output).not.toContain("每列選");

    await user.click(polarityButtons(CHEST_ZH).no);
    expectPolarity(CHEST_ZH, "no");
    expect(regexOutput()).toContain("!");

    await user.click(screen.getByRole("button", { name: "重置" }));
    expectPolarity(CHEST_ZH, "yes");
    expect(regexOutput()).not.toContain("!");
  });
});

describe("ChroniclesModBuilder polarity controls", () => {
  it("defaults every row to 空 and keeps the three options mutually exclusive", async () => {
    const user = userEvent.setup();
    renderBuilder({ families: [family(), summonFamily()] });

    expectPolarity(CHEST_ZH, "off");
    expectPolarity(SUMMON_ZH, "off");
    expect(regexOutput()).toMatch(/每列選「是」或「否」/);

    const chest = polarityButtons(CHEST_ZH);
    await user.click(chest.yes);
    expectPolarity(CHEST_ZH, "yes");
    await user.click(chest.no);
    expectPolarity(CHEST_ZH, "no");
    expect(chest.yes).toHaveAttribute("aria-pressed", "false");
    expect(chest.off).toHaveAttribute("aria-pressed", "false");
    expectPolarity(SUMMON_ZH, "off");
  });

  it("include-only ANDs 是 rows and ignores 空", async () => {
    const user = userEvent.setup();
    renderBuilder({ families: [family(), summonFamily()] });

    await user.click(polarityButtons(CHEST_ZH).yes);
    const includeOnly = regexOutput();
    expect(includeOnly).toMatch(/箱子/);
    expect(includeOnly).not.toContain("!");
    expect(includeOnly).not.toMatch(/法陣/);

    await user.click(polarityButtons(SUMMON_ZH).yes);
    const both = regexOutput();
    expect(both.split(" ").length).toBeGreaterThanOrEqual(2);
    expect((both.match(/"/g) ?? []).length).toBeGreaterThanOrEqual(4);
    expect(both).toMatch(/箱子/);
    expect(both).toMatch(/法陣/);
    expect(both).not.toContain("!");
  });

  it("exclude-only uses the existing ! group and 空 removes the row", async () => {
    const user = userEvent.setup();
    renderBuilder({ families: [family(), summonFamily()] });

    await user.click(polarityButtons(CHEST_ZH).no);
    const excludeOnly = regexOutput();
    expect(excludeOnly).toContain("!");
    expect(excludeOnly).toMatch(/箱子/);
    expect(excludeOnly).not.toMatch(/法陣/);

    await user.click(polarityButtons(SUMMON_ZH).no);
    const both = regexOutput();
    expect(both).toContain("!");
    expect(both).toMatch(/箱子/);
    expect(both).toMatch(/法陣/);

    await user.click(polarityButtons(CHEST_ZH).off);
    await user.click(polarityButtons(SUMMON_ZH).off);
    expectPolarity(CHEST_ZH, "off");
    expectPolarity(SUMMON_ZH, "off");
    expect(regexOutput()).toMatch(/每列選「是」或「否」/);
  });

  it("mixes 是 and 否 into one compound pattern", async () => {
    const user = userEvent.setup();
    renderBuilder({ families: [family(), summonFamily()] });

    await user.click(polarityButtons(CHEST_ZH).yes);
    await user.click(polarityButtons(SUMMON_ZH).no);

    const mixed = regexOutput();
    expect(mixed).toMatch(/箱子/);
    expect(mixed).toMatch(/法陣/);
    expect(mixed).toContain("!");
    expectPolarity(CHEST_ZH, "yes");
    expectPolarity(SUMMON_ZH, "no");
  });

  it("clears back to 空 when the already-selected 是 or 否 is clicked", async () => {
    const user = userEvent.setup();
    renderBuilder();

    const chest = polarityButtons(CHEST_ZH);
    await user.click(chest.yes);
    expectPolarity(CHEST_ZH, "yes");
    await user.click(chest.yes);
    expectPolarity(CHEST_ZH, "off");
    expect(regexOutput()).toMatch(/每列選「是」或「否」/);

    await user.click(chest.no);
    expectPolarity(CHEST_ZH, "no");
    await user.click(chest.no);
    expectPolarity(CHEST_ZH, "off");
  });
});
