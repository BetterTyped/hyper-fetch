import Link from "@docusaurus/Link";
import { Flame } from "lucide-react";
import { useEffect, useState } from "react";
import type { SidebarItem } from "@site/src/hooks/use-sidebar";
import { cn } from "@site/src/lib/utils";
import { npmNameOf } from "@site/src/utils/npm-name";

/** One entry of the list: a page link, or a button when the list filters instead of navigating */
export type PopularEntry = {
  id: string;
  name: string;
  img: SidebarItem["img"];
  /** The section's text color classes, used for the current entry */
  color: string;
  /** Shown on the right in gray: the npm name of a package, or what the section is when it has no package */
  hint: string;
  current: boolean;
} & ({ to: string; onSelect?: never } | { to?: never; onSelect: () => void });

const rowClass = (entry: PopularEntry) =>
  cn(
    "group flex w-full min-w-0 items-center gap-1.5 rounded-md px-1.5 py-[3px] text-left !text-[12px] font-medium leading-5 !no-underline",
    "transition-colors duration-100 hover:bg-white/[0.04]",
    entry.current ? entry.color : "!text-zinc-400 hover:!text-zinc-100",
  );

const Row = ({ entry }: { entry: PopularEntry }) => (
  <>
    <entry.img className="h-3 w-3 shrink-0" aria-hidden />
    {/* The sidebar styles set the size and color of link spans, so the name takes the row's again */}
    <span className="shrink-0 !text-[12px] leading-5 ![color:inherit]">{entry.name}</span>
    <span className="ml-auto min-w-0 truncate pl-2 font-mono !text-[9.5px] font-medium !text-zinc-600">
      {entry.hint}
    </span>
  </>
);

/**
 * The few sections most readers want, one click away under the section picker. Docs, guides and the API link to the
 * package's page in the current area. The examples use it as a filter.
 */
export const PopularList = ({ title = "Popular", entries }: { title?: string; entries: PopularEntry[] }) => {
  if (entries.length === 0) return null;
  return (
    <nav aria-label={title} className="flex flex-col">
      {/* Styled like the "Docs version" label above the picker */}
      <span className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        <Flame className="h-3.5 w-3.5 text-amber-400/90" aria-hidden />
        {title}
      </span>
      {entries.map((entry) =>
        entry.to ? (
          <Link
            key={entry.id}
            to={entry.to}
            aria-current={entry.current ? "page" : undefined}
            className={rowClass(entry)}
          >
            <Row entry={entry} />
          </Link>
        ) : (
          <button
            key={entry.id}
            type="button"
            aria-pressed={entry.current}
            onClick={entry.onSelect}
            className={cn(rowClass(entry), "border-0 bg-transparent")}
          >
            <Row entry={entry} />
          </button>
        ),
      )}
    </nav>
  );
};

/** The npm name of the section's package, or "guide" for a section without one, like Next.js */
export const hintOf = (item: SidebarItem) => npmNameOf(item.section) ?? "guide";

/** The packages the popular list offers in docs, guides and the API */
export const POPULAR_PACKAGES = ["core", "react", "sockets", "db"];
/** The integrations it offers in the integrations area */
export const POPULAR_INTEGRATIONS = ["nextjs", "adapter-graphql", "adapter-trpc", "adapter-firebase"];

/** Which sections an area suggests: a fixed list, or random ones with the fixed list shown until they are drawn */
export type PopularSource = { ids: string[] } | { random: string; fallback: string[] };

const POPULAR_COUNT = 4;

/** The overview page of an area is in the picker already, so it is never suggested */
const isOverview = (item: SidebarItem) =>
  item.section.category.toLowerCase() === "docs" || item.section.dir === "getting-started";

// Drawn once per area and page load, so the suggestions stay put while the reader moves between pages
const draws = new Map<string, string[]>();

const draw = (area: string, items: SidebarItem[]) => {
  const drawn = draws.get(area);
  if (drawn) return drawn;
  const dirs = items.filter((item) => item.section && !isOverview(item)).map((item) => item.section.dir);
  for (let index = dirs.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [dirs[index], dirs[other]] = [dirs[other], dirs[index]];
  }
  // One spare, so the list keeps its length when the current page is among the drawn ones
  const next = dirs.slice(0, POPULAR_COUNT + 1);
  draws.set(area, next);
  return next;
};

/**
 * The entries of an area's popular list. Random suggestions are drawn after hydration, so the server and the first
 * client render agree, and they leave out the page being read.
 */
export const usePopularEntries = (items: SidebarItem[], source: PopularSource): PopularEntry[] => {
  const random = "random" in source ? source.random : null;
  const [drawn, setDrawn] = useState<string[] | null>(null);

  useEffect(() => {
    if (random && items.length) setDrawn(draw(random, items));
  }, [random, items]);

  if ("ids" in source) return popularEntriesOf(items, source.ids);
  if (!drawn) return popularEntriesOf(items, source.fallback);
  const current = items.find((item) => item.active)?.section?.dir;
  return popularEntriesOf(
    items,
    drawn.filter((dir) => dir !== current).slice(0, POPULAR_COUNT),
  );
};

/** The popular entries of an area, built from its sidebar items, in the order of `ids` */
export const popularEntriesOf = (items: SidebarItem[], ids: string[]): PopularEntry[] =>
  ids.flatMap((id) => {
    const item = items.find((candidate) => candidate.section?.dir === id);
    if (!item) return [];
    return [
      {
        id,
        name: item.name,
        img: item.img,
        color: item.section.text,
        hint: hintOf(item),
        current: item.active,
        to: item.link.path,
      },
    ];
  });
