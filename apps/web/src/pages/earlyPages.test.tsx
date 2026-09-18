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
    <LocaleProvider initialLocale="zh-Hant">
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </LocaleProvider>,
  );
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
    expect(screen.getAllByText("正則包含")).toHaveLength(
      campaignChapters[0].defaultPicks.length,
    );

    const output = document.querySelector(".font-mono.text-gold");
    expect(output?.textContent).toBeTruthy();
    expect(output?.textContent).not.toContain("點選詞綴列");

    const pattern = output?.textContent ?? "";
    expect(matchesItem(pattern, "+15最大生命")).toBe(true);
    expect(matchesItem(pattern, "增加10%移動速度")).toBe(true);
    expect(matchesItem(pattern, "+10%火焰抗性")).toBe(false);
  });

  it("switches default includes when another chapter is selected", async () => {
    const user = userEvent.setup();
    renderEarly(<ChaptersPage />);

    expect(screen.getAllByText("正則包含")).toHaveLength(
      campaignChapters[0].defaultPicks.length,
    );

    await user.click(screen.getByRole("tab", { name: /第二章/ }));
    expect(screen.getByText(shopModById("fire_res").textZh)).toBeInTheDocument();
    expect(screen.getAllByText("正則包含")).toHaveLength(
      campaignChapters[1].defaultPicks.length,
    );
  });
});

describe("early vendor page", () => {
  it("loads the same chapter defaults and keeps include/exclude editing", async () => {
    const user = userEvent.setup();
    renderEarly(<VendorPage />, "/early/vendor");

    expect(screen.queryByText("內容稍後填入")).not.toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "章節" })).toBeInTheDocument();
    expect(screen.getAllByText("正則包含").length).toBeGreaterThan(0);

    await user.click(screen.getByText(shopModById("life").textZh));
    expect(screen.getByText("正則排除")).toBeInTheDocument();
  });

  it("honours ?chapter= query when opening the shop page", () => {
    renderEarly(<VendorPage />, "/early/vendor?chapter=act-4");
    expect(screen.getByRole("tab", { name: /第四章/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText(shopModById("chaos_res").textZh)).toBeInTheDocument();
    expect(screen.getAllByText("正則包含")).toHaveLength(
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
