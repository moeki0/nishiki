"use client";

import { g } from "@moeki0/gengen";
import { useInlineText } from "@moeki0/gengen/react";
import { sourceSchema } from "./source.schema";

function SourceRenderer({ text }: { text: string }) {
  const inlineText = useInlineText();

  return (
    <div
      style={{
        margin: "1rem 0",
        padding: "1rem 1.125rem 0.875rem",
        background: "#fbf9f3",
        border: "1px solid #e8e0cc",
        borderRadius: "8px",
        fontFamily: "'Times New Roman', Georgia, serif",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "4px",
          border: "1px solid rgba(180,150,90,0.2)",
          borderRadius: "5px",
          pointerEvents: "none",
        }}
      />
      <p
        style={{
          fontSize: "0.9375rem",
          lineHeight: 1.85,
          color: "#3d3122",
          margin: "0 0 0.625rem",
        }}
      >
        &ldquo;{inlineText(text.replace(/^[">]\s*/, ""))}&rdquo;
      </p>
    </div>
  );
}

export default g.block("source", {
  ...sourceSchema,
  component: SourceRenderer,
});
