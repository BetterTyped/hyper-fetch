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
  if (reflection.kindString === KindTypes.class) {
    const signature = getSignature(reflection);
    if (!signature) return null;

    const [name, typeSignature, callSignature] = getCallPreview(signature);
    const properties = getProperties(reflection);
    const methods = getMethods(reflection);

    return (
      <div className="api-docs__preview class">
        <pre>
          <code className="language-ts">
            {`${name}${typeSignature}(${callSignature}) &lbrace;
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
&rbrace;`}
          </code>
        </pre>
      </div>
    );
  }
  if (
    reflection.kindString === KindTypes.fn ||
    reflection.kindString === "Method" ||
    reflection.kindString === "Call signature"
  ) {
    const signature = getSignature(reflection);
    if (!signature) return null;

    const [name, typeSignature, callSignature] = getCallPreview(signature);

    return (
      <div className="api-docs__preview fn">
        <pre>
          <code className="language-ts">
            {name}
            {typeSignature}({callSignature})
          </code>
        </pre>
      </div>
    );
  }
  if (reflection.kindString === KindTypes.enum) {
    const { name } = reflection;

    const children =
      reflection &&
      "children" in reflection &&
      reflection?.children?.map<[string, string]>((child) => [
        child.name,
        child.defaultValue || "",
      ]);

    if (!children) return null;

    return (
      <div className="api-docs__preview enum">
        <pre>
          <code className="language-ts">
            {`enum ${name} &lbrace;\n`}
            {children.map((element) => {
              const value = !Number.isNaN(Number(element[1])) ? element[1] : `"${element[1]}"`;
              return `  ${element[0]} = ${value}; \n`;
            })}
            {`&rbrace;`}
          </code>
        </pre>
      </div>
    );
  }
  if (reflection.kindString === KindTypes.var) {
    const { name } = reflection;

    const children =
      reflection &&
      "children" in reflection &&
      reflection?.children?.map<[string, string]>((child) => [
        child.name,
        child.defaultValue || "",
      ]);

    if (!children) return null;

    return (
      <div className="api-docs__preview var">
        <pre>
          <code className="language-ts">
            {`const ${name} = &lbrace;\n`}
            {children.map((element) => {
              const value = !Number.isNaN(Number(element[1])) ? element[1] : `"${element[1]}"`;
              return `  ${element[0]}: ${value}, \n`;
            })}
            {`&rbrace;`}
          </code>
        </pre>
      </div>
    );
  }
  if (reflection.kindString === KindTypes.type) {
    const { name, type } = reflection;

    const children =
      (type &&
        "declaration" in type &&
        type.declaration?.children?.map<[string, JSONOutput.DeclarationReflection]>((child) => {
          const signature = getSignature(child);

          return [
            child.name,
            (signature?.type || signature || child) as unknown as JSONOutput.DeclarationReflection,
          ];
        })) ||
      [];

    if (!children?.length && !type) return null;

    if (!children?.length && type) {
      return (
        <div className="api-docs__preview type single">
          <pre>
            <code className="language-ts">
              type {name} = <Type {...props} reflection={type} />;
            </code>
          </pre>
        </div>
      );
    }

    return (
      <div className="api-docs__preview type">
        <pre>
          <code className="language-ts">
            {`type ${name} = &lbrace;\n`}
            {children.map(([elementName, elementType]) => (
              <>
                {"  "}
                {elementName}
                {elementType.flags?.isOptional && "?"}: <Type {...props} reflection={elementType} />
                ; {"\n"}
              </>
            ))}
            {`&rbrace;`}
          </code>
        </pre>
      </div>
    );
  }
  return null;
};