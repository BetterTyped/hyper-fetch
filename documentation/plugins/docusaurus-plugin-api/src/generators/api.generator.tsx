import * as path from "path";
import json2md from "json2md";
import { JSONOutput } from "typedoc";
import { trace, error } from "../utils/log.utils";
import { createFile } from "../utils/file.utils";

const docsExtension = ".mdx";

export const apiGenerator = (jsonFile: JSONOutput.ProjectReflection, packageRoute: string, docsRoot: string) => {
  jsonFile.children?.forEach((child) => {
    const name = child.name;
    const kind = child.kindString;

    if (!kind) {
      return trace(`Module ${kind} not parsed. Missing type specification.`);
    }

    const data = json2md([
      { h1: name },
      { blockquote: "A JSON to Markdown converter." },
      {
        img: [
          { title: "Some image", source: "https://example.com/some-image.png" },
          { title: "Another image", source: "https://example.com/some-image1.png" },
          { title: "Yet another image", source: "https://example.com/some-image2.png" },
        ],
      },
      { h2: "Features" },
      { ul: ["Easy to use", "You can programmatically generate Markdown content", "..."] },
      { h2: "How to contribute" },
      { ol: ["Fork the project", "Create your branch", "Raise a pull request"] },
      { h2: "Code blocks" },
      { p: "Below you can see a code block example." },
      {
        code: {
          language: "tsx",
          content: ["function sum (a, b) {", "   return a + b", "}", "sum(1, 2)"],
        },
      },
    ]);

    try {
      const routePath = path.join(docsRoot, packageRoute, kind, name + docsExtension);
      createFile(routePath, data);
    } catch (err) {
      error(`Cannot create file for ${name}`);
      error(err);
    }
  });

  // Module
  // - overview (if overview.md file is present use it, if not - create own overview)
  // - classes
  // - components (if includes tsx/jsx) / functions (other)
  // - interfaces (types, interfaces)
};
