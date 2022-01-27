import { JSONOutput } from "typedoc";
import { defaultTextsOptions } from "../constants/options.constants";
import { PluginOptions } from "../types/package.types";
import { description, table } from "./md.styles";

export class MdTransformer {
  constructor(private value: JSONOutput.DeclarationReflection, private options: PluginOptions, private pkg: string) {}

  getTitle() {
    return [{ h1: this.value.name }];
  }

  getDescription() {
    const shortDescription = this.value.comment?.shortText;
    const longDescription = this.value.comment?.text;

    const output = [];

    if (shortDescription) {
      output.push({ p: description(shortDescription || "") });
    }

    if (longDescription) {
      output.push({ p: description(longDescription || "") });
    }

    if (!output.length) {
      output.push({ p: description(`This ${this.value.kindString} doesn't have any description yet.`) });
    }

    return output;
  }

  getImport() {
    return [
      { h3: this.options.texts?.import ?? defaultTextsOptions.import },
      {
        code: {
          language: this._getLanguage(this.value),
          content: [`import { ${this.value.name} } from "${this.pkg}"`],
        },
      },
    ];
  }

  getExample() {
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

  getPreview() {
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

  getParams() {
    const parametersKinds = ["Call", "Constructor"];
    const signatureKinds = ["Call signature", "Constructor signature"];
    const parameterChild = this.value.children
      ?.find((child) => parametersKinds.includes(child.kindString || ""))
      ?.signatures?.find((signature) => signatureKinds.includes(signature.kindString || ""));

    if (parameterChild && parameterChild.parameters?.length) {
      const headers = this.options.texts?.paramTableHeaders ?? defaultTextsOptions.paramTableHeaders;
      const parameters = parameterChild.parameters.map((parameter) => {
        return {
          value: [
            parameter.name || "-",
            this._getTypeObject(parameter),
            parameter.defaultValue || "-",
            parameter?.comment?.shortText || "-",
          ],
        };
      });
      return [
        { h2: this.options.texts?.parameters ?? defaultTextsOptions.parameters },
        {
          p: table(headers, parameters),
        },
      ];
    }

    return [];
  }

  getMethods() {
    const output = [];

    return [];
  }

  private _getTypeObject(parameter: JSONOutput.ParameterReflection) {
    return "type";
  }

  private _getLanguage(value: JSONOutput.DeclarationReflection) {
    return "tsx";
  }
}
