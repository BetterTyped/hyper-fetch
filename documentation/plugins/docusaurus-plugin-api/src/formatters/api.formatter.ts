import { JSONOutput } from "typedoc";
import { KindTypes } from "../md/md.constants";

import { PluginOptions } from "../types/package.types";
import { classFormatter } from "./class.formatter";
import { defaultFormatter } from "./default.formatter";
import { enumFormatter } from "./enum.formatter";
import { functionFormatter } from "./function.formatter";
import { typeFormatter } from "./type.formatter";
import { variableFormatter } from "./variable.formatter";

export type FormatterPropsType = {
  reflection: JSONOutput.DeclarationReflection;
  reflectionTree: Pick<JSONOutput.DeclarationReflection, "id" | "name" | "kind" | "kindString">[];
  pluginOptions: PluginOptions;
  npmName: string;
  packageName: string;
};

export const apiFormatter = (props: FormatterPropsType) => {
  switch (props.reflection.kindString) {
    case KindTypes.class: {
      return classFormatter(props);
    }
    case KindTypes.enum: {
      return enumFormatter(props);
    }
    case KindTypes.var: {
      return variableFormatter(props);
    }
    case KindTypes.fn: {
      return functionFormatter(props);
    }
    case KindTypes.type: {
      return typeFormatter(props);
    }
    default: {
      return defaultFormatter(props);
    }
  }
};
