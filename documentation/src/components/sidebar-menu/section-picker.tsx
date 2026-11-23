import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronsUpDown,
  CornerDownLeft,
  Package,
  Search,
} from "lucide-react";
import Link from "@docusaurus/Link";
import type { SidebarItem } from "@site/src/hooks/use-sidebar";
import { cn } from "@site/src/lib/utils";
import { npmNameOf } from "@site/src/utils/npm-name";

import "./section-picker.css";

/** A heading in the picker list and a category chip above it */
export type PickerGroup = {
  title: string;
  /** The chip label */
  short: string;
};

export type SectionPickerProps = {
  items: SidebarItem[];
  activeItem: SidebarItem;
  /** What one entry is, for the search placeholder and counts: "integration", "package" */
  noun: { one: string; many: string };
  /** The group an entry is listed under */
  groupOf: (item: SidebarItem) => PickerGroup;
  /** Position of an entry's group, for sorting entries into group order */
  groupIndexOf: (item: SidebarItem) => number;
  /** How the overview page shows in the button and the footer link */
  overview: { label: string; icon: LucideIcon };
};

const PANEL_WIDTH = 720;
const GAP = 8;
const EDGE = 16;

/** Sections whose logo is dark use a light tile, see the palette in `src/integrations.ts` */
const hasLightTile = (item: SidebarItem) =>
  item.section.icon.includes("bg-zinc-100");

/** The overview is the "Getting Started" page of the area, every other entry is a package or a guide */
const isOverviewItem = (item: SidebarItem) =>
  item.section.category.toLowerCase() === "docs";

/** The logo on its tile. `glow` adds a blurred tile in the brand color behind it. */
export const IconTile = ({
  item,
  size,
  glow,
}: {
  item: SidebarItem;
  size: "sm" | "md" | "lg";
  glow?: boolean;
}) => {
  const box = {
    sm: "h-8 w-8 rounded-lg",
    md: "h-9 w-9 rounded-[10px]",
    lg: "h-14 w-14 rounded-2xl",
  }[size];
  const icon = { sm: "h-[18px] w-[18px]", md: "h-5 w-5", lg: "h-8 w-8" }[size];
  return (
    <span className="relative flex shrink-0">
      {glow && (
        <span
          className={cn(
            "absolute inset-0 scale-125 opacity-60 blur-xl",
            box,
            item.section.icon,
          )}
          aria-hidden
        />
      )}
      <span
        className={cn(
          "relative flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-white/10",
          box,
          // A brand-tinted tile hides logos of the same color, so logos sit on a neutral tile and the brand color
          // goes to the glow. Dark logos (Express, Fastify, Django, Deno) keep the light tile of their section.
          hasLightTile(item) ? item.section.icon : "bg-white/[0.06]",
        )}
      >
        <item.img className={icon} />
      </span>
    </span>
  );
};

export const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex !h-5 !min-w-5 items-center justify-center !rounded-md !border !border-white/10 !bg-white/[0.06] !px-1 !py-0 font-sans !text-[10px] font-semibold leading-none !text-zinc-400 !shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)]">
    {children}
  </kbd>
);

/** The trigger card at the top of the sidebar, shared by the section pickers and the version picker */
export const pickerTriggerClass = (open: boolean) =>
  cn(
    "group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border p-2 pr-3 text-left",
    "border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-white/[0.02]",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_-12px_rgba(0,0,0,0.6)]",
    "outline-none transition-all duration-200",
    "hover:border-white/[0.14] hover:from-white/[0.08]",
    "focus-visible:ring-2 focus-visible:ring-amber-400/40",
    open && "border-amber-400/30 from-white/[0.08]",
  );

/** The floating panel, shared by the section pickers and the version picker */
export const pickerPanelClass = cn(
  "section-picker fixed z-[1000] flex flex-col overflow-hidden rounded-2xl text-sm text-zinc-300",
  "border border-white/10 bg-[#141416]",
  "shadow-[0_32px_80px_-16px_rgba(0,0,0,0.85),0_0_0_1px_rgba(0,0,0,0.4)]",
);

export const panelMotion = {
  initial: { opacity: 0, y: -6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.1 } },
  transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const },
};

/** The thin gold highlight along the top edge of a panel */
export const PanelHighlight = () => (
  <div
    className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/30 to-transparent"
    aria-hidden
  />
);

/** The square chevron button on the right of a trigger */
export const TriggerChevron = ({ open }: { open: boolean }) => (
  <span
    className={cn(
      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-400",
      "transition-colors group-hover:text-zinc-200",
      open && "border-amber-400/30 text-amber-300",
    )}
  >
    <ChevronsUpDown className="h-3.5 w-3.5" aria-hidden />
  </span>
);

/**
 * Places a panel portaled to the body under its trigger, inside the viewport, and closes it on a click outside.
 * The sidebar scrolls and would clip a panel placed inside it.
 */
export const usePanelPosition = ({
  open,
  triggerRef,
  panelRef,
  width,
  align = "start",
  onOutside,
}: {
  open: boolean;
  triggerRef: React.RefObject<HTMLElement | null>;
  panelRef: React.RefObject<HTMLElement | null>;
  /** Fixed width, or the width of the trigger when left out */
  width?: number;
  /** Which edge of the trigger the panel lines up with */
  align?: "start" | "end";
  onOutside: () => void;
}) => {
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  }>();
  const outside = useRef(onOutside);
  outside.current = onOutside;

  useLayoutEffect(() => {
    if (!open) {
      return undefined;
    }
    const place = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      const panelWidth = Math.min(
        width ?? rect.width,
        window.innerWidth - EDGE * 2,
      );
      const anchor = align === "end" ? rect.right - panelWidth : rect.left;
      const left = Math.min(
        Math.max(EDGE, anchor),
        window.innerWidth - panelWidth - EDGE,
      );
      const top = rect.bottom + GAP;
      setPosition({
        top,
        left,
        width: panelWidth,
        maxHeight: Math.max(320, window.innerHeight - top - EDGE),
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, triggerRef, width, align]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !panelRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        outside.current();
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open, panelRef, triggerRef]);

  return position;
};

/**
 * Picks one page of an area from a command palette: search, category chips, a list and a preview of the highlighted
 * entry. The integrations and the API packages outgrew a plain list in the sidebar, so the sidebar shows the current
 * one and opens the rest on demand. The panel is portaled to the body, so the scrolling sidebar never clips it.
 */
export const SectionPicker = ({
  items,
  activeItem,
  noun,
  groupOf,
  groupIndexOf,
  overview,
}: SectionPickerProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState(0);
  // The portal needs the document, so it renders only after hydration
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const overviewItem = items.find(isOverviewItem);
  // Kept in group order, so each group heading shows once
  const entries = useMemo(
    () =>
      items
        .filter((item) => item !== overviewItem)
        .sort((a, b) => groupIndexOf(a) - groupIndexOf(b)),
    [items, overviewItem, groupIndexOf],
  );
  const groups = useMemo(
    () => [...new Set(entries.map((item) => groupOf(item).title))],
    [entries, groupOf],
  );
  const shortOf = (title: string) =>
    entries.map(groupOf).find((g) => g.title === title)?.short ?? title;

  const options = useMemo(() => {
    const search = query.trim().toLowerCase();
    return entries.filter(
      (item) =>
        (!group || groupOf(item).title === group) &&
        (!search ||
          item.name.toLowerCase().includes(search) ||
          groupOf(item).title.toLowerCase().includes(search) ||
          (npmNameOf(item.section) ?? "").includes(search) ||
          item.description.toLowerCase().includes(search)),
    );
  }, [entries, query, group, groupOf]);

  const preview = options[highlighted];
  const isOverview = activeItem === overviewItem;

  const close = (focusButton = false) => {
    setOpen(false);
    setQuery("");
    setGroup(null);
    if (focusButton) {
      buttonRef.current?.focus();
    }
  };

  const position = usePanelPosition({
    open,
    triggerRef: buttonRef,
    panelRef,
    width: PANEL_WIDTH,
    onOutside: () => close(),
  });

  useEffect(() => setMounted(true), []);

  // Start on the current entry and focus the search
  useEffect(() => {
    if (!open) {
      return;
    }
    setHighlighted(Math.max(0, entries.indexOf(activeItem)));
    requestAnimationFrame(() => inputRef.current?.focus());
    // Runs when the panel opens, not on every keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${highlighted}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [highlighted, open, position]);

  // The option is a Link, which adds the trailing slash the routes use, so Enter clicks it instead of pushing a path
  const openHighlighted = () => {
    listRef.current
      ?.querySelector<HTMLAnchorElement>(`[data-index="${highlighted}"]`)
      ?.click();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const count = Math.max(options.length, 1);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((index) => (index + 1) % count);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((index) => (index - 1 + count) % count);
    } else if (event.key === "Enter" && preview) {
      event.preventDefault();
      openHighlighted();
    } else if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "Tab") {
      // Tab walks the categories, so the whole palette works from the keyboard
      event.preventDefault();
      const all: (string | null)[] = [null, ...groups];
      const next =
        (all.indexOf(group) + (event.shiftKey ? -1 : 1) + all.length) %
        all.length;
      setGroup(all[next]);
      setHighlighted(0);
    }
  };

  const OverviewIcon = overview.icon;

  const panel = (
    <AnimatePresence>
      {open && position && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-[2px]"
          aria-hidden
        />
      )}
      {open && position && (
        <motion.div
          key="panel"
          ref={panelRef}
          {...panelMotion}
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
            transformOrigin: "top left",
          }}
          className={pickerPanelClass}
        >
          <PanelHighlight />

          {/* Search */}
          <div className="flex items-center gap-3 px-4 pb-3 pt-3.5">
            <Search
              className="h-[18px] w-[18px] shrink-0 text-zinc-500"
              aria-hidden
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setHighlighted(0);
              }}
              onKeyDown={onKeyDown}
              placeholder={`Search ${noun.many}...`}
              className="min-w-0 flex-1 border-0 bg-transparent text-[15px] font-medium text-zinc-100 outline-none placeholder:text-zinc-500"
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={
                preview ? `${listId}-${highlighted}` : undefined
              }
              aria-label={`Search ${noun.many}`}
              spellCheck={false}
              autoComplete="off"
            />
            <Kbd>esc</Kbd>
          </div>

          {/* Categories */}
          <div
            className="no-scrollbar flex gap-1.5 overflow-x-auto border-b border-white/[0.06] px-3 pb-3"
            style={{
              maskImage:
                "linear-gradient(to right, black calc(100% - 32px), transparent)",
            }}
          >
            {[null, ...groups].map((title) => {
              const count = title
                ? entries.filter((item) => groupOf(item).title === title).length
                : entries.length;
              const selected = group === title;
              return (
                <button
                  key={title ?? "all"}
                  type="button"
                  tabIndex={-1}
                  onClick={() => {
                    setGroup(title);
                    setHighlighted(0);
                    inputRef.current?.focus();
                  }}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
                    selected
                      ? "border-amber-400/30 bg-amber-400/[0.12] text-amber-200"
                      : "border-white/[0.06] bg-white/[0.03] text-zinc-400 hover:border-white/10 hover:bg-white/[0.06] hover:text-zinc-200",
                  )}
                >
                  {title ? shortOf(title) : "All"}
                  <span
                    className={cn(
                      "tabular-nums",
                      selected ? "text-amber-200/60" : "text-zinc-600",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            className="flex min-h-0"
            style={{ height: Math.min(position.maxHeight - 150, 440) }}
          >
            {/* List */}
            <div
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label={noun.many}
              className="min-w-0 flex-1 overflow-y-auto overscroll-contain p-1.5"
            >
              {options.map((item, index) => {
                const selected = item === activeItem;
                const active = index === highlighted;
                const showGroup =
                  !group &&
                  !query &&
                  (index === 0 ||
                    groupOf(options[index - 1]).title !== groupOf(item).title);
                return (
                  <div key={item.link.path}>
                    {showGroup && (
                      <div className="px-2.5 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500 first:pt-1.5">
                        {groupOf(item).title}
                      </div>
                    )}
                    <Link
                      id={`${listId}-${index}`}
                      data-index={index}
                      to={item.link.path}
                      role="option"
                      aria-selected={active}
                      tabIndex={-1}
                      onMouseMove={() => !active && setHighlighted(index)}
                      onClick={() => close()}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-2.5 py-2 !no-underline transition-colors duration-100",
                        active ? "bg-white/[0.07]" : "hover:bg-white/[0.04]",
                      )}
                    >
                      <IconTile item={item} size="sm" />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "truncate text-sm font-semibold",
                              active ? "text-white" : "text-zinc-200",
                            )}
                          >
                            {item.name}
                          </span>
                          {item.isNew && (
                            <span className="rounded-full bg-lime-400/15 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-lime-300">
                              New
                            </span>
                          )}
                          {item.isBeta && (
                            <span className="rounded-full bg-amber-400/15 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-amber-300">
                              Beta
                            </span>
                          )}
                        </span>
                        <span className="truncate text-xs text-zinc-500">
                          {item.description}
                        </span>
                      </span>
                      {selected ? (
                        <Check
                          className="h-4 w-4 shrink-0 text-amber-400"
                          aria-label="Current"
                        />
                      ) : (
                        <CornerDownLeft
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 text-zinc-500 transition-opacity",
                            !active && "opacity-0",
                          )}
                          aria-hidden
                        />
                      )}
                    </Link>
                  </div>
                );
              })}

              {options.length === 0 && (
                <div className="flex flex-col items-center px-6 py-12 text-center">
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/10">
                    <Search className="h-4 w-4 text-zinc-500" aria-hidden />
                  </span>
                  <span className="text-sm font-semibold text-zinc-200">
                    No {noun.many} match &ldquo;{query}&rdquo;
                  </span>
                  <a
                    href="https://github.com/BetterTyped/hyper-fetch/issues"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 text-xs font-medium !text-zinc-500 !no-underline hover:!text-amber-300"
                  >
                    Ask for it on GitHub
                  </a>
                </div>
              )}
            </div>

            {/* Preview */}
            {preview && (
              <div className="hidden min-h-0 w-[264px] shrink-0 flex-col overflow-y-auto overscroll-contain bg-white/[0.02] p-5 md:flex [&>*]:shrink-0">
                <IconTile item={preview} size="lg" glow />
                <div className="mt-4 text-lg font-bold leading-tight tracking-tight text-white">
                  {preview.name}
                </div>
                <div className="mt-1 text-xs font-medium text-zinc-500">
                  {groupOf(preview).title}
                </div>
                {preview.section.isPackage ? (
                  <span className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300 ring-1 ring-inset ring-amber-400/20">
                    <Package className="h-3 w-3" aria-hidden />
                    Official package
                  </span>
                ) : (
                  <span className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-sky-400/10 px-2 py-0.5 text-[11px] font-semibold text-sky-300 ring-1 ring-inset ring-sky-400/20">
                    <BookOpen className="h-3 w-3" aria-hidden />
                    Guide
                  </span>
                )}
                <div className="mt-3 text-[13px] leading-relaxed text-zinc-400">
                  {preview.description}
                </div>
                {npmNameOf(preview.section) && (
                  <code className="mt-4 block truncate !rounded-lg !border !border-white/[0.06] !bg-black/30 !px-2.5 !py-1.5 font-mono !text-[11px] !text-zinc-300">
                    <span className="text-zinc-500">npm i </span>
                    {npmNameOf(preview.section)}
                  </code>
                )}
                <Link
                  to={preview.link.path}
                  tabIndex={-1}
                  onClick={() => close()}
                  className="group mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold !text-amber-300 !no-underline hover:!text-amber-200"
                >
                  {preview === activeItem ? "You are here" : "Open docs"}
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 border-t border-white/[0.06] bg-black/20 px-4 py-2.5">
            <div className="hidden items-center gap-3 text-[11px] font-medium text-zinc-500 sm:flex">
              <span className="flex items-center gap-1">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <Kbd>↵</Kbd>
                Open
              </span>
              <span className="flex items-center gap-1">
                <Kbd>tab</Kbd>
                Category
              </span>
            </div>
            {overviewItem && (
              <Link
                to={overviewItem.link.path}
                onClick={() => close()}
                className="group ml-auto inline-flex items-center gap-1.5 text-xs font-semibold !text-zinc-400 !no-underline hover:!text-white"
              >
                <OverviewIcon className="h-3.5 w-3.5" aria-hidden />
                {overview.label}
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="section-picker">
      <button
        ref={buttonRef}
        type="button"
        className={pickerTriggerClass(open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? close() : setOpen(true))}
        onKeyDown={(event) => {
          if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {isOverview ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-zinc-300 ring-1 ring-white/10">
            <OverviewIcon className="h-[18px] w-[18px]" />
          </span>
        ) : (
          <IconTile item={activeItem} size="md" glow />
        )}
        <span className="flex min-w-0 flex-1 flex-col">
          <span
            className={cn(
              "line-clamp-2 text-sm font-bold leading-tight",
              isOverview ? "text-zinc-100" : activeItem.section.text,
            )}
          >
            {isOverview ? overview.label : activeItem.name}
          </span>
          <span className="truncate text-[11px] font-medium text-zinc-500">
            {isOverview
              ? `${entries.length} ${noun.many}`
              : shortOf(groupOf(activeItem).title)}
          </span>
        </span>
        <TriggerChevron open={open} />
      </button>

      {mounted && createPortal(panel, document.body)}
    </div>
  );
};
