import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { craftTierChoices, craftingFamiliesFor, earlyGearFamiliesFor, type AffixFamily } from "@poe2-regex/data";
import EndgameLayout from "./EndgameLayout.tsx";
import CraftingPage from "./CraftingPage.tsx";
import { LocaleProvider } from "../i18n.tsx";

function renderCrafting(path = "/endgame/crafting") {
  return render(
    <LocaleProvider initialLocale="zh-Hant">
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="endgame" element={<EndgameLayout />}>
            <Route path="crafting" element={<CraftingPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </LocaleProvider>,
  );
}

function lifeFamily() {
  const life = earlyGearFamiliesFor("body").find((family) => family.family === "IncreasedLife");
  if (!life) throw new Error("missing IncreasedLife");
  return life;
}

function affixRow(text: string) {
  const box = screen.getByRole("checkbox", { name: `目標 ${text}` });
  const row = box.closest("li");
  if (!row) throw new Error(`affix row missing: ${text}`);
  return row as HTMLElement;
}

function pattern() {
  return document.querySelector(".font-mono.text-gold")?.textContent ?? "";
}

function distinctSide(generation: "prefix" | "suffix", limit: number): AffixFamily[] {
  const picked: AffixFamily[] = [];
  const seen = new Set<string>();
  for (const family of earlyGearFamiliesFor("body")) {
    if (family.generation !== generation || seen.has(family.family)) continue;
    seen.add(family.family);
    picked.push(family);
    if (picked.length === limit) return picked;
  }
  throw new Error(`need ${limit} distinct prefix groups`);
}

describe("crafting page", () => {
  it("keeps the affix chrome, drops 是／或／否, and lets a chosen tier drive regex and item level", async () => {
    const user = userEvent.setup();
    renderCrafting();
    const life = lifeFamily();

    expect(screen.getByRole("link", { name: "做裝" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "胸甲" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: "戒指" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "弓" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "爪" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "雙手劍" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "陷阱" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "力量" })).not.toBeInTheDocument();
    expect(screen.getByText("craft-caps-v1")).toBeInTheDocument();
    expect(screen.getAllByText(/每件只能有 1 條工藝詞綴/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/重組器不在這條主路線/).length).toBeGreaterThan(0);
    expect(screen.getByText("倉庫正則（刷這個基底／這些目標）")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "火焰" })).toBeInTheDocument();
    expect(screen.getByText("Filter:")).toBeInTheDocument();
    expect(screen.getByText(/Min iLvL/i)).toBeInTheDocument();
    expect(screen.getByText(/Max iLvL/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "匯入物品" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "切換隱藏" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "简中匹配" })).not.toBeInTheDocument();
    expect(screen.queryByText("继续")).not.toBeInTheDocument();
    expect(screen.queryByText("换底")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "是" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "或" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "否" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "破潰石鎖定的詞條" })).not.toBeInTheDocument();
    expect(screen.getByText("勾選目標後，倉庫正則會顯示在這裡")).toBeInTheDocument();

    const row = affixRow(life.textZh);
    expect(within(row).getByRole("checkbox", { name: `目標 ${life.textZh}` })).not.toBeChecked();
    expect(within(row).getByRole("button", { name: `破潰石鎖定的詞條 ${life.textZh}` })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(within(row).getByRole("button", { name: "展開階層" })).toBeInTheDocument();

    expect(screen.getAllByText(/少花光明之兆/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/骰不到所選階級就是換底/).length).toBeGreaterThan(0);
    expect(document.querySelector("[data-craft-diagram]")).toBeTruthy();
    expect(document.querySelector('[data-node="base"]')).toHaveAttribute("data-active", "true");
    expect(document.querySelector('[data-node="fill"]')).toHaveAttribute("data-active", "true");
    expect(document.querySelector('[data-node="stop-base"]')).toHaveAttribute("data-active", "false");
    expect(screen.queryByRole("button", { name: "褻瀆分支" })).not.toBeInTheDocument();

    await user.click(within(row).getByRole("checkbox", { name: `目標 ${life.textZh}` }));
    await user.type(screen.getByLabelText("物品等級"), "1");
    expect(screen.queryByText("換底")).not.toBeInTheDocument();
    const open = pattern();
    expect(open).toContain("最大生命");
    expect(open).not.toMatch(/\\d/);

    const top = craftTierChoices(life)[0];
    await user.selectOptions(within(row).getByLabelText(`最低階級 ${life.textZh}`), String(top.index));
    expect(pattern()).not.toBe(open);
    expect(pattern()).toMatch(/\\d/);
    expect(screen.getByText("換底")).toBeInTheDocument();
    expect(screen.getAllByText(/所選階級高過這件的物品等級/).length).toBeGreaterThan(0);
    expect(document.querySelector('[data-node="stop-base"]')).toHaveAttribute("data-active", "true");

    await user.click(screen.getByRole("checkbox", { name: /預算緊/ }));
    expect(screen.getByText("換底")).toBeInTheDocument();
    expect(screen.getByText("你勾了預算緊。判定沒有因此改變。")).toBeInTheDocument();
  }, 15_000);

  it("classifies a lower-level non-target as safe to whittle", async () => {
    const user = userEvent.setup();
    renderCrafting();
    const life = lifeFamily();
    const top = craftTierChoices(life)[0];
    if (!top) throw new Error("missing life tiers");
    const other = earlyGearFamiliesFor("body").find((family) => (
      family.id !== life.id && family.tiers.some((tier) => tier.level < top.level)
    ));
    if (!other) throw new Error("missing a lower-level affix");
    const low = other.tiers.reduce(
      (best, tier, index) => (tier.level < other.tiers[best]!.level ? index : best),
      0,
    );

    await user.click(screen.getByRole("checkbox", { name: `目標 ${life.textZh}` }));
    await user.selectOptions(screen.getByLabelText(`最低階級 ${life.textZh}`), String(top.index));
    await user.selectOptions(screen.getByLabelText("非目標詞綴"), other.id);
    await user.selectOptions(screen.getByLabelText("這件上的階級"), String(low));
    await user.click(screen.getByRole("button", { name: "記在這件上" }));

    expect(screen.getByText("可削切")).toBeInTheDocument();
    expect(screen.getByText(`需求等級 ${other.tiers[low]!.level}`)).toBeInTheDocument();
    expect(screen.getByText("繼續（削切之兆，混沌石移除最低等級詞綴）")).toBeInTheDocument();
    expect(document.querySelector('[data-node="whittle"]')).toHaveAttribute("data-active", "true");
  }, 15_000);

  it("keeps a body once a third socket is added and opens Thrud's pool on weapons", async () => {
    const user = userEvent.setup();
    const view = renderCrafting();
    expect(screen.getByLabelText("孔 1")).toBeInTheDocument();
    expect(screen.getByLabelText("孔 2")).toBeInTheDocument();
    expect(screen.queryByLabelText("孔 3")).not.toBeInTheDocument();
    expect(screen.queryByText("步驟 A")).not.toBeInTheDocument();
    expect(screen.queryByText("步驟 D")).not.toBeInTheDocument();
    const treeHeading = document.getElementById("craft-tree-heading");
    const targets = screen.getByRole("heading", { name: "目標詞綴" });
    const item = screen.getByRole("heading", { name: "這件裝備" });
    expect(document.querySelectorAll("[data-craft-diagram]")).toHaveLength(1);
    expect(targets.compareDocumentPosition(treeHeading!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(item.compareDocumentPosition(treeHeading!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(treeHeading?.closest("section")?.querySelector("[data-craft-detail]")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "加一孔" }));
    expect(screen.getByText("繼續（額外增幅槽，留下這件）")).toBeInTheDocument();
    expect(screen.queryByText("卓越")).not.toBeInTheDocument();
    expect(screen.queryByText(/Exceptional/)).not.toBeInTheDocument();
    expect(document.querySelector('[data-node="keep-exceptional"]')).toHaveAttribute("data-active", "true");

    await user.selectOptions(screen.getByLabelText("孔 1"), "Serles_Triumph");
    expect(screen.getAllByText(/允許後綴\+1/).length).toBeGreaterThan(0);
    const suffixes = distinctSide("suffix", 5);
    for (const family of suffixes.slice(0, 4)) {
      await user.click(screen.getByRole("checkbox", { name: `目標 ${family.textZh}` }));
    }
    expect(within(affixRow(suffixes[3]!.textZh)).getByRole("checkbox")).toBeEnabled();
    const fifth = affixRow(suffixes[4]!.textZh);
    expect(within(fifth).getByRole("checkbox")).toBeDisabled();
    expect(fifth).toHaveAttribute("title", "後綴已滿 4 條");

    await user.click(document.querySelector('[data-node="stop-base"]')!);
    expect(document.querySelector("[data-craft-detail]")?.textContent).toContain("骰不到所選階級就是換底");

    view.unmount();
    renderCrafting("/endgame/crafting?slot=bow");
    await user.selectOptions(screen.getByLabelText("孔 1"), "Thruds_Might");
    expect(screen.getByRole("checkbox", { name: /變動物理詞綴的大小/ })).toBeInTheDocument();
  }, 15_000);

  it("opens a weapon class on the same target rows", () => {
    renderCrafting("/endgame/crafting?slot=bow");
    expect(screen.getByRole("option", { name: "弓" })).toHaveAttribute("aria-selected", "true");
    const bow = craftingFamiliesFor("bow").find((family) => family.matchZh.includes("物理"));
    if (!bow) throw new Error("missing bow physical affix");
    expect(screen.getByRole("checkbox", { name: `目標 ${bow.textZh}` })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "是" })).not.toBeInTheDocument();
  });

  it("locks one desecration target at a time and keeps that mod on the route", async () => {
    const user = userEvent.setup();
    renderCrafting();
    const life = lifeFamily();
    const other = earlyGearFamiliesFor("body").find(
      (family) => family.generation === "prefix" && family.family !== life.family,
    );
    if (!other) throw new Error("missing a second prefix");

    const lifeLock = () => screen.getByRole("button", { name: `破潰石鎖定的詞條 ${life.textZh}` });
    const otherLock = () => screen.getByRole("button", { name: `破潰石鎖定的詞條 ${other.textZh}` });
    const lifeBox = () => screen.getByRole("checkbox", { name: `目標 ${life.textZh}` });

    await user.click(lifeLock());
    expect(lifeBox()).toBeChecked();
    expect(lifeLock()).toHaveAttribute("aria-pressed", "true");

    await user.click(lifeLock());
    expect(lifeBox()).toBeChecked();
    expect(lifeLock()).toHaveAttribute("aria-pressed", "false");

    await user.selectOptions(screen.getByLabelText("前綴數量"), "2");
    await user.click(screen.getByRole("checkbox", { name: "目標側有 1 條要留下的破裂" }));
    expect(screen.getByText("繼續（精髓／合金頂掉後重褻瀆）")).toBeInTheDocument();

    await user.click(lifeLock());
    expect(screen.getByText("繼續")).toBeInTheDocument();
    expect(screen.queryByText("繼續（精髓／合金頂掉後重褻瀆）")).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: `${life.textZh} 已有` })).toBeChecked();

    await user.click(otherLock());
    expect(otherLock()).toHaveAttribute("aria-pressed", "true");
    expect(lifeLock()).toHaveAttribute("aria-pressed", "false");
    expect(lifeBox()).toBeChecked();
    expect(screen.getByRole("checkbox", { name: `目標 ${other.textZh}` })).toBeChecked();
    expect(screen.getAllByRole("button", { name: /破潰石鎖定的詞條/, pressed: true })).toHaveLength(1);
  });

  it("dims same-group affixes and extra prefixes once three are selected", async () => {
    const user = userEvent.setup();
    renderCrafting();
    const body = earlyGearFamiliesFor("body");
    const armour = body.find((family) => family.family === "BaseLocalDefences" && family.matchZh === "護甲值");
    const evasion = body.find((family) => family.family === "BaseLocalDefences" && family.matchZh === "閃避值");
    if (!armour || !evasion) throw new Error("missing defence variants");

    await user.click(screen.getByRole("checkbox", { name: `目標 ${armour.textZh}` }));
    const evasionRow = affixRow(evasion.textZh);
    expect(within(evasionRow).getByRole("checkbox", { name: `目標 ${evasion.textZh}` })).toBeDisabled();
    expect(evasionRow).toHaveAttribute("title", "與已選詞條同類，不能同時存在");
    expect(affixRow(armour.textZh)).not.toHaveAttribute("title", "與已選詞條同類，不能同時存在");

    await user.click(screen.getByRole("checkbox", { name: `目標 ${armour.textZh}` }));
    const prefixes = distinctSide("prefix", 4);
    for (const family of prefixes.slice(0, 3)) {
      await user.click(screen.getByRole("checkbox", { name: `目標 ${family.textZh}` }));
    }
    const fourth = affixRow(prefixes[3].textZh);
    expect(within(fourth).getByRole("checkbox")).toBeDisabled();
    expect(fourth).toHaveAttribute("title", "前綴已滿 3 條");
    expect(within(affixRow(prefixes[0].textZh)).getByRole("checkbox")).toBeEnabled();
  });
});
