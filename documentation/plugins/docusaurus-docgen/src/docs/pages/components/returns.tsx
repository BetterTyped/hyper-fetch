import React from "react";
import { JSONOutput } from "typedoc";

import { PagePropsType } from "types/page.types";
import { getSignature, getTag } from "../utils/parsing.utils";
import { Type } from "./type";

export const Returns: React.FC<
  PagePropsType<JSONOutput.DeclarationReflection | JSONOutput.SignatureReflection>
> = (props) => {
  const { reflection } = props;
  const { comment } = reflection;
  const signature = getSignature(reflection);
  const returnTag = getTag(comment, "@returns");

  return (
    <div className="api-docs__returns">
      <pre>
        <code className="language-ts">
          {returnTag?.content || signature ? (
            <Type {...props} reflection={signature?.type} />
          ) : (
            "void"
          )}
        </code>
      </pre>
    </div>
  );
};
