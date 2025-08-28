import DtsGenerator, { ExportedType } from "@anttiviljami/dtsgenerator/dist/core/dtsGenerator";
import RefParser from "@apidevtools/json-schema-ref-parser";
import { parseSchema } from "@anttiviljami/dtsgenerator/dist/core/type";
import * as lodash from "lodash";
import * as prettier from "prettier";
import * as fs from "fs-extra";
import * as path from "node:path";
import { createClient } from "@hyper-fetch/core";

import { Document, Operation, GeneratedTypes } from "./openapi.types";
import { getAvailableOperations } from "./operations";
import { adjustPathParamsFormat, normalizeOperationId, createTypeBaseName, isUrl } from "./utils";
import { HttpMethod } from "./http-methods.enum";
import { Config } from "config/schema";

interface RefError {
  path: string;
  ref: string;
  message: string;
}

const formatSchema = (obj: any, indent = 1): string => {
  const indentation = "  ".repeat(indent);
  const entries = Object.entries(obj)
    .map(([key, value]) => {
      const formattedKey = key.includes("-") ? `"${key}"` : key;
      if (typeof value === "string") {
        return `${indentation}${formattedKey}: ${value};`;
      }
      if (typeof value === "object" && value !== null) {
        return `${indentation}${formattedKey}: {\n${formatSchema(value, indent + 1)}\n${indentation}};`;
      }
      return "";
    })
    .join("\n");
  return entries;
};

export class OpenapiRequestGenerator {
  protected openapiDocument: Document;
  constructor(openapiDocument: any) {
    this.openapiDocument = openapiDocument as Document;
  }

  async generateFile({ config, fileName }: { config: Config; fileName: string }) {
    const defaultFileName = "openapi.client";
    const { schemaTypes, generatedTypes, sdkSchema, createSdkFn } = await this.generateRequestsFromSchema();
    const contents = [
      `import { createSdk as coreCreateSdk, ClientInstance, Request } from "@hyper-fetch/core";`,
      "\n\n",
      schemaTypes,
      "\n\n",
      generatedTypes.join("\n\n"),
      "\n\n",
      sdkSchema,
      "\n\n",
      createSdkFn,
    ].join("");
    const prettierOpts = {
      printWidth: 120,
      tabWidth: 2,
      useTabs: false,
      semi: true,
      singleQuote: false,
      trailingComma: "all" as const,
      bracketSpacing: true,
      bracketSameLine: false,
      proseWrap: "always" as const,
      arrowParens: "always" as const,
      parser: "typescript" as const,
    };

    const fName = fileName || defaultFileName;
    const extension = config.tsx ? ".ts" : ".js";
    const hasExtension = [".ts", ".js", ".tsx", ".jsx"].some((ext) => fName.endsWith(ext));
    const generatedPath = path.join(config.resolvedPaths.api, `${fName}${hasExtension ? "" : extension}`);

    const file = await prettier.format(contents, prettierOpts);
    await fs.writeFile(generatedPath, file, {
      flag: "w",
    });

    return generatedPath;
  }

  static getSchemaFromUrl = async ({ url, config }: { url: string; config: Config }) => {
    if (isUrl(url)) {
      const client = createClient({ url });
      const getSchema = client.createRequest<{ response: Document }>()({ endpoint: "" });
      const { data, error } = await getSchema.send();
      if (data) {
        return data;
      }
      throw error || new Error("Failed to fetch schema");
    }

    const schema = fs.readFileSync(path.join(config.resolvedPaths.cwd, url), "utf-8");
    return JSON.parse(schema);
  };

  generateRequestsFromSchema = async () => {
    const { schemaTypes, exportedTypes } = await OpenapiRequestGenerator.prepareSchema(this.openapiDocument);

    const generatedTypes: string[] = [];
    const schemaTree: Record<string, any> = {};

    getAvailableOperations(this.openapiDocument).forEach((operation) => {
      const meta = OpenapiRequestGenerator.generateMethodMetadata(operation, exportedTypes);
      const operationTypes = OpenapiRequestGenerator.generateTypes(meta);
      const requestInstanceType = OpenapiRequestGenerator.generateRequestInstanceType(meta, operationTypes);

      generatedTypes.push(Object.values(operationTypes).join("\n"));

      const { path: relPath, method } = meta;
      const segments = relPath.split("/").filter(Boolean);

      let currentLevel = schemaTree;
      // eslint-disable-next-line no-restricted-syntax
      for (const segment of segments) {
        let key: string;
        if (segment.startsWith(":")) {
          // Parameter segment - keep the $ prefix
          key = `$${segment.slice(1)}`;
        } else if (segment.includes("-")) {
          // Convert kebab-case to camelCase for path segments
          key = segment.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        } else {
          key = segment;
        }

        if (!currentLevel[key]) {
          currentLevel[key] = {};
        }
        currentLevel = currentLevel[key];
      }
      // Prefix method names with $
      currentLevel[`$${method.toLowerCase()}`] = requestInstanceType;
    });

    const sdkSchema = `export type SdkSchema<Client extends ClientInstance> = {\n${formatSchema(schemaTree)}\n}`;

    const createSdkFn = `

export type { Components };

export const createSdk = <Client extends ClientInstance>(client: Client, options?: Parameters<typeof coreCreateSdk>[1] | undefined) => {
  return coreCreateSdk<Client, SdkSchema<Client>>(client, options);
};
`;

    return { schemaTypes, generatedTypes, sdkSchema, createSdkFn };
  };

  static generateRequestInstanceType(
    { id, path: endpoint, queryParamsRequired }: { id: string; path: string; queryParamsRequired?: boolean },
    types: Record<string, string>,
  ) {
    const Response = types[`${createTypeBaseName(id)}ResponseType`]
      ? `${createTypeBaseName(id)}ResponseType`
      : undefined;
    const Payload = types[`${createTypeBaseName(id)}RequestBody`] ? `${createTypeBaseName(id)}RequestBody` : undefined;
    const LocalError = types[`${createTypeBaseName(id)}ErrorType`] ? `${createTypeBaseName(id)}ErrorType` : undefined;
    const QueryParams = types[`${createTypeBaseName(id)}QueryParams`]
      ? `${createTypeBaseName(id)}QueryParams`
      : undefined;

    const QueryParamsGeneric =
      QueryParams && queryParamsRequired === false ? `${QueryParams} | undefined` : QueryParams;

    return `Request<${Response}, ${Payload}, ${QueryParamsGeneric}, ${LocalError}, "${endpoint}", Client>`;
  }

  static generateHyperFetchRequest(
    {
      id,
      path: relPath,
      method,
      queryParamsRequired,
    }: { id: string; path: string; method: string; queryParamsRequired?: boolean },
    types: Record<string, string>,
  ) {
    const Response = types[`${createTypeBaseName(id)}ResponseType`]
      ? `${createTypeBaseName(id)}ResponseType`
      : undefined;
    const Payload = types[`${createTypeBaseName(id)}RequestBody`] ? `${createTypeBaseName(id)}RequestBody` : undefined;
    const LocalError = types[`${createTypeBaseName(id)}ErrorType`] ? `${createTypeBaseName(id)}ErrorType` : undefined;
    const QueryParams = types[`${createTypeBaseName(id)}QueryParams`]
      ? `${createTypeBaseName(id)}QueryParams`
      : undefined;
    const getVariableName = (str: string) => str.charAt(0).toLowerCase() + str.slice(1);

    let genericType = "";

    const addToGenericType = (key: string, value: string) => {
      if (genericType) {
        genericType += ",";
      }
      genericType += `${key}:${value}`;
    };

    if (Response) {
      addToGenericType("response", Response);
    }
    if (Payload) {
      addToGenericType("payload", Payload);
    }
    if (LocalError) {
      addToGenericType("error", LocalError);
    }
    if (QueryParams) {
      const key = queryParamsRequired === false ? "queryParams?" : "queryParams";
      addToGenericType(key, QueryParams);
    }

    if (genericType) {
      genericType = `<{${genericType}}>`;
    }

    return `export const ${getVariableName(
      createTypeBaseName(id),
    )} = client.createRequest${genericType}()({method: "${method}", endpoint: "${relPath}"})`;
  }

  static generateTypes({
    id,
    pathParametersType,
    queryParametersType,
    requestBodyType,
    errorType,
    responseType,
  }: {
    id: string;
    pathParametersType: string | undefined;
    queryParametersType: string | undefined;
    requestBodyType: string | undefined;
    errorType: string;
    responseType: string;
  }) {
    const typeName = createTypeBaseName(id);
    const types: GeneratedTypes<typeof typeName> = {};
    if (pathParametersType) {
      types[`${typeName}PathParams`] = `export type ${typeName}PathParams = ${pathParametersType}`;
    }
    if (queryParametersType) {
      types[`${typeName}QueryParams`] = `export type ${typeName}QueryParams = ${queryParametersType}`;
    }
    if (requestBodyType) {
      types[`${typeName}RequestBody`] = `export type ${typeName}RequestBody = ${requestBodyType}`;
    }
    if (errorType) {
      types[`${typeName}ErrorType`] = `export type ${typeName}ErrorType = ${errorType}`;
    }
    if (responseType) {
      types[`${typeName}ResponseType`] = `export type ${typeName}ResponseType = ${responseType}`;
    }
    return types;
  }

  static generateMethodMetadata(
    operation: { operationId: string; path: string; method: string } & Partial<Operation>,
    exportTypes: ExportedType[],
  ) {
    const { operationId, method, path: relPath } = operation;
    const normalizedOperationId = normalizeOperationId(operationId);
    const pathParametersType = lodash.find(exportTypes, {
      schemaRef: `#/paths/${normalizedOperationId}/pathParameters`,
    })?.path;
    const queryParametersType = lodash.find(exportTypes, {
      schemaRef: `#/paths/${normalizedOperationId}/queryParameters`,
    })?.path;
    const requestBodyType = lodash.find(exportTypes, {
      schemaRef: `#/paths/${normalizedOperationId}/requestBody`,
    })?.path;
    const responseTypePaths = lodash
      .chain(exportTypes)
      .filter(({ schemaRef }) => schemaRef.startsWith(`#/paths/${normalizedOperationId}/responses/2`))
      .map(({ path: responsePath }) => responsePath)
      .value();
    const errorTypePaths = lodash
      .chain(exportTypes)
      .filter(
        ({ schemaRef }) =>
          schemaRef.startsWith(`#/paths/${normalizedOperationId}/responses/4`) ||
          schemaRef.startsWith(`#/paths/${normalizedOperationId}/responses/5`),
      )
      .map(({ path: errorPath }) => errorPath)
      .value();

    const responseType = !lodash.isEmpty(responseTypePaths) ? responseTypePaths.join(" | ") : "any";
    const errorType = !lodash.isEmpty(errorTypePaths) ? errorTypePaths.join(" | ") : "undefined";
    const queryParamsRequired = Array.isArray(operation.parameters)
      ? operation.parameters.every((p) => {
          if ("in" in p && p.in === "query" && p.required === false) {
            return true;
          }
          return false;
        })
      : undefined;

    return {
      id: normalizedOperationId,
      pathParametersType,
      queryParametersType,
      requestBodyType,
      errorType,
      responseType,
      path: adjustPathParamsFormat(relPath),
      method: method ? method.toUpperCase() : HttpMethod.GET,
      queryParamsRequired,
    };
  }

  static validateSchema(openapiDocument: Document) {
    // Validate refs before processing
    const errors: RefError[] = [];

    function validateRefs(obj: any, refPath = "") {
      if (!obj || typeof obj !== "object") return;

      // Check if current object has $ref
      if (obj.$ref && typeof obj.$ref === "string" && obj.$ref.endsWith("/")) {
        errors.push({
          path: refPath,
          ref: obj.$ref,
          message: `Invalid reference "${obj.$ref}" - reference path cannot end with '/'`,
        });
      }

      // Recursively check all object properties
      Object.entries(obj).forEach(([key, value]) => {
        const newPath = refPath ? `${refPath}.${key}` : key;
        validateRefs(value, newPath);
      });
    }

    validateRefs(openapiDocument);

    // If there are validation errors, throw them with details
    if (errors.length > 0) {
      const errorMessages = errors.map((err) => `Invalid reference at ${err.path}: ${err.message}`);
      throw new Error(`Schema validation failed. The following errors were found:\n${errorMessages.join("\n")}`);
    }
  }

  static async prepareSchema(openapiDocument: Document) {
    OpenapiRequestGenerator.validateSchema(openapiDocument);

    const rootSchema = await RefParser.bundle(openapiDocument);
    const schema = parseSchema(rootSchema as any);
    const generator = new DtsGenerator([schema]);
    const schemaTypes = await generator.generate();
    const exportedTypes = generator.getExports();

    return { schemaTypes, exportedTypes };
  }
}
