import type { ComponentProps } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { AffixFamily, HarvestTag } from "@poe2-regex/data";
import { ChroniclesModBuilder } from "./ChroniclesModBuilder.tsx";
import { endgameModBuilderChrome } from "../endgameModBuilderChrome.ts";

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

const compactChrome = endgameModBuilderChrome;

function renderBuilder(
  overrides: Partial<ComponentProps<typeof ChroniclesModBuilder>> = {},
) {
  return render(
    <ChroniclesModBuilder
      kicker="TEST"
      title="測試詞綴正則"
      description="測試"
      statsNote="1 組"
      sourceNote="test"
      harvestTags={harvestTags}
      families={[family()]}
      {...overrides}
    />,
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

  it("keeps regex copy/reset and language toggles in compact chrome", () => {
    renderBuilder(compactChrome);

    expect(screen.getByRole("button", { name: "繁中匹配" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "EN match" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重置" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "複製" })).toBeInTheDocument();
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

  it("builds regex from match text, not family names, after include click", async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByText("地圖內含有額外的(2—3)個稀有箱子"));

    const output = document.querySelector(".font-mono.text-gold");
    expect(output?.textContent).toBeTruthy();
    expect(output?.textContent).not.toContain("司庫");
    expect(output?.textContent).not.toContain("Treasurer");
    expect(output?.textContent).not.toContain("點選詞綴列");
    expect(screen.getByText("正則包含")).toBeInTheDocument();
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

    expect(screen.queryByText("正則包含")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "匯入物品" }));
    const again = screen.getByPlaceholderText(/\+73 最大生命/);
    await user.click(again);
    await user.paste("地圖內含有額外的(2—3)個稀有箱子");
    await user.click(screen.getByRole("button", { name: "匯入" }));

    expect(screen.getByText("正則包含")).toBeInTheDocument();
    const output = document.querySelector(".font-mono.text-gold");
    expect(output?.textContent).not.toContain("司庫");
    expect(output?.textContent).not.toContain("Treasurer");
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

    expect(screen.getByText("正則包含")).toBeInTheDocument();
    const output = document.querySelector(".font-mono.text-gold");
    expect(output?.textContent).toBeTruthy();
    expect(output?.textContent).not.toContain("點選詞綴列");

    await user.click(screen.getByText("地圖內含有額外的(2—3)個稀有箱子"));
    expect(screen.getByText("正則排除")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "重置" }));
    expect(screen.getByText("正則包含")).toBeInTheDocument();
    expect(screen.queryByText("正則排除")).not.toBeInTheDocument();
  });
});
