import React from "react";

import { HeadingType } from "types/components.types";
import { PagePropsType } from "types/page.types";
import { getStatusIcon } from "../utils/name.utils";

export const Name: React.FC<PagePropsType & Partial<HeadingType>> = ({
  reflection,
  headingSize = "h1",
}) => {
  const { name } = reflection;
  const Tag = headingSize;

  const icon = getStatusIcon(reflection);

  return (
    <>
      <Tag className="api-docs__name">
        {icon}
        {name}
      </Tag>
      <hr />
    </>
  );
};
