import path from "path";
import { readFileSync } from "fs";
import visit from "unist-util-visit";
import json2md from "json2md";
import unified from "unified";
import remarkParse from "remark-parse";

import { MdTransformer } from "./md/md.transformer";
import { displayOptions } from "./types/injector.types";
import { _title, getMatchingElement, isJSONGenerated } from "./utils/injector.utils";
import { RequiredKeys } from "./types/helpers.types";
import { MdOptions } from "./md/md.types";
import { defaultMethodOptions } from "./md/md.constants";
import { apiDir, apiDocsPath, optionsDir, pluginOptionsDir } from "./constants/paths.constants";
import { PkgMeta, PluginOptions } from "./types/package.types";

const DEFAULT_INJECTOR_MD_OPTIONS: RequiredKeys<MdOptions> = {
  hasHeading: false,
  headingSize: "h6",
  descriptionSize: defaultMethodOptions.descriptionSize,
};

const MD_OPTIONS_METHODS = [
  displayOptions.description,
  displayOptions.import,
  displayOptions.example,
  displayOptions.preview,
  displayOptions.parameters,
  displayOptions.methods,
  displayOptions.returns,
  displayOptions.typeReferences,
  displayOptions.additionalLinks,
];

const DISPLAY_OPTIONS_WITH_PARAM = [displayOptions.method, displayOptions.parameter];

export const docsInjector = () => {
  return async (tree: any, file: any) => {
    await isJSONGenerated();

    const optionsPath = path.join(file.cwd, apiDir, optionsDir);
    const pluginOptionsPath = path.join(file.cwd, apiDir, pluginOptionsDir);

    const options: PkgMeta = require(optionsPath);
    const pluginOptions: PluginOptions = require(pluginOptionsPath);
    const apiRootDir = path.join(file.cwd, apiDir, pluginOptions.docs.routeBasePath);
    const packages = Object.keys(options);
    const isMonorepo = packages.length > 1;

    const packageNames = `(${packages.join("|")})`;
    const elementName = "([^ ]+)";
    const displayOptionParam = "([^ ]+)?";
    const rgx = new RegExp(
      `{@import ${packageNames} ${elementName} (${Object.keys(displayOptions).join("|")}) ?${displayOptionParam} ?}`,
    );

    visit(tree, (node: any) => {
      if ([node.children, node.children?.[0], node.children?.[0]?.type === "text"].every(Boolean)) {
        const apiImport = node.children[0].value.match(rgx);

        if (apiImport) {
          const [, packageName, elementName, displayOption, optionParam] = apiImport;

          if (!Object.keys(displayOptions).includes(displayOption)) {
            throw Error(`Unknown display option. Available display options are: ${Object.keys(displayOptions)}`);
          }

          if (optionParam && !DISPLAY_OPTIONS_WITH_PARAM.includes(displayOption)) {
            throw Error(`Display option ${displayOption} does not accept parameter`);
          }

          const packageApiDir = isMonorepo ? path.join(apiRootDir, packageName) : apiRootDir; // -> /api/Hyper-Fetch(if monorepo) or /api
          const apiJsonDocsPath = path.join(packageApiDir, apiDocsPath);

          const fileData = JSON.parse(readFileSync(apiJsonDocsPath, "utf-8"));

          const reflection = getMatchingElement(fileData, elementName);
          const formatter = new MdTransformer(reflection, pluginOptions, "", fileData.name, fileData.children);

          const displayOptionsArgs = [];
          if (MD_OPTIONS_METHODS.includes(displayOption)) {
            displayOptionsArgs.push(DEFAULT_INJECTOR_MD_OPTIONS);
          }
          if (optionParam) {
            displayOptionsArgs.push(optionParam);
          }

          node.children = unified()
            .use(remarkParse)
            //@ts-ignore
            .parse(json2md(formatter[`get${_title(displayOption)}`](...displayOptionsArgs))).children;
        }
      }
    });
  };
};
