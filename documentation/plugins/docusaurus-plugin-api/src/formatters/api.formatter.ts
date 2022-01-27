import { JSONOutput } from "typedoc";

import { PluginOptions } from "../types/package.types";
import { classFormatter } from "./class.formatter";
import { defaultFormatter } from "./default.formatter";
import { enumFormatter } from "./enum.formatter";
import { functionFormatter } from "./function.formatter";
import { typeFormatter } from "./type.formatter";
import { variableFormatter } from "./variable.formatter";

export const apiFormatter = (value: JSONOutput.DeclarationReflection, options: PluginOptions, pkg: string) => {
  switch (value.kindString?.toUpperCase()) {
    case "CLASS": {
      return classFormatter(value, options, pkg);
    }
    case "ENUMERATION": {
      return enumFormatter(value, options, pkg);
    }
    case "VARIABLE": {
      return variableFormatter(value, options, pkg);
    }
    case "FUNCTION": {
      return functionFormatter(value, options, pkg);
    }
    case "TYPE ALIAS": {
      return typeFormatter(value, options, pkg);
    }
    default: {
      return defaultFormatter(value, options, pkg);
    }
  }
};
