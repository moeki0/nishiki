import { g } from "@moeki0/gengen";

export const animapSchema = g.block("animap", {
  trigger:
    "勢力圏・支配領域・革命の波及など、地理的な変化や広がりが時間軸とともに見せられるとき。",
  schema: {
    data: g
      .codeblock("animap")
      .content(/^\d{1,4}年?[：:].+[|｜]/m) // 各行「年: 場所 | キャプション」形式
      .example(
        "1206: Mongol Empire | チンギス・ハンが建国\n1227: Mongol Empire; Xi Xia; Khwarezm | 西征の開始\n1279: Great Khanate; Ilkhanate; Khanate of the Golden Horde | 帝国最大版図",
      ),
  },
});
