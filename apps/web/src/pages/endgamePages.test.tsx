import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
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
  });
});

describe("endgame waystones page", () => {
  it("keeps tier picker and hides harvest/filter chrome and family names", () => {
    renderPage(<WaystonesPage />);

    expect(screen.getByRole("tablist", { name: "換界石階級" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "低階" })).toBeInTheDocument();
    expectEndgameChromeGone();
    expectRegexTools();
    expect(screen.queryAllByText("強韌的")).toHaveLength(0);
    expect(screen.queryAllByText("Tough", { exact: false })).toHaveLength(0);
    expect(screen.getByText(/更多怪物生命/)).toBeInTheDocument();
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
