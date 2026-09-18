import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import TabletsPage from "./TabletsPage.tsx";
import WaystonesPage from "./WaystonesPage.tsx";
import ShieldsDemo from "./ShieldsDemo.tsx";

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
  expect(screen.getByRole("button", { name: "繁中匹配" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "EN match" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "重置" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "複製" })).toBeInTheDocument();
}

describe("endgame tablets page", () => {
  it("keeps kind picker, hides harvest/filter chrome, and lists effects without family names", async () => {
    const user = userEvent.setup();
    render(<TabletsPage />);

    expect(screen.getByRole("listbox", { name: "碑牌種類" })).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: /裂痕碑牌/ }));

    expectEndgameChromeGone();
    expectRegexTools();
    expect(screen.queryAllByText("司庫的")).toHaveLength(0);
    expect(screen.queryAllByText("Treasurer's", { exact: false })).toHaveLength(0);
    expect(screen.queryAllByText("召喚師的")).toHaveLength(0);
    expect(screen.getByText("地圖內含有額外的(2—3)個稀有箱子")).toBeInTheDocument();
    expect(screen.getByText("地圖內含有額外的1個召喚法陣")).toBeInTheDocument();
    expect(screen.queryAllByText("召喚物")).toHaveLength(0);
  });
});

describe("endgame waystones page", () => {
  it("keeps tier picker and hides harvest/filter chrome and family names", () => {
    render(<WaystonesPage />);

    expect(screen.getByRole("tablist", { name: "換界石階級" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "低階" })).toBeInTheDocument();
    expectEndgameChromeGone();
    expectRegexTools();
    expect(screen.queryAllByText("強韌的")).toHaveLength(0);
    expect(screen.queryAllByText("Tough", { exact: false })).toHaveLength(0);
    expect(
      screen.getByText(/更多怪物生命/, { exact: false }),
    ).toBeInTheDocument();
  });
});

describe("early shields demo stays full chrome", () => {
  it("still shows tags, filter, import, hide toggle, and family names", () => {
    render(<ShieldsDemo />);

    expect(screen.getAllByRole("button", { name: "火焰" }).length).toBeGreaterThan(0);
    expect(screen.getByText("Filter:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "匯入物品" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "切換隱藏" })).toBeInTheDocument();
    expect(screen.getByText("多刺的")).toBeInTheDocument();
  });
});
