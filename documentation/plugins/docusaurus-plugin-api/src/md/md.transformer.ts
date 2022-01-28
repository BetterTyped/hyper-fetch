import json2md from "json2md";
import { JSONOutput } from "typedoc";
import { defaultTextsOptions } from "../constants/options.constants";
import { PluginOptions } from "../types/package.types";
import { KindTypes } from "./md.constants";
import {
  getMdDescription,
  getMdTable,
  getMdTitle,
  getMdBadges,
  AdmonitionTypes,
  getMdAdmonitions,
  getMdMainLine,
  getMdLine,
  getVariablePreview,
} from "./md.styles";
import { getMdBoldText, getMdQuoteText, getTypeName, sanitizeHtml } from "./md.utils";

export class MdTransformer {
  constructor(private value: JSONOutput.DeclarationReflection, private options: PluginOptions, private pkg: string) {}

  getName(): json2md.DataObject[] {
    return [{ h1: getMdTitle(this.value) }];
  }

  getMainLine(): json2md.DataObject[] {
    return [{ p: getMdMainLine() }];
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

    if (output.length) {
      output.unshift({ h2: "Description" });
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

  getImport(): json2md.DataObject[] {
    return [
      { h2: this.options.texts?.import ?? defaultTextsOptions.import },
      {
        code: {
          language: this._getLanguage(),
          content: [`import { ${this.value.name} } from "${this.pkg}"`],
        },
      },
    ];
  }

  getExample(): json2md.DataObject[] {
    const tags = this._getTags();
    const example = tags?.find(({ tag }) => tag === "example");

    if (example) {
      return [
        { h2: this.options.texts?.example ?? defaultTextsOptions.example },
        {
          code: {
            language: this._getLanguage(),
            content: [example.text],
          },
        },
      ];
    }
    return [];
  }

  getPreview(): json2md.DataObject[] {
    const signature = this._getCallSignature();
    const parameters = signature?.parameters;
    const kind = (this.value.kindString || "") as KindTypes;

    if (signature && parameters && [KindTypes.class, KindTypes.fn].includes(kind)) {
      const params = this._getParamsNames(parameters);
      return [
        { h2: this.options.texts?.preview ?? defaultTextsOptions.preview },
        {
          code: {
            language: this._getLanguage(),
            content: [`${signature.name}(${params.join(", ")})`],
          },
        },
      ];
    }

    if ([KindTypes.type, KindTypes.enum, KindTypes.var].includes(kind)) {
      return [
        { h2: this.options.texts?.preview ?? defaultTextsOptions.preview },
        {
          code: {
            language: this._getLanguage(),
            content: [getVariablePreview(kind as any, this.value.name, this._getStructuredType())],
          },
        },
      ];
    }

    return [];
  }

  getParameters(titleSize = "h2"): json2md.DataObject[] {
    const signature = this._getCallSignature();
    const parameters = signature?.parameters;

    if (parameters?.length) {
      const headers = this.options.texts?.paramTableHeaders ?? defaultTextsOptions.paramTableHeaders;
      const params = parameters.map((parameter, index) => {
        const name = this._getParamName(parameter, index);

        return {
          value: [
            getMdBoldText(name),
            getMdQuoteText(this._getType(parameter?.type)) || "-",
            parameter.defaultValue || "-",
            parameter?.comment?.shortText || "-",
          ],
        };
      });

      return [
        { [titleSize]: this.options.texts?.parameters ?? defaultTextsOptions.parameters },
        {
          p: getMdTable(headers, params),
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
        const parameters = methodTransformer.getParameters("h4");
        const returns = methodTransformer._getReturnType();
        const preview = methodTransformer._getCallPreview();
        const isLast = methods.length === index + 1;

        output.push({ h3: getMdQuoteText(method.name + "()") });

        if (preview) {
          output.push({
            code: {
              language: this._getLanguage(),
              content: [preview],
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
          output = output.concat(parameters);
        }

        !isLast && output.push({ p: getMdLine() });
      });
    }

    return output;
  }

  // ***************
  // ***************
  // Private methods
  // ***************
  // ***************

  _getMethods() {
    let methods: JSONOutput.DeclarationReflection[] = [];
    if (this.value.children) {
      const methodKinds = [KindTypes.method];
      methods = this.value.children
        .sort((a, b) => {
          const nameA = a.name.startsWith("_");
          const nameB = b.name.startsWith("_");

          if (nameA && nameB) {
            return 0;
          } else if (nameA) {
            return 1;
          }
          return -1;
        })
        .filter((child) => methodKinds.includes((child.kindString || "") as KindTypes));
    }
    return methods;
  }

  _getParamName(parameter: JSONOutput.ParameterReflection | undefined, index?: number) {
    if (parameter) {
      const paramName = parameter.name || "-";
      const paramIndex = typeof index === "number" ? index + 1 : "";
      return paramName === "__namedParameters" ? `param${paramIndex}` : paramName;
    }

    return "";
  }

  _getParamsNames(parameters: JSONOutput.ParameterReflection[] | undefined) {
    if (parameters) {
      return parameters.map((parameter, index) => {
        return this._getParamName(parameter, index);
      });
    }

    return [];
  }

  _getCallSignature() {
    const parametersKinds = ["Call", "Constructor"];

    // Methods
    if (this.value.signatures) {
      return this.value.signatures?.find((signature) => !!signature);
    }

    // Class / Function
    if (this.value.children) {
      return this.value.children
        ?.find((child) => parametersKinds.includes(child.kindString || ""))
        ?.signatures?.find((signature) => !!signature);
    }
    return this.value as JSONOutput.SignatureReflection;
  }

  _getSource() {
    return this.value.sources?.find((signature) => !!signature) || undefined;
  }

  _getReturnType() {
    const signature = this._getCallSignature();
    const tags = this._getTags();
    const returnTag = tags?.find(({ tag }) => tag === "returns");
    const type = this._getType(signature?.type);
    const returnsText = this.options.texts?.returns ?? defaultTextsOptions.returns;

    const getReturnResponse = (value: string) => `${returnsText} ${getMdQuoteText(value)}`;

    if (returnTag && returnTag.text) {
      return getReturnResponse(returnTag.text);
    }

    return getReturnResponse(type);
  }

  _getStructuredType() {
    const type = this.value?.type as JSONOutput.ReflectionType;
    const declaration = type?.declaration;
    if (declaration?.children?.length) {
      return declaration.children.map<[string, string]>((child) => [child.name, this._getType(child.type)]);
    }
    return getTypeName(type);
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

  _getType(
    type: JSONOutput.ParameterReflection["type"] | JSONOutput.ReflectionType | JSONOutput.SomeType | undefined,
  ): string {
    const declaration = (type as JSONOutput.ReflectionType)?.declaration;

    if (type?.type === "union" && type.types) {
      return type.types.map((type) => getTypeName(type)).join(" | ") || "";
    }

    if (declaration?.children?.length) {
      return `{ ${declaration.children.map<[string, string]>((child) => [child.name, this._getType(child.type)])} }`;
    }

    // @ts-ignore "typeArguments" is not present in the types
    const args = type && ((type.typeArguments || type.types) as JSONOutput.SomeType[]);

    if (type?.type && args && args?.length) {
      return `${getTypeName(type)}<${args.map((arg) => this._getType(arg)).join(", ")}>`;
    }

    return getTypeName(type);
  }

  _getLanguage() {
    const source = this._getSource();
    return source?.fileName?.split(".").pop() || "tsx";
  }
}
