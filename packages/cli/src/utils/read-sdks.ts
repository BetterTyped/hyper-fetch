import { SDK } from "registry/types";
import fs from "fs";
import path from "path";

export const readSdks = (): SDK[] => {
  const registryPath = path.resolve(__dirname, "../registry");
  const sdkDirs = fs.readdirSync(registryPath);

  const sdks: SDK[] = [];

  for (const sdkDir of sdkDirs) {
    const sdkPath = path.join(registryPath, sdkDir);
    const stats = fs.statSync(sdkPath);

    if (stats.isDirectory()) {
      const metaPath = path.join(sdkPath, "meta.ts");
      const versionsPath = path.join(sdkPath, "versions");

      if (fs.existsSync(metaPath) && fs.existsSync(versionsPath)) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const meta = require(metaPath).meta;
        const versionFiles = fs.readdirSync(versionsPath);

        const versions = versionFiles.map((versionFile) => {
          const version = path.basename(versionFile, path.extname(versionFile));
          return {
            version,
            path: path.join(versionsPath, versionFile),
          };
        });

        sdks.push({
          meta,
          versions,
        });
      }
    }
  }

  return sdks;
};
