import Link from "@docusaurus/Link";
import { usePluginData } from "@docusaurus/useGlobalData";
import { cn } from "@site/src/lib/utils";
import { ArrowUpRight, Search, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

import type {
  ExampleEntry,
  ExamplesPluginData,
} from "../../../plugins/examples";
type ExampleLevel = ExampleEntry["level"];

const levels: ExampleLevel[] = ["beginner", "intermediate", "advanced"];

export const levelClassName: Record<ExampleLevel, string> = {
  beginner: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  intermediate: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  advanced: "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300",
};

const levelDot: Record<ExampleLevel, string> = {
  beginner: "bg-emerald-400",
  intermediate: "bg-sky-400",
  advanced: "bg-fuchsia-400",
};

export const useExamples = () =>
  (usePluginData("hyper-fetch-examples") as ExamplesPluginData).examples;

const segment = (active: boolean) =>
  cn(
    "flex h-8 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border-0 px-3 text-[13px] font-medium transition-colors",
    active
      ? "bg-zinc-100 text-zinc-900"
      : "bg-transparent text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100",
  );

const chip = (active: boolean) =>
  cn(
    "shrink-0 cursor-pointer whitespace-nowrap rounded-full border border-solid px-2.5 py-1 text-xs font-medium transition-colors",
    active
      ? "border-[#fbc646] bg-[#fbc646] text-zinc-950"
      : "border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-100",
  );

const ExampleCard = ({
  example,
  tag,
  onTag,
}: {
  example: ExampleEntry;
  tag: string | null;
  onTag: (t: string) => void;
}) => (
  <div className="group relative flex h-full flex-col rounded-2xl bg-[#1f1f21] p-4 ring-1 ring-inset ring-white/[0.06] transition-[background-color,box-shadow] duration-200 hover:bg-[#242427] hover:ring-white/[0.14]">
    <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500">
      <span
        className={cn("size-1.5 rounded-full", levelDot[example.level])}
        aria-hidden
      />
      <span className="capitalize tracking-normal normal-case text-zinc-400">
        {example.level}
      </span>
      <span aria-hidden>·</span>
      <span className="truncate">{example.category}</span>
    </div>
    <Link
      to={example.permalink}
      className="mt-2.5 pr-6 text-[15px] font-semibold leading-snug tracking-[-0.01em] !text-zinc-100 !no-underline after:absolute after:inset-0 after:rounded-2xl"
    >
      {example.title}
    </Link>
    <ArrowUpRight className="absolute right-4 top-4 size-4 text-zinc-600 transition-[color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#fbc646]" />
    <p className="m-0 mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-zinc-400">
      {example.description}
    </p>
    {example.tags.length > 0 && (
      <div className="relative z-10 mt-auto flex flex-wrap gap-1 pt-3.5">
        {example.tags.slice(0, 4).map((value) => (
          <button
            key={value}
            type="button"
            className={chip(tag === value)}
            onClick={() => onTag(value)}
          >
            {value}
          </button>
        ))}
      </div>
    )}
  </div>
);

/**
 * Every example page as a searchable grid. Search, a category, a level and a topic narrow it together; the bar stays
 * under the navbar while the grid scrolls. Built from the pages' front matter, so a new page shows up by itself.
 */
export const ExamplesCatalog = () => {
  const examples = useExamples();
  const inputRef = useRef<HTMLInputElement>(null);

  // Most used topics first, so the useful filters come first in the scrolling row
  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    examples
      .flatMap((example) => example.tags)
      .forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([t]) => t);
  }, [examples]);
  const categories = useMemo(
    () => [...new Set(examples.map((example) => example.category))],
    [examples],
  );

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [level, setLevel] = useState<ExampleLevel | null>(null);

  // "/" jumps to the search, the way the docs search works
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        event.key !== "/" ||
        target?.closest("input, textarea, [contenteditable]")
      )
        return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  // Everything but the category, so each category tab can show how many matches it holds
  const matching = examples.filter((example) => {
    if (tag && !example.tags.includes(tag)) return false;
    if (level && example.level !== level) return false;
    const text = [
      example.title,
      example.description,
      example.category,
      example.path,
      ...example.tags,
    ]
      .join(" ")
      .toLowerCase();
    return words.every((word) => text.includes(word));
  });
  const filtered = category
    ? matching.filter((example) => example.category === category)
    : matching;
  const filtering = Boolean(words.length || tag || level || category);
  const groups = category
    ? [category]
    : categories.filter((c) => filtered.some((e) => e.category === c));

  const clear = () => {
    setQuery("");
    setCategory(null);
    setTag(null);
    setLevel(null);
  };

  return (
    <div className="examples-catalog mt-6">
      <div className="sticky top-[var(--ifm-navbar-height)] z-20 -mx-2 rounded-2xl bg-[#1c1c1d]/85 px-2 pb-3 pt-2 backdrop-blur-xl">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl bg-[#1f1f21] px-3.5 ring-1 ring-inset ring-white/[0.08] transition-shadow focus-within:ring-[#fbc646]/50">
            <Search className="size-4 shrink-0 text-zinc-500" aria-hidden />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${examples.length} examples by name, hook or feature`}
              className="w-full min-w-0 border-0 bg-transparent text-[15px] text-zinc-100 outline-none placeholder:text-zinc-500"
              aria-label="Search examples"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                className="flex size-6 cursor-pointer items-center justify-center rounded-md border-0 bg-white/[0.06] text-zinc-400 hover:text-zinc-100"
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
          <div className="flex shrink-0 items-center gap-0.5 overflow-x-auto rounded-xl bg-[#1f1f21] p-1 ring-1 ring-inset ring-white/[0.08] [scrollbar-width:none]">
            <button
              type="button"
              className={segment(level === null)}
              onClick={() => setLevel(null)}
            >
              All levels
            </button>
            {levels.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={level === value}
                className={cn(segment(level === value), "capitalize")}
                onClick={() => setLevel(level === value ? null : value)}
              >
                <span
                  className={cn("size-1.5 rounded-full", levelDot[value])}
                  aria-hidden
                />
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2.5 flex gap-1 overflow-x-auto [mask-image:linear-gradient(to_right,black_92%,transparent)] [scrollbar-width:none]">
          <button
            type="button"
            className={segment(category === null)}
            onClick={() => setCategory(null)}
          >
            All{" "}
            <span className="tabular-nums opacity-60">{matching.length}</span>
          </button>
          {categories.map((value) => {
            const count = matching.filter(
              (example) => example.category === value,
            ).length;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={category === value}
                disabled={!count && category !== value}
                className={cn(
                  segment(category === value),
                  "disabled:cursor-default disabled:opacity-35",
                )}
                onClick={() => setCategory(category === value ? null : value)}
              >
                {value} <span className="tabular-nums opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pr-8 [mask-image:linear-gradient(to_right,black_92%,transparent)] [scrollbar-width:none]">
          <span className="shrink-0 pr-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Topic
          </span>
          {tags.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={tag === value}
              className={chip(tag === value)}
              onClick={() => setTag(tag === value ? null : value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex h-6 items-center justify-between text-[13px] text-zinc-500">
        <span>
          {filtering
            ? `${filtered.length} of ${examples.length} examples`
            : `${examples.length} examples`}
        </span>
        {filtering && (
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent text-[13px] text-zinc-400 hover:text-white"
            onClick={clear}
          >
            <X className="size-3.5" aria-hidden /> Clear filters
          </button>
        )}
      </div>

      {groups.map((group) => (
        <section key={group} className="mt-6 first-of-type:mt-3">
          <h2 className="!mb-3 !mt-0 flex items-baseline gap-2 text-base font-semibold tracking-[-0.01em] text-zinc-200">
            {group}
            <span className="text-[13px] font-medium tabular-nums text-zinc-500">
              {filtered.filter((example) => example.category === group).length}
            </span>
          </h2>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered
              .filter((example) => example.category === group)
              .map((example) => (
                <ExampleCard
                  key={example.permalink}
                  example={example}
                  tag={tag}
                  onTag={(value) => setTag(tag === value ? null : value)}
                />
              ))}
          </div>
        </section>
      ))}

      {!filtered.length && (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl bg-[#1f1f21] px-6 py-12 text-center ring-1 ring-inset ring-white/[0.06]">
          <p className="m-0 text-zinc-300">No example matches these filters.</p>
          <button
            type="button"
            className="cursor-pointer rounded-lg border-0 bg-white/[0.08] px-3 py-1.5 text-[13px] font-medium text-zinc-100 hover:bg-white/[0.12]"
            onClick={clear}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};
