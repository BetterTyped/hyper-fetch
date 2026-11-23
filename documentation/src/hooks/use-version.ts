import { useLocation } from "@docusaurus/router";

const VERSION_SEGMENT = /^v\d+\.\d+\.\d+$/;

/**
 * The docs version of the page, by its name in the docs plugin: `current` for the latest docs, or the frozen
 * version from the URL, like `v9.0.0` in `/docs/v9.0.0/core/overview`. The name, not the label, because the label
 * shows the newest release and changes with every release.
 */
export const useVersion = (): [name: string, isVersioned: boolean] => {
  const { pathname } = useLocation();
  const segment = pathname.split("/").filter(Boolean)[1] ?? "";
  const isVersioned = VERSION_SEGMENT.test(segment);

  return [isVersioned ? segment : "current", isVersioned];
};
