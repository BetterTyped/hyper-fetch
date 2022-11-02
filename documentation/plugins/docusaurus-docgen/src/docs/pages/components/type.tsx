// Based on great work of @milesj https://github.com/milesj/docusaurus-plugin-typedoc-api/blob/39737cabeaf5a2d01a66edf07967b59cbdc2994f/packages/plugin/src/components/MemberSignatureTitle.tsx
import React from "react";
import { JSONOutput } from "typedoc";

import { PagePropsType } from "types/page.types";
import { getReference } from "../utils/parsing.utils";
import { Signature } from "./signature";

function parens(element: JSX.Element, needsParens?: boolean): JSX.Element {
  if (!needsParens) {
    return element;
  }

  return (
    <>
      {needsParens && <span className="api-type__symbol">(</span>}
      {element}
      {needsParens && <span className="api-type__symbol">)</span>}
    </>
  );
}

export function Type({
  needsParens,
  ...props
}: PagePropsType<any> & { needsParens?: boolean }): React.ReactElement | null {
  const { reflection, reflectionsTree } = props;
  if (!reflection) {
    return null;
  }

  switch (String(reflection.type)) {
    case "array": {
      const type = reflection as unknown as JSONOutput.ArrayType;

      return (
        <>
          <Type {...props} reflection={type.elementType} needsParens />
          <span className="api-type__symbol">[]</span>
        </>
      );
    }

    case "conditional": {
      const type = reflection as unknown as JSONOutput.ConditionalType;

      return parens(
        <>
          <Type {...props} reflection={type.checkType} needsParens />
          <span className="api-type__symbol"> extends </span>
          <Type {...props} reflection={type.extendsType} />
          <span className="api-type__symbol"> ? </span>
          <Type {...props} reflection={type.trueType} />
          <span className="api-type__symbol"> : </span>
          <Type {...props} reflection={type.falseType} />
        </>,
        needsParens,
      );
    }

    case "indexedAccess": {
      const type = reflection as unknown as JSONOutput.IndexedAccessType;

      return (
        <>
          <Type {...props} reflection={type.objectType} />
          <span className="api-type__symbol">[</span>
          <Type {...props} reflection={type.indexType} />
          <span className="api-type__symbol">]</span>
        </>
      );
    }

    case "inferred": {
      const type = reflection as unknown as JSONOutput.InferredType;

      return (
        <>
          <span className="api-type__symbol">infer </span> {type.name}
        </>
      );
    }

    case "intersection": {
      const type = reflection as unknown as JSONOutput.IntersectionType;

      return parens(
        <>
          {type.types.map((t, i) => (
            <React.Fragment key={t.type + i}>
              {i > 0 && <span className="api-type__symbol"> &amp; </span>}
              <Type {...props} reflection={t} needsParens />
            </React.Fragment>
          ))}
        </>,
        needsParens,
      );
    }

    case "intrinsic": {
      const type = reflection as unknown as JSONOutput.IntrinsicType;

      return <span className="api-type__type">{type.name}</span>;
    }

    case "literal": {
      const type = reflection as unknown as JSONOutput.LiteralType;

      return <span className="api-type__type">{String(type.value)}</span>;
    }

    case "mapped": {
      const type = reflection as unknown as unknown as JSONOutput.MappedType;

      return (
        <>
          <span className="api-type__symbol">&lbrace; </span>

          {type.readonlyModifier === "+" && <span className="api-type__symbol">readonly </span>}
          {type.readonlyModifier === "-" && <span className="api-type__symbol">-readonly </span>}

          <span className="api-type__symbol">[ </span>
          <span className="api-type__type">{type.parameter}</span>
          <span className="api-type__symbol"> in </span>
          <Type {...props} reflection={type.parameterType} />
          {type.nameType && (
            <>
              <span className="api-type__symbol"> as </span>
              <Type {...props} reflection={type.nameType} />
            </>
          )}
          <span className="api-type__symbol"> ]</span>

          {type.optionalModifier === "+" && <span className="api-type__symbol">?: </span>}
          {type.optionalModifier === "-" && <span className="api-type__symbol">-?: </span>}
          {!type.optionalModifier && <span className="api-type__symbol">: </span>}

          <Type {...props} reflection={type.templateType} />

          <span className="api-type__symbol"> &rbrace;</span>
        </>
      );
    }

    case "optional": {
      const type = reflection as unknown as JSONOutput.OptionalType;

      return (
        <>
          <Type {...props} reflection={type.elementType} />
          <span className="api-type__symbol">?</span>
        </>
      );
    }

    case "predicate": {
      const type = reflection as unknown as JSONOutput.PredicateType;

      return (
        <>
          {type.asserts && <span className="api-type__symbol">asserts </span>}
          <span className="api-type__type">{type.name}</span>
          {type.targetType && (
            <>
              <span className="api-type__symbol"> is </span>
              <Type {...props} reflection={type.targetType} />
            </>
          )}
        </>
      );
    }

    case "query": {
      const type = reflection as unknown as JSONOutput.QueryType;

      return (
        <>
          <span className="api-type__symbol">typeof </span>
          <Type {...props} reflection={type.queryType} />
        </>
      );
    }

    case "reference": {
      const type = reflection as unknown as JSONOutput.ReferenceType;
      const ref = getReference(reflectionsTree, type.id, type.name);
      const genericClass = ref?.id && !ref.sources ? "api-type__type-generic" : "";

      return (
        <>
          <span className={`api-type__type ${genericClass}`}>{type.name}</span>
          {type.typeArguments && type.typeArguments.length > 0 && (
            <>
              <span className="api-type__symbol">&lt;</span>
              {type.typeArguments.map((t, i) => (
                <React.Fragment key={t.type + i}>
                  {i > 0 && <span className="api-type__symbol">, </span>}
                  <Type {...props} reflection={t} />
                </React.Fragment>
              ))}
              <span className="api-type__symbol">&gt;</span>
            </>
          )}
        </>
      );
    }

    case "reflection": {
      const type = reflection as unknown as JSONOutput.ReflectionType;
      const decl = type.declaration;

      // object literal
      if (decl?.children && decl.children.length > 0) {
        return (
          <>
            <span className="api-type__symbol">&lbrace; </span>
            {decl.children.map((child, i) => (
              <React.Fragment key={child.id ?? i}>
                {i > 0 && <span className="api-type__symbol">; </span>}
                <span>
                  {child.name}
                  <span className="api-type__symbol">{child.flags?.isOptional && "?"}: </span>
                  {child.type ? <Type {...props} reflection={child.type} /> : "any"}
                </span>
              </React.Fragment>
            ))}
            <span className="api-type__symbol"> &rbrace;</span>
          </>
        );
      }

      if (decl?.signatures && decl.signatures.length === 1) {
        return <Signature {...props} hideName useArrow reflection={decl.signatures[0]} />;
      }

      if (decl?.signatures && decl.signatures.length > 0) {
        return parens(
          <>
            <span className="api-type__symbol">&lbrace; </span>
            {decl.signatures.map((sig, i) => (
              <React.Fragment key={sig.id ?? i}>
                <>
                  {i > 0 && <span className="api-type__symbol">; </span>}
                  <Signature {...props} reflection={sig} />
                  {sig}
                </>
              </React.Fragment>
            ))}
            <span className="api-type__symbol"> &rbrace;</span>
          </>,
          needsParens,
        );
      }

      return <>{"{}"}</>;
    }

    case "rest": {
      const type = reflection as unknown as JSONOutput.RestType;

      return (
        <>
          <span className="api-type__symbol">...</span>
          <Type {...props} reflection={type.elementType} />
        </>
      );
    }

    case "tuple": {
      const type = reflection as unknown as JSONOutput.TupleType;

      return (
        <>
          <span className="api-type__symbol">[</span>
          {type.elements?.map((t, i) => (
            <React.Fragment key={t.type + i}>
              {i > 0 && <span className="api-type__symbol">, </span>}
              <Type {...props} reflection={t} />
            </React.Fragment>
          ))}
          <span className="api-type__symbol">]</span>
        </>
      );
    }

    case "typeOperator": {
      const type = reflection as unknown as JSONOutput.TypeOperatorType;

      return (
        <>
          <span className="api-type__symbol">{type.operator} </span>
          <Type {...props} reflection={type.target} />
        </>
      );
    }

    case "union": {
      const type = reflection as unknown as JSONOutput.UnionType;

      return parens(
        <>
          {type.types.map((t, i) => (
            <React.Fragment key={t.type + i}>
              {i > 0 && <span className="api-type__symbol"> | </span>}
              <Type {...props} reflection={t} needsParens />
            </React.Fragment>
          ))}
        </>,
        needsParens,
      );
    }

    case "unknown": {
      const type = reflection as unknown as JSONOutput.UnknownType;

      return <span className="api-type__type">{type.name}</span>;
    }

    case "named-tuple-member": {
      const type = reflection as unknown as unknown as JSONOutput.NamedTupleMemberType;

      return (
        <>
          {type.name}
          <span className="api-type__symbol">{type.isOptional ? "?: " : ": "}</span>
          <Type {...props} reflection={type.element} />
        </>
      );
    }

    case "template-literal": {
      const type = reflection as unknown as unknown as JSONOutput.TemplateLiteralType;

      return (
        <>
          <span className="api-type__symbol">`</span>
          {type.head && <span className="api-type__type">{type.head}</span>}
          {type.tail.map((t, i) => (
            <React.Fragment key={i}>
              <span className="api-type__symbol">$&lbrace;</span>
              {typeof t[0] !== "string" && <Type {...props} reflection={t[0]} />}
              <span className="api-type__symbol">&rbrace;</span>
              {typeof t[1] === "string" && <span className="api-type__type">{t[1]}</span>}
            </React.Fragment>
          ))}
          <span className="api-type__symbol">`</span>
        </>
      );
    }

    default:
      return <span className="api-type__type">void</span>;
  }
}

Type.defaultProps = {
  needsParens: false,
};
