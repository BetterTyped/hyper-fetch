import React from "react";

import { PagePropsType } from "types/page.types";
import { getProperties } from "../utils/parsing.utils";
import { Property } from "./property";

export const Properties: React.FC<PagePropsType> = (props) => {
  const { reflection } = props;
  const { children } = reflection;

  if (!children) return null;

  const properties = getProperties(reflection);

  return (
    <div className="api-docs__properties">
      {properties.map((prop, index) => (
        <Property key={index} {...props} reflection={prop} />
      ))}
    </div>
  );
};
