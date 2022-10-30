import React from "react";
import { JSONOutput } from "typedoc";

import { PagePropsType } from "types/page.types";
import { getSignature } from "../utils/parsing.utils";

// <Type1, Type2>
export const Generics: React.FC<PagePropsType<JSONOutput.DeclarationReflection>> = (props) => {
  const { reflection } = props;
  const signature = getSignature(reflection);

  if (!signature?.typeParameter) return null;

  return (
    <div className="api-docs__generics">
      <span className="api-docs__symbol">&lt;</span>
      {signature.typeParameter.map((param, i) => (
        <React.Fragment key={param.id}>
          {i > 0 && <span className="api-docs__symbol">, </span>}
          {param.name}
        </React.Fragment>
      ))}
      <span className="api-docs__symbol">&gt;</span>
    </div>
  );
};
