import { describe, expect, it } from "vitest";
import { CAMPAIGN_GAPS, campaignChapters } from "@poe2-regex/data";
import {
  EARLY_TIPS_COLUMNS,
  EARLY_TIPS_INTRO,
  earlyTipRows,
  filterEarlyTips,
} from "./earlyTips.ts";

const MAPS = [
  "皆伐（Clearfell）",
  "葛瑞爾林（The Grelwood）",
  "獵場（Hunting Grounds）",
  "鴉鈴（Crowbell）",
  "弗雷索恩（Freythorn）",
  "奧格姆農地",
  "奧格姆村",
  "奧格姆宅第",
  "叛徒之路（Traitor’s Passage）",
  "凱斯城",
  "乳齒象惡地（Mastodon Badlands）",
  "泰坦之谷（Valley of the Titans）",
  "戴斯哈（Deshar）",
  "戴斯哈尖塔",
  "絲克瑪試煉",
  "本章說明",
  "叢林遺跡",
  "劇毒墓穴",
  "龍蜥濕地",
  "吉卡尼的機械迷城",
  "瑪特蘭水道",
  "阿札克泥沼",
  "熔岩寶庫",
  "阿戈拉",
  "本章說明",
  "符文探求者",
  "金氏島",
  "瓦卡帕努島",
  "廢棄監獄",
  "悉妮蔻拉之眼",
  "亡者之殿",
  "旅程之末",
  "部族之心",
  "本章說明",
  "狼之要塞（霍爾登的詛咒）",
  "卡里交匯道（被偷的巨靈之幣）",
  "熔岩神殿",
  "奇瑪",
  "灰燼森林（多里亞尼的意外事件）",
  "庫萊亞村",
  "狂嗥洞穴",
  "金司馬區",
  "終局銜接",
];

describe("early tips table", () => {
  it("keeps the locked columns, order, and priority marks", () => {
    expect(EARLY_TIPS_COLUMNS).toEqual(["章節", "地圖", "技巧／地標", "獎勵或設施", "優先"]);
    expect(earlyTipRows.map((row) => row.map)).toEqual(MAPS);
    expect(EARLY_TIPS_INTRO.join("\n")).toContain("再打三個間章（編年史作「間歇」）");
    expect(EARLY_TIPS_INTRO.join("\n")).toContain("這不是永久主線獎勵。");
    expect(earlyTipRows.filter((row) => row.priority === "優先").map((row) => row.map)).toEqual([
      "皆伐（Clearfell）",
      "弗雷索恩（Freythorn）",
      "戴斯哈尖塔",
      "吉卡尼的機械迷城",
      "阿札克泥沼",
      "庫萊亞村",
    ]);
    expect(earlyTipRows.filter((row) => row.chapter.startsWith("第五章")).every((row) => row.chapter === "第五章（間章）")).toBe(true);
    const joined = earlyTipRows.map((row) => `${row.cue} ${row.reward}`).join("\n");
    expect(joined).toContain("最後通牒雕刻");
    expect(joined).toContain("解鎖維里西姆鐵砧");
    expect(joined).toContain("赤谷（Red Vale）");
    expect(joined).toContain("攝魂之樹");
    expect(joined).toContain("纏縛陰林（Grim Tangle）");
    expect(joined).toContain("叛徒．芭芭拉（Balbala）");
    expect(joined).not.toContain("通牛");
    expect(joined).not.toContain("通牘");
    expect(joined).not.toContain("程序");
    for (const chapter of campaignChapters) expect(chapter.maps).toEqual([]);
    expect(CAMPAIGN_GAPS.some((gap) => gap.includes("不是每張地圖一組"))).toBe(true);
  });

  it("filters by chapter and priority without dropping the locked rewards", () => {
    const priority = filterEarlyTips(earlyTipRows, "", true);
    expect(priority).toHaveLength(6);
    expect(priority.find((row) => row.map.startsWith("皆伐"))?.reward).toBe("+10% 冰冷抗性");
    expect(priority.find((row) => row.map.startsWith("弗雷索恩"))?.reward).toBe("+30 精魂");
    expect(priority.find((row) => row.map === "戴斯哈尖塔")?.reward).toBe("+10% 閃電抗性");
    expect(priority.find((row) => row.map === "吉卡尼的機械迷城")?.cue).toContain("遺忘的黑顎");
    expect(priority.find((row) => row.map === "吉卡尼的機械迷城")?.reward).toBe("+10% 火焰抗性");
    expect(priority.find((row) => row.map === "阿札克泥沼")?.reward).toBe("+30 精魂");
    expect(priority.find((row) => row.map === "庫萊亞村")?.cue).toContain("萊塔拉");
    expect(priority.find((row) => row.map === "庫萊亞村")?.reward).toBe("+40 精魂");

    const act1 = filterEarlyTips(earlyTipRows, "第一章", true);
    expect(act1.map((row) => row.map)).toEqual(["皆伐（Clearfell）", "弗雷索恩（Freythorn）"]);
    expect(filterEarlyTips(earlyTipRows, "第四章", true)).toEqual([]);
  });
});