"use client";

import { g } from "@moeki0/gengen";
import { useInlineText } from "@moeki0/gengen/react";
import { bignumSchema } from "./bignum.schema";

type Item = { label: string; value: string };

function splitNumeric(value: string): {
  pre: string;
  num: string;
  post: string;
} {
  const m = value.match(
    /^(.*?)([\d,，.．]+(?:\s*[〜~–\-]\s*[\d,，.．]+)?)(.*)$/,
  );
  if (!m) return { pre: "", num: value, post: "" };
  return { pre: m[1].trim(), num: m[2].trim(), post: m[3].trim() };
}

function BignumRenderer({ items }: { items: Item[] }) {
  const inlineText = useInlineText();
  return (
    <div
      style={{
        margin: "1.5rem 0",
        display: "flex",
        flexWrap: "wrap",
        gap: "0.75rem",
        fontFamily: "var(--font-sans)",
      }}
    >
      {items.map((item, i) => {
        const { pre, num, post } = splitNumeric(item.value);
        return (
          <div
            key={i}
            style={{
              flex: "1 1 140px",
              minWidth: 0,
              background: "#fafafa",
              border: "1px solid #e8e8e8",
              borderRadius: "12px",
              padding: "1.25rem 1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.35rem",
            }}
          >
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 500,
                color: "#999",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                lineHeight: 1.3,
              }}
            >
              {inlineText(item.label)}
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "0.2em",
                flexWrap: "wrap",
              }}
            >
              {pre && (
                <span style={{ fontSize: "0.9rem", color: "#aaa", fontWeight: 400 }}>
                  {pre}
                </span>
              )}
              <span
                style={{
                  fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                  color: "#111",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {num}
              </span>
              {post && (
                <span
                  style={{
                    fontSize: "0.9rem",
                    color: "#666",
                    fontWeight: 600,
                  }}
                >
                  {post}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default g.block("bignum", {
  ...bignumSchema,
  component: BignumRenderer,
});
