import React from "react";

import { PagePropsType } from "types/page.types";
import { getMethods } from "../utils/parsing.utils";
import { Method } from "./method";

export const Methods: React.FC<PagePropsType> = (props) => {
  const { reflection, reflectionsTree } = props;
  const { children } = reflection;

  if (!children) return null;

  const methods = getMethods(reflection, reflectionsTree);

  return (
    <div className="api-docs__methods">
      {methods.map((method, index) => {
        return <Method {...props} key={index} reflection={method} />;
      })}
    </div>
  );
};
