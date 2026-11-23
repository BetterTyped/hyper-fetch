import Link from "@docusaurus/Link";
import { usePluginData } from "@docusaurus/useGlobalData";
import { cn } from "@site/src/lib/utils";
import {
  AppWindow,
  ArrowUpRight,
  Boxes,
  Database,
  Download,
  Layers,
  type LucideIcon,
  PencilLine,
  Plug,
  Radio,
  Rocket,
  Search,
  SlidersHorizontal,
  WifiOff,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

import type { ExampleEntry, ExamplesPluginData } from "../../../plugins/examples";

export const useExamples = () => (usePluginData("hyper-fetch-examples") as ExamplesPluginData).examples;

// Keyed by the `label` of each `documentation/examples/<category>/_category_.json`
const categoryIcons: Record<string, LucideIcon> = {
  "Getting started": Rocket,
  "Data fetching": Download,
  Mutations: PencilLine,
  Caching: Database,
  "Request control": SlidersHorizontal,
  "Offline and persistence": WifiOff,
  "Realtime and streaming": Radio,
  "Adapters and integrations": Plug,
  Frameworks: Layers,
  Apps: AppWindow,
};

// Shorter names for the category pills, so every category fits in one row. Section headings keep the full label.
const pillLabels: Record<string, string> = {
  "Offline and persistence": "Offline",
  "Realtime and streaming": "Realtime",
  "Adapters and integrations": "Integrations",
};

const pill = (active: boolean) =>
  cn(
    "flex h-9 shrink-0 cursor-pointer items-center whitespace-nowrap rounded-full border-0 px-3.5 text-sm font-medium transition-colors",
    active ? "bg-zinc-100 text-zinc-950" : "bg-transparent text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100",
  );

const ExampleCard = ({ example }: { example: ExampleEntry }) => (
  <Link
    to={example.permalink}
    className="group relative flex flex-col rounded-2xl bg-[#202022] p-5 !no-underline ring-1 ring-inset ring-white/[0.06] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-[#262629] hover:ring-white/[0.16]"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="!text-[17px] !font-semibold !leading-snug tracking-[-0.01em] !text-zinc-50">{example.title}</div>
      <ArrowUpRight
        className="mt-0.5 size-[18px] shrink-0 text-zinc-600 transition-[color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#fbc646]"
        aria-hidden
      />
    </div>
    <div className="mt-2 line-clamp-2 !text-sm !font-normal !leading-relaxed !text-zinc-400">{example.description}</div>
  </Link>
);

/**
 * The examples index: a searchable grid of every example page, grouped by category. It owns the page header, and the
 * page hides the docs sidebar, so the grid gets the full width. Built from the pages' front matter, so a new page
 * shows up by itself.
 */
export const ExamplesCatalog = () => {
  const examples = useExamples();
  const inputRef = useRef<HTMLInputElement>(null);
  const categories = useMemo(() => [...new Set(examples.map((example) => example.category))], [examples]);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  // "/" jumps to the search, the way the docs search works
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key !== "/" || target?.closest("input, textarea, [contenteditable]")) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  // Search matches the title, description, category and tags, so "useListener" or "offline" find their examples
  const matching = examples.filter((example) => {
    const text = [example.title, example.description, example.category, ...example.tags].join(" ").toLowerCase();
    return words.every((word) => text.includes(word));
  });
  const filtered = category ? matching.filter((example) => example.category === category) : matching;
  const groups = categories.filter((value) => filtered.some((example) => example.category === value));

  const clear = () => {
    setQuery("");
    setCategory(null);
  };

  return (
    <div className="examples-catalog mx-auto w-full max-w-[1400px] pb-24">
      <header className="flex flex-col gap-6 pt-6 md:pt-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="!mb-0 !mt-0 bg-gradient-to-r from-zinc-200/60 via-zinc-200 to-zinc-200/60 bg-clip-text !text-[clamp(2.25rem,4vw,3rem)] font-semibold !leading-[1.1] tracking-[-0.02em] !text-transparent [font-family:Figtree]">
            Examples
          </h1>
          <div className="mt-3 max-w-3xl text-lg leading-relaxed text-zinc-400">
            Runnable HyperFetch apps, from a first request to offline queues, realtime and server rendering.
          </div>
        </div>
        <label className="flex h-11 shrink-0 items-center gap-2.5 rounded-full bg-[#202022] px-4 ring-1 ring-inset ring-white/[0.08] transition-shadow focus-within:ring-[#fbc646]/60 w-full lg:w-80">
          <Search className="size-4 shrink-0 text-zinc-500" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or hook"
            className="w-full min-w-0 border-0 bg-transparent text-[15px] text-zinc-100 outline-none placeholder:text-zinc-500"
            aria-label="Search examples"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-white/[0.08] text-zinc-300 hover:text-white"
              onClick={() => setQuery("")}
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <kbd className="hidden rounded-md border border-solid border-white/10 bg-white/[0.04] px-1.5 font-mono text-[11px] text-zinc-500 shadow-none sm:block">
              /
            </kbd>
          )}
        </label>
      </header>

      <div className="sticky top-[var(--ifm-navbar-height)] z-20 -mx-3 mt-10 bg-[#1c1c1d]/90 px-3 py-3 backdrop-blur-xl">
        <nav
          aria-label="Categories"
          className="-mx-3 flex gap-1 overflow-x-auto px-3 [mask-image:linear-gradient(to_right,black_92%,transparent)] [scrollbar-width:none] lg:mx-0 lg:px-0 lg:[mask-image:none]"
        >
          <button type="button" className={pill(category === null)} onClick={() => setCategory(null)}>
            All
          </button>
          {categories.map((value) => {
            const count = matching.filter((example) => example.category === value).length;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={category === value}
                disabled={!count && category !== value}
                className={cn(pill(category === value), "disabled:cursor-default disabled:opacity-30")}
                onClick={() => setCategory(category === value ? null : value)}
              >
                {pillLabels[value] ?? value}
              </button>
            );
          })}
        </nav>
      </div>

      {groups.map((group) => {
        const Icon = categoryIcons[group] ?? Boxes;
        const items = filtered.filter((example) => example.category === group);
        return (
          <section key={group} className="mt-12 first-of-type:mt-8">
            <h2 className="!mb-5 !mt-0 flex items-center gap-3 !text-2xl font-semibold !leading-tight tracking-[-0.015em] !text-zinc-100 [font-family:Figtree]">
              <span className="flex size-10 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.08]">
                <Icon className="size-5 text-[#fbc646]" aria-hidden />
              </span>
              {group}
              <span className="text-base font-medium tabular-nums text-zinc-500">{items.length}</span>
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {items.map((example) => (
                <ExampleCard key={example.permalink} example={example} />
              ))}
            </div>
          </section>
        );
      })}

      {!filtered.length && (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl bg-[#202022] px-6 py-16 text-center ring-1 ring-inset ring-white/[0.06]">
          <div className="text-lg text-zinc-300">No example matches “{query}”.</div>
          <button
            type="button"
            className="cursor-pointer rounded-full border-0 bg-white/[0.08] px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-white/[0.12]"
            onClick={clear}
          >
            Show all examples
          </button>
        </div>
      )}
    </div>
  );
};
