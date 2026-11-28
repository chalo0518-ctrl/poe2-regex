import { describe, expect, it } from "vitest";
import { CAMPAIGN_GAPS, campaignChapters } from "@poe2-regex/data";
import {
  EARLY_TIP_CHAPTERS,
  EARLY_TIPS_COLUMNS,
  EARLY_TIPS_INTRO,
  earlyTipRows,
  earlyTipSourceGroups,
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
  "乳齒象惡地（Mastodon Badlands）",
  "凱斯城",
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
  "祖靈的試煉",
  "旅程之末",
  "部族之心",
];

describe("early tips table", () => {
  it("keeps the locked columns, order, and priority marks", () => {
    expect(EARLY_TIPS_COLUMNS).toEqual(["章節", "地圖", "技巧／地標", "獎勵或設施", "優先"]);
    expect(earlyTipRows.map((row) => row.map)).toEqual(MAPS);
    expect(EARLY_TIPS_INTRO[0]).toBe("現役開荒是第一章至第四章。0.5.5h 不改主線。永久獎勵以遊戲內任務圖示為準。");
    expect(EARLY_TIPS_INTRO.join("\n")).toContain("這不是永久主線獎勵。");
    expect(EARLY_TIPS_INTRO.join("\n")).not.toContain("間章");
    expect(EARLY_TIPS_INTRO.join("\n")).not.toContain("1.0");
    expect(EARLY_TIP_CHAPTERS).toEqual(["第一章", "第二章", "第三章", "第四章"]);
    expect(earlyTipRows.filter((row) => row.priority === "優先").map((row) => row.map)).toEqual([
      "皆伐（Clearfell）",
      "弗雷索恩（Freythorn）",
      "戴斯哈尖塔",
      "吉卡尼的機械迷城",
      "阿札克泥沼",
    ]);
    const joined = [
      ...EARLY_TIPS_INTRO,
      ...earlyTipRows.map((row) => `${row.chapter} ${row.map} ${row.cue} ${row.reward}`),
      ...earlyTipSourceGroups.flat().map((source) => `${source.label} ${source.href}`),
    ].join("\n");
    expect(joined).toContain("最後通牒雕刻");
    expect(joined).toContain("解鎖維里西姆鐵砧");
    expect(joined).toContain("赤谷（Red Vale）");
    expect(joined).toContain("攝魂之樹");
    expect(joined).toContain("纏縛陰林（Grim Tangle）");
    expect(joined).toContain("叛徒．芭芭拉（Balbala）");
    expect(joined).not.toContain("通牛");
    expect(joined).not.toContain("通牘");
    expect(joined).not.toContain("程序");
    expect(joined).not.toContain("第五章（間章）");
    expect(joined).not.toContain("間章");
    expect(joined).not.toContain("間歇");
    expect(joined).not.toContain("庫萊亞村");
    expect(joined).not.toContain("Interlude");
    expect(joined).not.toContain("分解台");
    const byMap = (name: string) => earlyTipRows.find((row) => row.map === name);
    expect(byMap("奧格姆村")?.reward).toBe("解鎖回收台");
    expect(byMap("奧格姆村")?.cue).toContain("把鍛造工具帶回皆伐營地交給倫利");
    expect(byMap("乳齒象惡地（Mastodon Badlands）")?.cue).toContain("再進凱斯城");
    expect(earlyTipRows.map((row) => row.map).indexOf("乳齒象惡地（Mastodon Badlands）")).toBeLessThan(
      earlyTipRows.map((row) => row.map).indexOf("凱斯城"),
    );
    expect(byMap("泰坦之谷（Valley of the Titans）")?.reward).toBe(
      "祭壇二選一：增加 30% 護符充能獲取並 +1 護符欄，或增加 30% 護符效果持續時間並 +1 護符欄",
    );
    expect(byMap("熔岩寶庫")?.cue).toContain("卡瑪薩之錘");
    expect(byMap("熔岩寶庫")?.cue).toContain("奧斯瓦德");
    expect(byMap("熔岩寶庫")?.reward).toBe("解鎖重鑄台");
    const act4 = earlyTipRows.filter((row) => row.chapter === "第四章").map((row) => row.map);
    expect(act4.indexOf("祖靈的試煉")).toBe(act4.indexOf("亡者之殿") + 1);
    expect(act4.indexOf("旅程之末")).toBe(act4.indexOf("祖靈的試煉") + 1);
    expect(byMap("祖靈的試煉")?.cue).toContain("銀幣");
    expect(byMap("祖靈的試煉")?.cue).toContain("娜瓦莉");
    expect(byMap("祖靈的試煉")?.cue).toContain("悉妮蔻拉的刺青");
    expect(byMap("祖靈的試煉")?.reward).toBe("+2 武器套點");
    expect(byMap("祖靈的試煉")?.priority).toBe("");
    expect(byMap("亡者之殿")?.cue).not.toContain("三抗各 +5%");
    expect(byMap("亡者之殿")?.reward).toBe("+2 武器套點");
    expect(byMap("瓦卡帕努島")?.reward).toContain("15% 的護甲同時套用至元素傷害");
    expect(byMap("瓦卡帕努島")?.reward).toContain("12% 閃避值的偏斜值");
    expect(byMap("瓦卡帕努島")?.reward).toContain("12% 能量護盾更快開始充能");
    expect(byMap("瓦卡帕努島")?.reward).toContain("增加 30% 全域護甲、閃避與能量護盾");
    expect(byMap("旅程之末")?.cue).toContain("圖貞");
    expect(byMap("旅程之末")?.cue).toContain("纏繞迷霧之書");
    expect(byMap("金氏島")?.cue).toContain("硫酸藥劑與 12 等未切割技能寶石");
    expect(byMap("金氏島")?.cue).toContain("以遊戲內任務圖示為準");
    expect(byMap("金氏島")?.reward).toBe("硫酸藥劑與 12 等未切割技能寶石");
    expect(earlyTipSourceGroups.flat().map((source) => source.href)).toEqual(expect.arrayContaining([
      "https://poe2db.tw/tw/Finding_the_Forge",
      "https://poe2db.tw/tw/Treasures_of_Utzaal",
      "https://poe2db.tw/tw/Trial_of_the_Ancestors",
      "https://poe2db.tw/tw/Dark_Mists",
      "https://poe2db.tw/tw/Rakiatas_Lesson",
    ]));
    for (const chapter of campaignChapters) expect(chapter.maps).toEqual([]);
    expect(CAMPAIGN_GAPS.some((gap) => gap.includes("不是每張地圖一組"))).toBe(true);
  });

  it("filters by chapter and priority without dropping the locked rewards", () => {
    const priority = filterEarlyTips(earlyTipRows, "", true);
    expect(priority).toHaveLength(5);
    expect(priority.find((row) => row.map.startsWith("皆伐"))?.reward).toBe("+10% 冰冷抗性");
    expect(priority.find((row) => row.map.startsWith("弗雷索恩"))?.reward).toBe("+30 精魂");
    expect(priority.find((row) => row.map === "戴斯哈尖塔")?.reward).toBe("+10% 閃電抗性");
    expect(priority.find((row) => row.map === "吉卡尼的機械迷城")?.cue).toContain("遺忘的黑顎");
    expect(priority.find((row) => row.map === "吉卡尼的機械迷城")?.reward).toBe("+10% 火焰抗性");
    expect(priority.find((row) => row.map === "阿札克泥沼")?.reward).toBe("+30 精魂");

    const act1 = filterEarlyTips(earlyTipRows, "第一章", true);
    expect(act1.map((row) => row.map)).toEqual(["皆伐（Clearfell）", "弗雷索恩（Freythorn）"]);
    expect(filterEarlyTips(earlyTipRows, "第四章", true)).toEqual([]);
  });
});