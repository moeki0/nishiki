import { g } from "@moeki0/gengen";

export const bignumSchema = g.block("bignum", {
  trigger:
    "死者数・期間・距離・人口など、数字そのものが規模や衝撃を物語るとき。最も印象的な統計を1〜3つ取り上げる。",
  schema: {
    heading: g
      .heading([2, 3])
      .content(/^(bignum|大きな数字|数字の強調|数字)$/i),
    items: g.list(1).all(g.split(/[：:]\s*/, g.str("label"), g.str("value"))),
  },
});
