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
  it("switches two main tabs and does not show them side by side", async () => {
    const user = userEvent.setup();
    renderAt("/showcase/memorial");

    expect(screen.getByRole("link", { name: "賽季 BD" })).toBeInTheDocument();
    const memorial = screen.getByRole("tab", { name: "我的狀況／紀念" });
    const recommended = screen.getByRole("tab", { name: "推薦／攻略" });
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(memorial).toHaveAttribute("aria-selected", "true");
    expect(recommended).toHaveAttribute("aria-selected", "false");
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "武器組 I" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "武器組 II" })).toBeInTheDocument();
    expect(slotLink(/武器組 I 主手/)).toBeInTheDocument();
    expect(slotLink(/武器組 I 副手/)).toBeInTheDocument();
    expect(slotLink(/武器組 II 主手/)).toBeInTheDocument();
    expect(slotLink(/武器組 II 副手/)).toBeInTheDocument();
    expect(slotLink(/生命藥劑/)).toBeInTheDocument();
    expect(slotLink(/魔力藥劑/)).toBeInTheDocument();
    expect(slotLink(/咒符 1/)).toBeInTheDocument();
    expect(slotLink(/咒符 2/)).toBeInTheDocument();
    expect(slotLink(/咒符 3/)).toBeInTheDocument();
    expect(screen.getAllByText("尚未抄入").length).toBeGreaterThan(0);
    expect(screen.queryByText("empty prefix")).not.toBeInTheDocument();
    expect(screen.queryByText("empty suffix")).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain("推荐");
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

  it("keeps the memorial empty until a snapshot is transcribed", async () => {
    const user = userEvent.setup();
    renderAt("/showcase/memorial");
    await user.click(slotLink(/頭盔/));
    expect(screen.getByRole("heading", { name: "頭盔" })).toBeInTheDocument();
    expect(screen.getByText("尚未抄入")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByText("empty prefix")).not.toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
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
    expect(screen.getByRole("tab", { name: "推薦／攻略" })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("tab", { name: /編輯/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "武器組 I" })).not.toBeInTheDocument();
    expect(screen.getByText("不會寫回網站")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "展開階層" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();

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
    expect(screen.getByRole("tab", { name: "My setup / Memorial" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Guide / Recommended" })).toBeInTheDocument();
    expect(screen.getAllByText("Not transcribed").length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toContain("推荐");
    await user.click(screen.getByRole("tab", { name: "Guide / Recommended" }));
    expect(screen.getAllByText("Name not set").length).toBeGreaterThan(0);
    expect(screen.getAllByText("empty prefix").length).toBeGreaterThan(0);
  });

  it("links the module from the home page", () => {
    renderAt("/");
    const links = screen.getAllByRole("link", { name: /賽季 BD/ });
    expect(links.length).toBeGreaterThan(0);
    expect(links.every((link) => link.getAttribute("href") === "/showcase")).toBe(true);
  });

  it("leaves the endgame crafting navigation unchanged", () => {
    render(
      <LocaleProvider initialLocale="zh-Hant">
        <MemoryRouter initialEntries={["/endgame/crafting"]}>
          <Routes>
            <Route path="endgame" element={<EndgameLayout />}>
              <Route path="crafting" element={<p>做裝頁</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </LocaleProvider>,
    );
    expect(screen.getByRole("link", { name: "做裝" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "換界石" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "碑牌" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "我的狀況／紀念" })).not.toBeInTheDocument();
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
