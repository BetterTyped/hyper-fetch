import Link from "@docusaurus/Link";
import { cn } from "@site/src/lib/utils";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Atom,
  BookOpen,
  Bot,
  Boxes,
  Braces,
  Cable,
  Code2,
  Compass,
  Database,
  FileCode,
  FlaskConical,
  Gauge,
  GraduationCap,
  Layers,
  ListOrdered,
  type LucideIcon,
  Network,
  Play,
  PlugZap,
  Puzzle,
  Radio,
  RefreshCw,
  Rocket,
  Send,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Timer,
  WifiOff,
  Workflow,
  Wrench,
  Zap,
} from "lucide-react";
import React from "react";

/* Icons an MDX page can name, so pages pick a glyph without importing lucide themselves */
const icons = {
  activity: Activity,
  atom: Atom,
  book: BookOpen,
  bot: Bot,
  boxes: Boxes,
  braces: Braces,
  cable: Cable,
  code: Code2,
  compass: Compass,
  database: Database,
  file: FileCode,
  flask: FlaskConical,
  gauge: Gauge,
  learn: GraduationCap,
  layers: Layers,
  list: ListOrdered,
  network: Network,
  play: Play,
  plug: PlugZap,
  puzzle: Puzzle,
  radio: Radio,
  refresh: RefreshCw,
  rocket: Rocket,
  send: Send,
  server: Server,
  shield: ShieldCheck,
  sparkles: Sparkles,
  terminal: Terminal,
  timer: Timer,
  offline: WifiOff,
  workflow: Workflow,
  wrench: Wrench,
  zap: Zap,
} satisfies Record<string, LucideIcon>;

export type OverviewIcon = keyof typeof icons;

/** The opening paragraph of an overview: one or two sentences on what it is and why it matters */
export const Lead = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-8 mt-2 !text-zinc-300 [&_code]:!text-[16px] [&_p]:!my-0 [&_p]:!text-[20px] [&_p]:!leading-[1.6] [&_strong]:!text-zinc-50">
    {children}
  </div>
);

export interface TilesProps {
  /** Columns on wide screens, 2 or 3 */
  cols?: 2 | 3;
  children: React.ReactNode;
}

/** A grid of tiles: the places a reader can go next, scannable at a glance */
export const Tiles = ({ cols = 2, children }: TilesProps) => (
  <div className={cn("not-prose my-6 grid gap-3 sm:grid-cols-2", cols === 3 && "xl:grid-cols-3")}>{children}</div>
);

export interface TileProps {
  title: string;
  /** Where the tile leads, a docs, guide or example URL */
  to: string;
  icon?: OverviewIcon;
  /** A short label next to the title, for example a package name or "5 min" */
  meta?: string;
  /** One sentence on what the reader gets there */
  children?: React.ReactNode;
}

/** One destination: an icon, a title and one line, styled like the integration cards */
export const Tile = ({ title, to, icon, meta, children }: TileProps) => {
  const Icon = icon ? icons[icon] : undefined;
  return (
    <Link
      to={to}
      className={cn(
        "group relative flex h-full gap-3.5 rounded-2xl border border-solid border-white/[0.06] bg-[#1f1f21] p-4",
        "!no-underline transition-colors duration-200 hover:border-white/[0.12] hover:bg-[#242427]",
      )}
    >
      {Icon && (
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] ring-1 ring-inset ring-white/[0.08]">
          <Icon className="size-[19px] text-amber-300" strokeWidth={1.75} />
        </span>
      )}
      <span className="min-w-0 flex-1 pr-5">
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[15px] font-semibold tracking-[-0.01em] !text-zinc-50">{title}</span>
          {meta && <span className="font-mono text-[12px] !text-zinc-500">{meta}</span>}
        </span>
        {children && (
          <span className="mt-1 block text-[14px] leading-relaxed !text-zinc-400 [&_code]:!text-[12.5px] [&_p]:!my-0 [&_p]:!text-[14px] [&_p]:!leading-relaxed [&_p]:!text-inherit">
            {children}
          </span>
        )}
      </span>
      <ArrowUpRight className="absolute right-4 top-4 size-4 text-zinc-600 transition-[color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-zinc-200" />
    </Link>
  );
};

export interface FlowProps {
  /** A short caption under the diagram */
  caption?: string;
  children: React.ReactNode;
}

/**
 * A concept diagram: a few steps in a row joined by arrows, stacked on phones. Use it for the one flow a reader needs
 * to picture, such as a request going from your code to the cache.
 */
export const Flow = ({ caption, children }: FlowProps) => {
  const steps = React.Children.toArray(children);
  return (
    <figure className="not-prose my-8">
      <div className="relative overflow-hidden rounded-2xl border border-solid border-white/[0.06] bg-[#1b1b1d] p-4 sm:p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(251,198,70,0.07),transparent)]"
        />
        <ol className="relative !m-0 flex list-none flex-col items-stretch gap-2 !p-0 md:flex-row">
          {steps.map((step, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <React.Fragment key={index}>
              {index > 0 && (
                <li aria-hidden className="!m-0 flex shrink-0 items-center justify-center text-zinc-600">
                  <ArrowRight className="size-4 rotate-90 md:rotate-0" />
                </li>
              )}
              {step}
            </React.Fragment>
          ))}
        </ol>
      </div>
      {caption && <figcaption className="mt-2 text-center text-[13px] !text-zinc-500">{caption}</figcaption>}
    </figure>
  );
};

export interface FlowStepProps {
  title: string;
  icon?: OverviewIcon;
  /** Marks the step the page is about */
  active?: boolean;
  /** A few words on what happens at this step */
  children?: React.ReactNode;
}

/** One step of a <Flow> */
export const FlowStep = ({ title, icon, active, children }: FlowStepProps) => {
  const Icon = icon ? icons[icon] : undefined;
  return (
    <li
      className={cn(
        "!m-0 flex min-w-0 flex-1 flex-col gap-1 rounded-xl border border-solid px-2.5 py-3",
        active ? "border-amber-300/30 bg-amber-300/[0.06]" : "border-white/[0.06] bg-white/[0.02]",
      )}
    >
      <span className="flex items-center gap-1.5">
        {Icon && <Icon className={cn("size-4 shrink-0", active ? "text-amber-300" : "text-zinc-400")} strokeWidth={1.75} />}
        <span className="text-[13.5px] font-semibold !text-zinc-100">{title}</span>
      </span>
      {children && (
        <span className="text-[12.5px] leading-snug !text-zinc-400 [&_code]:!text-[11.5px] [&_p]:!my-0 [&_p]:!text-[12.5px] [&_p]:!leading-snug [&_p]:!text-inherit">
          {children}
        </span>
      )}
    </li>
  );
};
