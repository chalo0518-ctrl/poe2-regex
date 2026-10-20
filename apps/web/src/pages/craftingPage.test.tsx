import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { earlyGearFamiliesFor } from "@poe2-regex/data";
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

describe("crafting page", () => {
  it("walks slot, tree, overwrite verdict, keeper fallback, and an item level rebase", async () => {
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
    expect(screen.queryByRole("button", { name: "简中匹配" })).not.toBeInTheDocument();
    expect(screen.queryByText("继续")).not.toBeInTheDocument();
    expect(screen.queryByText("换底")).not.toBeInTheDocument();

    const desecrate = screen.getByRole("button", { name: /褻瀆分支/ });
    expect(desecrate).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByText(/少花光明之兆/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Absent、Portent 項鍊與 Dusk 戒指/).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /選底/ }));
    expect(screen.getAllByText(/骰不到最高階就是換底/).length).toBeGreaterThan(0);

    await user.selectOptions(screen.getByLabelText("後綴數量"), "2");
    await user.click(screen.getByRole("checkbox", { name: "目標側有 1 條要留下的破裂" }));
    await user.click(screen.getByRole("checkbox", { name: "已有褻瀆詞綴" }));

    expect(screen.getByText("繼續（精髓／合金頂掉後重褻瀆）")).toBeInTheDocument();
    expect(screen.getByText(/先不要花光明之兆/)).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "工藝槽已是要永久留下的詞綴" }));
    expect(screen.getByText("繼續（改用光明之兆一輪清理）")).toBeInTheDocument();
    expect(screen.queryByText("繼續（精髓／合金頂掉後重褻瀆）")).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "工藝槽已是要永久留下的詞綴" }));
    const life = earlyGearFamiliesFor("body").find((family) => family.family === "IncreasedLife");
    expect(life).toBeTruthy();
    const row = screen.getByText(life!.textZh).closest("li");
    expect(row).toBeTruthy();
    await user.click(within(row as HTMLElement).getByRole("button", { name: "是" }));
    await user.type(screen.getByLabelText("物品等級"), "1");

    expect(screen.getByText("換底")).toBeInTheDocument();
    expect(screen.getByText(/最高階高過這件的物品等級/)).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /預算緊/ }));
    expect(screen.getByText("換底")).toBeInTheDocument();
    expect(screen.getByText("你勾了預算緊。判定沒有因此改變。")).toBeInTheDocument();
  });
});
