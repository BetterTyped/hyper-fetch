import { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

import { HttpMethod } from "./http-methods.enum";

export interface Operation extends OpenAPIV3.OperationObject {
  path: string;
  method: HttpMethod;
}

export type Document = OpenAPIV3.Document | OpenAPIV3_1.Document;

export type GeneratedTypes<T extends string> = {
  [K in `${T}PathParams` | `${T}QueryParams` | `${T}RequestBody` | `${T}ResponseType`]: string;
};
