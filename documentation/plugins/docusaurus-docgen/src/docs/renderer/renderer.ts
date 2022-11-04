import React from "react";
import { ReflectionKind } from "typedoc";

import { ClassPage } from "../pages/class.page";
import { FunctionPage } from "../pages/function.page";
import { EnumPage } from "../pages/enum.page";
import { VarPage } from "../pages/var.page";
import { TypePage } from "../pages/type.page";
import { PagePropsType } from "types/page.types";
import { transformMarkdown } from "./utils/processing.utils";

/**
 * Renderer
 * @param props
 * @param component
 * @returns
 */
export const renderer = <T extends React.FC<PagePropsType>>(props: PagePropsType, component: T) => {
  return transformMarkdown(component(props) as React.ReactElement);
};

/**
 * Pages renderer
 * @param props
 * @param component
 * @returns
 */
export const pageRenderer = (props: PagePropsType) => {
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
