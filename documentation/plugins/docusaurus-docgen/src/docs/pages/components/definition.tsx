import React from "react";

import { PagePropsType } from "types/page.types";

export const Definition: React.FC<PagePropsType> = (props) => {
  const { reflection } = props;
  const { sources } = reflection;

  const source = sources?.[0];

  if (!source) return null;

  return (
    <div className="api-docs__definition">
      Defined in{" "}
      <a href={source.url}>
        {source.fileName}:{source.line}
      </a>
    </div>
  );
};
