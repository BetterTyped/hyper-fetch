import React from "react";
import Translate from "@docusaurus/Translate";
import { ThemeClassNames } from "@docusaurus/theme-common";
import { useDocsVersion } from "@docusaurus/plugin-content-docs/client";
import type { Props } from "@theme/DocVersionBadge";
import { useSidebar } from "@site/src/hooks/use-sidebar";
import { cn } from "@site/src/lib/utils";

// eslint-disable-next-line import/no-default-export
export default function DocVersionBadge({ className }: Props): JSX.Element | null {
  const versionMetadata = useDocsVersion();
  const { activeItem } = useSidebar();

  const isCurrent = versionMetadata.version === "current";

  if (versionMetadata.badge) {
    return (
      <span
        className={cn(
          className,
          ThemeClassNames.docs.docVersionBadge,
          isCurrent ? activeItem?.section?.icon || "bg-yellow-500" : "bg-zinc-400",
          "block text-xs px-2 py-1 rounded-md w-fit !font-semibold",
          "!text-white/80 border-0 !mb-6 !bg-opacity-30",
          "sm:absolute sm:top-2 sm:right-0",
        )}
      >
        <Translate id="theme.docs.versionBadge.label" values={{ versionLabel: versionMetadata.label }}>
          {"Version: {versionLabel}"}
        </Translate>
        <span className="opacity-50 text-xs font-bold ml-1">{!isCurrent && "(Outdated)"}</span>
      </span>
    );
  }
  return null;
}
