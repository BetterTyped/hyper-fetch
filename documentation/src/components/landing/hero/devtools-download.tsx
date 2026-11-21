import Link from "@docusaurus/Link";
import { usePluginData } from "@docusaurus/useGlobalData";
import { ArrowDownToLine, ArrowRight, TerminalSquare } from "lucide-react";
import { motion } from "motion/react";
import React, { useEffect, useState } from "react";

import type { Platform } from "../../hyper-flow-downloads/releases";
import { detectPlatform } from "../../hyper-flow-downloads/releases";
import type { HyperFlowReleasesData } from "../../../plugins/hyperflow-releases";
import { HYPER_FLOW_RELEASES_PLUGIN } from "../../../plugins/hyperflow-releases";

/*
 * Under the product video: one clear button that downloads the HyperFlow devtools installer for the
 * visitor's platform, with every other platform one click away. Without a known platform or a build,
 * the button opens the download page instead.
 */

const DOWNLOAD_PAGE = "/docs/hyper-flow/download";

const AppleIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
    className={className}
  >
    <path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.87-.76-1.47.02-2.83.86-3.6 2.18-1.53 2.66-.39 6.6 1.1 8.76.73 1.06 1.6 2.25 2.73 2.2 1.1-.04 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.22 1.18-2.41 1.2-2.47-.03-.01-2.3-.88-2.28-3.52ZM14.18 6.13c.6-.74 1.01-1.75.9-2.77-.87.04-1.93.59-2.55 1.32-.56.64-1.05 1.69-.92 2.68.97.08 1.96-.49 2.57-1.23Z" />
  </svg>
);

const WindowsIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
    className={className}
  >
    <path d="M3 5.48 10.37 4.5v7.06H3V5.48Zm0 13.04 7.37.98v-6.97H3v5.99Zm8.18 1.09L21 21v-8.44h-9.82v7.05Zm0-15.22v7.17H21V3l-9.82 1.39Z" />
  </svg>
);

const names: Record<Platform, string> = {
  macos: "macOS",
  windows: "Windows",
  linux: "Linux",
};
const icons: Record<Platform, React.FC<{ className?: string }>> = {
  macos: AppleIcon,
  windows: WindowsIcon,
  linux: ({ className }) => (
    <TerminalSquare className={className} aria-hidden />
  ),
};

export const DevtoolsDownload = () => {
  const data = usePluginData(HYPER_FLOW_RELEASES_PLUGIN) as
    | HyperFlowReleasesData
    | undefined;
  const [platform, setPlatform] = useState<Platform | null>(null);

  useEffect(() => {
    const nav = navigator as Navigator & {
      userAgentData?: { platform?: string };
    };
    setPlatform(
      detectPlatform({
        userAgent: nav.userAgent,
        platform: nav.userAgentData?.platform ?? nav.platform,
      }),
    );
  }, []);

  const release = data?.release ?? null;
  const installer = platform
    ? release?.downloads.find((d) => d.platform === platform && d.primary)
    : undefined;
  const Icon = platform ? icons[platform] : ArrowDownToLine;
  const label = platform
    ? `Download for ${names[platform]}`
    : "Download HyperFlow";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="landing-scope mx-auto mb-12 flex w-[calc(100%-40px)] max-w-6xl flex-col items-center gap-4 text-center"
    >
      <span className="text-[15px] !text-zinc-400">
        <span className="font-semibold !text-zinc-100">HyperFlow</span>{" "}
        devtools, free for every platform
      </span>
      <div className="flex flex-wrap items-center justify-center gap-5">
        <a
          href={installer?.url ?? DOWNLOAD_PAGE}
          className="group inline-flex h-11 items-center gap-2.5 rounded-xl bg-white/[0.06] px-5 text-[15px] font-semibold !text-zinc-100 !no-underline ring-1 ring-inset ring-white/15 backdrop-blur-md transition-colors hover:bg-white/[0.1] hover:ring-white/25"
        >
          <Icon className="size-[18px]" />
          {label}
          {release?.version && (
            <span className="font-mono text-[12px] font-medium !text-zinc-500">
              v{release.version}
            </span>
          )}
        </a>
        <Link
          to={DOWNLOAD_PAGE}
          className="group inline-flex items-center gap-1 text-[14px] font-medium !text-zinc-400 !no-underline transition-colors hover:!text-zinc-100"
        >
          Other platforms
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </motion.div>
  );
};
