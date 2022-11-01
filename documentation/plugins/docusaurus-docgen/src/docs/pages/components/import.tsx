/* eslint-disable react/no-unescaped-entities */
import React from "react";

import { PagePropsType } from "types/page.types";
import { Code } from "./code";

export const Import: React.FC<PagePropsType> = (props) => {
  const { reflection, npmName, packageOptions } = props;
  const { showImports = true } = packageOptions;

  if (!showImports) return null;

  return (
    <div className="api-docs__import">
      <Code>
        import &amp;lbrace; {reflection.name} &amp;rbrace; from "{npmName}"
      </Code>
    </div>
  );
};
