import { JSONOutput } from "typedoc";

export const sanitizeHtml = (htmlString: string) => {
  return htmlString
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const flattenText = (value: string) => {
  return value.trim().replace(/(\r\n|\n|\r)/gm, "");
};

export const getStatusIcon = (tags: string[]) => {
  if (tags?.includes("alpha") || tags?.includes("beta")) {
    return "🚧 ";
  }
  if (tags?.includes("experimental")) {
    return "🧪 ";
  }

  return ``;
};

export const getMdBoldText = (value: string) => {
  return `<b>${value}</b>`;
};

export const getMdQuoteText = (value: string) => {
  return `<code>${sanitizeHtml(value)}</code>`;
};

export const getTypeName = (
  type: JSONOutput.ParameterReflection["type"] | JSONOutput.ReflectionType | JSONOutput.SomeType | undefined,
): string => {
  // @ts-ignore "name" is not present in the types
  return (type?.name as string) || type?.type || "void";
};
