import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { campaignChapters, shopModById } from "@poe2-regex/data";
import { matchesItem } from "@poe2-regex/regex";
import BuildsPage from "./BuildsPage.tsx";
import ChaptersPage from "./ChaptersPage.tsx";
import EarlyGearPage, { EarlyGearShieldsRedirect } from "./EarlyGearPage.tsx";
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
});

describe("early vendor page", () => {
  it("loads the same chapter defaults and keeps include/exclude editing", async () => {
    const user = userEvent.setup();
    renderEarly(<VendorPage />, "/early/vendor");

    expect(screen.queryByText("內容稍後填入")).not.toBeInTheDocument();
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

describe("early builds page stays a placeholder", () => {
  it("does not pretend to ship build presets", () => {
    renderEarly(<BuildsPage />, "/early/builds");
    expect(screen.getByText("流派推薦裝備")).toBeInTheDocument();
    expect(screen.getByText("內容稍後填入")).toBeInTheDocument();
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
    expect(screen.getByRole("option", { name: "頭盔" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "手套" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "鞋子" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "戒指" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "項鍊" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "腰帶" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "單手錘" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "盾牌" })).toBeInTheDocument();
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
