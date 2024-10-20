import { useLocation } from "@docusaurus/router";

import docsVersions from "../../versions.json";

const latestVersion = docsVersions[0] || "0.0.0";

export const useVersion = () => {
  const location = useLocation();
  const isVersioned = location.pathname.includes("docs/v.");

  const version = isVersioned ? location.pathname.split("/")[2] : `v${Number(latestVersion[0]) + 1}.0.0`;

  return [version, isVersioned];
};
