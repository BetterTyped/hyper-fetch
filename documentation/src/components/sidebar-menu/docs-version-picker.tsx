import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Layers } from "lucide-react";
import Link from "@docusaurus/Link";
import { useActiveDocContext, useActiveVersion, useVersions } from "@docusaurus/plugin-content-docs/client";
import type { ActiveDocContext, GlobalVersion } from "@docusaurus/plugin-content-docs/client";
import { cn } from "@site/src/lib/utils";

const DOCS_PLUGIN_ID = "default";

function pathForVersion(version: GlobalVersion, ctx: ActiveDocContext): string {
  const samePage = ctx.alternateDocVersions[version.name];
  if (samePage) {
    return samePage.path;
  }
  const main = version.docs.find((d) => d.id === version.mainDocId);
  return main?.path ?? version.path;
}

export function DocsVersionPicker(): JSX.Element | null {
  const versions = useVersions(DOCS_PLUGIN_ID);
  const activeVersion = useActiveVersion(DOCS_PLUGIN_ID);
  const docContext = useActiveDocContext(DOCS_PLUGIN_ID);

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  if (versions.length < 2 || !activeVersion) {
    return null;
  }

  return (
    <div ref={rootRef} className="relative z-20 mt-3 w-full min-w-0">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
          <Layers className="h-3.5 w-3.5 text-amber-400/90" aria-hidden />
          Docs version
        </span>
        <button
          type="button"
          className={cn(
            "inline-flex max-w-[min(100%,7rem)] shrink-0 items-center gap-0.5 rounded-md border px-1 py-0.5",
            "text-[9px] font-bold tabular-nums leading-none tracking-tight text-zinc-200",
            "border-zinc-600/90 bg-zinc-800/80 shadow-sm",
            "outline-none transition-all duration-150",
            "hover:border-amber-500/40 hover:bg-zinc-800 hover:text-white",
            "focus-visible:ring-2 focus-visible:ring-amber-400/35 focus-visible:ring-offset-1 focus-visible:ring-offset-[#1c1c1d]",
            open && "border-amber-500/50 bg-zinc-800 text-amber-100 ring-1 ring-amber-500/20",
          )}
          aria-expanded={open}
          aria-haspopup="true"
          aria-controls={menuId}
          onClick={toggle}
        >
          <span className="min-w-0 truncate text-[12px] px-2 py-1">{activeVersion.label}</span>
          <ChevronDown
            className={cn(
              "h-2 w-2 shrink-0 text-zinc-500 transition-transform duration-200",
              open && "rotate-180 text-amber-400/90",
            )}
            aria-hidden
            strokeWidth={2.5}
          />
        </button>
      </div>

      {open ? (
        <nav id={menuId} aria-label="Documentation versions">
          <ul
            className={cn(
              "absolute right-0 top-full z-50 mt-1.5 w-max min-w-[9.5rem] max-w-[min(calc(100vw-2rem),16rem)] max-h-[min(320px,70vh)] overflow-auto rounded-lg border py-1 shadow-2xl",
              "border-zinc-700/90 bg-zinc-950/95 backdrop-blur-md",
              "ring-1 ring-white/5",
            )}
          >
            {versions.map((version) => {
              const href = pathForVersion(version, docContext);
              const selected = version.name === activeVersion.name;
              return (
                <li key={version.name}>
                  <Link
                    to={href}
                    className={cn(
                      "flex items-center justify-between gap-2 px-2 py-1.5 text-[10px] font-semibold !no-underline transition-colors",
                      selected
                        ? "bg-amber-500/10 text-amber-100"
                        : "text-zinc-300 hover:bg-zinc-800/80 hover:text-white",
                    )}
                    aria-current={selected ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate tabular-nums">{version.label}</span>
                      {version.isLast ? (
                        <span className="text-[9px] font-semibold uppercase tracking-wide text-emerald-400/90">
                          Latest
                        </span>
                      ) : null}
                    </span>
                    <Check className={cn("h-3 w-3 shrink-0 text-amber-400", !selected && "invisible")} aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
