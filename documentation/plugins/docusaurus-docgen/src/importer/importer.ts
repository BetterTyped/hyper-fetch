/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import path from "path";
import unified from "unified";
import visit from "unist-util-visit";
import remarkParse from "remark-parse";
import { JSONOutput } from "typedoc";

import { PathsOptions, PkgMeta, PluginOptions } from "types/package.types";
import {
  libraryDir,
  pluginOptionsPath,
  packageConfigPath,
  pathsOptionsPath,
} from "../constants/paths.constants";
import { getMatchingElement } from "./utils/docs.utils";
import { getComponent } from "./components/component-map.utils";
import { cleanFileName } from "../utils/file.utils";
import { renderer } from "../docs/generator/renderer";
import { getPackageDocsPath } from "../utils/package.utils";

export const docsImporter = () => {
  return (tree: any, file: any) => {
    const optionsPath = path.join(file.cwd, libraryDir, pluginOptionsPath);
    const pathsPath = path.join(file.cwd, libraryDir, pathsOptionsPath);

    const pluginOptions: PluginOptions = require(optionsPath);
    const pathsOptions: PathsOptions = require(pathsPath);
    const packages = pluginOptions.packages.map((pkg) => cleanFileName(pkg.title));
    const isMonorepo = pluginOptions.packages.length > 1;
    const reflectionsMap: { name: string; reflection: JSONOutput.ProjectReflection }[] =
      pluginOptions.packages.map((pkg) => {
        return {
          name: cleanFileName(pkg.title),
          reflection: require(getPackageDocsPath(
            pathsOptions.docsGenerationDir,
            cleanFileName(pkg.title),
            isMonorepo,
          )),
        };
      });

    const packageRegex = `(${packages.join("|")})`;
    const nameRegex = "([^ ]+)";
    const displayOptionParam = "([^ ]+)?";
    const rgx = new RegExp(`{@import ${packageRegex} ${nameRegex} ${displayOptionParam}}`);

    visit(tree, (node: any) => {
      if ([node.children, node.children?.[0], node.children?.[0]?.type === "text"].every(Boolean)) {
        const apiImport = node.children[0].value.match(rgx) as null | string[];

        if (apiImport) {
          const [, packageName, elementName, componentType] = apiImport;
          const packageOptions = pluginOptions.packages.find(
            (pkg) => cleanFileName(pkg.title) === packageName,
          );

          if (!packageOptions) {
            throw new Error(`Cannot find package options for ${packageName}`);
          }

          const configPath = path.join(
            file.cwd,
            libraryDir,
            pluginOptions.id,
            packageName,
            packageConfigPath,
          );
          const packageMeta: PkgMeta = require(configPath);

          const packageReflection = reflectionsMap.find(
            ({ name }) => cleanFileName(packageName) === name,
          )?.reflection;

          if (!packageReflection) {
            throw new Error(`Cannot find package reflection for ${packageName}`);
          }

          const packagesReflections = [
            packageReflection,
            ...reflectionsMap
              .filter(({ name }) => cleanFileName(packageName) !== name)
              .map(({ reflection }) => reflection),
          ];

          const reflection = getMatchingElement(packageReflection, elementName);
          const Component = getComponent(componentType);

          if (!packageReflection.children) {
            throw new Error(`Package reflections tree is empty, ${packageMeta.title}`);
          }

          node.children = unified()
            .use(remarkParse)
            .parse(
              renderer(
                {
                  reflection,
                  reflectionsTree: packagesReflections,
                  npmName: packageReflection.name,
                  packageName,
                  pluginOptions,
                  packageOptions,
                },
                Component,
              ),
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
            ).children;
        }
      }
    });
  };
};
