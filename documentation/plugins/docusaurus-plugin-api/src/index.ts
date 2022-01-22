import * as path from 'path';
import { LoadContext } from '@docusaurus/types';

import { parser } from './parser/parser';
import { getPath } from './utils/file.utils';
import { asyncForEach } from './utils/loop.utils';
import { PluginOptions } from './types';
import { getPackageJson } from './utils/package.utils';

const plugin = function (context: LoadContext, options: PluginOptions) {
  // const { siteConfig } = context;
  const { rootPath, apiPath = '/api', packages } = options;

  return {
    name: 'docusaurus-plugin-api',

    async contentLoaded() {
      const projectRoot = rootPath;
      const defaultApiJsonStorage = '/docs.json';

      await asyncForEach(packages, false, async (element) => {
        const packageRoot = getPath(projectRoot, element.path);
        const packageJson = getPackageJson(packageRoot);

        const name = element.name || packageJson?.name;
        const apiRoot = path.join(
          context.generatedFilesDir,
          '..',
          apiPath,
          name,
          defaultApiJsonStorage
        );
        const tsconfig = element.tsconfig || '/tsconfig.json';

        console.log(apiRoot);

        await parser(apiRoot, packageRoot, element.entry, tsconfig);
      });

      const sleep = () => new Promise((r) => setTimeout(r, 100000));

      await sleep();
    },
  };
};

export default plugin;
