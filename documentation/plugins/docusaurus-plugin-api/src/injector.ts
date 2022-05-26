import { readFileSync } from "fs";
import visit from "unist-util-visit";
import { MdTransformer } from "./md/md.transformer";
import json2md from "json2md";
import unified from "unified";
import remarkParse from "remark-parse";
import { _PKG_META, _PLUGIN_OPTS } from "./globals";
import { displayOptions } from "./types/injector.types";
import { _title, getMatchingElement, isJSONGenerated } from "./utils/injector.utils";
import { RequiredKeys } from "./types/helpers.types";
import { MdOptions } from "./md/md.types";
import { defaultMethodOptions } from "./md/md.constants";

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

const plugin = () => {
  const transformer = async (ast: any) => {
    await isJSONGenerated();
    const packageName = `(${Array.from(_PKG_META.keys()).join("|")})`;
    const elementName = "([^ ]+)";
    const displayOptionParam = "([^ ]+)?";
    const rgx = new RegExp(
      `{@import ${packageName} ${elementName} (${Object.keys(displayOptions).join("|")}) ?${displayOptionParam} ?}`,
    );

    visit(ast, "paragraph", (node: any) => {
      if ([node.children, node.children[0], node.children[0].type === "text"].every(Boolean)) {
        const apiImport = node.children[0].value.match(rgx);

        if (apiImport) {
          const [, pkgName, elementName, displayOption, optionParam] = apiImport;

          if (!Object.keys(displayOptions).includes(displayOption)) {
            throw Error(`Unknown display option. Available display options are: ${Object.keys(displayOptions)}`);
          }

          if (optionParam && !DISPLAY_OPTIONS_WITH_PARAM.includes(displayOption)) {
            throw Error(`Display option ${displayOption} does not accept parameter`);
          }

          const packageMetaData = _PKG_META.get(pkgName);
          if (!packageMetaData) {
            throw Error(
              `Wrong package name for import. Received ${pkgName}. Available names: ${Array.from(_PKG_META.keys())}`,
            );
          }

          const fileData = _PLUGIN_OPTS.readOnce
            ? packageMetaData.file
            : JSON.parse(readFileSync(packageMetaData.docPath, "utf-8"));

          const reflection = getMatchingElement(fileData, elementName);
          const formatter = new MdTransformer(reflection, _PLUGIN_OPTS, "", fileData.name, []);

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
  return transformer;
};

export default plugin;
