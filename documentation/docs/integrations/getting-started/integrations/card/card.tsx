import Link from "@docusaurus/Link";
import { Section } from "@site/src/modules";
import { cn } from "@site/src/lib/utils";
import { ArrowUpRight } from "lucide-react";

export type CardProps = {
  section: Section;
  /** The integration's first page, from the sidebar; defaults to its overview */
  to?: string;
  className?: string;
};

/* One integration: its logo on a light tile, the name with its package and status, and one line */
export function IntegrationCard({ section, to, className }: CardProps) {
  const Icon = section.img;
  return (
    <Link
      to={to ?? `/docs/integrations/${section.dir}/overview`}
      className={cn(
        "group relative flex h-full gap-3.5 rounded-2xl border border-solid border-white/[0.06] bg-[#1f1f21] p-4 !no-underline transition-colors duration-200 hover:border-white/[0.1] hover:bg-[#242427]",
        className,
      )}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white p-2">
        {Icon && <Icon width={26} height={26} className="size-[26px]" />}
      </span>
      <span className="min-w-0 flex-1 pr-5">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[16px] font-semibold tracking-[-0.01em] !text-zinc-50">
            {section.label}
          </span>
          {section.isNew && (
            <span className="rounded-md bg-lime-400/15 px-1.5 py-0.5 text-[11px] font-semibold !text-lime-300">
              New
            </span>
          )}
          {section.isBeta && (
            <span className="rounded-md bg-sky-400/15 px-1.5 py-0.5 text-[11px] font-semibold !text-sky-300">
              Beta
            </span>
          )}
        </span>
        {section.isPackage && (
          <span className="mt-0.5 block truncate font-mono text-[12px] !text-zinc-500">
            @hyper-fetch/{section.package}
          </span>
        )}
        <span className="mt-1.5 line-clamp-3 text-[14px] leading-relaxed !text-zinc-400">
          {section.description}
        </span>
      </span>
      <ArrowUpRight className="absolute right-4 top-4 size-4 text-zinc-600 transition-[color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-zinc-200" />
    </Link>
  );
}
