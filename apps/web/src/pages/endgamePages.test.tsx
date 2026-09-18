import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { matchesItem } from "@poe2-regex/regex";
import TabletsPage from "./TabletsPage.tsx";
import WaystonesPage from "./WaystonesPage.tsx";
import ShieldsDemo from "./ShieldsDemo.tsx";
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
    expect(within(chestRow as HTMLElement).getByRole("button", { name: "是" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(within(chestRow as HTMLElement).getByRole("button", { name: "或" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(within(chestRow as HTMLElement).getByRole("button", { name: "否" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(within(chestRow as HTMLElement).queryByRole("button", { name: "空" })).not.toBeInTheDocument();
  });

  it("ANDs 是 rows, ORs 或 rows, and !-excludes 否 rows from the live tablet regex", async () => {
    const user = userEvent.setup();
    renderPage(<TabletsPage />);
    await user.click(screen.getByRole("option", { name: /裂痕碑牌/ }));

    const chest = screen.getByText("地圖內含有額外的(2—3)個稀有箱子").closest("li") as HTMLElement;
    const summon = screen.getByText("地圖內含有額外的1個召喚法陣").closest("li") as HTMLElement;
    const rarity = screen.getByText("地圖增加(15—20)%怪物稀有度").closest("li") as HTMLElement;
    await user.click(within(chest).getByRole("button", { name: "是" }));
    await user.click(within(summon).getByRole("button", { name: "或" }));
    await user.click(within(rarity).getByRole("button", { name: "否" }));

    const pattern = document.querySelector(".font-mono.text-gold")?.textContent ?? "";
    expect(pattern).toContain("!");
    expect(pattern).toMatch(/箱子/);
    expect(pattern).toMatch(/法陣|稀有度/);
    expect((pattern.match(/"/g) ?? []).length).toBeGreaterThanOrEqual(4);
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
    expect(output?.textContent).toMatch(/填入數值後/);

    await user.type(screen.getByLabelText("物品稀有度 最小"), "40");
    expect(output?.textContent).toContain("物品稀有度");
    expect(output?.textContent).not.toContain("更多稀有度");
    expect(output?.textContent).not.toContain("充盈的");
    expect(output?.textContent).not.toContain("強韌");

    await user.click(screen.getByRole("button", { name: "EN match" }));
    expect(output?.textContent).toContain("Item Rarity");
    expect(output?.textContent).not.toContain("物品稀有度");
  });

  it("generated regex matches juiced waystone text and ignores empty axes", async () => {
    const user = userEvent.setup();
    renderPage(<WaystonesPage />);

    await user.type(screen.getByLabelText("物品稀有度 最小"), "40");
    await user.type(screen.getByLabelText("怪物效用 最小"), "20");

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

  it("ignores empty axes and ANDs filled min/max", async () => {
    const user = userEvent.setup();
    renderPage(<WaystonesPage />);

    await user.type(screen.getByLabelText("換界石階級 最小"), "14");
    await user.type(screen.getByLabelText("換界石階級 最大"), "16");
    await user.type(screen.getByLabelText("怪物效用 最小"), "20");

    const output = document.querySelector(".font-mono.text-gold");
    expect(output?.textContent).toContain("階級");
    expect(output?.textContent).toContain("怪物效用");
    expect(output?.textContent).not.toContain("致命之運");
    expect(output?.textContent).not.toContain("物品稀有度");
    expect(output?.textContent?.includes('"')).toBe(true);
    expect((output?.textContent?.match(/"/g) ?? []).length).toBeGreaterThanOrEqual(4);
  });
});

describe("early shields demo keeps harvest chrome without family names", () => {
  it("still shows tags, filter, import, and hide toggle", () => {
    renderPage(<ShieldsDemo />);

    expect(screen.getAllByRole("button", { name: "火焰" }).length).toBeGreaterThan(0);
    expect(screen.getByText("Filter:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "匯入物品" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "切換隱藏" })).toBeInTheDocument();
  });

  it("lists effect text only, not family names or row tags", () => {
    renderPage(<ShieldsDemo />);

    expect(screen.queryAllByText("多刺的")).toHaveLength(0);
    expect(screen.queryAllByText("Thorny", { exact: false })).toHaveLength(0);
    expect(screen.getByText("(1—2) to (3—4) Physical Thorns damage")).toBeInTheDocument();
  });
});
