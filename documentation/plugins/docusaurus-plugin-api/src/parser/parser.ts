import * as TypeDoc from "typedoc";
import { error } from "../utils/log.utils";

export const parseToJson = async (
  apiDocsPath: string,
  entryPath: string,
  tsconfig: string,
  options?: Partial<TypeDoc.TypeDocOptions>,
) => {
  // 1. Prepare typedoc application to render
  const app = new TypeDoc.Application();

  // 2. Prepare parser readers
  app.options.addReader(new TypeDoc.TSConfigReader());
  app.options.addReader(new TypeDoc.TypeDocReader());

  // 3. Parser options to bootstrap project
  app.bootstrap({
    emit: true,
    excludeExternals: true,
    excludeInternal: true,
    excludePrivate: true,
    excludeProtected: true,
    exclude: ["node_modules"],
    ...options,
    entryPointStrategy: "expand",
    tsconfig,
    entryPoints: [entryPath],
    logLevel: "Error",
  });

  // 4. Generate json output
  const project = app.convert();
  if (project) {
    await app.generateJson(project, apiDocsPath);
  } else {
    error("Cannot generate project for dir: " + apiDocsPath);
  }
};
