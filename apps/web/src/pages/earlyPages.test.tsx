import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { MemoryRouter, Navigate, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { campaignChapters, shopModById } from "@poe2-regex/data";
import { matchesItem } from "@poe2-regex/regex";
import ChaptersPage from "./ChaptersPage.tsx";
import EarlyGearPage, { EarlyGearShieldsRedirect } from "./EarlyGearPage.tsx";
import EarlyLayout from "./EarlyLayout.tsx";
import EarlyTipsPage from "./EarlyTipsPage.tsx";
import VendorPage from "./VendorPage.tsx";
import { LocaleProvider } from "../i18n.tsx";

function renderEarly(ui: ReactElement, path = "/early/chapters") {
  return render(
    <LocaleProvider initialLocale="zh-Hant">
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </LocaleProvider>,
  );
}

function pressedYesCount() {
  return screen.getAllByRole("button", { name: "是", pressed: true }).length;
}

function polarityOn(text: string) {
  const row = screen.getByText(text).closest("li");
  if (!row) throw new Error(`row not found: ${text}`);
  return {
    yes: within(row).getByRole("button", { name: "是" }),
    or: within(row).getByRole("button", { name: "或" }),
    no: within(row).getByRole("button", { name: "否" }),
  };
}

describe("early chapters page", () => {
  it("surfaces chapter shop defaults instead of an empty placeholder", () => {
    renderEarly(<ChaptersPage />);

    expect(screen.getByRole("tab", { name: /第一章/ })).toBeInTheDocument();
    expect(screen.queryByText("內容稍後填入")).not.toBeInTheDocument();
    expect(screen.queryByText(/章節關卡與商店節點稍後填入/)).not.toBeInTheDocument();

    expect(screen.getByText(shopModById("life").textZh)).toBeInTheDocument();
    expect(screen.getByText(shopModById("movement_speed").textZh)).toBeInTheDocument();
    expect(screen.queryByText(shopModById("life").labelZh)).not.toBeInTheDocument();
    expect(screen.queryByText("生命")).not.toBeInTheDocument();
    expect(pressedYesCount()).toBe(campaignChapters[0].defaultPicks.length);

    const output = document.querySelector(".font-mono.text-gold");
    expect(output?.textContent).toBeTruthy();
    expect(output?.textContent).not.toContain("每列選");

    const pattern = output?.textContent ?? "";
    expect(matchesItem(pattern, "+15最大生命\n增加10%移動速度")).toBe(true);
    expect(matchesItem(pattern, "+15最大生命")).toBe(false);
    expect(matchesItem(pattern, "增加10%移動速度")).toBe(false);
    expect(matchesItem(pattern, "+10%火焰抗性")).toBe(false);
  });

  it("switches default includes when another chapter is selected", async () => {
    const user = userEvent.setup();
    renderEarly(<ChaptersPage />);

    expect(pressedYesCount()).toBe(campaignChapters[0].defaultPicks.length);

    await user.click(screen.getByRole("tab", { name: /第二章/ }));
    expect(screen.getByText(shopModById("fire_res").textZh)).toBeInTheDocument();
    expect(pressedYesCount()).toBe(campaignChapters[1].defaultPicks.length);
  });

  it("keeps the shop regex and points the route notes at the tips tab", () => {
    renderEarly(<ChaptersPage />);

    expect(screen.queryByRole("heading", { name: "開荒流程" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "開荒流程" })).not.toBeInTheDocument();
    expect(screen.queryByText(/葛瑞爾林/)).not.toBeInTheDocument();
    expect(screen.queryByText("維里西姆鐵砧")).not.toBeInTheDocument();
    const tips = screen.getByRole("link", { name: "開荒技巧" });
    expect(tips).toHaveAttribute("href", "/early/tips");
    const rail = document.querySelector("[data-regex-rail]");
    expect(rail).toBeTruthy();
    expect(rail!.compareDocumentPosition(tips) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(pressedYesCount()).toBe(campaignChapters[0].defaultPicks.length);
    expect(campaignChapters.every((chapter) => chapter.maps.length === 0)).toBe(true);
  });
});

describe("early tips page", () => {
  function dataRows() {
    const table = screen.getByRole("table");
    return within(table).getAllByRole("row").slice(1);
  }

  it("lists the locked route in one sheet, with notes above and sources below", async () => {
    const user = userEvent.setup();
    renderEarly(<EarlyTipsPage />, "/early/tips");

    expect(screen.getByRole("heading", { name: "開荒技巧" })).toBeInTheDocument();
    expect(screen.getAllByText(/禁忌儀式是聯盟內容/)).toHaveLength(1);
    expect(screen.getByText("現役開荒是第一章至第四章。0.5.5h 不改主線。永久獎勵以遊戲內任務圖示為準。")).toBeInTheDocument();
    expect(screen.getByText("解鎖回收台")).toBeInTheDocument();
    expect(screen.queryByText("分解台")).not.toBeInTheDocument();
    const headers = screen.getAllByRole("columnheader").map((cell) => cell.textContent);
    expect(headers).toEqual(["章節", "地圖", "技巧／地標", "獎勵或設施", "優先"]);
    expect(headers).not.toContain("來源");

    const table = screen.getByRole("table");
    expect(table.textContent).toContain("葛瑞爾林（The Grelwood）");
    expect(table.textContent).toContain("赤谷（Red Vale）");
    expect(table.textContent).toContain("攝魂之樹");
    expect(table.textContent).toContain("纏縛陰林（Grim Tangle）");
    expect(table.textContent).toContain("獵場（Hunting Grounds）");
    expect(table.textContent).toContain("鴉鈴（Crowbell）");
    expect(table.textContent).toContain("弗雷索恩（Freythorn）");
    expect(table.textContent).not.toContain("叛徒之路");
    expect(table.textContent).not.toContain("第五章（間章）");
    expect(table.textContent).not.toContain("庫萊亞村");
    expect(screen.queryByRole("tab", { name: /第五章/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "間歇" })).not.toBeInTheDocument();
    expect(screen.queryByText(/間章/)).not.toBeInTheDocument();
    expect(table.textContent).not.toContain("通牛");
    expect(table.textContent).not.toContain("通牘");
    expect(table.textContent).not.toContain("（優先）");
    expect(within(table).getAllByText("優先")).toHaveLength(3);

    const sources = screen.getByRole("link", { name: "編年史第 1 章" });
    expect(sources).toHaveAttribute("href", "https://poe2db.tw/tw/Act_1");
    expect(table.compareDocumentPosition(sources) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(screen.getByText(/乳齒象惡地裂縫見 Reddit/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "只看優先" }));
    const act1Priority = dataRows().map((row) => row.textContent ?? "");
    expect(act1Priority).toHaveLength(2);
    expect(act1Priority.some((text) => text.includes("皆伐（Clearfell）") && text.includes("+10% 冰冷抗性"))).toBe(true);
    expect(act1Priority.some((text) => text.includes("弗雷索恩（Freythorn）") && text.includes("+30 精魂"))).toBe(true);

    await user.click(screen.getByRole("tab", { name: /第二章/ }));
    const act2 = dataRows().map((row) => row.textContent ?? "");
    expect(act2).toHaveLength(1);
    expect(act2[0]).toContain("戴斯哈尖塔");
    expect(act2[0]).toContain("+10% 閃電抗性");
    expect(act2.every((text) => text.startsWith("第二章"))).toBe(true);

    await user.click(screen.getByRole("button", { name: "只看優先" }));
    expect(screen.getByRole("tab", { name: /第二章/ })).toHaveAttribute("aria-selected", "true");
    const act2Text = dataRows().map((row) => row.textContent ?? "").join("\n");
    expect(act2Text.indexOf("乳齒象惡地（Mastodon Badlands）")).toBeLessThan(act2Text.indexOf("凱斯城"));
    expect(dataRows().some((row) => row.textContent?.includes("叛徒之路（Traitor’s Passage）"))).toBe(true);
    expect(dataRows().some((row) => row.textContent?.includes("叛徒．芭芭拉（Balbala）"))).toBe(true);
    expect(dataRows().every((row) => row.textContent?.startsWith("第二章"))).toBe(true);

    await user.click(screen.getByRole("tab", { name: /第三章/ }));
    expect(screen.getByRole("table").textContent).toContain("卡瑪薩之錘");
    expect(screen.getByRole("table").textContent).toContain("奧斯瓦德");
    expect(screen.getByRole("table").textContent).toContain("解鎖重鑄台");
    expect(screen.getByRole("table").textContent).toContain("最後通牒雕刻");
    expect(screen.getByRole("table").textContent).toContain("阿札克泥沼");
    await user.click(screen.getByRole("button", { name: "只看優先" }));
    const act3Priority = dataRows().map((row) => row.textContent ?? "");
    expect(act3Priority).toHaveLength(2);
    expect(act3Priority.some((text) => text.includes("吉卡尼的機械迷城") && text.includes("遺忘的黑顎") && text.includes("+10% 火焰抗性"))).toBe(true);
    expect(act3Priority.some((text) => text.includes("阿札克泥沼") && text.includes("+30 精魂"))).toBe(true);

    await user.click(screen.getByRole("button", { name: "只看優先" }));
    await user.click(screen.getByRole("tab", { name: /第四章/ }));
    expect(screen.getByRole("table").textContent).toContain("解鎖維里西姆鐵砧");
    expect(screen.getByRole("table").textContent).toContain("祖靈的試煉");
    expect(screen.getByRole("table").textContent).toContain("悉妮蔻拉的刺青");
    expect(screen.getByRole("table").textContent).toContain("圖貞");
    expect(screen.getByRole("table").textContent).toContain("纏繞迷霧之書");
    expect(screen.getByRole("link", { name: "祖靈的試煉" })).toHaveAttribute(
      "href",
      "https://poe2db.tw/tw/Trial_of_the_Ancestors",
    );
    expect(screen.getByRole("table").textContent).not.toContain("最後通牒雕刻");
    await user.click(screen.getByRole("button", { name: "只看優先" }));
    expect(dataRows().map((row) => row.textContent ?? "")).toEqual(["沒有符合的列"]);
  });
});

describe("early subnav", () => {
  it("orders chapters, tips, vendor, and gear, and keeps /early on chapters", () => {
    render(
      <LocaleProvider initialLocale="zh-Hant">
        <MemoryRouter initialEntries={["/early"]}>
          <Routes>
            <Route path="/early" element={<EarlyLayout />}>
              <Route index element={<Navigate to="chapters" replace />} />
              <Route path="chapters" element={<p>chapters default</p>} />
              <Route path="tips" element={<p>tips</p>} />
              <Route path="vendor" element={<p>vendor</p>} />
              <Route path="gear" element={<p>gear</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </LocaleProvider>,
    );

    const nav = screen.getByRole("navigation", { name: "子頁面" });
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual([
      "章節地圖",
      "開荒技巧",
      "商店裝備篩選",
      "裝備詞綴",
    ]);
    expect(within(nav).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
      "/early/chapters",
      "/early/tips",
      "/early/vendor",
      "/early/gear",
    ]);
    expect(screen.getByText("chapters default")).toBeInTheDocument();
  });
});

describe("early vendor page", () => {
  it("loads the same chapter defaults and keeps include/exclude editing", async () => {
    const user = userEvent.setup();
    renderEarly(<VendorPage />, "/early/vendor");

    expect(screen.queryByText("內容稍後填入")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "開荒流程" })).not.toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "章節" })).toBeInTheDocument();
    expect(pressedYesCount()).toBeGreaterThan(0);

    await user.click(polarityOn(shopModById("life").textZh).no);
    expect(polarityOn(shopModById("life").textZh).no).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(polarityOn(shopModById("life").textZh).yes).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(polarityOn(shopModById("life").textZh).or).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("honours ?chapter= query when opening the shop page", () => {
    renderEarly(<VendorPage />, "/early/vendor?chapter=act-4");
    expect(screen.getByRole("tab", { name: /第四章/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText(shopModById("chaos_res").textZh)).toBeInTheDocument();
    expect(pressedYesCount()).toBe(
      campaignChapters.find((c) => c.id === "act-4")?.defaultPicks.length ?? -1,
    );
  });
});



describe("early gear category picker", () => {
  function renderGear(path = "/early/gear") {
    return render(
      <LocaleProvider initialLocale="zh-Hant">
        <MemoryRouter initialEntries={[path]}>
          <EarlyGearPage />
        </MemoryRouter>
      </LocaleProvider>,
    );
  }

  it("defaults to body armour with 是／或／否 polarity and Traditional Chinese match", async () => {
    const user = userEvent.setup();
    renderGear();

    expect(screen.getByRole("option", { name: "胸甲" })).toHaveAttribute("aria-selected", "true");
    expect(document.querySelector("[data-row-stats]")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "頭盔" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "手套" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "鞋子" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "戒指" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "項鍊" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "腰帶" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "單手錘" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "盾牌" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "弓" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "爪" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("option").map((el) => el.textContent)).toEqual([
      "胸甲",
      "頭盔",
      "手套",
      "鞋子",
      "戒指",
      "項鍊",
      "腰帶",
      "單手錘",
      "盾牌",
    ]);
    expect(screen.getAllByRole("button", { name: "火焰" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("tab", { name: "力量" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "敏捷" })).not.toBeInTheDocument();
    expect(screen.queryByText("力量塔盾")).not.toBeInTheDocument();
    expect(screen.queryByText("輕盾")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "简中匹配" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "繁中匹配" })).toBeInTheDocument();
    expect(document.querySelector("[data-affix-scroll]")).toBeNull();
    expect(screen.queryByRole("region", { name: "預設詞綴" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /收合/ })).not.toBeInTheDocument();
    const earlyPrefixes = screen.getByRole("heading", { name: /^基礎前綴/ }).closest("section");
    const earlyRows = [...(earlyPrefixes?.querySelectorAll("li.affix-row") ?? [])];
    expect(earlyRows[0]?.textContent).toContain("物理荊棘傷害");
    expect(earlyRows[1]?.textContent).toContain("最大能量護盾");
    expect(screen.getByText("+(10—19)最大生命")).toBeInTheDocument();
    expect(screen.getByText("+(16—27)護甲值")).toBeInTheDocument();
    expect(screen.getByText("+(11—18)閃避值")).toBeInTheDocument();

    const life = screen.getByText("+(10—19)最大生命").closest("li") as HTMLElement;
    await user.click(within(life).getByRole("button", { name: "是" }));
    const pattern = document.querySelector(".font-mono.text-gold")?.textContent ?? "";
    expect(pattern).toContain("最大生命");
    expect(matchesItem(pattern, "+15最大生命")).toBe(true);
    expect(matchesItem(pattern, "+10%火焰抗性")).toBe(false);
  });

  it("does not show attribute-family tabs; body lists armour and evasion together", () => {
    renderGear();

    expect(screen.queryByRole("tablist", { name: "基底" })).not.toBeInTheDocument();
    expect(screen.queryByText("力量塔盾")).not.toBeInTheDocument();
    expect(screen.queryByText("力／敏盾")).not.toBeInTheDocument();
    expect(screen.getByText("+(16—27)護甲值")).toBeInTheDocument();
    expect(screen.getByText("+(11—18)閃避值")).toBeInTheDocument();
  });

  it("switches slots and rebuilds regex for rings and one-handed maces", async () => {
    const user = userEvent.setup();
    renderGear();

    await user.click(screen.getByRole("option", { name: "戒指" }));
    expect(screen.getByText("+(3—5)%全元素抗性")).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "力量" })).not.toBeInTheDocument();
    expect(screen.queryByText("力量塔盾")).not.toBeInTheDocument();

    const allRes = screen.getByText("+(3—5)%全元素抗性").closest("li") as HTMLElement;
    await user.click(within(allRes).getByRole("button", { name: "是" }));
    const ringPattern = document.querySelector(".font-mono.text-gold")?.textContent ?? "";
    expect(ringPattern.length).toBeGreaterThan(0);
    expect(matchesItem(ringPattern, "+5%全元素抗性")).toBe(true);
    expect(matchesItem(ringPattern, "+15最大生命")).toBe(false);

    await user.click(screen.getByRole("option", { name: "單手錘" }));
    expect(screen.getByText("附加(1—2)至(4—5)物理傷害")).toBeInTheDocument();
    const phys = screen.getByText("附加(1—2)至(4—5)物理傷害").closest("li") as HTMLElement;
    await user.click(within(phys).getByRole("button", { name: "或" }));
    const fire = screen.getByText("附加(1—2)至(3—5)火焰傷害").closest("li") as HTMLElement;
    await user.click(within(fire).getByRole("button", { name: "否" }));
    const macePattern = document.querySelector(".font-mono.text-gold")?.textContent ?? "";
    expect(macePattern).toContain("!");
    expect(matchesItem(macePattern, "附加至物理傷害")).toBe(true);
    expect(matchesItem(macePattern, "附加至火焰傷害")).toBe(false);
    expect(matchesItem(macePattern, "+15最大生命")).toBe(false);
  });

  it("keeps the shield lab available with harvest chrome", () => {
    renderGear("/early/gear?slot=shield");

    expect(screen.getByRole("option", { name: "盾牌" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: "胸甲" })).toBeInTheDocument();
    expect(screen.queryByText("力量塔盾")).not.toBeInTheDocument();
    expect(screen.queryByText("力／敏盾")).not.toBeInTheDocument();
    expect(screen.queryByText("力／智盾")).not.toBeInTheDocument();
    expect(screen.queryByText("輕盾")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "火焰" }).length).toBeGreaterThan(0);
    expect(screen.getByText("Filter:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "匯入物品" })).toBeInTheDocument();
    expect(screen.queryAllByText("多刺的")).toHaveLength(0);
    expect(screen.getByText("(1—2) to (3—4) Physical Thorns damage")).toBeInTheDocument();
  });

  it("redirects /early/shields to the major-slot gear UI without attribute families", () => {
    render(
      <LocaleProvider initialLocale="zh-Hant">
        <MemoryRouter initialEntries={["/early/shields"]}>
          <Routes>
            <Route path="/early/shields" element={<EarlyGearShieldsRedirect />} />
            <Route path="/early/gear" element={<EarlyGearPage />} />
          </Routes>
        </MemoryRouter>
      </LocaleProvider>,
    );

    expect(screen.getByRole("option", { name: "盾牌" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: "胸甲" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "頭盔" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "單手錘" })).toBeInTheDocument();
    expect(screen.queryByText("力量塔盾")).not.toBeInTheDocument();
    expect(screen.queryByText("力／敏盾")).not.toBeInTheDocument();
    expect(screen.queryByText("力／智盾")).not.toBeInTheDocument();
    expect(screen.queryByText("輕盾")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "火焰" }).length).toBeGreaterThan(0);
  });
});
