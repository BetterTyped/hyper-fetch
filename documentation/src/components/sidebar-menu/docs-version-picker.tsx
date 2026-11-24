import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CornerDownLeft,
  History,
  Layers,
} from "lucide-react";
import Link from "@docusaurus/Link";
import {
  useActiveDocContext,
  useActiveVersion,
  useVersions,
} from "@docusaurus/plugin-content-docs/client";
import type {
  ActiveDocContext,
  GlobalVersion,
} from "@docusaurus/plugin-content-docs/client";
import { cn } from "@site/src/lib/utils";

import {
  Kbd,
  PanelHighlight,
  panelMotion,
  pickerPanelClass,
  usePanelPosition,
} from "./section-picker";

import "./section-picker.css";

const DOCS_PLUGIN_ID = "default";
const RELEASE_POST = "/blog/hyper-fetch-10-0";
const PANEL_WIDTH = 260;

function pathForVersion(version: GlobalVersion, ctx: ActiveDocContext): string {
  const samePage = ctx.alternateDocVersions[version.name];
  if (samePage) {
    return samePage.path;
  }
  const main = version.docs.find((d) => d.id === version.mainDocId);
  return main?.path ?? version.path;
}

/** "v10.0.0" → "10", for the number on the version tile */
const majorOf = (label: string) => /\d+/.exec(label)?.[0] ?? label;

/** The major on its tile. The latest version glows gold, older ones stay neutral. */
const VersionTile = ({
  version,
  size,
}: {
  version: GlobalVersion;
  size: "sm" | "md";
}) => (
  <span className="relative flex shrink-0">
    {version.isLast && (
      <span
        className={cn(
          "absolute inset-0 scale-125 bg-amber-400/40 opacity-60 blur-xl",
          size === "md" ? "rounded-[10px]" : "rounded-lg",
        )}
        aria-hidden
      />
    )}
    <span
      className={cn(
        "relative flex items-center justify-center font-mono font-bold tabular-nums ring-1",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
        size === "md"
          ? "h-9 w-9 rounded-[10px] text-[15px]"
          : "h-8 w-8 rounded-lg text-[13px]",
        version.isLast
          ? "bg-amber-400/[0.12] ring-amber-400/25"
          : "bg-white/[0.06] text-zinc-400 ring-white/10",
      )}
    >
      <span className={cn(version.isLast && "bt-gold-text")}>
        {majorOf(version.label)}
      </span>
    </span>
  </span>
);

const VersionStatus = ({ version }: { version: GlobalVersion }) =>
  version.isLast ? (
    <span className="inline-flex items-center gap-1.5 text-emerald-300/90">
      <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
      Latest
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-zinc-500">
      <History className="size-3" aria-hidden />
      Previous major
    </span>
  );

/**
 * Switches the docs to another major, on the same page when it exists there. Built like the section pickers above it:
 * a trigger card in the sidebar and a panel portaled to the body.
 */
export function DocsVersionPicker(): React.JSX.Element | null {
  const versions = useVersions(DOCS_PLUGIN_ID);
  const activeVersion = useActiveVersion(DOCS_PLUGIN_ID);
  const docContext = useActiveDocContext(DOCS_PLUGIN_ID);

  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [mounted, setMounted] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const close = (focusButton = false) => {
    setOpen(false);
    if (focusButton) {
      buttonRef.current?.focus();
    }
  };

  const position = usePanelPosition({
    open,
    triggerRef: buttonRef,
    panelRef,
    // Starts at the left edge of the sidebar, where the section picker's panel starts too
    alignRef: rowRef,
    width: PANEL_WIDTH,
    onOutside: () => close(),
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      return;
    }
    setHighlighted(
      Math.max(
        0,
        versions.findIndex((version) => version.name === activeVersion?.name),
      ),
    );
    requestAnimationFrame(() => listRef.current?.focus());
    // Runs when the panel opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (versions.length < 2 || !activeVersion) {
    return null;
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((index) => (index + 1) % versions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted(
        (index) => (index - 1 + versions.length) % versions.length,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      listRef.current
        ?.querySelector<HTMLAnchorElement>(`[data-index="${highlighted}"]`)
        ?.click();
    } else if (event.key === "Escape" || event.key === "Tab") {
      event.preventDefault();
      close(true);
    }
  };

  const panel = (
    <AnimatePresence>
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
          <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-3.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
              Docs version
            </span>
            <Kbd>esc</Kbd>
          </div>
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-label="Documentation versions"
            aria-activedescendant={`${listId}-${highlighted}`}
            onKeyDown={onKeyDown}
            className="flex flex-col gap-0.5 p-1.5 pt-0 outline-none"
          >
            {versions.map((version, index) => {
              const selected = version.name === activeVersion.name;
              const active = index === highlighted;
              return (
                <Link
                  key={version.name}
                  id={`${listId}-${index}`}
                  data-index={index}
                  to={pathForVersion(version, docContext)}
                  role="option"
                  aria-selected={active}
                  aria-current={selected ? "page" : undefined}
                  tabIndex={-1}
                  onMouseMove={() => !active && setHighlighted(index)}
                  onClick={() => close()}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-2.5 py-2 !no-underline transition-colors duration-100",
                    active ? "bg-white/[0.07]" : "hover:bg-white/[0.04]",
                  )}
                >
                  <VersionTile version={version} size="sm" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span
                      className={cn(
                        "truncate font-mono text-sm font-semibold tabular-nums",
                        active ? "text-white" : "text-zinc-200",
                      )}
                    >
                      {version.label}
                    </span>
                    <span className="text-[11px] font-medium">
                      <VersionStatus version={version} />
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
              );
            })}
          </div>
          <Link
            to={RELEASE_POST}
            onClick={() => close()}
            className="group flex items-center justify-between gap-2 border-t border-white/[0.06] bg-black/20 px-4 py-2.5 text-xs font-semibold !text-zinc-400 !no-underline hover:!text-white"
          >
            What is new in{" "}
            {versions
              .find((version) => version.isLast)
              ?.label.replace(/\.0\.0$/, "")}
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="section-picker w-full min-w-0">
      <div
        ref={rowRef}
        className="flex min-w-0 items-center justify-between gap-2"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          <Layers className="h-3.5 w-3.5 text-amber-400/90" aria-hidden />
          Docs version
        </span>
        <button
          ref={buttonRef}
          type="button"
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-lg border py-1 pl-2 pr-1.5",
            "font-mono text-[12px] font-semibold tabular-nums leading-none text-zinc-200",
            "border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
            "outline-none transition-all duration-150",
            "hover:border-amber-400/30 hover:text-white",
            "focus-visible:ring-2 focus-visible:ring-amber-400/35",
            open && "border-amber-400/40 text-amber-100",
          )}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => (open ? close() : setOpen(true))}
          onKeyDown={(event) => {
            if (
              !open &&
              (event.key === "ArrowDown" || event.key === "ArrowUp")
            ) {
              event.preventDefault();
              setOpen(true);
            }
          }}
        >
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              activeVersion.isLast
                ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                : "bg-zinc-500",
            )}
            aria-hidden
          />
          {activeVersion.label}
          <ChevronDown
            className={cn(
              "h-3 w-3 shrink-0 text-zinc-500 transition-transform duration-200",
              open && "rotate-180 text-amber-400/90",
            )}
            aria-hidden
            strokeWidth={2.5}
          />
        </button>
      </div>

      {mounted && createPortal(panel, document.body)}
    </div>
  );
}
