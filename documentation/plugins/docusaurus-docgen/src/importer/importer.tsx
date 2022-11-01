/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import React from "react";
import path from "path";
import unified from "unified";
import visit from "unist-util-visit";
import remarkParse from "remark-parse";
import { JSONOutput } from "typedoc";

import { PkgMeta, PluginOptions } from "types/package.types";
import { libraryDir, pluginOptionsPath, packageConfigPath } from "../constants/paths.constants";
import { getMatchingElement } from "./utils/injector.utils";
import { getComponent } from "./components/component-map.utils";

export const docsImporter = () => {
  return async (tree: any, file: any) => {
    const configPath = path.join(file.cwd, libraryDir, packageConfigPath);
    const optionsPath = path.join(file.cwd, libraryDir, pluginOptionsPath);

    const packageMeta: PkgMeta = require(configPath);
    const pluginOptions: PluginOptions = require(optionsPath);
    const packageOptions = pluginOptions.packages.find((pkg) => pkg.title === packageMeta.title);
    const packages = Object.keys(packageMeta);

    if (!packageOptions) throw new Error(`Cannot find package options for ${packageMeta.title}`);

    const packageRegex = `(${packages.join("|")})`;
    const nameRegex = "([^ ]+)";
    const rgx = new RegExp(`{@import ${packageRegex} ${nameRegex}`);

    visit(tree, (node: any) => {
      if ([node.children, node.children?.[0], node.children?.[0]?.type === "text"].every(Boolean)) {
        const apiImport = node.children[0].value.match(rgx) as null | string[];

        if (apiImport) {
          const [, packageName, elementName, componentType] = apiImport;

          const packageReflection: JSONOutput.ProjectReflection = require(packageMeta.packageDocsJsonPath);

          const reflection = getMatchingElement(packageReflection, elementName);
          const Component = getComponent(componentType);

          if (!packageReflection.children) {
            throw new Error(`Package reflections tree is empty, ${packageMeta.title}`);
          }

          node.children = unified()
            .use(remarkParse)
            .parse(
              <Component
                reflection={reflection}
                reflectionsTree={packageReflection.children}
                npmName={packageReflection.name}
                packageName={packageName}
                pluginOptions={pluginOptions}
                packageOptions={packageOptions}
              />,
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
            ).children;
        }
      }
    });
  };
};
