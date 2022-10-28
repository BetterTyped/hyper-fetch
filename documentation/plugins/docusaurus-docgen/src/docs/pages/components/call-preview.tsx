import React from "react";
import { JSONOutput } from "typedoc";

import { PagePropsType } from "types/page.types";
import { getCallPreview, getSignature } from "../utils/parsing.utils";

export const CallPreview: React.FC<
  PagePropsType<JSONOutput.DeclarationReflection | JSONOutput.SignatureReflection>
> = ({ reflection }) => {
  const signature = getSignature(reflection);

  if (!signature) return null;

  const [name, typeSignature, callSignature] = getCallPreview(signature);

  return (
    <div className="api-docs__call-preview">
      <pre>
        <code className="language-tsx">
          {name}
          {typeSignature}({callSignature})
        </code>
      </pre>
    </div>
  );
};
