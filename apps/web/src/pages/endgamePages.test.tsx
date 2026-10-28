import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { matchesItem } from "@poe2-regex/regex";
import TabletsPage from "./TabletsPage.tsx";
import WaystonesPage from "./WaystonesPage.tsx";
import { LocaleProvider } from "../i18n.tsx";

function renderPage(ui: ReactElement) {
  return render(<LocaleProvider initialLocale="zh-Hant">{ui}</LocaleProvider>);
}

function expectEndgameChromeGone() {
  expect(screen.queryAllByRole("button", { name: "Ulaman" })).toHaveLength(0);
  expect(screen.queryAllByRole("button", { name: "火焰" })).toHaveLength(0);
  expect(screen.queryAllByText("Filter:")).toHaveLength(0);
  expect(screen.queryAllByText(/Min iLvL/i)).toHaveLength(0);
  expect(screen.queryAllByText(/Max iLvL/i)).toHaveLength(0);
  expect(screen.queryAllByRole("button", { name: "匯入物品" })).toHaveLength(0);
  expect(screen.queryAllByRole("button", { name: "切換隱藏" })).toHaveLength(0);
}

function dragBound(name: string, value: string) {
  fireEvent.change(screen.getByLabelText(name), { target: { value } });
}

function expectRegexTools() {
  expect(screen.queryByRole("button", { name: "简中匹配" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "繁中匹配" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "EN match" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "重置" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "複製" })).toBeInTheDocument();
}

describe("endgame tablets page", () => {
  it("keeps kind picker, hides harvest/filter chrome, and lists effects without family names", async () => {
    const user = userEvent.setup();
    renderPage(<TabletsPage />);

    expect(screen.getByRole("listbox", { name: "碑牌種類" })).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: /裂痕碑牌/ }));

    expectEndgameChromeGone();
    expectRegexTools();
    expect(screen.queryAllByText("司庫的")).toHaveLength(0);
    expect(screen.queryAllByText("Treasurer's", { exact: false })).toHaveLength(0);
    expect(screen.queryAllByText("召喚師的")).toHaveLength(0);
    expect(screen.getByText("地圖內含有額外的(2—3)個稀有箱子")).toBeInTheDocument();
    expect(screen.getByText("地圖內含有額外的1個召喚法陣")).toBeInTheDocument();
    expect(screen.getByText("Map contains (2—3) additional Rare Chests")).toBeInTheDocument();
    expect(screen.queryAllByText("召喚物")).toHaveLength(0);

    const chestRow = screen.getByText("地圖內含有額外的(2—3)個稀有箱子").closest("li");
    expect(chestRow).toBeTruthy();
    expect(within(chestRow as HTMLElement).getByRole("button", { name: "YES" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(within(chestRow as HTMLElement).getByRole("button", { name: "YES" })).toHaveAttribute(
      "title",
      "YES：包含此詞條（AND）",
    );
    expect(within(chestRow as HTMLElement).getByRole("button", { name: "OR" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(within(chestRow as HTMLElement).getByRole("button", { name: "NOT" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(within(chestRow as HTMLElement).queryByRole("button", { name: "是" })).not.toBeInTheDocument();
    expect(within(chestRow as HTMLElement).queryByRole("button", { name: "或" })).not.toBeInTheDocument();
    expect(within(chestRow as HTMLElement).queryByRole("button", { name: "否" })).not.toBeInTheDocument();
    expect(within(chestRow as HTMLElement).queryByRole("button", { name: "空" })).not.toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "搜尋詞綴" })).toBeInTheDocument();
    expect(screen.getByText("常見 2–3")).toBeInTheDocument();
    expect(screen.queryByText(/iLvL/)).not.toBeInTheDocument();
    const rail = screen.getByRole("region", { name: "倉庫正則" });
    expect(rail).toHaveAttribute("data-regex-rail", "dock");
    expect(rail).toHaveTextContent("已選 0 · 排除 0");
    expect(rail).toHaveTextContent("每列選 YES、OR 或 NOT");
    expect(screen.getByText(/YES 0 · OR 0 · NOT 0/)).toBeInTheDocument();
    expect(screen.getByText("點詞綴文字選 YES。右側 NOT 排除，OR 仍可選。常見範圍直接顯示在列上，展開才看完整階層。")).toBeInTheDocument();
  });

  it("searches the current kind, selects YES from the mod text, and still reaches OR and NOT", async () => {
    const user = userEvent.setup();
    renderPage(<TabletsPage />);
    await user.click(screen.getByRole("option", { name: /裂痕碑牌/ }));

    const search = screen.getByRole("searchbox", { name: "搜尋詞綴" });
    await user.type(search, "召唤");
    expect(screen.getByText("地圖內含有額外的1個召喚法陣")).toBeInTheDocument();
    expect(screen.queryByText("地圖內含有額外的(2—3)個稀有箱子")).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "稀有箱子");
    const chestText = "地圖內含有額外的(2—3)個稀有箱子";
    const chest = screen.getByRole("button", { name: chestText });
    expect(screen.queryByText("地圖內含有額外的1個召喚法陣")).not.toBeInTheDocument();
    expect(screen.getByText("常見 2–3")).toBeInTheDocument();

    await user.click(chest);
    const row = chest.closest("li") as HTMLElement;
    expect(chest).toHaveAttribute("title", "點此詞綴選 YES");
    expect(within(row).getByRole("button", { name: "YES" })).toHaveAttribute("aria-pressed", "true");
    expect(within(row).getByRole("button", { name: "OR" })).toHaveAttribute("aria-pressed", "false");
    expect(within(row).getByRole("button", { name: "NOT" })).toHaveAttribute("aria-pressed", "false");

    await user.click(within(row).getByRole("button", { name: "OR" }));
    expect(within(row).getByRole("button", { name: "OR" })).toHaveAttribute("aria-pressed", "true");
    await user.click(within(row).getByRole("button", { name: "NOT" }));
    expect(within(row).getByRole("button", { name: "NOT" })).toHaveAttribute("aria-pressed", "true");
    expect(document.querySelector(".font-mono.text-gold")?.textContent ?? "").toContain("!");
    const rail = screen.getByRole("region", { name: "倉庫正則" });
    expect(rail).toHaveTextContent("已選 0 · 排除 1");
    expect(rail).toHaveTextContent("NOT 地圖內含有額外的(2—3)個稀有箱子");
    expect(screen.getByRole("button", { name: /清除NOT/ })).toBeInTheDocument();
    expect(screen.getByText(/YES 0 · OR 0 · NOT 1/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "清空全部條件" }));
    expect(within(row).getByRole("button", { name: "NOT" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("region", { name: "倉庫正則" })).toHaveTextContent("已選 0 · 排除 0");
  });

  it("keeps full tier detail behind expand and still offers per-mod min/max", async () => {
    const user = userEvent.setup();
    renderPage(<TabletsPage />);
    await user.click(screen.getByRole("option", { name: /裂痕碑牌/ }));

    const chestText = "地圖內含有額外的(2—3)個稀有箱子";
    expect(screen.queryByText(/iLvL/)).not.toBeInTheDocument();
    const row = screen.getByText(chestText).closest("li") as HTMLElement;
    await user.click(within(row).getByRole("button", { name: "YES" }));
    expect(within(row).getByPlaceholderText("最小")).toBeInTheDocument();
    expect(within(row).getByPlaceholderText("最大")).toBeInTheDocument();
    await user.click(within(row).getByRole("button", { name: "展開階層" }));
    expect(within(row).getByText(/iLvL/)).toBeInTheDocument();
  });

  it("ANDs 是 rows, ORs 或 rows, and !-excludes 否 rows from the live tablet regex", async () => {
    const user = userEvent.setup();
    renderPage(<TabletsPage />);
    await user.click(screen.getByRole("option", { name: /裂痕碑牌/ }));

    const chest = screen.getByText("地圖內含有額外的(2—3)個稀有箱子").closest("li") as HTMLElement;
    const summon = screen.getByText("地圖內含有額外的1個召喚法陣").closest("li") as HTMLElement;
    const rarity = screen.getByText("地圖增加(15—20)%怪物稀有度").closest("li") as HTMLElement;
    await user.click(within(chest).getByRole("button", { name: "YES" }));
    await user.click(within(summon).getByRole("button", { name: "OR" }));
    await user.click(within(rarity).getByRole("button", { name: "NOT" }));

    const pattern = document.querySelector(".font-mono.text-gold")?.textContent ?? "";
    expect(pattern).toContain("!");
    expect(pattern).toMatch(/箱子/);
    expect((pattern.match(/"/g) ?? []).length).toBe(6);
    expect(matchesItem(pattern, "地圖內含有額外的個稀有箱子\n地圖內含有額外的個召喚法陣")).toBe(
      true,
    );
    expect(matchesItem(pattern, "地圖內含有額外的個稀有箱子")).toBe(false);
    expect(
      matchesItem(
        pattern,
        "地圖內含有額外的個稀有箱子\n地圖內含有額外的個召喚法陣\n地圖增加怪物稀有度",
      ),
    ).toBe(false);
  });
});

describe("endgame waystones page", () => {
  it("uses market min/max filters and drops the affix-pool tier picker", async () => {
    const user = userEvent.setup();
    renderPage(<WaystonesPage />);

    expect(screen.queryByRole("tablist", { name: "換界石階級" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "低階" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "中階" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "高階" })).not.toBeInTheDocument();
    expectEndgameChromeGone();
    expectRegexTools();

    expect(screen.getByRole("group", { name: "換界石終局篩選" })).toBeInTheDocument();
    expect(screen.getByLabelText("換界石階級 最小")).toBeInTheDocument();
    expect(screen.getByLabelText("怪物效用 最小")).toBeInTheDocument();
    expect(screen.getByLabelText("怪物稀有度 最大")).toBeInTheDocument();
    expect(screen.getByLabelText("換界石掉落率 最小")).toBeInTheDocument();
    expect(screen.getByLabelText("換界石經驗 最小")).toBeInTheDocument();
    expect(screen.getByLabelText("換界石怪物群大小 最小")).toBeInTheDocument();
    expect(screen.getByLabelText("物品稀有度 最小")).toBeInTheDocument();
    expect(screen.getByLabelText("換界石復活 最大")).toBeInTheDocument();
    expect(screen.getByLabelText("換界石金幣 最小")).toBeInTheDocument();
    expect(screen.queryByLabelText("混沌試煉")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Ultimatum Trial")).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "勝利之運" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "不限" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("物品數量 最小")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("group", { name: "詞條取捨" })).toHaveLength(0);
    expect(screen.queryAllByRole("button", { name: "是" })).toHaveLength(0);
    expect(screen.queryAllByRole("button", { name: "或" })).toHaveLength(0);
    expect(screen.queryAllByRole("button", { name: "否" })).toHaveLength(0);
    expect(screen.queryAllByText("強韌的")).toHaveLength(0);
    expect(screen.queryAllByText("Tough", { exact: false })).toHaveLength(0);
    expect(screen.queryByText(/更多怪物生命/)).not.toBeInTheDocument();

    const output = document.querySelector(".font-mono.text-gold");
    expect(output?.textContent).toMatch(/拖動滑桿後/);
    expect(screen.getByLabelText("物品稀有度 最小")).toHaveAttribute("type", "range");
    expect(screen.getByLabelText("換界石階級 最小")).toHaveAttribute("max", "16");
    expect(screen.getByLabelText("換界石金幣 最大")).toHaveAttribute("max", "1000");
    expect(screen.getByLabelText("換界石經驗 最大")).toHaveAttribute("max", "400");
    expect(screen.getByLabelText("換界石復活 最大")).toHaveAttribute("max", "6");

    dragBound("物品稀有度 最小", "40");
    expect(output?.textContent).toContain("物品稀有度");
    expect(output?.textContent).not.toContain("更多稀有度");
    expect(output?.textContent).not.toContain("充盈的");
    expect(output?.textContent).not.toContain("強韌");

    await user.click(screen.getByRole("button", { name: "EN match" }));
    expect(output?.textContent).toContain("Item Rarity");
    expect(output?.textContent).not.toContain("物品稀有度");
  });

  it("generated regex matches juiced waystone text and ignores empty axes", () => {
    renderPage(<WaystonesPage />);

    dragBound("物品稀有度 最小", "40");
    dragBound("怪物效用 最小", "20");

    const pattern = document.querySelector(".font-mono.text-gold")?.textContent ?? "";
    const juicy = [
      "物品稀有度: +45%",
      "怪物效用: +29%",
      "此區域找到的物品擁有14%更多稀有度",
      "怪物擁有16%更多效用",
    ].join("\n");
    const low = "物品稀有度: +12%\n怪物效用: +8%";
    expect(matchesItem(pattern, juicy)).toBe(true);
    expect(matchesItem(pattern, low)).toBe(false);
  });

  it("keeps the regex rail in view, summarizes filled axes, and labels a lowered minimum as 優化", async () => {
    const user = userEvent.setup();
    renderPage(<WaystonesPage />);

    const rail = screen.getByRole("region", { name: "倉庫正則" });
    expect(rail).toHaveAttribute("data-regex-rail", "dock");
    expect(rail.className).toMatch(/fixed/);
    expect(screen.getByRole("button", { name: "優化長度" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "清空全部" })).toBeDisabled();

    dragBound("物品稀有度 最小", "47");
    expect(screen.getByRole("button", { name: "清除物品稀有度" })).toHaveTextContent("≥47");
    expect(screen.getByRole("button", { name: "忽略物品稀有度" })).toBeInTheDocument();
    const rarity = screen.getByLabelText("物品稀有度 最小").closest("[data-axis]") as HTMLElement;
    expect(rarity.querySelector('[data-bound="min"]')).toHaveTextContent("47");
    expect(rarity.querySelector('[data-bound="max"]')).toHaveTextContent("不限");
    expect(screen.queryByText(/優化：物品稀有度/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "優化長度" }));
    expect(screen.getByRole("button", { name: "優化長度" })).toHaveAttribute("aria-pressed", "true");
    const tight = document.querySelector(".font-mono.text-gold")?.textContent ?? "";
    expect(tight).toContain("物品稀有度");
    expect(tight).toContain("[5-9].");
    expect(tight).not.toContain("[5-9]\\d");
    expect(screen.getByText(/下限仍是你填的值/)).toBeInTheDocument();
    expect(screen.queryByText(/優化：物品稀有度/)).not.toBeInTheDocument();
    expect(matchesItem(tight, "物品稀有度: +47%")).toBe(true);
    expect(matchesItem(tight, "物品稀有度: +39%")).toBe(false);

    dragBound("物品稀有度 最小", "0");
    expect(screen.queryByRole("button", { name: "清除物品稀有度" })).not.toBeInTheDocument();
    expect(rarity.querySelector('[data-bound="min"]')).toHaveTextContent("不限");

    dragBound("物品稀有度 最小", "47");
    await user.click(screen.getByRole("button", { name: "清空全部" }));
    expect(screen.getByLabelText("物品稀有度 最小")).toHaveValue("0");
    expect(screen.queryByRole("button", { name: "清除物品稀有度" })).not.toBeInTheDocument();
  });

  it("labels axes 優化 when length pressure lowers the typed minimum", async () => {
    const user = userEvent.setup();
    renderPage(<WaystonesPage />);
    const mins = [
      "換界石怪物群大小 最小",
      "怪物效用 最小",
      "物品稀有度 最小",
      "怪物稀有度 最小",
      "換界石掉落率 最小",
      "換界石金幣 最小",
      "換界石經驗 最小",
    ];
    for (const name of mins) {
      dragBound(name, "47");
    }
    await user.click(screen.getByRole("button", { name: "優化長度" }));

    const rail = screen.getByRole("region", { name: "倉庫正則" });
    expect(rail).toHaveTextContent("優化：怪物效用 下限 47→40（會匹配低於輸入值）");
    expect(rail).toHaveTextContent("標成優化的軸會匹配低於輸入值");
    expect(rail).not.toHaveTextContent("優化：物品稀有度");
    expect(rail).not.toHaveTextContent("47→0");
    const pattern = document.querySelector(".font-mono.text-gold")?.textContent ?? "";
    expect(pattern.length).toBeLessThanOrEqual(250);
    const item = [
      "怪物群大小: +47%",
      "怪物效用: +40%",
      "物品稀有度: +47%",
      "怪物稀有度: +47%",
      "掉落率: +40%",
      "增加47%本區域中金幣的掉落量",
      "增加40%經驗獲得",
    ].join("\n");
    expect(matchesItem(pattern, item)).toBe(true);
    expect(matchesItem(pattern, item.replace("怪物效用: +40%", "怪物效用: +39%"))).toBe(false);
    expect(matchesItem(pattern, item.replace("物品稀有度: +47%", "物品稀有度: +46%"))).toBe(false);
  });

  it("ignores empty axes and ANDs filled min/max", () => {
    renderPage(<WaystonesPage />);

    dragBound("換界石階級 最小", "14");
    dragBound("換界石階級 最大", "15");
    dragBound("怪物效用 最小", "20");

    const output = document.querySelector(".font-mono.text-gold");
    expect(output?.textContent).toContain("階級");
    expect(output?.textContent).toContain("怪物效用");
    expect(output?.textContent).not.toContain("致命之運");
    expect(output?.textContent).not.toContain("物品稀有度");
    expect(output?.textContent?.includes('"')).toBe(true);
    expect((output?.textContent?.match(/"/g) ?? []).length).toBeGreaterThanOrEqual(4);
  });
});
