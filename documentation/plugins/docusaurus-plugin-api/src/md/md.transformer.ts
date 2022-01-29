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
import { getMdBoldText, getMdQuoteText, getType, getTypeName, getParamName, getParamsNames } from "./md.utils";

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

  getDescription(hasHeader = true) {
    const shortDescription = this.value.comment?.shortText;
    const longDescription = this.value.comment?.text;

    const output = [];

    if (shortDescription) {
      output.push({ p: getMdDescription(shortDescription || "") });
    }

    if (longDescription) {
      output.push({ p: getMdDescription(longDescription || "") });
    }

    if (hasHeader && output.length) {
      output.unshift({ h2: "Description" });
    }

    return output;
  }

  getAdmonitionsByType(type: AdmonitionTypes): json2md.DataObject[] {
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

  getImport(hasHeader = true): json2md.DataObject[] {
    const output: json2md.DataObject[] = [
      {
        code: {
          language: this._getLanguage(),
          content: [`import { ${this.value.name} } from "${this.pkg}"`],
        },
      },
    ];

    if (hasHeader) {
      output.unshift({ h2: this.options.texts?.import ?? defaultTextsOptions.import });
    }

    return output;
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

  getPreview(hasHeader = true): json2md.DataObject[] {
    const signature = this._getCallSignature();
    const parameters = signature?.parameters;
    const kind = (this.value.kindString || "") as KindTypes;

    if (signature && parameters && [KindTypes.class, KindTypes.fn].includes(kind)) {
      const params = getParamsNames(parameters);
      const output: json2md.DataObject[] = [];

      if (hasHeader) {
        output.unshift({ h2: this.options.texts?.preview ?? defaultTextsOptions.preview });
      }

      output.push({
        code: {
          language: this._getLanguage(),
          content: [`${getTypeName(signature, true)}(${params.join(", ")})`],
        },
      });

      return output;
    }

    if ([KindTypes.type, KindTypes.enum, KindTypes.var].includes(kind)) {
      const output: json2md.DataObject[] = [];

      if (hasHeader) {
        output.unshift({ h2: this.options.texts?.preview ?? defaultTextsOptions.preview });
      }

      output.push({
        code: {
          language: this._getLanguage(),
          content: [
            getVariablePreview(
              kind as KindTypes.enum | KindTypes.type | KindTypes.var,
              getTypeName(this.value, true),
              this._getStructureType(),
            ),
          ],
        },
      });

      return output;
    }

    return [];
  }

  getParameters(hasHeader = true): json2md.DataObject[] {
    const signature = this._getCallSignature();
    const parameters = signature?.parameters;

    if (parameters?.length) {
      const output: json2md.DataObject[] = [];

      const headers = this.options.texts?.paramTableHeaders ?? defaultTextsOptions.paramTableHeaders;
      let namedParameterCount = 0;
      const params = parameters.map((parameter) => {
        const name = getParamName(parameter, namedParameterCount);

        if (parameter.name === "__namedParameters") {
          namedParameterCount++;
        }

        return {
          value: [
            getMdBoldText(name),
            getMdQuoteText(getType(parameter?.type)) || "-",
            parameter.defaultValue || "-",
            parameter?.comment?.shortText || "-",
          ],
        };
      });

      if (hasHeader) {
        output.unshift({ h2: this.options.texts?.parameters ?? defaultTextsOptions.parameters });
      }

      output.push({
        p: getMdTable(headers, params),
      });

      return output;
    }

    return [];
  }

  getMethods(hasHeader = true): json2md.DataObject[] {
    let output: Array<Record<string, unknown>> = [];

    const methods = this._getMethods();

    if (methods.length) {
      if (hasHeader) {
        output.push({ h2: this.options.texts?.methods ?? defaultTextsOptions.methods });
      }

      methods.forEach((method, index) => {
        const methodTransformer = new MdTransformer(method, this.options, this.pkg);
        const description = methodTransformer.getDescription();
        const parameters = methodTransformer.getParameters(false);
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
          output.push({ h4: this.options.texts?.parameters ?? defaultTextsOptions.parameters });
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
    const type = getType(signature?.type);
    const returnsText = this.options.texts?.returns ?? defaultTextsOptions.returns;

    const getReturnResponse = (value: string) => `${returnsText} ${getMdQuoteText(value)}`;

    if (returnTag && returnTag.text) {
      return getReturnResponse(returnTag.text);
    }

    return getReturnResponse(type);
  }

  _getStructureType() {
    const value = this.value;
    const type = value?.type;
    if (type && "declaration" in type && type.declaration?.children?.length) {
      return type.declaration.children.map<[string, string]>((child) => {
        const signature = child?.signatures?.[0];
        return [`${child.name}: ${getType(child.type)}`, getType(signature || child.type)];
      });
    }
    if (value && "children" in value && value?.children?.length) {
      return value.children.map<[string, string]>((child) => [
        `${child.name}: ${getType(child.type)}`,
        child.defaultValue || getType(child.type),
      ]);
    }
    return getType(type);
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

  _getLanguage() {
    const source = this._getSource();
    return source?.fileName?.split(".").pop() || "tsx";
  }
}
