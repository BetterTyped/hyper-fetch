import { JSONOutput, ReflectionKind } from "typedoc";

export const getReference = (
  reflectionsTree: JSONOutput.ProjectReflection[],
  id: number | undefined,
  name: string | undefined,
) => {
  let reflectionMatch: JSONOutput.DeclarationReflection | undefined;
  if (id) {
    // First element is always current library so we are not mixing ids between
    reflectionsTree[0].children?.some((reflection) => {
      if (reflection.id === id) {
        reflectionMatch = reflection;
        return true;
      }
      return false;
    });
  } else if (name) {
    // If no ID found, we can try to look for a matching value in other monorepo packages
    const matches: JSONOutput.DeclarationReflection[] = [];
    reflectionsTree.forEach((tree) =>
      tree.children?.forEach((reflection) => {
        if (reflection.name === name) {
          matches.push(reflection);
          return true;
        }
        return false;
      }),
    );
    // If there are more matches, our result is not reliable
    if (matches.length === 1) {
      const [match] = matches;
      reflectionMatch = match;
    }
  }

  return reflectionMatch;
};

export const getSignature = (reflection: JSONOutput.DeclarationReflection) => {
  const parametersKinds = ["Call", "Constructor"];

  // Methods
  if (reflection.signatures) {
    return reflection.signatures?.find((signature) => !!signature);
  }

  // Class / Function
  if (reflection.children) {
    return reflection.children
      ?.find((child) => parametersKinds.includes(child.kindString || ""))
      ?.signatures?.find((signature) => !!signature);
  }
  return reflection as JSONOutput.SignatureReflection;
};

export const getCallPreview = (signature: JSONOutput.SignatureReflection) => {
  const { name } = signature;

  const typeSignatures =
    signature.typeParameter?.length && signature.typeParameter.map((param) => param.name);
  const typeSignature = typeSignatures ? `<${typeSignatures.join(", ")}>` : "";

  const callSignatures =
    signature.parameters?.length &&
    signature.parameters.map((param, index) =>
      // eslint-disable-next-line no-nested-ternary
      param.flags?.isRest
        ? `...${param.name}`
        : param.name === "__namedParameter"
        ? `params$${index}`
        : param.name,
    );
  const callSignature = callSignatures ? callSignatures.join(", ") : "";

  return [name, typeSignature, callSignature];
};

const isFunctionType = (
  reflection: any,
  reflectionsTree: JSONOutput.ProjectReflection[],
): boolean => {
  const element = reflection as unknown as JSONOutput.DeclarationReflection;

  if (typeof element.type === "object" && element.type && "id" in element.type && element.type.id) {
    const referenceType = getReference(reflectionsTree, element.type.id, element.type.name);

    if (referenceType?.type?.type === "conditional") {
      if (
        referenceType.type?.trueType &&
        isFunctionType(referenceType.type.trueType, reflectionsTree)
      ) {
        return true;
      }
      if (
        referenceType.type?.falseType &&
        isFunctionType(referenceType.type.falseType, reflectionsTree)
      ) {
        return true;
      }
      if (
        referenceType.type?.checkType &&
        isFunctionType(referenceType.type.trueType, reflectionsTree)
      ) {
        return true;
      }
    }
    if (referenceType) {
      return isFunctionType(referenceType, reflectionsTree);
    }
  }
  if (
    typeof element.type === "object" &&
    element?.type &&
    "declaration" in element.type &&
    element.type.declaration
  ) {
    return !!element.type.declaration.signatures;
  }
  if ((element as any)?.declaration) {
    return !!(element as any).declaration?.signatures;
  }
  return false;
};

const isMethod = (
  reflection: JSONOutput.DeclarationReflection,
  reflectionsTree: JSONOutput.ProjectReflection[],
) => {
  if (reflection.kind === ReflectionKind.Method) {
    return true;
  }
  return isFunctionType(reflection, reflectionsTree);
};

export const getProperties = (
  reflection: JSONOutput.DeclarationReflection,
  reflectionsTree: JSONOutput.ProjectReflection[],
) => {
  return (reflection.children || [])
    .sort((a, b) => {
      const nameA = a.name.startsWith("_");
      const nameB = b.name.startsWith("_");

      if (nameA && nameB) {
        return 0;
      }
      if (nameA) {
        return 1;
      }
      return -1;
    })
    .filter((element) => element.name !== "constructor")
    .filter((element) => {
      return !isMethod(element, reflectionsTree);
    });
};

export const getMethods = (
  reflection: JSONOutput.DeclarationReflection,
  reflectionsTree: JSONOutput.ProjectReflection[],
) => {
  return (reflection.children || [])
    .sort((a, b) => {
      const nameA = a.name.startsWith("_");
      const nameB = b.name.startsWith("_");

      if (nameA && nameB) {
        return 0;
      }
      if (nameA) {
        return 1;
      }
      return -1;
    })
    .filter((element) => element.name !== "constructor")
    .filter((element) => {
      return isMethod(element, reflectionsTree);
    });
};

// Comments

export const parseTag = (
  tag: JSONOutput.CommentTag,
  hasTitle?: boolean,
): { description: string; title: string; raw: JSONOutput.CommentTag } => {
  const content = tag.content
    .map(({ kind, text }) => {
      if (kind === "code") {
        return `\n${text}\n`;
      }
      return text;
    })
    .join("");

  if (hasTitle) {
    const [title, ...description] = content.split("\n");
    return {
      title,
      description: description.join("\n"),
      raw: tag,
    };
  }
  return {
    title: "",
    description: content,
    raw: tag,
  };
};

export const getTag = (
  comment: JSONOutput.DeclarationReflection["comment"],
  name: `@${string}`,
  hasTitle?: boolean,
) => {
  const tags = comment?.blockTags?.filter((blockTag) => blockTag.tag === name) || [];

  return tags.map((tag) => parseTag(tag, hasTitle));
};
