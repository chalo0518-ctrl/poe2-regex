import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import {
  SEASON_BD_V1,
  catalogForDollSlot,
  emptyRecommendedGear,
  recommendedGear,
  showcaseCatalog,
  type BdShowcase,
  type MemorialGear,
  type RecommendedGear,
} from "@poe2-regex/data";
import AppLayout from "../components/AppLayout.tsx";
import { LocaleProvider } from "../i18n.tsx";
import EndgameLayout from "./EndgameLayout.tsx";
import HomePage from "./HomePage.tsx";
import { showcaseRoute } from "./showcaseRoutes.tsx";

function renderAt(path: string, locale: "zh-Hant" | "en" = "zh-Hant", snapshot?: BdShowcase) {
  return render(
    <LocaleProvider initialLocale={locale}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            {showcaseRoute(snapshot)}
          </Route>
        </Routes>
      </MemoryRouter>
    </LocaleProvider>,
  );
}

function slotLink(name: RegExp) {
  return screen.getByRole("link", { name });
}

describe("season BD showcase", () => {
  it("shows the season picker before the archive tabs", async () => {
    const user = userEvent.setup();
    renderAt("/showcase");
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    const filter = within(screen.getByRole("region", { name: "選擇賽季" })).getByRole("combobox", { name: "賽季" });
    await user.selectOptions(filter, "current");
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: /進入賽季回顧/ }));
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
  });

  it("switches two main tabs and does not show them side by side", async () => {
    const user = userEvent.setup();
    renderAt("/showcase/memorial");

    expect(screen.getByRole("link", { name: "賽季回顧" })).toBeInTheDocument();
    const memorial = screen.getByRole("tab", { name: "紀念" });
    const recommended = screen.getByRole("tab", { name: "推薦" });
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(memorial).toHaveAttribute("aria-selected", "true");
    expect(recommended).toHaveAttribute("aria-selected", "false");
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
    expect(screen.getByText("暮色 刃痕")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "基礎珠寶" })).toBeInTheDocument();
    expect(screen.getAllByText("水井之心").length).toBeGreaterThan(0);
    expect(screen.queryByText("empty prefix")).not.toBeInTheDocument();
    expect(slotLink(/主手/)).toHaveAccessibleName(/暮色 刃痕/);
    expect(screen.queryByRole("link", { name: /戒指 3/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /飾品/ })).not.toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "II" })[0]);
    expect(screen.getByText("林木塑像")).toBeInTheDocument();
    expect(screen.queryByText("暮色 刃痕")).not.toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "I" })[0]);
    expect(slotLink(/生命藥劑/)).toBeInTheDocument();
    expect(slotLink(/魔力藥劑/)).toBeInTheDocument();
    expect(slotLink(/咒符 1/)).toBeInTheDocument();
    expect(slotLink(/咒符 2/)).toBeInTheDocument();
    expect(slotLink(/咒符 3/)).toBeInTheDocument();
    expect(screen.queryByText("empty prefix")).not.toBeInTheDocument();
    expect(screen.queryByText("empty suffix")).not.toBeInTheDocument();
    expect(slotLink(/主手/)).toHaveStyle({ gridRow: "2 / 6" });
    expect(slotLink(/手套/)).toHaveStyle({ gridRow: "6 / 8" });
    expect(slotLink(/副手/)).toHaveStyle({ gridRow: "2 / 6" });
    expect(slotLink(/鞋子/)).toHaveStyle({ gridRow: "6 / 8" });
    expect(slotLink(/生命藥劑/)).toHaveStyle({ gridRow: "8 / 10" });
    expect(screen.getByText("5,511")).toBeInTheDocument();
    expect(screen.getByText("Grim Pillars")).toBeInTheDocument();
    expect(screen.getByText("16k")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("推荐");
    expect(document.body.textContent).not.toContain("鑽嵌");
    expect(document.body.textContent).not.toContain("装备");

    await user.click(recommended);
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
    expect(recommended).toHaveAttribute("aria-selected", "true");
    expect(memorial).toHaveAttribute("aria-selected", "false");
    expect(screen.queryByText("尚未抄入")).not.toBeInTheDocument();
    expect(screen.getAllByText("empty prefix").length).toBeGreaterThan(0);
    expect(screen.getAllByText("empty suffix").length).toBeGreaterThan(0);
    expect(screen.queryByRole("tab", { name: /編輯/ })).not.toBeInTheDocument();
  });

  it("opens transcribed memorial gear and leaves ring 3 empty", async () => {
    const user = userEvent.setup();
    renderAt("/showcase/memorial");
    await user.hover(slotLink(/主手/));
    expect(screen.getByRole("dialog", { name: "暮色 刃痕" })).toHaveTextContent("單挑法杖");

    const sockets = screen.getByRole("button", { name: "顯示鑲嵌" });
    await user.click(sockets);
    expect(sockets).toHaveAttribute("aria-pressed", "true");
    expect(within(slotLink(/頭盔/)).getAllByTitle("完美鍛鐵符文")).toHaveLength(1);
    expect(within(slotLink(/頭盔/)).getByTitle("渡鴉碎片").querySelector("img")).not.toBeNull();

    await user.click(slotLink(/頭盔/));
    expect(screen.getByRole("heading", { name: "心靈 堅城" })).toBeInTheDocument();
    expect(screen.getByText("先祖頭冠")).toBeInTheDocument();
    expect(screen.getByText("完美鍛鐵符文")).toBeInTheDocument();
    expect(screen.getByText("已汙染")).toBeInTheDocument();
    expect(screen.getAllByText("增加18%找到的物品稀有度").length).toBeGreaterThan(0);
    expect(screen.queryByText("前綴")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(2);

    await user.click(screen.getByRole("link", { name: "返回我的狀況／紀念" }));
    expect(screen.queryByRole("link", { name: /戒指 3/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /飾品/ })).not.toBeInTheDocument();
  });

  it("lays recorded sockets out like the in-game doll", async () => {
    const user = userEvent.setup();
    renderAt("/showcase/memorial");
    await user.click(screen.getByRole("button", { name: "顯示鑲嵌" }));

    function stack(name: RegExp) {
      const node = slotLink(name).querySelector(".socket-stack");
      if (!node) throw new Error(`missing sockets for ${name}`);
      return node;
    }

    expect(stack(/主手/)).toHaveAttribute("data-layout", "column");
    expect(stack(/主手/)).toHaveAttribute("data-basis", "slot");
    expect(stack(/主手/)).toHaveAttribute("data-fallback", "false");
    expect(stack(/主手/).querySelectorAll(".socket-pip")).toHaveLength(3);
    expect(stack(/副手/)).toHaveAttribute("data-layout", "row");
    expect(stack(/副手/).querySelectorAll(".socket-pip")).toHaveLength(2);
    expect(stack(/頭盔/)).toHaveAttribute("data-layout", "row");
    const helmPips = stack(/頭盔/).querySelectorAll(".socket-pip");
    expect(helmPips).toHaveLength(2);
    expect(stack(/胸甲/)).toHaveAttribute("data-layout", "triangle");
    expect(stack(/胸甲/).querySelectorAll(".socket-pip")).toHaveLength(3);
    expect(stack(/手套/)).toHaveAttribute("data-layout", "row");
    const glovePips = stack(/手套/).querySelectorAll(".socket-pip");
    expect(glovePips).toHaveLength(2);
    const bootPips = stack(/鞋子/).querySelectorAll(".socket-pip");
    expect(stack(/鞋子/)).toHaveAttribute("data-layout", "split");
    expect(bootPips).toHaveLength(2);
    for (const pip of [...glovePips, ...bootPips]) {
      expect(pip).toHaveAttribute("data-cy", "0.5");
      expect(pip).toHaveAttribute("data-d", String(56 / 154));
    }
    expect(glovePips[0]).toHaveAttribute("data-cx", String(38 / 154));
    expect(glovePips[1]).toHaveAttribute("data-cx", String(116 / 154));
    expect(bootPips[0]).toHaveAttribute("data-cx", String(38 / 154));
    expect(bootPips[1]).toHaveAttribute("data-cx", String(116 / 154));
    expect(helmPips[0]).toHaveAttribute("data-cx", String(38 / 154));
    expect(helmPips[0]).toHaveAttribute("data-cy", String(76 / 154));
    expect(helmPips[1]).toHaveAttribute("data-cx", String(116 / 154));
    expect(helmPips[1]).toHaveAttribute("data-cy", String(76 / 154));
    expect(helmPips[0]).toHaveAttribute("title", "完美鍛鐵符文");
    expect(helmPips[1]).toHaveAttribute("title", "渡鴉碎片");
    expect(helmPips[1].querySelector("img")).not.toBeNull();
    const bodyPips = stack(/胸甲/).querySelectorAll(".socket-pip");
    expect(bodyPips[0]).toHaveAttribute("data-cx", String(38 / 154));
    expect(bodyPips[0]).toHaveAttribute("data-cy", String(76 / 232));
    expect(bodyPips[1]).toHaveAttribute("data-cx", String(116 / 154));
    expect(bodyPips[1]).toHaveAttribute("data-cy", String(76 / 232));
    expect(bodyPips[2]).toHaveAttribute("data-cx", String(116 / 154));
    expect(bodyPips[2]).toHaveAttribute("data-cy", String(155 / 232));
    const wandPips = stack(/主手/).querySelectorAll(".socket-pip");
    expect(wandPips[0]).toHaveAttribute("data-cy", String(76 / 308));
    expect(wandPips[1]).toHaveAttribute("data-cy", String(153 / 308));
    expect(wandPips[0]).toHaveAttribute("data-cx", String(77 / 154));
    expect(wandPips[2]).toHaveAttribute("data-cx", String(77 / 154));
    expect(wandPips[2]).toHaveAttribute("data-cy", String(231 / 308));
    for (const pip of [...helmPips, ...bodyPips, ...wandPips, ...stack(/副手/).querySelectorAll(".socket-pip")]) {
      expect(pip).toHaveAttribute("data-d", String(56 / 154));
    }
    expect(bootPips[0]).not.toHaveAttribute("title");
    expect(bootPips[1]).toHaveAttribute("title", "費爾羅的追擊符文");
    expect(slotLink(/鞋子/).textContent).not.toContain("完美鍛鐵符文");
    expect(slotLink(/腰帶/).querySelector(".socket-stack")).toBeNull();
    expect(slotLink(/項鍊/).querySelector(".socket-stack")).toBeNull();

    const thumbnails = () => [...document.querySelectorAll(".ninja-weapon-thumbnail")];
    expect(thumbnails().map((node) => node.getAttribute("data-slot"))).toEqual(["weapon-2-main", "weapon-2-off"]);
    expect(thumbnails().map((node) => node.querySelectorAll(".socket-pip").length)).toEqual([2, 3]);
    expect(thumbnails()[1].querySelector(".socket-pip")).toHaveAttribute("data-d", String(28 / 74));

    await user.click(screen.getAllByRole("button", { name: "II" })[0]);
    expect(thumbnails().map((node) => node.getAttribute("data-slot"))).toEqual(["weapon-1-main", "weapon-1-off"]);
    expect(thumbnails().map((node) => node.querySelectorAll(".socket-pip").length)).toEqual([3, 2]);
    expect(stack(/主手/)).toHaveAttribute("data-layout", "row");
    expect(stack(/主手/).querySelectorAll(".socket-pip")).toHaveLength(2);
    expect(stack(/副手/)).toHaveAttribute("data-layout", "triangle");
    expect(stack(/副手/).querySelectorAll(".socket-pip")).toHaveLength(3);
    const debug = screen.getByRole("button", { name: "孔位除錯" });
    await user.click(debug);
    expect(debug).toHaveAttribute("aria-pressed", "true");
    expect(document.querySelector(".socket-debug")).not.toBeNull();
    await user.click(debug);
    expect(document.querySelector(".socket-debug")).toBeNull();
  });

  it("shows transcribed memorial gear for the clicked slot only", async () => {
    const user = userEvent.setup();
    const body: MemorialGear = {
      nameZh: "測試胸甲",
      nameEn: "Test body",
      imageUrl: "https://poe2db.tw/image/Art/2DItems/body.png",
      baseZh: "專家胸甲",
      baseEn: "Expert Robe",
      implicits: [{ textZh: "+10 護甲", textEn: "+10 to Armour" }],
      affixes: [{ generation: "prefix", textZh: "+80 最大生命", textEn: "+80 to maximum Life" }],
    };
    const snapshot: BdShowcase = { ...SEASON_BD_V1, memorial: { body } };
    renderAt("/showcase/memorial", "zh-Hant", snapshot);

    expect(slotLink(/頭盔/)).toHaveTextContent("尚未抄入");
    expect(screen.queryByRole("img", { name: "測試胸甲" })).toHaveAttribute(
      "src",
      "https://poe2db.tw/image/Art/2DItems/body.png",
    );
    await user.click(slotLink(/測試胸甲/));
    expect(screen.getByRole("heading", { name: "測試胸甲" })).toBeInTheDocument();
    expect(screen.getByText("專家胸甲")).toBeInTheDocument();
    expect(screen.getByText("+10 護甲")).toBeInTheDocument();
    expect(screen.getByText("+80 最大生命")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
  });

  it("drops a poe.ninja image even if one was pasted into the snapshot", () => {
    const helmet: MemorialGear = {
      nameZh: "不採用的圖",
      nameEn: "Rejected art",
      imageUrl: "https://poe.ninja/image/helm.png",
      baseZh: "",
      baseEn: "",
      implicits: [],
      affixes: [],
    };
    renderAt("/showcase/memorial", "zh-Hant", { ...SEASON_BD_V1, memorial: { helmet } });
    expect(screen.getByText("不採用的圖")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("opens a recommended editor that is not a third main tab", async () => {
    const user = userEvent.setup();
    renderAt("/showcase/recommended");

    const helmet = slotLink(/頭盔/);
    expect(within(helmet).getAllByText("empty prefix")).toHaveLength(3);
    expect(within(helmet).getAllByText("empty suffix")).toHaveLength(3);
    expect(within(helmet).getByText("名稱待填")).toBeInTheDocument();
    expect(within(helmet).getByText("固有尚未填入")).toBeInTheDocument();

    await user.click(helmet);
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.getByRole("tab", { name: "推薦" })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("tab", { name: /編輯/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "武器組 I" })).not.toBeInTheDocument();
    expect(screen.getByText("不會寫回網站")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "展開階層" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toEqual([screen.getByRole("combobox", { name: "賽季" })]);

    const prefix = screen.getByRole("region", { name: "前綴" });
    const suffix = screen.getByRole("region", { name: "後綴" });
    expect(within(prefix).getByRole("heading", { name: "必要" })).toBeInTheDocument();
    expect(within(prefix).getByRole("heading", { name: "可選" })).toBeInTheDocument();
    expect(within(suffix).getByRole("heading", { name: "必要" })).toBeInTheDocument();
    expect(within(suffix).getByRole("heading", { name: "可選" })).toBeInTheDocument();

    const catalog = catalogForDollSlot("helmet", recommendedGear(SEASON_BD_V1, "helmet"));
    expect(within(prefix).getAllByRole("checkbox", { name: /^必要 / })).toHaveLength(
      catalog.filter((family) => family.generation === "prefix").length,
    );
    const life = catalog.find((family) => family.family === "IncreasedLife");
    if (!life) throw new Error("missing IncreasedLife");
    const lifeRow = document.querySelector(`[data-affix-id="${CSS.escape(life.id)}"]`);
    if (!(lifeRow instanceof HTMLElement)) throw new Error("missing life row");
    expect(within(prefix).getByRole("checkbox", { name: `必要 ${life.matchZh}` })).toBeInTheDocument();
    expect(within(suffix).queryByRole("checkbox", { name: `必要 ${life.matchZh}` })).not.toBeInTheDocument();
    expect(lifeRow.textContent).not.toContain("健壯之");

    await user.click(within(lifeRow).getByRole("checkbox", { name: `必要 ${life.matchZh}` }));
    await user.click(screen.getByRole("link", { name: "返回推薦／攻略" }));

    const updated = slotLink(/頭盔/);
    expect(within(updated).getByText(life.matchZh)).toBeInTheDocument();
    expect(within(updated).getAllByText("empty prefix")).toHaveLength(2);
    expect(within(updated).getAllByText("empty suffix")).toHaveLength(3);
    expect(within(updated).queryByText("健壯之")).not.toBeInTheDocument();
  });

  it("stops at three prefixes and filters the editor by the recorded base", async () => {
    const user = userEvent.setup();
    const gear: RecommendedGear = {
      ...emptyRecommendedGear(),
      nameZh: "力量胸甲",
      nameEn: "Strength body",
      imageUrl: "https://poe2db.tw/image/Art/2DItems/body.png",
      baseZh: "護甲基底",
      baseEn: "Armour base",
      implicits: [{ textZh: "+20 護甲", textEn: "+20 to Armour" }],
      craftSlot: "body",
      basePoolId: "str",
    };
    renderAt("/showcase/recommended", "zh-Hant", {
      ...SEASON_BD_V1,
      recommended: { body: gear },
    });

    const body = slotLink(/力量胸甲/);
    expect(within(body).getByRole("img", { name: "力量胸甲" })).toHaveAttribute(
      "src",
      "https://poe2db.tw/image/Art/2DItems/body.png",
    );
    expect(within(body).getByText("+20 護甲")).toBeInTheDocument();
    expect(within(body).getByText("護甲基底")).toBeInTheDocument();

    await user.click(body);
    const catalog = showcaseCatalog("body", "str");
    const prefix = screen.getByRole("region", { name: "前綴" });
    expect(within(prefix).getAllByRole("checkbox", { name: /^必要 / })).toHaveLength(
      catalog.filter((family) => family.generation === "prefix").length,
    );
    const distinct = distinctPrefixes(catalog, 4);
    for (const family of distinct.slice(0, 3)) {
      const row = affixRow(family.id);
      await user.click(within(row).getByRole("checkbox", { name: `必要 ${family.matchZh}` }));
    }
    const blocked = affixRow(distinct[3].id);
    expect(within(blocked).getByRole("checkbox", { name: `必要 ${distinct[3].matchZh}` })).toBeDisabled();
  });

  it("does not invent affixes for a weapon slot that has no class yet", () => {
    renderAt("/showcase/recommended/weapon-1-main");
    expect(screen.getByText("這個部位還沒有對上的做裝詞庫")).toBeInTheDocument();
    const prefix = screen.getByRole("region", { name: "前綴" });
    expect(within(prefix).queryAllByRole("checkbox")).toHaveLength(0);
    expect(within(prefix).getAllByText("empty prefix")).toHaveLength(3);
    expect(screen.getByRole("region", { name: "後綴" }).textContent).toContain("empty suffix");
  });

  it("uses English chrome without simplified Chinese", async () => {
    const user = userEvent.setup();
    renderAt("/showcase/memorial", "en");
    expect(screen.getByRole("tab", { name: "Memorial" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Recommended" })).toBeInTheDocument();
    expect(screen.getByText("Dusk Scratch")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("推荐");
    await user.click(screen.getByRole("tab", { name: "Recommended" }));
    expect(screen.getAllByText("Name not set").length).toBeGreaterThan(0);
    expect(screen.getAllByText("empty prefix").length).toBeGreaterThan(0);
  });

  it("only links season recap and equipment crafting from the preview home", () => {
    renderAt("/");
    const links = screen.getAllByRole("link", { name: /賽季回顧/ });
    expect(links.length).toBeGreaterThan(0);
    expect(links.every((link) => link.getAttribute("href") === "/showcase")).toBe(true);
    expect(screen.getAllByRole("link", { name: /裝備製作/ }).every((link) => link.getAttribute("href") === "/endgame/crafting")).toBe(true);
    expect(document.querySelector('a[href="/early"], a[href="/endgame"]')).toBeNull();
  });

  it("keeps equipment crafting linked in the endgame navigation", () => {
    render(
      <LocaleProvider initialLocale="zh-Hant">
        <MemoryRouter initialEntries={["/endgame/waystones"]}>
          <Routes>
            <Route path="endgame" element={<EndgameLayout />}>
              <Route path="waystones" element={<p>換界石頁</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </LocaleProvider>,
    );
    expect(screen.getByRole("link", { name: "裝備製作" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "換界石" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "碑牌" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "紀念" })).not.toBeInTheDocument();
  });
});

function affixRow(id: string) {
  const node = document.querySelector(`[data-affix-id="${CSS.escape(id)}"]`);
  if (!(node instanceof HTMLElement)) throw new Error(`missing affix row ${id}`);
  return node;
}

function distinctPrefixes(catalog: ReturnType<typeof showcaseCatalog>, limit: number) {
  const picked = [];
  const seen = new Set<string>();
  for (const family of catalog) {
    if (family.generation !== "prefix" || seen.has(family.family)) continue;
    seen.add(family.family);
    picked.push(family);
    if (picked.length === limit) return picked;
  }
  throw new Error(`need ${limit} prefixes`);
}
