import React from "react";
import { JSONOutput } from "typedoc";

export type GenericParametersProps = {
  generics?: JSONOutput.TypeParameterReflection[];
};

export const GenericParameters = ({ generics }: GenericParametersProps) => {
  if (!generics || generics.length === 0) {
    return null;
  }

  return (
    <span className="api-docs__generics">
      &lt;
      {generics.map((param, i) => (
        <React.Fragment key={param.id}>
          {i > 0 && ","}
          {param.name}
        </React.Fragment>
      ))}
      &gt;
    </span>
  );
};
