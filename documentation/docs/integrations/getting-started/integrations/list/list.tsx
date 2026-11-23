import { integrations } from "@site/src/integrations";
import { useSidebar } from "@site/src/hooks/use-sidebar";
import type { Section } from "@site/src/modules";
import { cn } from "@site/src/lib/utils";
import {
  Cpu,
  Database,
  Layers,
  LucideIcon,
  Server,
  Smartphone,
  Sparkles,
  Wrench,
} from "lucide-react";

import { IntegrationCard } from "../card/card";

/*
 * Every integration, grouped by what the reader is connecting rather than by package type. A section joins the
 * first group that matches it; anything no group matches lands in "More", so a new integration is never dropped.
 */

type Group = {
  id: string;
  title: string;
  line: string;
  icon: LucideIcon;
  match: (section: Section) => boolean;
};

const backends = ["tRPC", "oRPC", "Hono", "Elysia"];

const groups: Group[] = [
  {
    id: "backends",
    title: "Typed from your backend",
    line: "The client reads its types from your server code. No schema to write, no code to generate.",
    icon: Server,
    match: (section) => backends.includes(section.label),
  },
  {
    id: "apis",
    title: "APIs and data",
    line: "GraphQL, Firebase and Axios behind the same request API, cache and hooks.",
    icon: Database,
    match: (section) => section.category === "Adapter",
  },
  {
    id: "frameworks",
    title: "Server frameworks",
    line: "Call a backend in any language through a typed SDK generated from its OpenAPI document.",
    icon: Layers,
    match: (section) => section.category === "Framework",
  },
  {
    id: "runtimes",
    title: "Runtimes",
    line: "Run the same client on Node.js, Bun, Deno and the edge.",
    icon: Cpu,
    match: (section) => section.category === "Runtime",
  },
  {
    id: "apps",
    title: "Mobile and desktop",
    line: "Use HyperFetch and its React hooks outside the browser.",
    icon: Smartphone,
    match: (section) => section.category === "Native",
  },
  {
    id: "tooling",
    title: "Tooling and monitoring",
    line: "Lint rules, devtools and error reporting for your requests.",
    icon: Wrench,
    match: (section) =>
      section.category === "Plugin" || section.category === "Monitoring",
  },
];

const more: Group = {
  id: "more",
  title: "More",
  line: "Other integrations.",
  icon: Sparkles,
  match: () => true,
};

const grouped = (() => {
  const sections = integrations.filter(
    (section) => section.category !== "docs",
  );
  const result = new Map<Group, Section[]>();
  sections.forEach((section) => {
    const group = groups.find((g) => g.match(section)) ?? more;
    result.set(group, [...(result.get(group) ?? []), section]);
  });
  return [...groups, more]
    .filter((group) => result.has(group))
    .map((group) => ({ group, items: result.get(group)! }));
})();

export function IntegrationsList() {
  const { sidebar } = useSidebar();
  const pathOf = (section: Section) =>
    sidebar.find((item) => item.section.label === section.label)?.link.path ??
    `/docs/integrations/${section.dir}/overview`;

  return (
    <section className="pb-12">
      <nav
        aria-label="Integration groups"
        className="sticky top-[var(--ifm-navbar-height)] z-20 -mx-2 mb-2 rounded-2xl bg-[#1c1c1d]/85 px-2 py-2.5 backdrop-blur-xl"
      >
        <div className="flex gap-1.5 overflow-x-auto [mask-image:linear-gradient(to_right,black_92%,transparent)] [scrollbar-width:none]">
          {grouped.map(({ group, items }) => (
            <a
              key={group.id}
              href={`#${group.id}`}
              className="flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-white/[0.05] px-3.5 text-[14px] font-medium !text-zinc-200 !no-underline transition-colors hover:bg-white/[0.1] hover:!text-white"
            >
              <group.icon className="size-4 text-zinc-400" />
              {group.title}
              <span className="tabular-nums !text-zinc-500">
                {items.length}
              </span>
            </a>
          ))}
        </div>
      </nav>

      {grouped.map(({ group, items }) => (
        <div
          key={group.id}
          id={group.id}
          className="scroll-mt-[calc(var(--ifm-navbar-height)+4.5rem)] pt-8"
        >
          <div className="mb-4 flex items-start gap-3">
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-zinc-200">
              <group.icon className="size-[18px]" />
            </span>
            <div>
              <h2 className="!m-0 flex items-baseline gap-2 text-[22px] font-bold tracking-[-0.02em] text-zinc-50">
                {group.title}
                <span className="text-[14px] font-medium tabular-nums !text-zinc-500">
                  {items.length}
                </span>
              </h2>
              <p className="!mb-0 mt-1 !text-[15px] !leading-relaxed !text-zinc-400">
                {group.line}
              </p>
            </div>
          </div>
          <div className={cn("grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3")}>
            {items.map((section) => (
              <IntegrationCard
                key={section.label}
                section={section}
                to={pathOf(section)}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
