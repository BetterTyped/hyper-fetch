import React from "react";
import clsx from "clsx";
import Translate from "@docusaurus/Translate";
import { ThemeClassNames } from "@docusaurus/theme-common";
import { useDocsVersion } from "@docusaurus/plugin-content-docs/client";
import type { Props } from "@theme/DocVersionBadge";

// eslint-disable-next-line import/no-default-export
export default function DocVersionBadge({ className }: Props): JSX.Element | null {
  const versionMetadata = useDocsVersion();

  const isCurrent = versionMetadata.version === "current";

  if (versionMetadata.badge) {
    return (
      <span
        className={clsx(
          className,
          ThemeClassNames.docs.docVersionBadge,
          "badge badge--secondary !text-white border-0 mb-5",
          isCurrent ? "bg-yellow-500" : "bg-zinc-400/20",
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
