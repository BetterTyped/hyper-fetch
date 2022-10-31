import { ReflectionKind } from "typedoc";

import { renderer } from "./renderer";
import { PagePropsType } from "types/page.types";
import { ClassPage } from "../pages/class.page";
import { FunctionPage } from "../pages/function.page";
import { EnumPage } from "../pages/enum.page";
import { VarPage } from "../pages/var.page";
import { TypePage } from "../pages/type.page";

export const pageGenerator = (props: PagePropsType) => {
  switch (props.reflection.kind) {
    case ReflectionKind.Class: {
      return renderer(props, ClassPage);
    }
    case ReflectionKind.Enum: {
      return renderer(props, EnumPage);
    }
    case ReflectionKind.Variable: {
      return renderer(props, VarPage);
    }
    case ReflectionKind.Function: {
      return renderer(props, FunctionPage);
    }
    case ReflectionKind.TypeAlias: {
      return renderer(props, TypePage);
    }
    case ReflectionKind.Interface: {
      return "test";
      // return renderer(props, TypePage);
    }
    default: {
      return "test";
      // return defaultFormatter(props);
    }
  }
};
