import * as path from "path";
import json2md from "json2md";

import { error } from "../../../utils/log.utils";
import { PackageOption } from "../../../types/package.types";
import { createFile, readFile } from "../../../utils/file.utils";
import { defaultPackageOptions } from "../../../constants/options.constants";

export const generatePackagePage = (packageDocsDir: string, options: PackageOption) => {
  const readmePath = path.join(
    options.dir,
    options.readmeDir ?? defaultPackageOptions.readmeDir,
    options.readmeName ?? defaultPackageOptions.readmeName,
  );
  let data = readFile(readmePath);

  if (!data) {
    data = json2md([{ h1: "Overview" }, { p: "Packages overview" }]);
  }

  try {
    const routePath = path.join(packageDocsDir, "index.mdx");
    createFile(routePath, data);
  } catch (err) {
    error(JSON.stringify(err));
  }
};
