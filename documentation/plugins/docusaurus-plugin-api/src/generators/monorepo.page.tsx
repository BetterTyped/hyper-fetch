import * as path from "path";
import json2md from "json2md";
import { error } from "../utils/log.utils";
import { PluginOptions } from "../types/package.types";
import { cleanFileName, createFile } from "../utils/file.utils";
import { cardBlock, description, row } from "../md/md.styles";
import { defaultTextsOptions } from "../constants/options.constants";

export const generateMonorepoPage = (apiDocsRoot: string, options: PluginOptions) => {
  const monorepo = options.texts;

  const data = json2md([
    { h1: monorepo?.monorepoTitle ?? defaultTextsOptions.monorepoTitle },
    { p: description(monorepo?.monorepoDescription ?? defaultTextsOptions.monorepoDescription) },
    {
      p: row(
        options.packages
          .map((pkg) =>
            cardBlock({
              link: "/" + path.join(options.docs.routeBasePath, cleanFileName(pkg.title)),
              logo: pkg.logo,
              title: pkg.title,
              description: pkg.description || "Show details »",
            }),
          )
          .join(""),
      ),
    },
    { p: "<br/>" },
    { p: "<br/>" },
    { p: "Powered by @better-type/docusaurus-api-docs" },
  ]);

  try {
    const routePath = path.join(apiDocsRoot, "index.mdx");
    createFile(routePath, data);
  } catch (err) {
    error(JSON.stringify(err));
  }
};
