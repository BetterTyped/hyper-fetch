import React from "react";

import { AnimatedSpan, Terminal, TypingAnimation } from "../../ui/terminal";
import { FeaturesCard } from "./features-card";

export function CliSdkDemo({ bare = false }: { bare?: boolean } = {}) {
  const content = (
    <Terminal className="h-full w-full min-w-[400px] my-auto">
      <TypingAnimation>{"$ hyper-fetch generate --schema openapi.json"}</TypingAnimation>

      <AnimatedSpan className="!text-zinc-500">Parsing schema...</AnimatedSpan>

      <AnimatedSpan className="!text-green-400">✔ 42 endpoints, 18 models found</AnimatedSpan>

      <AnimatedSpan className="!text-green-400">✔ Typed params, payloads, errors. All inferred.</AnimatedSpan>

      <AnimatedSpan className="!text-green-400">✔ Request methods generated to src/api/</AnimatedSpan>

      <AnimatedSpan className="!text-yellow-300 !flex !flex-wrap !gap-x-0">
        {"Zero "}
        <span style={{ color: "#f87171", fontSize: "inherit" }}>{"`any`"}</span>
        {". Zero manual types. Zero "}
        <span
          style={{
            textDecoration: "underline",
            textDecorationColor: "#ef4444",
            textUnderlineOffset: "3px",
            color: "white",
            fontSize: "inherit",
          }}
        >
          errors
        </span>
        {"."}
      </AnimatedSpan>

      <AnimatedSpan className="!text-blue-400">🚀 Just use it.</AnimatedSpan>
    </Terminal>
  );

  if (bare) {
    return content;
  }

  return <FeaturesCard bgColor="transparent">{content}</FeaturesCard>;
}
