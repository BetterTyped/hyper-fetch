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
      &lt;
      {signature.typeParameter.map((param, index) => (
        <React.Fragment key={param.id}>
          {index > 0 && ","}
          {param.name}
        </React.Fragment>
      ))}
      &gt;
    </div>
  );
};
