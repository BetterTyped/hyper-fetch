import * as path from "path";

import { error } from "../../../utils/log.utils";
import { createFile, readFile } from "../../generator/utils/file.utils";
import { defaultPackageOptions } from "../../../constants/options.constants";
import { PackageOptions } from "types/package.types";

export const generatePackagePage = (packageDocsDir: string, options: PackageOptions) => {
  const readmePath = path.join(
    options.dir,
    options.readmeDir ?? defaultPackageOptions.readmeDir,
    options.readmeName ?? defaultPackageOptions.readmeName,
  );
  let data = readFile(readmePath);

  // TODO
  if (!data) {
    data = `---
sidebar_position: 1
---
    
# Overview

`;
  }

  try {
    const routePath = path.join(packageDocsDir, "index.mdx");
    createFile(routePath, data);
  } catch (err) {
    error(JSON.stringify(err));
  }
};
