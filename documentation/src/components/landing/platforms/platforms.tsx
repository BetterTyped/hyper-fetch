import { HighlighterItem } from "@site/src/components";
import { cn } from "@site/src/lib/utils";
import {
  Bot,
  Database,
  Globe,
  Monitor,
  Plus,
  Radio,
  Server,
  Smartphone,
} from "lucide-react";
import { motion } from "motion/react";
import React from "react";

import { BentoGrid } from "../shared/bento-card";
import { SectionHeader, fadeUp } from "../shared/section-header";

/*
 * "Runs on every platform": bento cards with a technical title, an icon top right and the list of
 * where it runs, each with its logo.
 */

type Item = {
  name: string;
  logo?: string;
  glyph?: React.ElementType;
  more?: boolean;
};

const platforms: { title: string; icon: React.ElementType; items: Item[] }[] = [
  {
    title: "Frontend",
    icon: Monitor,
    items: [
      { name: "React", logo: "react" },
      { name: "Next.js", logo: "next" },
      { name: "Any SPA", glyph: Globe },
    ],
  },
  {
    title: "Runtime",
    icon: Server,
    items: [
      { name: "Node.js", logo: "node" },
      { name: "Bun", logo: "bun" },
      { name: "Edge", logo: "edge" },
    ],
  },
  {
    title: "Realtime",
    icon: Radio,
    items: [
      { name: "WebSockets", logo: "sockets" },
      { name: "SSE", logo: "sse" },
      { name: "Firebase", logo: "firebase" },
    ],
  },
  {
    title: "Mobile",
    icon: Smartphone,
    items: [
      { name: "React Native", logo: "react" },
      { name: "Hybrid apps", glyph: Smartphone },
    ],
  },
  {
    title: "AI agents",
    icon: Bot,
    items: [
      { name: "Claude Code", logo: "claude" },
      { name: "Cursor", logo: "cursor" },
      { name: "Codex", logo: "openai" },
    ],
  },
  {
    title: "Backend",
    icon: Database,
    items: [
      { name: "OpenAPI", logo: "openapi" },
      { name: "GraphQL", logo: "graphql" },
      { name: "tRPC", logo: "trpc" },
      { name: "oRPC", logo: "orpc-dark" },
      { name: "Hono", logo: "hono" },
      { name: "more", more: true },
    ],
  },
];

export const Platforms = () => (
  <section className="relative pb-24 pt-8 md:pt-12">
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <SectionHeader
        eyebrow="Works everywhere"
        title="Runs on every platform"
      />
      <BentoGrid className="sm:grid-cols-2 lg:grid-cols-3">
        {platforms.map((p, i) => {
          const twoCols = p.items.length > 3;
          return (
            <motion.div key={p.title} {...fadeUp(i)} className="min-w-0">
              <HighlighterItem className="!rounded-3xl">
                <div className="relative z-20 flex h-full flex-col overflow-hidden rounded-[inherit] bg-[#1f1f21] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="!m-0 text-[22px] font-bold tracking-tight text-zinc-100">
                      {p.title}
                    </h3>
                    <p.icon
                      className="size-7 shrink-0 text-[#fbc646]"
                      strokeWidth={1.5}
                    />
                  </div>
                  <ul
                    className={cn(
                      "!mb-0 mt-6 list-none !p-0",
                      twoCols
                        ? "grid grid-cols-2 gap-x-6 gap-y-3"
                        : "flex flex-col gap-3",
                    )}
                  >
                    {p.items.map((item) => {
                      const Glyph = item.glyph;
                      if (item.more) {
                        return (
                          <li key="more" className="!m-0 flex items-center">
                            <a
                              href="/docs/integrations"
                              className="inline-flex items-center gap-3 text-[21px] font-bold tracking-tight !text-zinc-500 !no-underline transition-colors hover:!text-[#fbc646]"
                            >
                              <Plus
                                className="size-6 shrink-0"
                                strokeWidth={2}
                              />
                              more
                            </a>
                          </li>
                        );
                      }
                      return (
                        <li
                          key={item.name}
                          className="!m-0 flex min-w-0 items-center gap-3"
                        >
                          {item.logo ? (
                            <img
                              src={`/img/integration-${item.logo}.svg`}
                              alt=""
                              className="size-6 shrink-0 object-contain"
                            />
                          ) : (
                            Glyph && (
                              <Glyph
                                className="size-6 shrink-0 text-zinc-300"
                                strokeWidth={1.75}
                              />
                            )
                          )}
                          <span className="truncate text-[21px] font-bold tracking-tight text-zinc-100">
                            {item.name}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </HighlighterItem>
            </motion.div>
          );
        })}
      </BentoGrid>
    </div>
  </section>
);
