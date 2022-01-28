import { JSONOutput } from "typedoc";
import { KindTypes } from "../md/md.constants";

import { PluginOptions } from "../types/package.types";
import { classFormatter } from "./class.formatter";
import { defaultFormatter } from "./default.formatter";
import { enumFormatter } from "./enum.formatter";
import { functionFormatter } from "./function.formatter";
import { typeFormatter } from "./type.formatter";
import { variableFormatter } from "./variable.formatter";

export const apiFormatter = (value: JSONOutput.DeclarationReflection, options: PluginOptions, pkg: string) => {
  switch (value.kindString) {
    case KindTypes.class: {
      return classFormatter(value, options, pkg);
    }
    case KindTypes.enum: {
      return enumFormatter(value, options, pkg);
    }
    case KindTypes.var: {
      return variableFormatter(value, options, pkg);
    }
    case KindTypes.fn: {
      return functionFormatter(value, options, pkg);
    }
    case KindTypes.type: {
      return typeFormatter(value, options, pkg);
    }
    default: {
      return defaultFormatter(value, options, pkg);
    }
  }
};
