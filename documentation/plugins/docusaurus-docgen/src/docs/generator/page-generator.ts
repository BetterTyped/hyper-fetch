import { renderer } from "./renderer";
import { PagePropsType } from "types/page.types";
import { KindTypes } from "../../constants/api.constants";
import { ClassPage } from "../pages/class.page";
import { FunctionPage } from "../pages/function.page";
import { EnumPage } from "../pages/enum.page";
import { VarPage } from "../pages/var.page";
import { TypePage } from "../pages/type.page copy";

export const pageGenerator = (props: PagePropsType) => {
  switch (props.reflection.kindString) {
    case KindTypes.class: {
      return renderer(props, ClassPage);
    }
    case KindTypes.enum: {
      return renderer(props, EnumPage);
    }
    case KindTypes.var: {
      return renderer(props, VarPage);
    }
    case KindTypes.fn: {
      return renderer(props, FunctionPage);
    }
    case KindTypes.type: {
      return renderer(props, TypePage);
    }
    default: {
      return "test";
      // return defaultFormatter(props);
    }
  }
};
