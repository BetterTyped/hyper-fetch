// import * as fs from "fs";
// import glob from "fast-glob";
// import { TSDocParser, ParserContext, DocComment } from "@microsoft/tsdoc";
// import { DocNode, DocExcerpt } from "@microsoft/tsdoc";
import * as TypeDoc from 'typedoc';
import {
  prepareApiDirectory,
  // writeFileAsync,
  getPath,
} from '../utils/file.utils';
import { info, success } from '../utils/log.utils';
// import { asyncForEach } from '../utils/loop.utils';
// import ts from 'typescript';

export const parser = async (
  apiPath: string,
  root: string,
  entry: string,
  tsconfig: string
) => {
  info('[docusaurus-plugin-api] Starting api docs generation.');

  // 1. Prepare api directory to save output
  prepareApiDirectory(apiPath);

  // // 2. Look for all files to be parsed
  const app = new TypeDoc.Application();

  // 2. Prepare parser
  app.options.addReader(new TypeDoc.TSConfigReader());
  app.options.addReader(new TypeDoc.TypeDocReader());

  // 3. Parser options to bootstrap project
  app.bootstrap({
    emit: true,
    excludeExternals: true,
    excludeInternal: true,
    excludePrivate: true,
    excludeProtected: true,
    exclude: ['node_modules'],
    // Custom options
    // ...options,
    entryPointStrategy: 'expand',
    tsconfig: getPath(root, tsconfig),
    entryPoints: [getPath(root, entry)],
    logLevel: 'Verbose',
  });

  // 4. Generate json output
  const project = app.convert();
  if (project) {
    await app.generateJson(project, apiPath);
  }

  success(`Finished parsing api files`);
};
