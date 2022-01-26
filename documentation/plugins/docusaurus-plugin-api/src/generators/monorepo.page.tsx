import * as fs from "fs";
import * as path from "path";
import json2md from "json2md";
import { error } from "../utils/log.utils";
import { PluginOptions } from "../types/package.types";

export const generateMonorepoPage = (apiDocsRoot: string, _options: PluginOptions) => {
  const data = json2md([
    { h1: "Overview" },
    { p: "Packages overview" },
    // ...options.packages.map((pkg) => ({
    //   link: {
    //     title: pkg.title || "-",
    //     link: "",
    //   },
    // })),
  ]);

  try {
    const routePath = path.join(apiDocsRoot, "index.mdx");
    fs.writeFileSync(routePath, data);
  } catch (err) {
    error(JSON.stringify(err));
  }
};
