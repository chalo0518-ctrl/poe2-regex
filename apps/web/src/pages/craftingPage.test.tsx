import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { craftTierChoices, earlyGearFamiliesFor } from "@poe2-regex/data";
import EndgameLayout from "./EndgameLayout.tsx";
import CraftingPage from "./CraftingPage.tsx";
import { LocaleProvider } from "../i18n.tsx";

function renderCrafting() {
  return render(
    <LocaleProvider initialLocale="zh-Hant">
      <MemoryRouter initialEntries={["/endgame/crafting"]}>
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

function targetRegion() {
  return screen.getByRole("region", { name: "目標詞綴" });
}

function lifeRow() {
  const life = lifeFamily();
  const row = within(targetRegion()).getByText(life.textZh).closest("li");
  if (!row) throw new Error("life row missing");
  return row as HTMLElement;
}

describe("crafting page", () => {
  it("walks slot, tree, desecration lock, keeper fallback, and a chosen-tier rebase", async () => {
    const user = userEvent.setup();
    renderCrafting();

    expect(screen.getByRole("link", { name: "做裝" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "胸甲" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: "戒指" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "力量" })).not.toBeInTheDocument();
    expect(screen.getByText("craft-caps-v1")).toBeInTheDocument();
    expect(screen.getAllByText(/每件只能有 1 條工藝詞綴/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/重組器不在這條主路線/).length).toBeGreaterThan(0);
    expect(screen.getByText("倉庫正則（刷這個基底／這些目標）")).toBeInTheDocument();
    expect(screen.getByLabelText("搜尋詞綴")).toBeInTheDocument();
    expect(screen.getByLabelText("破潰石鎖定的詞條")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "是" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "或" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "否" })).not.toBeInTheDocument();
    expect(screen.queryByText(/可接受/)).not.toBeInTheDocument();
    expect(screen.queryByText(/acceptable/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "简中匹配" })).not.toBeInTheDocument();
    expect(screen.queryByText("继续")).not.toBeInTheDocument();
    expect(screen.queryByText("换底")).not.toBeInTheDocument();

    const desecrate = screen.getByRole("button", { name: /褻瀆分支/ });
    expect(desecrate).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByText(/少花光明之兆/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Absent、Portent 項鍊與 Dusk 戒指/).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /選底/ }));
    expect(screen.getAllByText(/骰不到所選階級就是換底/).length).toBeGreaterThan(0);

    await user.selectOptions(screen.getByLabelText("後綴數量"), "2");
    await user.click(screen.getByRole("checkbox", { name: "目標側有 1 條要留下的破裂" }));
    await user.selectOptions(screen.getByLabelText("破潰石鎖定的詞條"), "目標以外的詞條");

    expect(screen.getByText("繼續（精髓／合金頂掉後重褻瀆）")).toBeInTheDocument();
    expect(screen.getByText(/先不要花光明之兆/)).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "工藝槽已是要永久留下的詞綴" }));
    expect(screen.getByText("繼續（改用光明之兆一輪清理）")).toBeInTheDocument();
    expect(screen.queryByText("繼續（精髓／合金頂掉後重褻瀆）")).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "工藝槽已是要永久留下的詞綴" }));
    const life = lifeFamily();
    const row = lifeRow();
    await user.click(within(row).getByRole("checkbox", { name: `目標 ${life.textZh}` }));
    const top = craftTierChoices(life)[0];
    expect(top).toBeTruthy();
    await user.selectOptions(within(row).getByRole("combobox"), String(top!.index));
    await user.type(screen.getByLabelText("物品等級"), "1");

    expect(screen.getByText("換底")).toBeInTheDocument();
    expect(screen.getByText(/所選階級高過這件的物品等級/)).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /預算緊/ }));
    expect(screen.getByText("換底")).toBeInTheDocument();
    expect(screen.getByText("你勾了預算緊。判定沒有因此改變。")).toBeInTheDocument();
  });

  it("lets a checked target take a minimum tier and treats a locked target as on the item", async () => {
    const user = userEvent.setup();
    renderCrafting();
    const life = lifeFamily();
    const top = craftTierChoices(life)[0];
    expect(top?.statMin).toBeGreaterThan(1);

    await user.click(within(lifeRow()).getByRole("checkbox", { name: `目標 ${life.textZh}` }));
    const pattern = () => document.querySelector(".font-mono.text-gold")?.textContent ?? "";
    const open = pattern();
    expect(open).toContain("最大生命");
    expect(open).not.toMatch(/\\d/);

    await user.type(screen.getByLabelText("物品等級"), "1");
    expect(screen.queryByText("換底")).not.toBeInTheDocument();

    await user.selectOptions(within(lifeRow()).getByRole("combobox"), String(top!.index));
    const bounded = pattern();
    expect(bounded).toContain("最大生命");
    expect(bounded).not.toBe(open);
    expect(bounded).toMatch(/\\d/);
    expect(screen.getByText("換底")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("物品等級"));
    await user.selectOptions(screen.getByLabelText("前綴數量"), "2");
    await user.click(screen.getByRole("checkbox", { name: "目標側有 1 條要留下的破裂" }));
    await user.selectOptions(screen.getByLabelText("破潰石鎖定的詞條"), "目標以外的詞條");
    expect(screen.getByText("繼續（精髓／合金頂掉後重褻瀆）")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("破潰石鎖定的詞條"), life.textZh);
    expect(screen.getByText("繼續")).toBeInTheDocument();
    expect(screen.queryByText("繼續（精髓／合金頂掉後重褻瀆）")).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: `${life.textZh} 已有` })).toBeChecked();
  });
});
