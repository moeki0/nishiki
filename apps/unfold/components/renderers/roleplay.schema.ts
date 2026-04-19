import { g } from "@moeki0/gengen";

export const roleplaySchema = g.block("roleplay", {
  trigger:
    "読者が歴史上の人物の立場に立って決断できる局面。選択の結果が実際に異なる歴史的帰結と結びつくとき。",
  schema: {
    heading: g
      .heading([2, 3])
      .content(/(roleplay|立場選択|あなたの選択|役割|歴史的選択)/),
    prompt: g.text(),
    choices: g
      .list(2)
      .all(g.split(/\s*→\s*/, g.str("label"), g.str("outcome"))),
  },
});
