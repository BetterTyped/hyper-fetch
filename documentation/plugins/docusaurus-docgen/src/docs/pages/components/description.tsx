import React from "react";
import { JSONOutput } from "typedoc";

import { HeadingType } from "types/components.types";
import { PagePropsType } from "types/page.types";

export const Description: React.FC<
  PagePropsType<JSONOutput.DeclarationReflection | JSONOutput.SignatureReflection> &
    Partial<HeadingType>
> = ({ reflection }) => {
  const { comment } = reflection;

  return (
    <div className="api-docs__description">
      {comment?.summary.map(({ text }) => (
        <>
          {"\n"}
          {text}
        </>
      ))}
    </div>
  );
};
