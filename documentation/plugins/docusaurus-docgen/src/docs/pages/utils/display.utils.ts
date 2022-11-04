import { StringType } from "./types.utils";

export const parens = (element: string, needsParens?: boolean) => {
  if (!needsParens) {
    return element;
  }

  return `(${element})`;
};

export const objectToString = (value: Record<string, StringType> | string, level = 0) => {
  if (typeof value === "string") return value;
  const addIndent = (spaces: number) => {
    let strOutput = "";
    for (let i = 0; i < spaces; i += 1) {
      strOutput += "  ";
    }
    return strOutput;
  };
  let strOutput = "";

  Object.keys(value).forEach((key) => {
    if (typeof value[key] === "object") {
      strOutput += `${addIndent(level + 1) + key}: `;
      strOutput += `${objectToString(value[key], level + 1)};\n`;
    } else {
      strOutput += `${addIndent(level + 1) + key}: ${value[key]};\n`;
    }
  });

  return `{\n${strOutput}${addIndent(level - 1)}${addIndent(level)}}`.replace(/"/g, "");
};
