import { g } from "@moeki0/gengen";

export const agelineSchema = g.block("ageline", {
  trigger:
    "複数の主要人物が同じ瞬間に居合わせた場面。彼らの年齢の差・若さ・経験の違いが文脈に意味を持つとき。",
  schema: {
    data: g
      .codeblock("ageline")
      .content(/.+[：:]\s*\d/) // 少なくとも「名前: 年齢」行を含む
      .example(
        "1789年時点の年齢\nルイ16世: 34 (国王)\nロベスピエール: 31 (弁護士議員)\nナポレオン: 19 (陸軍少尉)",
      ),
  },
});
