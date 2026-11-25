import type { ChapterId } from "@poe2-regex/data";

export const CAMPAIGN_FLOW_TITLE = "開荒流程";

/** Shared lines at the top of every chapter flow. Locked copy. */
export const CAMPAIGN_FLOW_INTRO = [
  "現役開荒是第一章至第四章，再打三個間章（編年史作「間歇」），大約 65 等進終局。0.5.5h 不改主線。1.0 預定 2026-12-11 會拿掉間章、補上第五、六章，這條路線只適用搶先體驗這段。",
  "禁忌儀式是聯盟內容：每張主線圖都有祭祀，給升級用裝備與通貨；頭目祭祀會疊加，整串打完才用貢禮換傳奇。這不是永久主線獎勵。"
] as const;

export type CampaignFlowStep = {
  name?: string;
  aside?: string;
  text: string;
};

export type CampaignFlowSource = {
  label: string;
  href: string;
};

export type CampaignFlow = {
  id: ChapterId;
  /** Set on the interlude tab so the page says 間章, not a 1.0 fifth act. */
  kicker?: string;
  lead: readonly string[];
  steps: readonly CampaignFlowStep[];
  tail: readonly string[];
  footnote?: string;
  sources: readonly CampaignFlowSource[];
};

export const campaignFlows: readonly CampaignFlow[] = [
  {
    "id": "act-1",
    "lead": [],
    "steps": [
      {
        "name": "皆伐（Clearfell）",
        "text": "擊敗腐敗獸群．貝伊拉，+10% 冰冷抗性（優先）。"
      },
      {
        "name": "葛瑞爾林（The Grelwood）",
        "text": "前往赤谷（Red Vale）時，找到河道後沿上游走。尋找攝魂之樹時，改沿發光樹根走。地面出現蘑菇，代表已靠近纏縛陰林（Grim Tangle）入口。"
      },
      {
        "name": "獵場（Hunting Grounds）",
        "text": "前往奧格姆農地時留意路牌。沿途若看到被啄死的牛，這條路通往鴉鈴（Crowbell，+2 武器套點）。要去弗雷索恩，先完成祭壇，再跟隨移動的蝗蟲。"
      },
      {
        "name": "弗雷索恩（Freythorn）",
        "text": "擊敗迷霧之王，+30 精魂（優先）。"
      },
      {
        "name": "奧格姆農地",
        "text": "烏娜的小屋，+2 武器套點。"
      },
      {
        "name": "奧格姆村",
        "text": "倫利的工作坊可解鎖分解台。"
      },
      {
        "name": "奧格姆宅第",
        "text": "存活儀式．燭光，+20 最大生命。主線頭目是吉恩諾伯爵。"
      }
    ],
    "tail": [],
    "sources": [
      {
        "label": "0.5 版地標紀錄",
        "href": "https://www.reddit.com/r/PathOfExile2/comments/1tvk2un/collecting_05_campaign_navigation_cueshintstips/"
      },
      {
        "label": "森林跑圖示範",
        "href": "https://www.youtube.com/watch?v=G_z8gRdOWqw&t=134s"
      },
      {
        "label": "編年史第 1 章",
        "href": "https://poe2db.tw/tw/Act_1"
      }
    ]
  },
  {
    "id": "act-2",
    "lead": [],
    "steps": [
      {
        "name": "叛徒之路（Traitor’s Passage）",
        "text": "在岔路尋找馬拉克斯卷軸標記。找叛徒．芭芭拉（Balbala）時走有標記的一支；要趕往出口就走另一支。"
      },
      {
        "name": "凱斯城",
        "text": "擊敗蟒蛇女王．卡巴拉，+2 武器套點。"
      },
      {
        "name": "乳齒象惡地（Mastodon Badlands）",
        "text": "地面裂縫通往無光通道／靈魂之井。"
      },
      {
        "name": "泰坦之谷（Valley of the Titans）",
        "text": "進圖先看巨人石像的頭部，再找對應的峽谷。沿峽谷走到底可找到封印，回頭再選下一尊。此處祭壇可選護符充能或持續，並 +1 護符欄。"
      },
      {
        "name": "戴斯哈（Deshar）",
        "text": "區域等級 28，可出較高階巨靈之幣。撿遺書交還夏布林，+2 武器套點。社群速度路線常等到這裡的 28 等幣，再打絲克瑪試煉（昇華前兩點），而不是一進第二章就用 22 等幣。"
      },
      {
        "name": "戴斯哈尖塔",
        "text": "與卡洛翰的姐妹互動，+10% 閃電抗性（優先）。"
      },
      {
        "name": "絲克瑪試煉",
        "text": "昇華第 1–2 點，鑰匙是巨靈之幣。"
      }
    ],
    "tail": [],
    "sources": [
      {
        "label": "0.5 版地標紀錄",
        "href": "https://www.reddit.com/r/PathOfExile2/comments/1tvk2un/collecting_05_campaign_navigation_cueshintstips/"
      },
      {
        "label": "編年史第 2 章",
        "href": "https://poe2db.tw/tw/Act_2"
      }
    ],
    "footnote": "乳齒象惡地裂縫見該 Reddit 彙整與 0.5 補丁說明；官方 Streamlining 影片未示範。"
  },
  {
    "id": "act-3",
    "lead": [],
    "steps": [
      {
        "text": "遇到探險者時先交談，打開小地圖，依對話新增的標記前往下一區。"
      },
      {
        "name": "叢林遺跡",
        "text": "擊敗神威銀拳，+2 武器套點。感染荒地由此進入。"
      },
      {
        "name": "劇毒墓穴",
        "text": "把歐洛克毒藥交給瑟維，三選一：增加 25% 暈眩門檻、增加 30% 元素異常狀態門檻、或增加 25% 魔力回復率。"
      },
      {
        "name": "龍蜥濕地",
        "text": "擊敗龍蜥．欽路錫安，取得最後通牒雕刻，可開混沌試煉（昇華第 3–4 點）。0.5.5 起混沌試煉可中途離開再續。"
      },
      {
        "name": "吉卡尼的機械迷城",
        "text": "擊敗遺忘的黑顎，+10% 火焰抗性（優先）。"
      },
      {
        "name": "瑪特蘭水道",
        "text": "由此岔出阿札克泥沼。"
      },
      {
        "name": "阿札克泥沼",
        "text": "擊敗沼澤女巫．尹娜杜克，+30 精魂（優先）。"
      },
      {
        "name": "熔岩寶庫",
        "text": "擊敗冶煉師範．梅克圖後，可解鎖重鑄台。"
      },
      {
        "name": "阿戈拉",
        "text": "完成血犧，+2 武器套點。"
      }
    ],
    "tail": [],
    "sources": [
      {
        "label": "0.5 版地標紀錄",
        "href": "https://www.reddit.com/r/PathOfExile2/comments/1tvk2un/collecting_05_campaign_navigation_cueshintstips/"
      },
      {
        "label": "編年史第 3 章",
        "href": "https://poe2db.tw/tw/Act_3"
      }
    ]
  },
  {
    "id": "act-4",
    "lead": [
      "島嶼多半可自選順序。0.5.5c 起要先把船隻特許證交給瑪寇魯，島嶼才會開。第一座島後可解鎖藏身處。",
      "四張撕碎的地圖碎片在金氏島、凱吉灣、瓦卡帕努島、伯勞鳥之島。交給丹尼格拼成藏寶圖，再請瑪寇魯前往掠奪者之角，進入荒廢哨站完成「符文探求者」，解鎖維里西姆鐵砧。"
    ],
    "steps": [
      {
        "name": "金氏島",
        "text": "眼盲巨獸的獎勵不是武器套點。編年史任務獎勵寫硫酸藥劑與 12 等未切割技能寶石；整理站與社群曾改記為高階符文。以任務圖示為準。"
      },
      {
        "name": "瓦卡帕努島",
        "text": "擊敗大白鯊取得鯊魚鰭，交給尼加卡努（或金司馬區）的凱馬拿，可選岡姆的教誨（增加 30% 全域護甲、閃避與能量護盾）或萊基亞塔的教誨（部分護甲套用至元素傷害、偏斜、能量護盾較快開始充能）。"
      },
      {
        "name": "廢棄監獄",
        "text": "正義女神：藥劑的生命恢復或魔力恢復增加 30%，二選一。"
      },
      {
        "name": "悉妮蔻拉之眼",
        "text": "娜瓦莉憩地，+5% 最大魔力。"
      },
      {
        "name": "亡者之殿",
        "text": "擊敗白之亞瑪，+2 武器套點。先祖刺青可選三抗各 +5%，或三屬各 +5。"
      },
      {
        "name": "旅程之末",
        "text": "擊敗恐懼造物．歐姆弗畢亞，+2 武器套點。"
      },
      {
        "name": "部族之心",
        "text": "主線頭目是圖克哈瑪酋長．塔瓦凱。"
      }
    ],
    "tail": [],
    "sources": [
      {
        "label": "編年史第 4 章",
        "href": "https://poe2db.tw/tw/Act_4"
      },
      {
        "label": "符文探求者",
        "href": "https://poe2db.tw/tw/The_Runeseeker"
      },
      {
        "label": "部落藥術",
        "href": "https://poe2db.tw/tw/Tribal_Medicine"
      }
    ]
  },
  {
    "id": "act-5",
    "kicker": "第五章分頁（間章／間歇）",
    "lead": [
      "三個間章可自選順序。進場會降抗，先補抗再進。許多指南會先跑「多里亞尼的意外事件」，以便早拿 +40 精魂。"
    ],
    "steps": [
      {
        "name": "霍爾登的詛咒",
        "aside": "（回奧格姆）",
        "text": "狼之要塞擊敗恐懼典獄長．歐斯溫，+2 武器套點。"
      },
      {
        "name": "被偷的巨靈之幣",
        "aside": "（去瓦斯提里荒漠）",
        "text": "卡里交匯道擊敗艾克提與艾能德，+2 武器套點；同區熔岩神殿 +5% 最大生命。奇瑪可選一座靈柱恩惠（可更換）。"
      },
      {
        "name": "多里亞尼的意外事件",
        "aside": "（去庫萊亞山）",
        "text": "灰燼森林的遠古紀念碑有 14 等未切割技能寶石。庫萊亞村擊敗迷失長矛．萊塔拉，+40 精魂（優先）。狂嗥洞穴擊敗怪異雪獸，回報後 +2 武器套點。"
      }
    ],
    "tail": [
      "三個間章都完成後，回金司馬區向黑衣幽魂領最後 +2 武器套點，再開啟輿圖。多數角色約 58–60 等開始地圖；升 T15 前，優先把地圖和要塞任務推開，不必一開始就把圖汁拉滿。"
    ],
    "sources": [
      {
        "label": "編年史間歇",
        "href": "https://poe2db.tw/tw/Interlude"
      }
    ]
  }
];

export function campaignFlowFor(id: ChapterId): CampaignFlow {
  const found = campaignFlows.find((flow) => flow.id === id);
  if (!found) throw new Error(`Missing campaign flow: ${id}`);
  return found;
}

export function campaignFlowText(flow: CampaignFlow): string {
  const steps = flow.steps.map((step) =>
    [step.name, step.aside, step.text].filter(Boolean).join(""),
  );
  return [
    ...CAMPAIGN_FLOW_INTRO,
    flow.kicker,
    ...flow.lead,
    ...steps,
    ...flow.tail,
    flow.footnote,
    ...flow.sources.map((source) => source.label),
  ]
    .filter(Boolean)
    .join("\n");
}
