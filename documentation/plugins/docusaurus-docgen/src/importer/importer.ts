/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import path from "path";
import unified from "unified";
import visit from "unist-util-visit";
import remarkParse from "remark-parse";
import { JSONOutput } from "typedoc";

import { PackageOptionsFile, PkgMeta } from "types/package.types";
import { pluginOptionsPath, packageConfigPath } from "../constants/paths.constants";
import { getFile, getMatchingElement } from "./utils/docs.utils";
import { getComponent } from "./components/component-map.utils";
import { cleanFileName } from "../docs/generator/utils/file.utils";
import { renderer } from "../docs/renderer/renderer";
import { getPackageDocsPath } from "../docs/generator/utils/package.utils";

export const docsImporter =
  (options: { packageRoute: string; apiDir: string; versionedDir?: string }) => () => {
    return (tree: any, file: any) => {
      const currentVersionedDir = file.history[0]
        ?.split("/")
        .find((pathPart: string) => pathPart.includes("versioned_docs"));
      const version = file.history[0]
        ?.split("/")
        .find((pathPart: string) => pathPart.includes("version-"));

      const { packageRoute, apiDir, versionedDir = currentVersionedDir } = options;

      const libDocsPath = version ? `${versionedDir}/${version}/${packageRoute}` : apiDir;
      const filesDir = path.join(file.cwd);
      const docsDir = path.join(filesDir, libDocsPath);
      const optionsPath = path.join(docsDir, pluginOptionsPath);

      const pluginOptions: PackageOptionsFile = getFile<PackageOptionsFile>(optionsPath) || {
        id: "",
        packages: [],
      };
      const packagesNames = pluginOptions.packages.map((pkg) => cleanFileName(pkg.title));
      const isMonorepo = pluginOptions.packages.length > 1;

      const reflectionsMap: { name: string; reflection: JSONOutput.ProjectReflection }[] =
        pluginOptions.packages.map((pkg) => {
          return {
            name: cleanFileName(pkg.title),
            reflection: require(getPackageDocsPath(docsDir, cleanFileName(pkg.title), isMonorepo)),
          };
        });

      const packageRegex = `(${packagesNames.join("|")})`;
      const nameRegex = "([^ ]+)";
      const displayOptionParam = "([^ ]+)?";
      const rgx = new RegExp(`{@import ${packageRegex} ${nameRegex} ${displayOptionParam}}`);

      visit(tree, (node: any) => {
        if (
          [node.children, node.children?.[0], node.children?.[0]?.type === "text"].every(Boolean)
        ) {
          const apiImport = node.children[0].value.match(rgx) as null | string[];

          if (apiImport) {
            const [, packageName, elementName, componentType] = apiImport;
            const packageOptions = pluginOptions.packages.find(
              (pkg) => cleanFileName(pkg.title) === packageName,
            );

            if (!packageOptions) {
              throw new Error(`Cannot find package options for ${packageName}`);
            }

            if (!reflectionsMap.length) {
              throw new Error(`Cannot existing docs.json reflection files`);
            }

            const configPath = path.join(docsDir, packageName, packageConfigPath);

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
              .use(remarkParse as any, undefined as any)
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
