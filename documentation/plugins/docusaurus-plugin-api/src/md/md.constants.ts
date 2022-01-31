import { RequiredKeys } from "../types/helpers.types";
import { MdOptions, MethodOptions, ParamOptions } from "./md.types";

export enum KindTypes {
  class = "Class",
  enum = "Enumeration",
  var = "Variable",
  fn = "Function",
  type = "Type alias",
  method = "Method",
}

export const defaultOptions: RequiredKeys<MdOptions> = {
  hasHeading: true,
  headingSize: "h2",
  descriptionSize: "p",
};

export const defaultParamOptions: RequiredKeys<ParamOptions> = {
  type: "link",
  headingSize: "h3",
  descriptionSize: "p",
};

export const defaultMethodOptions: RequiredKeys<MethodOptions> = {
  type: "link",
  headingSize: "h3",
  paramsHeadingSize: "h4",
  descriptionSize: "p",
};
