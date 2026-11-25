export const EARLY_TIPS_TITLE = "開荒技巧";

export const EARLY_TIPS_COLUMNS = [
  "章節",
  "地圖",
  "技巧／地標",
  "獎勵或設施",
  "優先",
] as const;

export const EARLY_TIPS_INTRO = [
  "現役開荒是第一章至第四章，再打三個間章（編年史作「間歇」），大約 65 等進終局。0.5.5h 不改主線。1.0 預定 2026-12-11 會拿掉間章、補上第五、六章，這條路線只適用搶先體驗這段。",
  "禁忌儀式是聯盟內容：每張主線圖都有祭祀，給升級用裝備與通貨；頭目祭祀會疊加，整串打完才用貢禮換傳奇。這不是永久主線獎勵。"
] as const;

export type EarlyTipRow = {
  chapter: string;
  map: string;
  cue: string;
  reward: string;
  priority: "" | "優先";
};

export const earlyTipRows: readonly EarlyTipRow[] = [
  {
    "chapter": "第一章",
    "map": "皆伐（Clearfell）",
    "cue": "擊敗腐敗獸群．貝伊拉",
    "reward": "+10% 冰冷抗性",
    "priority": "優先"
  },
  {
    "chapter": "第一章",
    "map": "葛瑞爾林（The Grelwood）",
    "cue": "前往赤谷（Red Vale）時，找到河道後沿上游走。尋找攝魂之樹時，改沿發光樹根走。地面出現蘑菇，代表已靠近纏縛陰林（Grim Tangle）入口。",
    "reward": "",
    "priority": ""
  },
  {
    "chapter": "第一章",
    "map": "獵場（Hunting Grounds）",
    "cue": "前往奧格姆農地時留意路牌。要去弗雷索恩，先完成祭壇，再跟隨移動的蝗蟲。",
    "reward": "",
    "priority": ""
  },
  {
    "chapter": "第一章",
    "map": "鴉鈴（Crowbell）",
    "cue": "在獵場沿途若看到被啄死的牛，這條路通往此處。",
    "reward": "+2 武器套點",
    "priority": ""
  },
  {
    "chapter": "第一章",
    "map": "弗雷索恩（Freythorn）",
    "cue": "擊敗迷霧之王",
    "reward": "+30 精魂",
    "priority": "優先"
  },
  {
    "chapter": "第一章",
    "map": "奧格姆農地",
    "cue": "烏娜的小屋",
    "reward": "+2 武器套點",
    "priority": ""
  },
  {
    "chapter": "第一章",
    "map": "奧格姆村",
    "cue": "倫利的工作坊",
    "reward": "解鎖分解台",
    "priority": ""
  },
  {
    "chapter": "第一章",
    "map": "奧格姆宅第",
    "cue": "存活儀式．燭光。主線頭目是吉恩諾伯爵。",
    "reward": "+20 最大生命",
    "priority": ""
  },
  {
    "chapter": "第二章",
    "map": "叛徒之路（Traitor’s Passage）",
    "cue": "在岔路尋找馬拉克斯卷軸標記。找叛徒．芭芭拉（Balbala）時走有標記的一支；要趕往出口就走另一支。",
    "reward": "",
    "priority": ""
  },
  {
    "chapter": "第二章",
    "map": "凱斯城",
    "cue": "擊敗蟒蛇女王．卡巴拉",
    "reward": "+2 武器套點",
    "priority": ""
  },
  {
    "chapter": "第二章",
    "map": "乳齒象惡地（Mastodon Badlands）",
    "cue": "地面裂縫通往無光通道／靈魂之井。",
    "reward": "",
    "priority": ""
  },
  {
    "chapter": "第二章",
    "map": "泰坦之谷（Valley of the Titans）",
    "cue": "進圖先看巨人石像的頭部，再找對應的峽谷。沿峽谷走到底可找到封印，回頭再選下一尊。",
    "reward": "祭壇可選護符充能或持續，並 +1 護符欄",
    "priority": ""
  },
  {
    "chapter": "第二章",
    "map": "戴斯哈（Deshar）",
    "cue": "區域等級 28，可出較高階巨靈之幣。撿遺書交還夏布林。社群速度路線常等到這裡的 28 等幣，再打絲克瑪試煉（昇華前兩點），而不是一進第二章就用 22 等幣。",
    "reward": "+2 武器套點",
    "priority": ""
  },
  {
    "chapter": "第二章",
    "map": "戴斯哈尖塔",
    "cue": "與卡洛翰的姐妹互動",
    "reward": "+10% 閃電抗性",
    "priority": "優先"
  },
  {
    "chapter": "第二章",
    "map": "絲克瑪試煉",
    "cue": "鑰匙是巨靈之幣。",
    "reward": "昇華第 1–2 點",
    "priority": ""
  },
  {
    "chapter": "第三章",
    "map": "本章說明",
    "cue": "遇到探險者時先交談，打開小地圖，依對話新增的標記前往下一區。",
    "reward": "",
    "priority": ""
  },
  {
    "chapter": "第三章",
    "map": "叢林遺跡",
    "cue": "擊敗神威銀拳。感染荒地由此進入。",
    "reward": "+2 武器套點",
    "priority": ""
  },
  {
    "chapter": "第三章",
    "map": "劇毒墓穴",
    "cue": "把歐洛克毒藥交給瑟維",
    "reward": "三選一：增加 25% 暈眩門檻、增加 30% 元素異常狀態門檻、或增加 25% 魔力回復率",
    "priority": ""
  },
  {
    "chapter": "第三章",
    "map": "龍蜥濕地",
    "cue": "擊敗龍蜥．欽路錫安，取得最後通牒雕刻。0.5.5 起混沌試煉可中途離開再續。",
    "reward": "可開混沌試煉（昇華第 3–4 點）",
    "priority": ""
  },
  {
    "chapter": "第三章",
    "map": "吉卡尼的機械迷城",
    "cue": "擊敗遺忘的黑顎",
    "reward": "+10% 火焰抗性",
    "priority": "優先"
  },
  {
    "chapter": "第三章",
    "map": "瑪特蘭水道",
    "cue": "由此岔出阿札克泥沼。",
    "reward": "",
    "priority": ""
  },
  {
    "chapter": "第三章",
    "map": "阿札克泥沼",
    "cue": "擊敗沼澤女巫．尹娜杜克",
    "reward": "+30 精魂",
    "priority": "優先"
  },
  {
    "chapter": "第三章",
    "map": "熔岩寶庫",
    "cue": "擊敗冶煉師範．梅克圖後",
    "reward": "可解鎖重鑄台",
    "priority": ""
  },
  {
    "chapter": "第三章",
    "map": "阿戈拉",
    "cue": "完成血犧",
    "reward": "+2 武器套點",
    "priority": ""
  },
  {
    "chapter": "第四章",
    "map": "本章說明",
    "cue": "島嶼多半可自選順序。0.5.5c 起要先把船隻特許證交給瑪寇魯，島嶼才會開。第一座島後可解鎖藏身處。",
    "reward": "解鎖藏身處",
    "priority": ""
  },
  {
    "chapter": "第四章",
    "map": "符文探求者",
    "cue": "四張撕碎的地圖碎片在金氏島、凱吉灣、瓦卡帕努島、伯勞鳥之島。交給丹尼格拼成藏寶圖，再請瑪寇魯前往掠奪者之角，進入荒廢哨站完成此任務。",
    "reward": "解鎖維里西姆鐵砧",
    "priority": ""
  },
  {
    "chapter": "第四章",
    "map": "金氏島",
    "cue": "眼盲巨獸的獎勵不是武器套點。編年史任務獎勵寫硫酸藥劑與 12 等未切割技能寶石；整理站與社群曾改記為高階符文。以任務圖示為準。",
    "reward": "硫酸藥劑與 12 等未切割技能寶石",
    "priority": ""
  },
  {
    "chapter": "第四章",
    "map": "瓦卡帕努島",
    "cue": "擊敗大白鯊取得鯊魚鰭，交給尼加卡努（或金司馬區）的凱馬拿。",
    "reward": "可選岡姆的教誨（增加 30% 全域護甲、閃避與能量護盾）或萊基亞塔的教誨（部分護甲套用至元素傷害、偏斜、能量護盾較快開始充能）",
    "priority": ""
  },
  {
    "chapter": "第四章",
    "map": "廢棄監獄",
    "cue": "正義女神",
    "reward": "藥劑的生命恢復或魔力恢復增加 30%，二選一",
    "priority": ""
  },
  {
    "chapter": "第四章",
    "map": "悉妮蔻拉之眼",
    "cue": "娜瓦莉憩地",
    "reward": "+5% 最大魔力",
    "priority": ""
  },
  {
    "chapter": "第四章",
    "map": "亡者之殿",
    "cue": "擊敗白之亞瑪。先祖刺青可選三抗各 +5%，或三屬各 +5。",
    "reward": "+2 武器套點",
    "priority": ""
  },
  {
    "chapter": "第四章",
    "map": "旅程之末",
    "cue": "擊敗恐懼造物．歐姆弗畢亞",
    "reward": "+2 武器套點",
    "priority": ""
  },
  {
    "chapter": "第四章",
    "map": "部族之心",
    "cue": "主線頭目是圖克哈瑪酋長．塔瓦凱。",
    "reward": "",
    "priority": ""
  },
  {
    "chapter": "第五章（間章）",
    "map": "本章說明",
    "cue": "三個間章可自選順序。進場會降抗，先補抗再進。許多指南會先跑「多里亞尼的意外事件」，以便早拿 +40 精魂。",
    "reward": "",
    "priority": ""
  },
  {
    "chapter": "第五章（間章）",
    "map": "狼之要塞（霍爾登的詛咒）",
    "cue": "回奧格姆。擊敗恐懼典獄長．歐斯溫。",
    "reward": "+2 武器套點",
    "priority": ""
  },
  {
    "chapter": "第五章（間章）",
    "map": "卡里交匯道（被偷的巨靈之幣）",
    "cue": "去瓦斯提里荒漠。擊敗艾克提與艾能德。",
    "reward": "+2 武器套點",
    "priority": ""
  },
  {
    "chapter": "第五章（間章）",
    "map": "熔岩神殿",
    "cue": "與卡里交匯道同區。",
    "reward": "+5% 最大生命",
    "priority": ""
  },
  {
    "chapter": "第五章（間章）",
    "map": "奇瑪",
    "cue": "可選一座靈柱恩惠（可更換）。",
    "reward": "靈柱恩惠",
    "priority": ""
  },
  {
    "chapter": "第五章（間章）",
    "map": "灰燼森林（多里亞尼的意外事件）",
    "cue": "去庫萊亞山。遠古紀念碑。",
    "reward": "14 等未切割技能寶石",
    "priority": ""
  },
  {
    "chapter": "第五章（間章）",
    "map": "庫萊亞村",
    "cue": "擊敗迷失長矛．萊塔拉",
    "reward": "+40 精魂",
    "priority": "優先"
  },
  {
    "chapter": "第五章（間章）",
    "map": "狂嗥洞穴",
    "cue": "擊敗怪異雪獸，回報後",
    "reward": "+2 武器套點",
    "priority": ""
  },
  {
    "chapter": "第五章（間章）",
    "map": "金司馬區",
    "cue": "三個間章都完成後，向黑衣幽魂領最後獎勵，再開啟輿圖。",
    "reward": "+2 武器套點",
    "priority": ""
  },
  {
    "chapter": "第五章（間章）",
    "map": "終局銜接",
    "cue": "多數角色約 58–60 等開始地圖；升 T15 前，把地圖和要塞任務推開，不必一開始就把圖汁拉滿。",
    "reward": "",
    "priority": ""
  }
];

export const EARLY_TIP_CHAPTERS = [
  "第一章",
  "第二章",
  "第三章",
  "第四章",
  "第五章（間章）",
] as const;

export type EarlyTipSource = { label: string; href: string };

/** Source groups under the table. Each group is one spec bullet. */
export const earlyTipSourceGroups: readonly (readonly EarlyTipSource[])[] = [
  [
    {
      "label": "0.5 版地標紀錄",
      "href": "https://www.reddit.com/r/PathOfExile2/comments/1tvk2un/collecting_05_campaign_navigation_cueshintstips/"
    }
  ],
  [
    {
      "label": "森林跑圖示範",
      "href": "https://www.youtube.com/watch?v=G_z8gRdOWqw&t=134s"
    }
  ],
  [
    {
      "label": "編年史第 1 章",
      "href": "https://poe2db.tw/tw/Act_1"
    },
    {
      "label": "第 2 章",
      "href": "https://poe2db.tw/tw/Act_2"
    },
    {
      "label": "第 3 章",
      "href": "https://poe2db.tw/tw/Act_3"
    },
    {
      "label": "第 4 章",
      "href": "https://poe2db.tw/tw/Act_4"
    },
    {
      "label": "間歇",
      "href": "https://poe2db.tw/tw/Interlude"
    }
  ],
  [
    {
      "label": "符文探求者",
      "href": "https://poe2db.tw/tw/The_Runeseeker"
    },
    {
      "label": "部落藥術",
      "href": "https://poe2db.tw/tw/Tribal_Medicine"
    }
  ]
];

export const EARLY_TIPS_FOOTNOTE = "乳齒象惡地裂縫見 Reddit 彙整與 0.5 補丁說明；官方 Streamlining 影片未示範。";

export function filterEarlyTips(
  rows: readonly EarlyTipRow[],
  chapter: string,
  priorityOnly: boolean,
): EarlyTipRow[] {
  return rows.filter((row) => {
    if (chapter && row.chapter !== chapter) return false;
    if (priorityOnly && row.priority !== "優先") return false;
    return true;
  });
}
