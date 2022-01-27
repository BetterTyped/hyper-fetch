import json2md from "json2md";
import { JSONOutput } from "typedoc";
import { defaultTextsOptions } from "../constants/options.constants";
import { PluginOptions } from "../types/package.types";
import { getMdDescription, getMdQuoteText, getMdTable, getMdTitle, getMdBadges } from "./md.styles";

export class MdTransformer {
  constructor(private value: JSONOutput.DeclarationReflection, private options: PluginOptions, private pkg: string) {}

  getName(): json2md.DataObject[] {
    return [{ h1: getMdTitle(this.value) }];
  }

  getBadges(): json2md.DataObject[] {
    const badges = getMdBadges(this.value);

    if (badges) {
      return [{ p: getMdBadges(this.value) || "" }];
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
      output.push({ p: getMdDescription(`This ${this.value.kindString} doesn't have any description yet.`) });
    }

    return output;
  }

  getImport(): json2md.DataObject[] {
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
      const parameters = signature.parameters.map((parameter) => {
        return {
          value: [
            parameter.name || "-",
            this._getTypeObject(parameter) || "-",
            parameter.defaultValue || "-",
            parameter?.comment?.shortText || "-",
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
      const returnsText = this.options.texts?.methods ?? defaultTextsOptions.methods;

      methods.forEach((method, index) => {
        const methodTransformer = new MdTransformer(method, this.options, this.pkg);
        const description = methodTransformer.getDescription();
        const parameters = methodTransformer.getParams("h4");
        const returns = methodTransformer._getReturnType();
        const isLast = methods.length === index + 1;

        output.push({ h3: getMdQuoteText(method.name + "()") });
        output.push({
          code: {
            language: this._getLanguage(this.value),
            content: [methodTransformer._getCallPreview()],
          },
        });

        if (returns) {
          output.push({ p: `${returnsText}${getMdQuoteText(returns)}` });
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

  _getMethods() {
    const methodKinds = ["Method"];
    const methods = this.value.children?.filter((child) => methodKinds.includes(child.kindString || ""));
    return methods || [];
  }

  _getCallSignature() {
    const parametersKinds = ["Call", "Constructor"];
    const signature = this.value.children
      ?.find((child) => parametersKinds.includes(child.kindString || ""))
      ?.signatures?.find((signature) => !!signature);
    return signature;
  }

  _getReturnType() {
    const signature = this._getCallSignature();
    const type = signature?.type;
    const args = type && "typeArguments" in type && type?.typeArguments;

    if (type?.type && args && args?.length) {
      return `${type.type}<${args.join(", ")}>`;
    }

    return type?.type;
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
