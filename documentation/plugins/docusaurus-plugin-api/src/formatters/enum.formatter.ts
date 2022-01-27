import json2md from "json2md";
import { JSONOutput } from "typedoc";
import { PluginOptions } from "../types/package.types";

export const enumFormatter = (value: JSONOutput.DeclarationReflection, options: PluginOptions, pkg: string): string => {
  return json2md([
    { h1: value.name },
    { blockquote: "This is enum" },
    { blockquote: "This is enum" },
    { blockquote: "This is enum" },
    { blockquote: "This is enum" },
    { blockquote: "This is enum" },
    { blockquote: "This is enum" },
    { blockquote: "This is enum" },
  ]);
};
