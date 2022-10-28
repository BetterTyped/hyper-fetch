import { renderer } from "./renderer";
import { ClassPage } from "../pages/class.page";
import { KindTypes } from "../../constants/api.constants";
import { PagePropsType } from "types/page.types";

export const pageGenerator = (props: PagePropsType) => {
  switch (props.reflection.kindString) {
    case KindTypes.class: {
      return renderer(props, ClassPage);
    }
    case KindTypes.enum: {
      return "test";
      // return enumFormatter(props);
    }
    case KindTypes.var: {
      return "test";
      // return variableFormatter(props);
    }
    case KindTypes.fn: {
      return "test";
      // return functionFormatter(props);
    }
    case KindTypes.type: {
      return "test";
      // return typeFormatter(props);
    }
    default: {
      return "test";
      // return defaultFormatter(props);
    }
  }
};
