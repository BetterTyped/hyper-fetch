import { readFileSync } from "fs";
import visit from "unist-util-visit";
import { MdTransformer } from "./md/md.transformer";
import json2md from "json2md";
import unified from "unified";
import remarkParse from "remark-parse";
import { _PKG_META, _PLUGIN_OPTS } from "./globals";
import { displayOptions } from "./types/injector.types";
import { _title, getMatchingElement, isJSONGenerated } from "./utils/injector.utils";

const plugin = (options: any) => {
  const transformer = async (ast: any) => {
    await isJSONGenerated();
    const packageName = `(${Array.from(_PKG_META.keys()).join("|")}) `;
    const elementMatch = "([^ ]+)";
    const rgx = new RegExp(`{@import ${packageName}${elementMatch} (${Object.keys(displayOptions).join("|")})}`);

    visit(ast, "paragraph", (node: any) => {
      if ([node.children, node.children[0], node.children[0].type === "text"].every(Boolean)) {
        const apiImport = node.children[0].value.match(rgx);

        if (apiImport) {
          const [, pkgName, elementName, displayOption] = apiImport;

          if (!Object.keys(displayOptions).includes(displayOption)) {
            throw Error(`Unknown display option. Available display options are: ${Object.keys(displayOptions)}`);
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

          const child = getMatchingElement(fileData, elementName);
          const formatter = new MdTransformer(child, _PLUGIN_OPTS, fileData.name, false);

          node.children = unified()
            .use(remarkParse)
            //@ts-ignore
            .parse(json2md(formatter[`get${_title(displayOption)}`]())).children;
        }
      }
    });
  };
  return transformer;
};

export default plugin;
