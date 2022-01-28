import json2md from "json2md";
import { JSONOutput } from "typedoc";
import { defaultTextsOptions } from "../constants/options.constants";
import { PluginOptions } from "../types/package.types";
import {
  getMdDescription,
  getMdQuoteText,
  getMdTable,
  getMdTitle,
  getMdBadges,
  AdmonitionTypes,
  getMdAdmonitions,
} from "./md.styles";

export class MdTransformer {
  constructor(private value: JSONOutput.DeclarationReflection, private options: PluginOptions, private pkg: string) {}

  getName(): json2md.DataObject[] {
    return [{ h1: getMdTitle(this.value) }];
  }

  getBadges(): json2md.DataObject[] {
    const badges = getMdBadges(this.value);

    if (badges) {
      return [{ p: badges }];
    }

    return [];
  }

  getDescription(setDefaultDescription = false) {
    const shortDescription = this.value.comment?.shortText;
    const longDescription = this.value.comment?.text;

    const output = [];

    if (shortDescription) {
      output.push({ p: getMdDescription(shortDescription || "") });
    }

    if (longDescription) {
      output.push({ p: getMdDescription(longDescription || "") });
    }

    if (!output.length && setDefaultDescription) {
      output.push({
        p: getMdDescription(
          `This ${getMdQuoteText(this.value.kindString || "Element")} doesn't have any description yet.`,
        ),
      });
    }

    return output;
  }

  getImport(): json2md.DataObject[] {
    return [
      { h2: this.options.texts?.import ?? defaultTextsOptions.import },
      {
        code: {
          language: this._getLanguage(this.value),
          content: [`import { ${this.value.name} } from "${this.pkg}"`],
        },
      },
    ];
  }

  getExample(): json2md.DataObject[] {
    return [
      { h2: this.options.texts?.example ?? defaultTextsOptions.example },
      {
        code: {
          language: this._getLanguage(this.value),
          content: [`import { ${this.value.name} } from "${this.pkg}"`],
        },
      },
    ];
  }

  getPreview(): json2md.DataObject[] {
    return [
      { h2: this.options.texts?.example ?? defaultTextsOptions.example },
      {
        code: {
          language: this._getLanguage(this.value),
          content: [`import { ${this.value.name} } from "${this.pkg}"`],
        },
      },
    ];
  }

  getParams(titleSize = "h2"): json2md.DataObject[] {
    const signature = this._getCallSignature();

    if (signature && signature.parameters?.length) {
      const headers = this.options.texts?.paramTableHeaders ?? defaultTextsOptions.paramTableHeaders;
      const parameters = signature.parameters.map((parameter, index) => {
        const paramName = parameter.name || "-";
        const name = paramName === "__namedParameters" ? `parameter${index + 1}` : paramName;

        return {
          value: [
            name,
            this._getTypeObject(parameter) || "",
            parameter.defaultValue || "",
            parameter?.comment?.shortText || "",
          ],
        };
      });
      return [
        { [titleSize]: this.options.texts?.parameters ?? defaultTextsOptions.parameters },
        {
          p: getMdTable(headers, parameters),
        },
      ];
    }

    return [];
  }

  getMethods(): json2md.DataObject[] {
    let output: Array<Record<string, unknown>> = [];

    const methods = this._getMethods();

    if (methods.length) {
      output.push({ h2: this.options.texts?.methods ?? defaultTextsOptions.methods });

      methods.forEach((method, index) => {
        const methodTransformer = new MdTransformer(method, this.options, this.pkg);
        const description = methodTransformer.getDescription();
        const parameters = methodTransformer.getParams("h4");
        const returns = methodTransformer._getReturnType();
        const preview = methodTransformer._getCallPreview();
        const isLast = methods.length === index + 1;

        output.push({ h3: getMdQuoteText(method.name + "()") });

        if (preview) {
          output.push({
            code: {
              language: this._getLanguage(this.value),
              content: [methodTransformer._getCallPreview()],
            },
          });
        }

        if (returns) {
          output.push({ p: returns });
        }
        if (description?.length) {
          output = output.concat(description);
        }
        if (parameters?.length) {
          output = output.concat(description);
        }

        !isLast && output.push({ p: "<hr />" });
      });
    }

    return output;
  }

  getAdmonitionsType(type: AdmonitionTypes): json2md.DataObject[] {
    let output: Array<Record<string, unknown>> = [];

    const tags = this._getTags();
    const admonitions = getMdAdmonitions(tags, type, this.options);

    if (admonitions.length) {
      admonitions.forEach((admonition) => {
        output.push({ p: admonition });
      });
    }

    return output;
  }

  // Private methods

  _getMethods() {
    const methodKinds = ["Method"];
    const methods = this.value.children
      ?.sort((a, b) => {
        const nameA = a.name.startsWith("_");
        const nameB = b.name.startsWith("_");

        if (nameA && nameB) {
          return 0;
        } else if (nameA) {
          return 1;
        }
        return -1;
      })
      ?.filter((child) => methodKinds.includes(child.kindString || ""));
    return methods || [];
  }

  _getCallSignature() {
    const parametersKinds = ["Call", "Constructor"];

    // Methods
    if (this.value.signatures) {
      return this.value.signatures?.find((signature) => !!signature);
    }

    // Class / Function
    return this.value.children
      ?.find((child) => parametersKinds.includes(child.kindString || ""))
      ?.signatures?.find((signature) => !!signature);
  }

  _getReturnType() {
    const signature = this._getCallSignature();
    const type = signature?.type;
    const args = type && "typeArguments" in type && type?.typeArguments;
    const returnsText = this.options.texts?.returns ?? defaultTextsOptions.returns;

    const getReturnResponse = (value: string) => `${returnsText} ${getMdQuoteText(value)}`;

    const tags = this._getTags();
    const returnTag = tags?.find(({ tag }) => tag === "returns");

    if (returnTag && returnTag.text) {
      return getReturnResponse(returnTag.text);
    }

    if (type?.type && args && args?.length) {
      // @ts-ignore "name" is not present in the types
      return getReturnResponse(`${type.name}<${args.map((arg) => arg.name || arg.type).join(", ")}>`);
    }

    // @ts-ignore "name" is not present in the types
    return getReturnResponse(type?.name || type?.type || "void");
  }

  _getCallPreview() {
    const signature = this._getCallSignature();

    if (signature) {
      const name = signature.name;

      const typeSignatures = signature.typeParameter?.length && signature.typeParameter.map((param) => param.name);
      const typeSignature = typeSignatures ? `<${typeSignatures.join(", ")}>` : "";

      const callSignatures = signature.parameters?.length && signature.parameters.map((param) => param.name);
      const callSignature = callSignatures ? callSignatures.join(", ") : "";

      return `${name}${typeSignature}(${callSignature})`;
    }

    return "";
  }

  _getTags() {
    return this.value.comment?.tags;
  }

  _getTypeObject(parameter: JSONOutput.ParameterReflection) {
    return "type";

    // const type = parameter?.type;
    // const args = type && "typeArguments" in type && type?.typeArguments;

    // if (type?.type && args && args?.length) {
    //   return `${type.type}<${args.map((type) => (type as any)?.name || type.type).join(", ")}>`;
    // }

    // return type?.type;
  }

  _getLanguage(value: JSONOutput.DeclarationReflection) {
    return "tsx";
  }
}
