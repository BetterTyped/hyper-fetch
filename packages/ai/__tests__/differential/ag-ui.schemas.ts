import { realpathSync } from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

type SchemaType = { safeParse: (value: unknown) => { success: boolean; error?: { message: string } } };

export type AGUISchemasType = {
  RunAgentInputSchema: SchemaType;
  MessageSchema: SchemaType;
  EventSchemas: SchemaType;
  PROTOCOL_VERSION: string;
};

/**
 * The official AG-UI 1.0 zod schemas. `@ag-ui/core` is not a dependency of this package - it is what the installed
 * `@tanstack/ai` devDependency is built on, so it is loaded from next to it.
 */
export const loadAGUISchemas = async (): Promise<AGUISchemasType> => {
  const tanstack = realpathSync(fileURLToPath(new URL("../../node_modules/@tanstack/ai", import.meta.url)));
  const schemas = path.resolve(tanstack, "../../@ag-ui/core/dist/schemas.mjs");
  return (await import(/* @vite-ignore */ pathToFileURL(schemas).href)) as AGUISchemasType;
};

export const expectValid = (schema: SchemaType, value: unknown) => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error(`Not valid AG-UI: ${result.error?.message}\n${JSON.stringify(value, null, 2)}`);
  }
};
