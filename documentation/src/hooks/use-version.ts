import { useLocation } from "@docusaurus/router";

import docsVersions from "../../versions.json";

const getCurrentMajor = () => {
  const latestVersion = docsVersions[0] || "v0.0.0";
  const latestMajor = latestVersion[1];
  return Number(latestMajor) + 1;
};

export const useVersion = () => {
  const location = useLocation();
  const isVersioned = location.pathname.includes("docs/v.");

  const version = isVersioned ? location.pathname.split("/")[2] : `v${getCurrentMajor()}.0.0`;

  return [version, isVersioned];
};
