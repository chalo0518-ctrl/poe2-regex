import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { craftTierChoices, craftingFamiliesFor, earlyGearFamiliesFor, type AffixFamily } from "@poe2-regex/data";
import EndgameLayout from "./EndgameLayout.tsx";
import CraftingPage from "./CraftingPage.tsx";
import { LocaleProvider } from "../i18n.tsx";

function activeLibrary() {
  const panel = document.querySelector('[role="tabpanel"]:not([hidden])');
  if (!(panel instanceof HTMLElement)) throw new Error("missing affix sheet");
  return within(panel);
}

function renderCrafting(path = "/endgame/crafting", locale: "zh-Hant" | "en" = "zh-Hant") {
  return render(
    <LocaleProvider initialLocale={locale}>
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
  return distinctCraftSide("body", generation, limit);
}

function distinctCraftSide(
  slot: Parameters<typeof craftingFamiliesFor>[0],
  generation: "prefix" | "suffix",
  limit: number,
): AffixFamily[] {
  const picked: AffixFamily[] = [];
  const seen = new Set<string>();
  for (const family of craftingFamiliesFor(slot)) {
    if (family.generation !== generation || seen.has(family.family)) continue;
    seen.add(family.family);
    picked.push(family);
    if (picked.length === limit) return picked;
  }
  throw new Error(`need ${limit} distinct ${generation} groups on ${slot}`);
}

describe("crafting page", () => {
  it("keeps the affix chrome, drops 是／或／否, and lets a chosen tier drive regex and item level", async () => {
    const user = userEvent.setup();
    renderCrafting();
    const life = lifeFamily();

    expect(screen.getByRole("link", { name: "做裝" })).toBeInTheDocument();
    const slotSelect = screen.getByLabelText("裝備部位");
    expect(slotSelect).toHaveValue("body");
    expect(within(slotSelect).getByRole("option", { name: "胸甲" })).toHaveProperty("selected", true);
    const armour = within(slotSelect).getByRole("group", { name: "防具" });
    const jewellery = within(slotSelect).getByRole("group", { name: "飾品" });
    const weapons = within(slotSelect).getByRole("group", { name: "武器" });
    expect(within(armour).getByRole("option", { name: "頭盔" })).toBeInTheDocument();
    expect(within(armour).getByRole("option", { name: "手套" })).toBeInTheDocument();
    expect(within(armour).getByRole("option", { name: "鞋子" })).toBeInTheDocument();
    expect(within(armour).getByRole("option", { name: "盾牌" })).toBeInTheDocument();
    expect(within(armour).queryByRole("option", { name: "戒指" })).not.toBeInTheDocument();
    expect(within(jewellery).getByRole("option", { name: "戒指" })).toBeInTheDocument();
    expect(within(jewellery).getByRole("option", { name: "項鍊" })).toBeInTheDocument();
    expect(within(jewellery).getByRole("option", { name: "腰帶" })).toBeInTheDocument();
    expect(within(weapons).getByRole("option", { name: "弓" })).toBeInTheDocument();
    expect(within(weapons).getByRole("option", { name: "爪" })).toBeInTheDocument();
    expect(within(weapons).getByRole("option", { name: "雙手劍" })).toBeInTheDocument();
    expect(within(weapons).getByRole("option", { name: "陷阱" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "力量" })).not.toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByText("craft-caps-v1")).toBeInTheDocument();
    expect(screen.getAllByText(/每件只能有 1 條工藝詞綴/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/重組器不在這條主路線/).length).toBeGreaterThan(0);
    expect(screen.getByText("倉庫正則（刷這個基底／這些目標）")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "火焰" })).toBeInTheDocument();
    expect(activeLibrary().getByText("Filter:")).toBeInTheDocument();
    expect(activeLibrary().getByText(/Min iLvL/i)).toBeInTheDocument();
    expect(activeLibrary().getByText(/Max iLvL/i)).toBeInTheDocument();
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
    await user.selectOptions(activeLibrary().getByLabelText(`最低階級 ${life.textZh}`), String(top.index));
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
    const aside = treeHeading?.closest("aside");
    const left = aside?.previousElementSibling as HTMLElement | null;
    expect(document.querySelectorAll("[data-craft-diagram]")).toHaveLength(1);
    expect(aside?.querySelector("[data-craft-diagram]")).toHaveAttribute("data-orientation", "vertical");
    expect(left?.querySelector('[aria-label="增幅"]')).toBeTruthy();
    expect(left && within(left).getByRole("heading", { name: "目標詞綴" })).toBeTruthy();
    expect(left && within(left).getByRole("heading", { name: "這件裝備" })).toBeTruthy();
    expect(aside?.parentElement?.nextElementSibling).toBeNull();
    const base = document.querySelector('[data-node="base"]') as HTMLElement;
    const fill = document.querySelector('[data-node="fill"]') as HTMLElement;
    expect(base.compareDocumentPosition(fill) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

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
    expect(document.querySelector("[data-augment-pool]")).toBeNull();

    await user.click(document.querySelector('[data-node="stop-base"]')!);
    expect(document.querySelector("[data-craft-detail]")?.textContent).toContain("骰不到所選階級就是換底");

    view.unmount();
    renderCrafting("/endgame/crafting?slot=bow");
    await user.selectOptions(screen.getByLabelText("孔 1"), "Thruds_Might");
    const poolName = "索魯德的強權 額外詞綴";
    const pool = () => screen.getByRole("region", { name: poolName });
    const destructionName = /變動物理詞綴的大小/;
    expect(within(pool()).getByRole("heading", { name: /^前綴/ })).toBeInTheDocument();
    expect(within(pool()).getByRole("heading", { name: /^後綴/ })).toBeInTheDocument();
    const destruction = within(pool()).getByRole("checkbox", { name: destructionName });
    const baseSuffix = screen.getByRole("heading", { name: /^基礎後綴/ }).closest("section");
    expect(baseSuffix && within(baseSuffix).queryByRole("checkbox", { name: destructionName })).toBeNull();
    expect(pool().compareDocumentPosition(baseSuffix!) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();

    await user.click(destruction);
    expect(destruction).toBeChecked();
    await user.selectOptions(screen.getByLabelText("孔 1"), "");
    expect(screen.queryByRole("region", { name: poolName })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: destructionName })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("孔 1"), "Thruds_Might");
    expect(within(pool()).getByRole("checkbox", { name: destructionName })).not.toBeChecked();
    for (const family of distinctCraftSide("bow", "suffix", 3)) {
      await user.click(screen.getByRole("checkbox", { name: `目標 ${family.textZh}` }));
    }
    const blocked = within(pool()).getByRole("checkbox", { name: destructionName }).closest("li");
    expect(blocked).toHaveAttribute("title", "後綴已滿 3 條");
    expect(within(blocked as HTMLElement).getByRole("checkbox")).toBeDisabled();
  }, 15_000);

  it("titles Thrud's extra pool in English under the normal list", async () => {
    const user = userEvent.setup();
    renderCrafting("/endgame/crafting?slot=bow", "en");
    await user.selectOptions(screen.getByLabelText("Socket 1"), "Thruds_Might");
    const enPool = screen.getByRole("region", { name: "Thrud's Might extra affixes" });
    expect(within(enPool).getByRole("heading", { name: /^Prefixes/ })).toBeInTheDocument();
    expect(within(enPool).getByRole("heading", { name: /^Suffixes/ })).toBeInTheDocument();
    expect(within(enPool).getByRole("button", { name: "Collapse Thrud's Might extra affixes" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    const base = screen.getAllByRole("heading", { name: /^Suffixes/ }).find(
      (heading) => !heading.closest("[data-augment-pool]"),
    );
    if (!base) throw new Error("missing the normal suffix heading");
    expect(enPool.compareDocumentPosition(base) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  it("opens a weapon class on the same target rows", async () => {
    const user = userEvent.setup();
    renderCrafting("/endgame/crafting?slot=bow");
    const slotSelect = screen.getByLabelText("裝備部位");
    expect(slotSelect).toHaveValue("bow");
    expect(within(slotSelect).getByRole("option", { name: "弓" })).toHaveProperty("selected", true);
    const bow = craftingFamiliesFor("bow").find((family) => family.matchZh.includes("物理"));
    if (!bow) throw new Error("missing bow physical affix");
    expect(screen.getByRole("checkbox", { name: `目標 ${bow.textZh}` })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "是" })).not.toBeInTheDocument();
    await user.selectOptions(slotSelect, "ring");
    expect(slotSelect).toHaveValue("ring");
    expect(screen.queryByRole("checkbox", { name: `目標 ${bow.textZh}` })).not.toBeInTheDocument();
    const ring = craftingFamiliesFor("ring")[0];
    if (!ring) throw new Error("missing a ring affix");
    expect(screen.getByRole("checkbox", { name: `目標 ${ring.textZh}` })).toBeEnabled();
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
    await user.click(screen.getByRole("tab", { name: "已有詞條" }));
    expect(screen.getByRole("checkbox", { name: `${life.textZh} 已有` })).toBeChecked();
    await user.click(screen.getByRole("tab", { name: "目標詞綴" }));

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

    const defaultPool = screen.getByRole("region", { name: "預設詞綴" });
    const prefixScroll = within(defaultPool).getByRole("heading", { name: /^基礎前綴/ }).closest("section")?.querySelector("[data-affix-scroll]");
    const suffixScroll = within(defaultPool).getByRole("heading", { name: /^基礎後綴/ }).closest("section")?.querySelector("[data-affix-scroll]");
    expect(prefixScroll).toBeTruthy();
    expect(suffixScroll).toBeTruthy();
    expect(prefixScroll).not.toBe(suffixScroll);
    expect(prefixScroll?.contains(screen.getByRole("heading", { name: "這件裝備" }))).toBe(false);
    expect(prefixScroll?.contains(screen.getByLabelText("孔 1"))).toBe(false);

    await user.click(screen.getByRole("checkbox", { name: `目標 ${armour.textZh}` }));
    const evasionRow = affixRow(evasion.textZh);
    const armourRow = affixRow(armour.textZh);
    const prefixSection = armourRow.closest("section");
    if (!prefixSection) throw new Error("missing prefix section");
    const sunkLabel = within(prefixSection).getByText("互斥／不可選");
    expect(within(evasionRow).getByRole("checkbox", { name: `目標 ${evasion.textZh}` })).toBeDisabled();
    expect(evasionRow).toHaveAttribute("title", "與已選詞條同類，不能同時存在");
    expect(armourRow).not.toHaveAttribute("title", "與已選詞條同類，不能同時存在");
    expect(armourRow.compareDocumentPosition(sunkLabel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(sunkLabel.compareDocumentPosition(evasionRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await user.click(screen.getByRole("checkbox", { name: `目標 ${armour.textZh}` }));
    expect(within(prefixSection).queryByText("互斥／不可選")).not.toBeInTheDocument();
    expect(within(affixRow(evasion.textZh)).getByRole("checkbox")).toBeEnabled();
    const prefixes = distinctSide("prefix", 4);
    for (const family of prefixes.slice(0, 3)) {
      await user.click(screen.getByRole("checkbox", { name: `目標 ${family.textZh}` }));
    }
    const fourth = affixRow(prefixes[3].textZh);
    expect(within(fourth).getByRole("checkbox")).toBeDisabled();
    expect(fourth).toHaveAttribute("title", "前綴已滿 3 條");
    expect(within(affixRow(prefixes[0].textZh)).getByRole("checkbox")).toBeEnabled();
    const flags = [...prefixSection.querySelectorAll("li.affix-row")].map((row) => row.getAttribute("data-blocked"));
    const firstBlocked = flags.indexOf("true");
    expect(firstBlocked).toBeGreaterThan(0);
    expect(flags.lastIndexOf("false")).toBeLessThan(firstBlocked);
    expect(prefixScroll?.contains(fourth)).toBe(true);
  });

  it("shows Medved's soul pool in its own box and keeps desecrated affixes separate", async () => {
    const user = userEvent.setup();
    renderCrafting();
    const abyss = screen.getByRole("region", { name: "褻瀆詞綴" });
    expect(within(abyss).getByRole("heading", { name: /^前綴/ })).toBeInTheDocument();
    expect(within(abyss).getByRole("heading", { name: /^後綴/ })).toBeInTheDocument();
    expect(within(abyss).getAllByRole("checkbox").length).toBeGreaterThan(0);
    expect(abyss.querySelectorAll("[data-affix-scroll]").length).toBeGreaterThan(0);
    expect(screen.queryByRole("region", { name: "梅德偉的照料 額外詞綴" })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("孔 1"), "Medveds_Tending");
    const medved = screen.getByRole("region", { name: "梅德偉的照料 額外詞綴" });
    expect(within(medved).getByRole("heading", { name: /^前綴/ })).toBeInTheDocument();
    expect(within(medved).getByRole("heading", { name: /^後綴/ })).toBeInTheDocument();
    const soul = within(medved).getByRole("checkbox", { name: /增加\(1—20\)%最大生命/ });
    expect(soul).toBeEnabled();
    expect(screen.getByRole("region", { name: "預設詞綴" }).contains(soul)).toBe(false);
    expect(abyss.contains(soul)).toBe(false);
    expect(medved.querySelectorAll("[data-affix-scroll]")).toHaveLength(2);
    expect(
      screen.getByRole("region", { name: "預設詞綴" }).compareDocumentPosition(medved)
        & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    await user.click(soul);
    expect(soul).toBeChecked();
    await user.selectOptions(screen.getByLabelText("孔 1"), "");
    expect(screen.queryByRole("region", { name: "梅德偉的照料 額外詞綴" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /增加\(1—20\)%最大生命/ })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("孔 1"), "Serles_Triumph");
    expect(screen.queryByRole("region", { name: /額外詞綴/ })).not.toBeInTheDocument();
  });

  it("collapses each affix box without clearing picks, and keeps that choice across sheets", async () => {
    const user = userEvent.setup();
    renderCrafting();
    const life = lifeFamily();
    const augment = screen.getByRole("region", { name: "增幅" });
    expect(within(augment).queryByRole("button", { name: /收合|展開/ })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "這件裝備" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "決策樹" })).toBeInTheDocument();

    const preset = screen.getByRole("region", { name: "預設詞綴" });
    const collapsePreset = within(preset).getByRole("button", { name: "收合預設詞綴" });
    expect(collapsePreset).toHaveAttribute("aria-expanded", "true");
    expect(within(preset).getByRole("heading", { name: /^基礎前綴/ })).toBeInTheDocument();
    expect(within(preset).getByRole("heading", { name: /^基礎後綴/ })).toBeInTheDocument();
    expect(preset.querySelector("[data-affix-scroll]")?.className).toContain("max-h-[18rem]");

    const lifeBox = within(preset).getByRole("checkbox", { name: `目標 ${life.textZh}` });
    await user.click(lifeBox);
    expect(lifeBox).toBeChecked();
    expect(pattern()).toContain("最大生命");

    await user.click(collapsePreset);
    expect(preset).toHaveAttribute("data-collapsed", "true");
    expect(within(preset).getByRole("button", { name: "展開預設詞綴" })).toHaveAttribute("aria-expanded", "false");
    expect(within(preset).getByRole("heading", { name: "預設詞綴" })).toBeInTheDocument();
    expect(within(preset).queryByRole("heading", { name: /^基礎前綴/ })).not.toBeInTheDocument();
    expect(within(preset).queryByRole("heading", { name: /^基礎後綴/ })).not.toBeInTheDocument();
    expect(preset.querySelector("[data-affix-scroll]")).toBeNull();
    expect(pattern()).toContain("最大生命");

    const abyss = screen.getByRole("region", { name: "褻瀆詞綴" });
    const abyssBox = within(abyss).getAllByRole("checkbox")[0];
    if (!abyssBox) throw new Error("missing a desecrated affix");
    const abyssName = abyssBox.getAttribute("aria-label");
    if (!abyssName) throw new Error("desecrated affix has no name");
    await user.click(abyssBox);
    expect(abyssBox).toBeChecked();
    await user.click(within(abyss).getByRole("button", { name: "收合褻瀆詞綴" }));
    expect(within(abyss).queryByRole("checkbox")).not.toBeInTheDocument();
    expect(within(abyss).queryByRole("heading", { name: /^前綴/ })).not.toBeInTheDocument();
    expect(within(abyss).queryByRole("heading", { name: /^後綴/ })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("孔 1"), "Medveds_Tending");
    const medved = screen.getByRole("region", { name: "梅德偉的照料 額外詞綴" });
    const soul = within(medved).getByRole("checkbox", { name: /增加\(1—20\)%最大生命/ });
    await user.click(soul);
    expect(soul).toBeChecked();
    await user.click(within(medved).getByRole("button", { name: "收合梅德偉的照料 額外詞綴" }));
    expect(within(medved).queryByRole("checkbox")).not.toBeInTheDocument();
    expect(medved.querySelector("[data-affix-scroll]")).toBeNull();

    await user.click(screen.getByRole("tab", { name: "已有詞條" }));
    const ownedPreset = screen.getByRole("region", { name: "預設詞綴" });
    const ownedAbyss = screen.getByRole("region", { name: "褻瀆詞綴" });
    const ownedMedved = screen.getByRole("region", { name: "梅德偉的照料 額外詞綴" });
    expect(ownedPreset).toHaveAttribute("data-collapsed", "true");
    expect(ownedAbyss).toHaveAttribute("data-collapsed", "true");
    expect(ownedMedved).toHaveAttribute("data-collapsed", "true");
    expect(within(ownedPreset).queryByRole("checkbox", { name: `${life.textZh} 已有` })).not.toBeInTheDocument();

    await user.click(within(ownedPreset).getByRole("button", { name: "展開預設詞綴" }));
    const ownedLife = within(ownedPreset).getByRole("checkbox", { name: `${life.textZh} 已有` });
    expect(ownedLife).not.toBeChecked();
    await user.click(ownedLife);
    expect(ownedLife).toBeChecked();
    await user.click(within(ownedPreset).getByRole("button", { name: "收合預設詞綴" }));
    expect(within(ownedPreset).queryByRole("checkbox")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "目標詞綴" }));
    const back = screen.getByRole("region", { name: "預設詞綴" });
    expect(back).toHaveAttribute("data-collapsed", "true");
    expect(screen.getByRole("region", { name: "褻瀆詞綴" })).toHaveAttribute("data-collapsed", "true");
    expect(screen.getByRole("region", { name: "梅德偉的照料 額外詞綴" })).toHaveAttribute("data-collapsed", "true");
    expect(pattern()).toContain("最大生命");

    await user.click(within(back).getByRole("button", { name: "展開預設詞綴" }));
    expect(within(back).getByRole("checkbox", { name: `目標 ${life.textZh}` })).toBeChecked();
    const scroll = back.querySelector("[data-affix-scroll]");
    expect(scroll?.className).toContain("max-h-[18rem]");
    expect(scroll?.className).toContain("overflow-y-auto");

    await user.click(within(screen.getByRole("region", { name: "褻瀆詞綴" })).getByRole("button", { name: "展開褻瀆詞綴" }));
    expect(within(screen.getByRole("region", { name: "褻瀆詞綴" })).getByRole("checkbox", { name: abyssName })).toBeChecked();

    const medvedAgain = screen.getByRole("region", { name: "梅德偉的照料 額外詞綴" });
    await user.click(within(medvedAgain).getByRole("button", { name: "展開梅德偉的照料 額外詞綴" }));
    expect(within(medvedAgain).getByRole("checkbox", { name: /增加\(1—20\)%最大生命/ })).toBeChecked();
    expect(medvedAgain.querySelectorAll("[data-affix-scroll]")).toHaveLength(2);

    await user.click(screen.getByRole("tab", { name: "已有詞條" }));
    expect(within(screen.getByRole("region", { name: "預設詞綴" })).getByRole("checkbox", { name: `${life.textZh} 已有` })).toBeChecked();
    expect(screen.getByRole("heading", { name: "這件裝備" })).toBeInTheDocument();
    expect(screen.getByLabelText("孔 1")).toHaveValue("Medveds_Tending");
    expect(screen.getByRole("heading", { name: "決策樹" })).toBeInTheDocument();
  }, 15_000);

  it("switches target and owned sheets without dropping picks or owned flags", async () => {
    const user = userEvent.setup();
    renderCrafting();
    const life = lifeFamily();
    const tabs = screen.getByRole("tablist", { name: "詞綴分頁" });
    const targets = within(tabs).getByRole("tab", { name: "目標詞綴" });
    const owned = within(tabs).getByRole("tab", { name: "已有詞條" });
    expect(targets).toHaveAttribute("aria-selected", "true");
    expect(owned).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("heading", { name: "目標詞綴" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "這件裝備" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: `${life.textZh} 已有` })).not.toBeInTheDocument();

    const target = screen.getByRole("checkbox", { name: `目標 ${life.textZh}` });
    await user.click(target);
    expect(target).toBeChecked();
    expect(screen.getByText(/這件還沒有目標詞綴/)).toBeInTheDocument();
    await user.click(owned);
    expect(screen.queryByRole("checkbox", { name: `目標 ${life.textZh}` })).not.toBeInTheDocument();
    const have = screen.getByRole("checkbox", { name: `${life.textZh} 已有` });
    expect(have).not.toBeChecked();
    await user.click(have);
    expect(have).toBeChecked();
    expect(screen.getByText(/已有一條目標/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "這件裝備" })).toBeInTheDocument();
    expect(screen.getByLabelText("孔 1")).toBeInTheDocument();

    await user.click(targets);
    expect(screen.getByRole("checkbox", { name: `目標 ${life.textZh}` })).toBeChecked();
    await user.click(owned);
    expect(screen.getByRole("checkbox", { name: `${life.textZh} 已有` })).toBeChecked();
  });

  it("gives owned affixes the same pools, scrollers, and conflict sinking", async () => {
    const user = userEvent.setup();
    renderCrafting();
    const body = earlyGearFamiliesFor("body");
    const armour = body.find((family) => family.family === "BaseLocalDefences" && family.matchZh === "護甲值");
    const evasion = body.find((family) => family.family === "BaseLocalDefences" && family.matchZh === "閃避值");
    const life = lifeFamily();
    if (!armour || !evasion) throw new Error("missing defence variants");

    await user.click(screen.getByRole("tab", { name: "已有詞條" }));
    expect(screen.getByRole("heading", { name: "已有詞條" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "目標詞綴" })).not.toBeInTheDocument();
    const pool = screen.getByRole("region", { name: "預設詞綴" });
    const scrolls = pool.querySelectorAll("[data-affix-scroll]");
    expect(scrolls).toHaveLength(2);
    expect(scrolls[0]?.className).toContain("max-h-[18rem]");
    const abyss = screen.getByRole("region", { name: "褻瀆詞綴" });
    expect(abyss.querySelectorAll("[data-affix-scroll]")).toHaveLength(2);
    expect(screen.getByText(/勾這件已經有的詞綴/)).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: `${armour.textZh} 已有` }));
    const evasionRow = screen.getByRole("checkbox", { name: `${evasion.textZh} 已有` }).closest("li");
    if (!evasionRow) throw new Error("missing evasion row");
    expect(within(evasionRow).getByRole("checkbox")).toBeDisabled();
    expect(evasionRow).toHaveAttribute("title", "與已選詞條同類，不能同時存在");
    const prefixSection = screen.getByRole("checkbox", { name: `${armour.textZh} 已有` }).closest("section");
    if (!prefixSection) throw new Error("missing prefix section");
    const sunk = within(prefixSection).getByText("互斥／不可選");
    expect(sunk.compareDocumentPosition(evasionRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText(/這件還沒有目標詞綴/)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("孔 1"), "Medveds_Tending");
    expect(screen.getByRole("region", { name: "梅德偉的照料 額外詞綴" })).toBeInTheDocument();

    const lifeLock = screen.getByRole("button", { name: `破潰石鎖定的詞條 ${life.textZh}` });
    await user.click(lifeLock);
    expect(screen.getByRole("checkbox", { name: `${life.textZh} 已有` })).toBeDisabled();
    await user.click(screen.getByRole("tab", { name: "目標詞綴" }));
    expect(screen.getByRole("checkbox", { name: `目標 ${life.textZh}` })).toBeChecked();
    expect(screen.getByRole("button", { name: `破潰石鎖定的詞條 ${life.textZh}` })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("checkbox", { name: `目標 ${armour.textZh}` })).not.toBeChecked();
    expect(screen.getByRole("region", { name: "梅德偉的照料 額外詞綴" })).toBeInTheDocument();
  });

  it("treats a cleared owned tier as not yet met", async () => {
    const user = userEvent.setup();
    renderCrafting();
    const prefixes = distinctSide("prefix", 2);
    for (const family of prefixes) {
      await user.click(screen.getByRole("checkbox", { name: `目標 ${family.textZh}` }));
    }
    await user.selectOptions(screen.getByLabelText("前綴數量"), "3");
    expect(screen.getByText("換底")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "已有詞條" }));
    for (const family of prefixes) {
      await user.click(screen.getByRole("checkbox", { name: `${family.textZh} 已有` }));
    }
    expect(screen.getByText("繼續")).toBeInTheDocument();
    await user.selectOptions(activeLibrary().getByLabelText(`最低階級 ${prefixes[0].textZh}`), "");
    expect(screen.getByText("換底")).toBeInTheDocument();
  });
});
