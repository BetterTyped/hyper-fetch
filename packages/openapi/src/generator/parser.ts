import DtsGenerator, { ExportedType } from "@anttiviljami/dtsgenerator/dist/core/dtsGenerator";
import RefParser from "@apidevtools/json-schema-ref-parser";
import { parseSchema } from "@anttiviljami/dtsgenerator/dist/core/type";
import { Document, Operation } from "openapi-client-axios";
import _, { capitalize } from "lodash";

import { generateOperations } from "./operations";

export const generateSchemaTypes = async (openapiDocument: Document) => {
  const rootSchema = await RefParser.bundle(openapiDocument);

  const schema = parseSchema(rootSchema as any);

  const generator = new DtsGenerator([schema]);
  const schemaTypes = await generator.generate();
  const exportedTypes = generator.getExports();
  const availableOperations = generateOperations(openapiDocument);

  const generatedTypes = [];
  const generatedRequests = [];
  for (const operation of availableOperations) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const metadata = generateMethodMetadata(operation, exportedTypes);
    const operationTypes = generateTypes(metadata);
    const generatedRequest = generateHyperFetchRequest(metadata.id, metadata.path, metadata.method, operationTypes);
    generatedTypes.push(Object.values(operationTypes).join("\n"));
    generatedRequests.push(generatedRequest);
  }

  console.log(schemaTypes);
  console.log(generatedTypes.join("\n\n"));
  console.log(generatedRequests.join("\n\n"));
};

// FROM openapi-axios-client
function convertKeyToTypeName(key: string): string {
  return key
    .replace(/\/(.)/g, (_match: string, p1: string) => {
      return p1.toUpperCase();
    })
    .replace(/}/g, "")
    .replace(/{/g, "$")
    .replace(/^\//, "")
    .replace(/[^0-9A-Za-z_$]+/g, "_");
}

function changePathParamsFormat(path: string) {
  // Naive implementation for now:
  return path.replace(/}/g, "").replace(/{/g, ":");
}

function generateMethodMetadata(operation: Operation, exportTypes: ExportedType[]) {
  const { operationId, method, path: relPath } = operation;
  const normalizedOperationId = convertKeyToTypeName(operationId);
  const pathParametersType = _.find(exportTypes, {
    schemaRef: `#/paths/${normalizedOperationId}/pathParameters`,
  })?.path;
  const queryParametersType = _.find(exportTypes, {
    schemaRef: `#/paths/${normalizedOperationId}/queryParameters`,
  })?.path;
  const requestBodyType = _.find(exportTypes, { schemaRef: `#/paths/${normalizedOperationId}/requestBody` })?.path;
  const responseTypePaths = _.chain(exportTypes)
    .filter(({ schemaRef }) => schemaRef.startsWith(`#/paths/${normalizedOperationId}/responses/2`))
    .map(({ path }) => path)
    .value();
  const responseType = !_.isEmpty(responseTypePaths) ? responseTypePaths.join(" | ") : "any";

  return {
    id: normalizedOperationId,
    pathParametersType,
    queryParametersType,
    requestBodyType,
    responseType,
    path: changePathParamsFormat(relPath),
    method: method.toUpperCase(),
  };
}

function generateTypes({
  id,
  path,
  pathParametersType,
  queryParametersType,
  requestBodyType,
  responseType,
}: {
  id: string;
  pathParametersType: string | undefined;
  queryParametersType: string | undefined;
  requestBodyType: string | undefined;
  responseType: string;
  path: string;
}) {
  const typeName = createTypeName(id);
  const types = {};
  if (pathParametersType) {
    types[`${typeName}PathParams`] = `export type ${typeName}PathParams = ${pathParametersType}`;
    // types.push(`export type ${typeName}PathParams = ${pathParametersType}`);
  }
  if (queryParametersType) {
    types[`${typeName}QueryParams`] = `export type ${typeName}QueryParams = ${queryParametersType}`;
    // types.push(`export type ${typeName}QueryParams = ${queryParametersType}`);
  }
  if (requestBodyType) {
    types[`${typeName}RequestBody`] = `export type ${typeName}RequestBody = ${requestBodyType}`;
    // types.push(`export type ${typeName}RequestBody = ${requestBodyType}`);
  }
  if (responseType) {
    types[`${typeName}ResponseType`] = `export type ${typeName}ResponseType = ${responseType}`;
    // types.push(`export type ${typeName}ResponseType = ${responseType}`);
  }

  return types;
}

function createTypeName(str: string) {
  const capitalizeFirstLetter = (s) => {
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  return str.split("_").map(capitalizeFirstLetter).join("");
}

function generateHyperFetchRequest(id, path, method, types: Record<string, string>) {
  const Response = types[`${createTypeName(id)}ResponseType`] ? `${createTypeName(id)}ResponseType` : "unknown";
  const Payload = types[`${createTypeName(id)}RequestBody`] ? `${createTypeName(id)}RequestBody` : "undefined";
  const LocalError = "undefined";
  const QueryParams = types[`${createTypeName(id)}QueryParams`] ? `${createTypeName(id)}QueryParams` : "undefined";
  return `export const ${id} = client.createRequest<${Response}, ${Payload}, ${LocalError}, ${QueryParams}>()({method: "${method}", endpoint: "${path}"})`;
}
