import React from "react";
import { JSONOutput } from "typedoc";

import { PagePropsType } from "types/page.types";
import { getTag } from "../utils/parsing.utils";
import { getTypePresentation } from "../utils/types.utils";
import { Code } from "./code";
import { NonParsing } from "./non-parsing";

export const Returns: React.FC<
  PagePropsType<JSONOutput.DeclarationReflection | JSONOutput.SignatureReflection>
> = (props) => {
  const { reflection, reflectionsTree } = props;
  const { comment } = reflection;
  const returnTag = getTag(comment, "@returns")[0];
  const disableReturn = getTag(comment, "@disableReturns")[0];

  if (disableReturn && !returnTag) return null;

  return (
    <div className="api-docs__returns">
      {returnTag?.description && (
        <NonParsing>
          {"\n"}
          {returnTag.description}
          {"\n"}
        </NonParsing>
      )}
      {!disableReturn && <Code>{getTypePresentation(reflection, reflectionsTree)}</Code>}
    </div>
  );
};
