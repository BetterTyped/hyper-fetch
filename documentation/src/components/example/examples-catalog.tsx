import Link from "@docusaurus/Link";
import { usePluginData } from "@docusaurus/useGlobalData";
import { cn } from "@site/src/lib/utils";
import { Search, X } from "lucide-react";
import React, { useMemo, useState } from "react";

import type { ExampleEntry, ExamplesPluginData } from "../../../plugins/examples";
type ExampleLevel = ExampleEntry["level"];

const levels: ExampleLevel[] = ["beginner", "intermediate", "advanced"];
const VISIBLE_TAGS = 14;

export const levelClassName: Record<ExampleLevel, string> = {
  beginner: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  intermediate: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  advanced: "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300",
};

const chipClassName = (active: boolean) =>
  cn(
    "cursor-pointer rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
    active
      ? "border-yellow-400 bg-yellow-400 text-zinc-950"
      : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500",
  );

/** The most used tags, plus the selected one when it was picked from a card. */
const visibleTags = (all: string[], selected: string | null) => {
  const first = all.slice(0, VISIBLE_TAGS);
  return selected && !first.includes(selected) ? [...first, selected] : first;
};

export const useExamples = () => (usePluginData("hyper-fetch-examples") as ExamplesPluginData).examples;

const ExampleCard = ({ example, onTag }: { example: ExampleEntry; onTag: (tag: string) => void }) => (
  <div className="relative flex h-full flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:border-zinc-600">
    <div className="flex items-start justify-between gap-2">
      <Link
        to={example.permalink}
        className="text-base font-semibold !text-zinc-100 !no-underline after:absolute after:inset-0"
      >
        {example.title}
      </Link>
      <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[11px]", levelClassName[example.level])}>
        {example.level}
      </span>
    </div>
    <p className="m-0 text-sm text-zinc-400">{example.description}</p>
    <div className="relative z-10 mt-auto flex flex-wrap gap-1.5 pt-2">
      {example.tags.map((tag) => (
        <button key={tag} type="button" className={chipClassName(false)} onClick={() => onTag(tag)}>
          {tag}
        </button>
      ))}
    </div>
  </div>
);

/**
 * Searchable list of every example page, grouped like the sidebar. It is built from the pages' front matter, so a
 * new page shows up here by itself.
 */
export const ExamplesCatalog = () => {
  const examples = useExamples();

  // Most used tags first, so the useful filters are visible without expanding the list.
  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    examples.flatMap((example) => example.tags).forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([tag]) => tag);
  }, [examples]);

  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [level, setLevel] = useState<ExampleLevel | null>(null);
  const [showAllTags, setShowAllTags] = useState(false);

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = examples.filter((example) => {
    if (tag && !example.tags.includes(tag)) return false;
    if (level && example.level !== level) return false;
    const text = [example.title, example.description, example.category, example.path, ...example.tags]
      .join(" ")
      .toLowerCase();
    return words.every((word) => text.includes(word));
  });
  const categories = [...new Set(filtered.map((example) => example.category))];
  const filtering = Boolean(words.length || tag || level);

  const pickTag = (value: string) => setTag(tag === value ? null : value);

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <label className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 focus-within:border-zinc-500">
          <Search className="size-4 shrink-0 text-zinc-500" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${examples.length} examples by name, hook or feature`}
            className="w-full border-0 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
            aria-label="Search examples"
          />
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
          {levels.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={level === value}
              className={chipClassName(level === value)}
              onClick={() => setLevel(level === value ? null : value)}
            >
              {value}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-zinc-700" aria-hidden />
          {(showAllTags ? tags : visibleTags(tags, tag)).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={tag === value}
              className={chipClassName(tag === value)}
              onClick={() => pickTag(value)}
            >
              {value}
            </button>
          ))}
          {tags.length > VISIBLE_TAGS && (
            <button
              type="button"
              className="cursor-pointer border-0 bg-transparent px-1 text-xs text-zinc-400 hover:text-white"
              onClick={() => setShowAllTags(!showAllTags)}
            >
              {showAllTags ? "Fewer tags" : `+${tags.length - VISIBLE_TAGS} more`}
            </button>
          )}
        </div>
        {filtering && (
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>
              {filtered.length} of {examples.length} examples
            </span>
            <button
              type="button"
              className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent text-xs text-zinc-300 hover:text-white"
              onClick={() => {
                setQuery("");
                setTag(null);
                setLevel(null);
              }}
            >
              <X className="size-3" aria-hidden /> Clear filters
            </button>
          </div>
        )}
      </div>

      {categories.map((category) => (
        <section key={category} className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">{category}</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filtered
              .filter((example) => example.category === category)
              .map((example) => (
                <ExampleCard key={example.permalink} example={example} onTag={pickTag} />
              ))}
          </div>
        </section>
      ))}
      {!filtered.length && <p className="mt-8 text-zinc-400">No example matches these filters.</p>}
    </div>
  );
};
