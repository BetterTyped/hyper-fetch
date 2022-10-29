/* eslint-disable no-nested-ternary */
// https://github.com/TypeStrong/typedoc-default-themes/blob/master/src/default/partials/member.signature.title.hbs

import React from "react";
import { JSONOutput } from "typedoc";

import { PagePropsType } from "types/page.types";
import { GenericParameters } from "./generic-parameters";
import { Type } from "./type";

export type SignatureProps = {
  useArrow?: boolean;
  hideName?: boolean;
};

export function Signature({
  useArrow,
  hideName,
  ...props
}: PagePropsType<JSONOutput.SignatureReflection> & SignatureProps) {
  const { reflection } = props;
  const hasName = !hideName && reflection.name !== "__type";
  // const isConstructor = reflection.kindString === "Constructor signature";

  return (
    <>
      {hasName && reflection.name}
      {/* {!hasName && isConstructor && (
        <>
          {reflection.flags?.isAbstract && (
            <span className="api-docs__signature-symbol">abstract </span>
          )}
          <span className="api-docs__signature-symbol">new </span>
        </>
      )} */}
      <GenericParameters generics={reflection.typeParameter} />
      <span className="api-docs__signature-symbol">(</span>
      {reflection.parameters?.map((param, index) => (
        <React.Fragment key={param.id}>
          {index > 0 && <span className="api-docs__signature-symbol">, </span>}

          <span>
            {param.flags?.isRest && <span className="api-docs__signature-symbol">...</span>}
            {param.name}

            <span className="api-docs__signature-symbol">
              {(param.flags?.isOptional || "defaultValue" in param) && "?"}
              {": "}
            </span>

            <Type {...props} reflection={param.type} />
          </span>
        </React.Fragment>
      ))}
      <span className="api-docs__signature-symbol">)</span>
      {useArrow && <span className="api-docs__signature-symbol"> =&gt; </span>}
      {!useArrow && <span className="api-docs__signature-symbol">: </span>}
      {reflection.type && <Type {...props} reflection={reflection.type} />}
      {!reflection.type && "void"}
    </>
  );
}
