import React from "react";
import { JSONOutput } from "typedoc";

import { KindTypes } from "../../../constants/api.constants";
import { PagePropsType } from "types/page.types";
import { getCallPreview, getMethods, getProperties, getSignature } from "../utils/parsing.utils";
import { transformMarkdown } from "../../../utils/md.utils";
import { Type } from "./type";

export const Preview: React.FC<
  PagePropsType<JSONOutput.DeclarationReflection | JSONOutput.SignatureReflection>
> = (props) => {
  const { reflection } = props;
  switch (String(reflection.kindString)) {
    case KindTypes.class: {
      const signature = getSignature(reflection);
      if (!signature) return null;

      const [name, typeSignature, callSignature] = getCallPreview(signature);
      const properties = getProperties(reflection);
      const methods = getMethods(reflection);

      return (
        <div className="api-docs__preview">
          <pre>
            <code className="language-tsx">
              {`${name}${typeSignature}(${callSignature}) &amp;lbrace;
  ${properties
    .map(
      (prop) =>
        `${prop.name}: ${transformMarkdown(
          <div>
            <Type {...props} reflection={prop.type} />
          </div>,
        )};`,
    )
    .join("\n  ")}
  ${methods
    .map(
      (method) =>
        `${method.name}: ${transformMarkdown(
          <div>
            <Type {...props} reflection={getSignature(method) || method} />
          </div>,
        )};`,
    )
    .join("\n  ")}
&amp;rbrace;`}
            </code>
          </pre>
        </div>
      );
    }
    default: {
      return <div className="api-docs__preview">test</div>;
    }
  }
};
