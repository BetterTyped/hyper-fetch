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
    <span className="tsd-generics">
      <span className="tsd-signature-symbol">&lt;</span>
      {generics.map((param, i) => (
        <React.Fragment key={param.id}>
          {i > 0 && <span className="tsd-signature-symbol">, </span>}
          {param.name}
        </React.Fragment>
      ))}
      <span className="tsd-signature-symbol">&gt;</span>
    </span>
  );
};
