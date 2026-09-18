import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { campaignChapters, shopModById } from "@poe2-regex/data";
import { matchesItem } from "@poe2-regex/regex";
import ChaptersPage from "./ChaptersPage.tsx";
import VendorPage from "./VendorPage.tsx";
import BuildsPage from "./BuildsPage.tsx";
import { LocaleProvider } from "../i18n.tsx";

function renderEarly(ui: ReactElement, path = "/early/chapters") {
  return render(
    <LocaleProvider initialLocale="zh-Hans">
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </LocaleProvider>,
  );
}

describe("early chapters page", () => {
  it("surfaces chapter shop defaults instead of an empty placeholder", () => {
    renderEarly(<ChaptersPage />);

    expect(screen.getByRole("tab", { name: /第一章/ })).toBeInTheDocument();
    expect(screen.queryByText("内容稍后填入")).not.toBeInTheDocument();
    expect(screen.queryByText(/章节关卡与商店节点稍后填入/)).not.toBeInTheDocument();

    expect(screen.getByText(shopModById("life").textZhHans!)).toBeInTheDocument();
    expect(screen.getByText(shopModById("movement_speed").textZhHans!)).toBeInTheDocument();
    expect(screen.queryByText(shopModById("life").labelZh)).not.toBeInTheDocument();
    expect(screen.queryByText("生命")).not.toBeInTheDocument();
    expect(screen.getAllByText("正则包含")).toHaveLength(
      campaignChapters[0].defaultPicks.length,
    );

    const output = document.querySelector(".font-mono.text-gold");
    expect(output?.textContent).toBeTruthy();
    expect(output?.textContent).not.toContain("点选词缀列");

    const pattern = output?.textContent ?? "";
    expect(matchesItem(pattern, "+15 生命上限")).toBe(true);
    expect(matchesItem(pattern, "移动速度提高 10%")).toBe(true);
    expect(matchesItem(pattern, "火焰抗性 +10%")).toBe(false);
  });

  it("switches default includes when another chapter is selected", async () => {
    const user = userEvent.setup();
    renderEarly(<ChaptersPage />);

    expect(screen.getAllByText("正则包含")).toHaveLength(
      campaignChapters[0].defaultPicks.length,
    );

    await user.click(screen.getByRole("tab", { name: /第二章/ }));
    expect(screen.getByText(shopModById("fire_res").textZhHans!)).toBeInTheDocument();
    expect(screen.getAllByText("正则包含")).toHaveLength(
      campaignChapters[1].defaultPicks.length,
    );
  });
});

describe("early vendor page", () => {
  it("loads the same chapter defaults and keeps include/exclude editing", async () => {
    const user = userEvent.setup();
    renderEarly(<VendorPage />, "/early/vendor");

    expect(screen.queryByText("内容稍后填入")).not.toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "章节" })).toBeInTheDocument();
    expect(screen.getAllByText("正则包含").length).toBeGreaterThan(0);

    await user.click(screen.getByText(shopModById("life").textZhHans!));
    expect(screen.getByText("正则排除")).toBeInTheDocument();
  });

  it("honours ?chapter= query when opening the shop page", () => {
    renderEarly(<VendorPage />, "/early/vendor?chapter=act-4");
    expect(screen.getByRole("tab", { name: /第四章/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText(shopModById("chaos_res").textZhHans!)).toBeInTheDocument();
    expect(screen.getAllByText("正则包含")).toHaveLength(
      campaignChapters.find((c) => c.id === "act-4")?.defaultPicks.length ?? -1,
    );
  });
});

describe("early builds page stays a placeholder", () => {
  it("does not pretend to ship build presets", () => {
    renderEarly(<BuildsPage />, "/early/builds");
    expect(screen.getByText("流派推荐装备")).toBeInTheDocument();
    expect(screen.getByText("内容稍后填入")).toBeInTheDocument();
  });
});
