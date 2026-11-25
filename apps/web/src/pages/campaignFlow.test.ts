import { describe, expect, it } from "vitest";
import { CAMPAIGN_GAPS, campaignChapters, type ChapterId } from "@poe2-regex/data";
import {
  CAMPAIGN_FLOW_INTRO,
  CAMPAIGN_FLOW_TITLE,
  campaignFlowFor,
  campaignFlows,
  campaignFlowText,
} from "./campaignFlow.ts";

const PRIORITY = "（優先）";

function text(id: ChapterId) {
  return campaignFlowText(campaignFlowFor(id));
}

function stepNames(id: ChapterId) {
  return campaignFlowFor(id).steps.map((step) => step.name ?? step.text);
}

describe("locked early campaign flow", () => {
  it("keeps the shop catalog empty of per-map regexes", () => {
    expect(campaignChapters.map((chapter) => chapter.id)).toEqual([
      "act-1",
      "act-2",
      "act-3",
      "act-4",
      "act-5",
    ]);
    expect(campaignChapters.map((chapter) => chapter.labelZh)).toEqual([
      "第一章",
      "第二章",
      "第三章",
      "第四章",
      "第五章",
    ]);
    for (const chapter of campaignChapters) expect(chapter.maps).toEqual([]);
    expect(CAMPAIGN_GAPS.some((gap) => gap.includes("不是每張地圖一組"))).toBe(true);
    expect(campaignFlows.map((flow) => flow.id)).toEqual([
      "act-1",
      "act-2",
      "act-3",
      "act-4",
      "act-5",
    ]);
    expect(CAMPAIGN_FLOW_TITLE).toBe("開荒流程");
  });

  it("marks 優先 only on the three resists and the spirit rewards", () => {
    const all = campaignFlows.map((flow) => campaignFlowText(flow)).join("\n");
    expect(all.split(PRIORITY).length - 1).toBe(6);
    expect(text("act-1")).toContain("皆伐（Clearfell）");
    expect(text("act-1")).toContain("+10% 冰冷抗性（優先）。");
    expect(text("act-1")).toContain("弗雷索恩（Freythorn）");
    expect(text("act-1")).toContain("+30 精魂（優先）。");
    expect(text("act-2")).toContain("戴斯哈尖塔");
    expect(text("act-2")).toContain("+10% 閃電抗性（優先）。");
    expect(text("act-3")).toContain("吉卡尼的機械迷城");
    expect(text("act-3")).toContain("+10% 火焰抗性（優先）。");
    expect(text("act-3")).toContain("阿札克泥沼");
    expect(text("act-3")).toContain("+30 精魂（優先）。");
    expect(text("act-5")).toContain("庫萊亞村擊敗迷失長矛．萊塔拉，+40 精魂（優先）。");
    expect(text("act-4")).not.toContain(PRIORITY);
    expect(all).toContain("這不是永久主線獎勵。");
    expect(all).toContain("優先把地圖和要塞任務推開");
  });

  it("follows the locked main-story order and keeps corrected names", () => {
    expect(CAMPAIGN_FLOW_INTRO[0]).toContain("再打三個間章（編年史作「間歇」）");
    expect(CAMPAIGN_FLOW_INTRO[0]).toContain("1.0 預定 2026-12-11 會拿掉間章、補上第五、六章");
    expect(text("act-5")).toContain("第五章分頁（間章／間歇）");
    expect(text("act-5")).not.toContain("1.0 的第五章");

    expect(stepNames("act-1")).toEqual([
      "皆伐（Clearfell）",
      "葛瑞爾林（The Grelwood）",
      "獵場（Hunting Grounds）",
      "弗雷索恩（Freythorn）",
      "奧格姆農地",
      "奧格姆村",
      "奧格姆宅第",
    ]);
    const grelwood = campaignFlowFor("act-1").steps[1]?.text ?? "";
    expect(grelwood.indexOf("赤谷（Red Vale）")).toBeLessThan(grelwood.indexOf("攝魂之樹"));
    expect(grelwood.indexOf("攝魂之樹")).toBeLessThan(grelwood.indexOf("纏縛陰林（Grim Tangle）"));
    expect(text("act-1")).toContain("鴉鈴（Crowbell，+2 武器套點）");
    expect(text("act-1")).toContain("跟隨移動的蝗蟲");

    expect(stepNames("act-2")).toEqual([
      "叛徒之路（Traitor’s Passage）",
      "凱斯城",
      "乳齒象惡地（Mastodon Badlands）",
      "泰坦之谷（Valley of the Titans）",
      "戴斯哈（Deshar）",
      "戴斯哈尖塔",
      "絲克瑪試煉",
    ]);
    expect(text("act-2")).toContain("在岔路尋找馬拉克斯卷軸標記。找叛徒．芭芭拉（Balbala）");
    expect(text("act-2")).toContain("地面裂縫通往無光通道／靈魂之井");

    expect(stepNames("act-3")[0]).toBe(
      "遇到探險者時先交談，打開小地圖，依對話新增的標記前往下一區。",
    );
    expect(stepNames("act-3").slice(1)).toEqual([
      "叢林遺跡",
      "劇毒墓穴",
      "龍蜥濕地",
      "吉卡尼的機械迷城",
      "瑪特蘭水道",
      "阿札克泥沼",
      "熔岩寶庫",
      "阿戈拉",
    ]);
    expect(text("act-3")).toContain("取得最後通牒雕刻，可開混沌試煉");
    expect(text("act-3")).toContain("擊敗遺忘的黑顎");
    expect(text("act-3")).toContain("由此岔出阿札克泥沼");
    expect(text("act-3")).toContain("完成血犧，+2 武器套點。");

    const act4 = text("act-4");
    const fragment = act4.indexOf("金氏島、凱吉灣、瓦卡帕努島、伯勞鳥之島");
    const outpost = act4.indexOf("進入荒廢哨站完成「符文探求者」，解鎖維里西姆鐵砧");
    expect(fragment).toBeGreaterThan(-1);
    expect(outpost).toBeGreaterThan(fragment);
    expect(stepNames("act-4")).toEqual([
      "金氏島",
      "瓦卡帕努島",
      "廢棄監獄",
      "悉妮蔻拉之眼",
      "亡者之殿",
      "旅程之末",
      "部族之心",
    ]);
    expect(act4).toContain("鯊魚鰭");
    expect(act4).toContain("岡姆的教誨");
    expect(act4).toContain("萊基亞塔的教誨");

    expect(stepNames("act-5")).toEqual([
      "霍爾登的詛咒",
      "被偷的巨靈之幣",
      "多里亞尼的意外事件",
    ]);
    expect(text("act-5")).toContain("狂嗥洞穴擊敗怪異雪獸");

    const all = campaignFlows.map((flow) => campaignFlowText(flow)).join("\n");
    for (const stale of [
      "隨機地圖辨位",
      "葛瑞爾森林",
      "紅谷",
      "靈魂之樹",
      "狩獵場",
      "蜇蟲",
      "叛徒通道",
      "尔",
      "試練",
      "符文求求者",
      "維里西姆鐵砠",
      "維里西姆鐵砣",
      "維里西姆鐵砢",
      "最後通牖",
      "最後通牘",
      "黑頾",
      "黑頞",
      "血狠",
      "血狛",
      "鯊魚鰍",
      "鯊魚鱅",
      "崑姆",
      "教誦",
      "悉妮藻拉",
      "狂嗤",
      "狂嗍",
      "程序猳",
    ]) {
      expect(all, stale).not.toContain(stale);
    }
  });

  it("keeps a source link at each chapter foot", () => {
    expect(campaignFlowFor("act-1").sources.map((source) => source.label)).toEqual([
      "0.5 版地標紀錄",
      "森林跑圖示範",
      "編年史第 1 章",
    ]);
    expect(campaignFlowFor("act-2").sources.map((source) => source.href)).toContain(
      "https://poe2db.tw/tw/Act_2",
    );
    expect(campaignFlowFor("act-2").footnote).toContain("乳齒象惡地裂縫");
    expect(campaignFlowFor("act-4").sources.map((source) => source.href)).toContain(
      "https://poe2db.tw/tw/The_Runeseeker",
    );
    expect(campaignFlowFor("act-5").sources[0]?.href).toBe("https://poe2db.tw/tw/Interlude");
  });
});
