import React from "react";
import { JSONOutput } from "typedoc";

import { PagePropsType } from "types/page.types";
import { getTag } from "../utils/parsing.utils";
import { getTypePresentation } from "../utils/types.utils";
import { Code } from "./code";

export const Returns: React.FC<
  PagePropsType<JSONOutput.DeclarationReflection | JSONOutput.SignatureReflection>
> = (props) => {
  const { reflection, reflectionsTree } = props;
  const { comment } = reflection;
  const returnTag = getTag(comment, "@returns");

  return (
    <div className="api-docs__returns">
      <>
        {returnTag?.content}
        <Code>{getTypePresentation(reflection, reflectionsTree)}</Code>
      </>
    </div>
  );
};
