import { promises as pFs, readFileSync } from "fs";
import visit from "unist-util-visit";
import path from "path";
import { KindTypes } from "./md/md.constants";
import { JSONOutput } from "typedoc";
import { MdTransformer } from "./md/md.transformer";
import { PluginOptions } from "./types/package.types";
import json2md from "json2md";
import unified from "unified";
import remarkParse from "remark-parse";

// TODO import globally options and files, no passing here
// TODO split to multiple files.

function _title(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const elementMatch = "([^ ]+)";
// TODO add all display options
enum displayOptions {
  parameters = "parameters",
  example = "example",
  import = "import",
  preview = "preview",
  description = "description",
  title = "title",
}

const paramsConstraint = (elTag: KindTypes) => [KindTypes.class, KindTypes.fn, KindTypes.type].includes(elTag);

declare type packageMeta = {
  name: string;
  docDir: string;
};

const docsExists = async (pkgsMeta: packageMeta[]): Promise<void> => {
  const notFoundDocs = [];
  for (const { name, docDir } of pkgsMeta) {
    try {
      await pFs.access(path.join(docDir, "docs.json"));
    } catch {
      notFoundDocs.push(name);
    }
  }

  if (notFoundDocs.length > 0) {
    throw Error(`Could not find docs for the following packages: ${notFoundDocs}`);
  }
};

const getMatchingElement = (
  parsedApiJSON: JSONOutput.ProjectReflection,
  name: string,
  // @ts-ignore
): JSONOutput.DeclarationReflection => {
  // @ts-ignore
  for (const child of parsedApiJSON.children) {
    if (child.name === name) {
      // @ts-ignore
      if (!paramsConstraint(child.kindString)) {
        throw Error(`Cannot show params for type ${child.kindString} for ${child.name}`);
      }

      return child;
    }
  }
};

const plugin = (options: { packages: packageMeta[] }) => {
  const { packages } = options;
  const transformer = async (ast: any) => {
    await docsExists(packages);
    const pkgDirMap = new Map(packages.map((pkg: packageMeta) => [pkg.name, path.join(pkg.docDir, "docs.json")]));
    const packageName = `(${packages.map((pkg: packageMeta) => pkg.name).join("|")}) `;
    const rgx = new RegExp(`{@import ${packageName}${elementMatch} (${Object.keys(displayOptions).join("|")})}`);

    visit(ast, "paragraph", (node: any) => {
      if ([node.children, node.children[0], node.children[0].type === "text"].every(Boolean)) {
        const apiImport = node.children[0].value.match(rgx);

        if (apiImport) {
          const [, pkgName, name, displayOption] = apiImport;

          if (!Object.keys(displayOptions).includes(displayOption)) {
            throw Error(`Unknown display option. Available display options are: ${Object.keys(displayOptions)}`);
          }

          const jsonPath = pkgDirMap.get(pkgName);

          if (!jsonPath) {
            throw Error(
              `Wrong package name for import. Received ${pkgName}. Available names: ${Array.from(pkgDirMap.keys())}`,
            );
          }

          const fileData = readFileSync(jsonPath);
          // @ts-ignore
          const parsedJSON = JSON.parse(fileData);

          const child = getMatchingElement(parsedJSON, name);
          const formatter = new MdTransformer(child, {} as PluginOptions, parsedJSON.name);

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
