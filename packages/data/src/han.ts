/**
 * Traditional → simplified pairs for search folding.
 * Comparison folds both sides, so a simplified query hits traditional mod text
 * and a traditional query still hits it. Ambiguous collapses (復/複 → 复) are
 * acceptable for search.
 */
const TRAD_TO_SIMP: ReadonlyArray<readonly [string, string]> = [
  ["來", "来"],
  ["個", "个"],
  ["倫", "伦"],
  ["傳", "传"],
  ["兒", "儿"],
  ["內", "内"],
  ["兩", "两"],
  ["凍", "冻"],
  ["動", "动"],
  ["勢", "势"],
  ["勵", "励"],
  ["華", "华"],
  ["寶", "宝"],
  ["圖", "图"],
  ["喚", "唤"],
  ["壇", "坛"],
  ["師", "师"],
  ["幣", "币"],
  ["庫", "库"],
  ["後", "后"],
  ["從", "从"],
  ["復", "复"],
  ["徵", "征"],
  ["恆", "恒"],
  ["懼", "惧"],
  ["戰", "战"],
  ["擊", "击"],
  ["擁", "拥"],
  ["擠", "挤"],
  ["數", "数"],
  ["斷", "断"],
  ["於", "于"],
  ["時", "时"],
  ["會", "会"],
  ["條", "条"],
  ["機", "机"],
  ["殺", "杀"],
  ["殼", "壳"],
  ["滿", "满"],
  ["瀆", "渎"],
  ["為", "为"],
  ["無", "无"],
  ["爾", "尔"],
  ["產", "产"],
  ["異", "异"],
  ["瘋", "疯"],
  ["盡", "尽"],
  ["禮", "礼"],
  ["禱", "祷"],
  ["穩", "稳"],
  ["級", "级"],
  ["經", "经"],
  ["維", "维"],
  ["綴", "缀"],
  ["續", "续"],
  ["獲", "获"],
  ["獻", "献"],
  ["現", "现"],
  ["盜", "盗"],
  ["製", "制"],
  ["複", "复"],
  ["褻", "亵"],
  ["許", "许"],
  ["詞", "词"],
  ["誌", "志"],
  ["諾", "诺"],
  ["識", "识"],
  ["譫", "谵"],
  ["護", "护"],
  ["變", "变"],
  ["貢", "贡"],
  ["賊", "贼"],
  ["賦", "赋"],
  ["贈", "赠"],
  ["過", "过"],
  ["遠", "远"],
  ["遲", "迟"],
  ["遺", "遗"],
  ["間", "间"],
  ["關", "关"],
  ["陣", "阵"],
  ["險", "险"],
  ["隻", "只"],
  ["雙", "双"],
  ["靈", "灵"],
  ["預", "预"],
  ["領", "领"],
  ["頭", "头"],
  ["額", "额"],
  ["驗", "验"],
  ["體", "体"],
  ["閉", "闭"],
  ["換", "换"],
  ["揮", "挥"],
  ["暫", "暂"],
  ["棄", "弃"],
  ["淵", "渊"],
  ["減", "减"],
  ["昇", "升"],
  ["犧", "牺"],
  ["獎", "奖"],
  ["霧", "雾"],
  ["鏡", "镜"],
  ["東", "东"],
  ["車", "车"],
  ["門", "门"],
  ["開", "开"],
  ["長", "长"],
  ["電", "电"],
  ["馬", "马"],
  ["魚", "鱼"],
  ["鳥", "鸟"],
  ["龍", "龙"],
  ["風", "风"],
  ["雲", "云"],
  ["發", "发"],
  ["對", "对"],
  ["與", "与"],
  ["這", "这"],
  ["還", "还"],
  ["進", "进"],
  ["選", "选"],
  ["擇", "择"],
  ["種", "种"],
  ["類", "类"],
  ["質", "质"],
  ["裝", "装"],
  ["備", "备"],
  ["區", "区"],
  ["點", "点"],
  ["線", "线"],
  ["氣", "气"],
  ["閃", "闪"],
  ["結", "结"],
  ["經驗", "经验"],
];

const FOLD = new Map<string, string>();
for (const [trad, simp] of TRAD_TO_SIMP) {
  if ([...trad].length === 1 && [...simp].length === 1) {
    FOLD.set(trad, simp);
  } else {
    // Multi-character entries are expanded per character below.
    const tradChars = [...trad];
    const simpChars = [...simp];
    if (tradChars.length === simpChars.length) {
      for (let i = 0; i < tradChars.length; i++) {
        const from = tradChars[i];
        const to = simpChars[i];
        if (from && to) FOLD.set(from, to);
      }
    }
  }
}

/** Fold traditional Han characters to simplified for search comparison. */
export function foldHan(value: string): string {
  let out = "";
  for (const ch of value) out += FOLD.get(ch) ?? ch;
  return out;
}
