import Link from "@docusaurus/Link";
import { useLocation } from "@docusaurus/router";
import { useThemeConfig } from "@docusaurus/theme-common";
import { useNavbarSecondaryMenu } from "@docusaurus/theme-common/internal";
import useBaseUrl from "@docusaurus/useBaseUrl";
import { cn } from "@site/src/lib/utils";
import Search from "@theme/NavbarItem/SearchNavbarItem";
import {
  BookOpen,
  Braces,
  ChevronRight,
  Compass,
  Heart,
  LayoutGrid,
  Newspaper,
  Plug,
  X,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useTransform,
  type Variants,
} from "motion/react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useSwipeToClose } from "./use-swipe-to-close";

/*
 * The mobile navigation as a bottom sheet with one scroll and no nested pages: search on top, the site sections as
 * a row of high-contrast pills, then what the reader needs next. On a docs page that is the area's own page list, so
 * the next page is one tap away. Anywhere else it is the sections with one line each.
 *
 * Portaled to the body, so the sticky navbar never clips or blurs it. No backdrop blur on the full-screen layer:
 * blurring over the animated landing is what drops frames on phones.
 */

interface NavItem {
  label: string;
  to: string;
  activeBaseRegex?: string;
}

interface VersionItem {
  type?: string;
  to: string;
  label: string;
}

const sections: Record<
  string,
  { icon: React.ElementType; name: string; line: string }
> = {
  Docs: {
    icon: BookOpen,
    name: "Docs",
    line: "Core, React, sockets and the CLI",
  },
  Integrations: {
    icon: Plug,
    name: "Integrations",
    line: "Adapters, backends and frameworks",
  },
  Guides: {
    icon: Compass,
    name: "Guides",
    line: "Patterns, recipes and comparisons",
  },
  Api: { icon: Braces, name: "API", line: "Every type and method" },
  Examples: {
    icon: LayoutGrid,
    name: "Examples",
    line: "Runnable apps to fork",
  },
  Blog: { icon: Newspaper, name: "Blog", line: "Releases and tutorials" },
};

const ease = [0.32, 0.72, 0, 1] as const;

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
} as const satisfies Variants;

const sheetVariants = {
  hidden: { y: "100%" },
  visible: { y: 0, transition: { duration: 0.42, ease } },
  exit: { y: "100%", transition: { duration: 0.22, ease: "easeIn" } },
} as const satisfies Variants;

const GitHubIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 16 16"
    className={className}
    fill="currentColor"
    aria-hidden
  >
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

const isActive = (item: NavItem, pathname: string) => {
  if (item.activeBaseRegex)
    return new RegExp(item.activeBaseRegex).test(pathname);
  const base = item.to.replace(/\/$/, "");
  return pathname === base || pathname.startsWith(`${base}/`);
};

export const MobileNav = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const { pathname } = useLocation();
  const { navbar } = useThemeConfig();
  const secondary = useNavbarSecondaryMenu();
  const logo = useBaseUrl("/img/brand/HF.svg");

  const items = useMemo(
    () =>
      (navbar.items as unknown as NavItem[]).filter(
        (item) => item.label && item.to && sections[item.label],
      ),
    [navbar.items],
  );
  const version = useMemo(
    () =>
      (navbar.items as unknown as VersionItem[]).find(
        (item) => item.type === "custom-versionTag",
      ),
    [navbar.items],
  );
  const current = items.find((item) => isActive(item, pathname));
  const hasTree = !!secondary.content;

  const [mounted, setMounted] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const pillsRef = useRef<HTMLDivElement | null>(null);
  const { y, onPointerDown, onClickCapture } = useSwipeToClose({
    open,
    onClose,
    listRef,
  });
  const overlayOpacity = useTransform(y, [0, 320], [1, 0.15]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Bring the active section pill into view, so the row always shows where the reader is
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      pillsRef.current
        ?.querySelector<HTMLElement>("[aria-current=page]")
        ?.scrollIntoView({ inline: "center" });
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const sheet = (
    <AnimatePresence>
      {open && (
        <div key="mobile-nav" className="mobile-nav">
          <motion.div
            className="fixed inset-0 z-[400]"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
            onClick={onClose}
          >
            <motion.div
              className="absolute inset-0 bg-black/70"
              style={{ opacity: overlayOpacity }}
            />
          </motion.div>

          <motion.div
            className="fixed inset-x-0 bottom-0 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[401] mx-auto flex w-full max-w-lg flex-col"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={sheetVariants}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[24px] bg-[#161618] shadow-[0_-24px_60px_-20px_rgba(0,0,0,0.9)] ring-1 ring-inset ring-white/10"
              style={{ y }}
              onPointerDown={onPointerDown}
              onClickCapture={onClickCapture}
            >
              <div className="shrink-0 touch-none select-none px-4">
                <div className="mx-auto mt-2 h-[5px] w-10 rounded-full bg-white/20" />
                <div className="flex h-14 items-center justify-between">
                  <Link to="/" onClick={onClose} className="flex items-center">
                    <img
                      src={logo}
                      alt="HyperFetch"
                      className="h-[22px] w-auto"
                    />
                  </Link>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close navigation"
                    className="flex size-10 cursor-pointer items-center justify-center rounded-full border-0 bg-white/[0.08] text-zinc-200 transition-colors active:bg-white/[0.14]"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>

              {/* DocSearch opens its own modal above the sheet */}
              <div className="mobile-nav-search shrink-0 px-4">
                <Search />
              </div>

              {/* On a docs page the sections become pills above the page list; elsewhere the list below is the sections */}
              {hasTree && (
                <nav aria-label="Sections" className="shrink-0">
                  <div
                    ref={pillsRef}
                    className="flex gap-2 overflow-x-auto px-4 pb-3 pt-3 [mask-image:linear-gradient(to_right,black_88%,transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {items.map((item) => {
                      const section = sections[item.label];
                      const active = item === current;
                      return (
                        <Link
                          key={item.label}
                          to={item.to}
                          onClick={onClose}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[15px] font-semibold !no-underline transition-colors",
                            active
                              ? "bg-zinc-50 !text-zinc-900"
                              : "bg-white/[0.07] !text-zinc-200 active:bg-white/[0.12]",
                          )}
                        >
                          <section.icon className="size-4" />
                          {section.name}
                        </Link>
                      );
                    })}
                  </div>
                </nav>
              )}

              <div
                className={cn(
                  "h-px shrink-0 bg-white/[0.08]",
                  !hasTree && "mt-4",
                )}
              />

              <div
                ref={listRef}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-8 pt-4"
              >
                {hasTree ? (
                  <div className="mobile-nav-tree menu">
                    {secondary.content}
                  </div>
                ) : (
                  <>
                    <ul className="m-0 flex list-none flex-col gap-1 p-0">
                      {items.map((item) => {
                        const section = sections[item.label];
                        return (
                          <li key={item.label}>
                            <Link
                              to={item.to}
                              onClick={onClose}
                              className="flex items-center gap-3.5 rounded-2xl px-2 py-3 !no-underline transition-colors active:bg-white/[0.06]"
                            >
                              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.07] text-zinc-100">
                                <section.icon className="size-5" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-[17px] font-semibold leading-tight !text-zinc-50">
                                  {section.name}
                                </span>
                                <span className="mt-1 block text-[14px] leading-snug !text-zinc-400">
                                  {section.line}
                                </span>
                              </span>
                              <ChevronRight className="size-5 shrink-0 text-zinc-500" />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>

                    {version && (
                      <Link
                        to={version.to}
                        onClick={onClose}
                        className="mt-4 flex items-center gap-3.5 rounded-2xl bg-[#fbc646]/[0.08] px-4 py-3.5 !no-underline ring-1 ring-inset ring-[#fbc646]/25 transition-colors active:bg-[#fbc646]/[0.14]"
                      >
                        <span className="font-mono text-[15px] font-bold !text-[#fbc646]">
                          {version.label}
                        </span>
                        <span className="min-w-0 flex-1 text-[15px] font-semibold !text-zinc-50">
                          HyperFetch 10 is out
                        </span>
                        <ChevronRight className="size-5 shrink-0 text-[#fbc646]" />
                      </Link>
                    )}
                  </>
                )}
              </div>

              <div className="grid shrink-0 grid-cols-2 gap-2 border-0 border-t border-solid border-white/[0.08] bg-[#161618] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
                <a
                  href="https://github.com/BetterTyped/hyper-fetch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white/[0.08] text-[15px] font-semibold !text-zinc-50 !no-underline transition-colors active:bg-white/[0.14]"
                >
                  <GitHubIcon className="size-[18px]" />
                  GitHub
                </a>
                <a
                  href="https://github.com/sponsors/prc5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#db2777] text-[15px] font-semibold !text-white !no-underline transition-colors active:bg-[#be185d]"
                >
                  <Heart className="size-4 fill-white" />
                  Sponsor
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return mounted ? createPortal(sheet, document.body) : null;
};
