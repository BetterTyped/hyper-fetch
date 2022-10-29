import React from "react";
import { JSONOutput } from "typedoc";

import { HeadingType } from "types/components.types";
import { PagePropsType } from "types/page.types";
import { NonParsing } from "./non-parsing";

export const Description: React.FC<
  PagePropsType<JSONOutput.DeclarationReflection | JSONOutput.SignatureReflection> &
    Partial<HeadingType>
> = ({ reflection }) => {
  const { comment } = reflection;

  return (
    <div className="api-docs__description">
      <NonParsing>{comment?.summary.map(({ text }) => text).join("\n")}</NonParsing>
    </div>
  );
};
