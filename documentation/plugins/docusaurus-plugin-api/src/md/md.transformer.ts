import json2md from "json2md";
import { JSONOutput } from "typedoc";
import { defaultTextsOptions } from "../constants/options.constants";
import { PluginOptions } from "../types/package.types";
import { KindTypes, defaultOptions, defaultMethodOptions, defaultParamOptions } from "./md.constants";
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
  getMdBlockLink,
  getMdRow,
  getMdBoldText,
  getMdQuoteText,
  getMdCodeQuote,
} from "./md.styles";
import { MdOptions, MethodOptions, ParamOptions } from "./md.types";
import { getType, getTypeName, getParamName, getParamsNames, unSanitizeHtml } from "./md.utils";

export class MdTransformer {
  readonly baseLink: string; // to current element
  readonly packageLink: string; // to the outside modules - types / functions / classes / variables ...

  constructor(
    private reflection: JSONOutput.DeclarationReflection,
    private pluginOptions: PluginOptions,
    private npmName: string,
    private packageName: string,
    private reflectionTree: Pick<JSONOutput.DeclarationReflection, "id" | "name" | "kind" | "kindString">[] = [],
  ) {
    const monorepoBlock = this.pluginOptions.packages?.length > 1 ? `/${this.packageName}` : "";
    this.baseLink = `/${this.pluginOptions.docs.routeBasePath}${monorepoBlock}/${this.reflection.kindString}/${this.reflection.name}`;
    this.packageLink = `/${this.pluginOptions.docs.routeBasePath}${monorepoBlock}`;
  }

  getName(
    options: Omit<MdOptions, "hasHeader" | "descriptionSize"> = { ...defaultOptions, headingSize: "h1" },
  ): json2md.DataObject[] {
    const { headingSize = "h1" } = options;
    return [{ [headingSize]: getMdTitle(this.reflection) }];
  }

  getMainLine(): json2md.DataObject[] {
    return [{ p: getMdMainLine() }];
  }

  getBadges(): json2md.DataObject[] {
    const badges = getMdBadges(this.reflection);

    if (badges) {
      return [{ p: badges }];
    }

    return [];
  }

  getDescription(options: MdOptions = defaultOptions) {
    const {
      headingSize = defaultOptions.headingSize,
      hasHeading = defaultOptions.hasHeading,
      descriptionSize = defaultOptions.descriptionSize,
    } = options;

    const shortDescription = this.reflection.comment?.shortText;
    const longDescription = this.reflection.comment?.text;

    const output: json2md.DataObject[] = [];

    if (shortDescription) {
      output.push({ [descriptionSize]: getMdDescription(shortDescription || "") });
    }

    if (longDescription) {
      output.push({ [descriptionSize]: getMdDescription(longDescription || "") });
    }

    if (hasHeading && output.length) {
      output.unshift({ [headingSize]: "Description" });
    }

    return output;
  }

  getAdmonitionsByType(type: AdmonitionTypes): json2md.DataObject[] {
    let output: Array<Record<string, unknown>> = [];

    const tags = this._getTags();
    const admonitions = getMdAdmonitions(tags, type, this.pluginOptions);

    if (admonitions.length) {
      admonitions.forEach((admonition) => {
        output.push({ p: admonition });
      });
    }

    return output;
  }

  getAdmonitions(): json2md.DataObject[] {
    const types: AdmonitionTypes[] = ["note", "tip", "info", "caution", "danger", "deprecated"];
    let output: Array<Record<string, unknown>> = [];
    let admonitions: string[][] = [];

    const tags = this._getTags();

    types.forEach((type) => {
      admonitions = admonitions.concat(getMdAdmonitions(tags, type, this.pluginOptions));
    });

    if (admonitions.length) {
      admonitions.forEach((admonition) => {
        output.push({ p: admonition });
      });
    }

    return output;
  }

  getImport(options: Omit<MdOptions, "descriptionSize"> = defaultOptions): json2md.DataObject[] {
    const { headingSize = defaultOptions.headingSize, hasHeading = defaultOptions.hasHeading } = options;

    const output: json2md.DataObject[] = [
      {
        code: {
          language: this._getLanguage(),
          content: [`import { ${this.reflection.name} } from "${this.npmName}"`],
        },
      },
    ];

    if (hasHeading) {
      output.unshift({ [headingSize]: this.pluginOptions.texts?.import ?? defaultTextsOptions.import });
    }

    return output;
  }

  getExample(options: Omit<MdOptions, "descriptionSize"> = defaultOptions): json2md.DataObject[] {
    const { headingSize = defaultOptions.headingSize, hasHeading = defaultOptions.hasHeading } = options;
    const tags = this._getTags();
    const example = tags?.find(({ tag }) => tag === "example");
    const output: json2md.DataObject[] = [];

    if (example) {
      if (hasHeading) {
        output.push({ [headingSize]: this.pluginOptions.texts?.example ?? defaultTextsOptions.example });
      }

      output.push({
        code: {
          language: this._getLanguage(),
          content: [example.text],
        },
      });
    }
    return output;
  }

  getPreview(options: Omit<MdOptions, "descriptionSize"> = defaultOptions): json2md.DataObject[] {
    const { headingSize = defaultOptions.headingSize, hasHeading = defaultOptions.hasHeading } = options;
    const signature = this._getCallSignature();
    const parameters = signature?.parameters;
    const kind = (this.reflection.kindString || "") as KindTypes;

    if (signature && parameters && [KindTypes.class, KindTypes.fn].includes(kind)) {
      const params = getParamsNames(parameters);
      const output: json2md.DataObject[] = [];

      if (hasHeading) {
        output.unshift({ [headingSize]: this.pluginOptions.texts?.preview ?? defaultTextsOptions.preview });
      }

      output.push({
        code: {
          language: this._getLanguage(),
          content: [`${unSanitizeHtml(getTypeName(signature, "", [], true, false))}(${params.join(", ")})`],
        },
      });

      return output;
    }

    if ([KindTypes.type, KindTypes.enum, KindTypes.var].includes(kind)) {
      const output: json2md.DataObject[] = [];

      if (hasHeading) {
        output.unshift({ [headingSize]: this.pluginOptions.texts?.preview ?? defaultTextsOptions.preview });
      }

      output.push({
        code: {
          language: this._getLanguage(),
          content: [
            getVariablePreview(
              kind as KindTypes.enum | KindTypes.type | KindTypes.var,
              unSanitizeHtml(getTypeName(this.reflection, "", [], true, false)),
              this._getStructureView(),
            ),
          ],
        },
      });

      return output;
    }

    return [];
  }

  getParameters(options: Omit<MdOptions, "descriptionSize"> = defaultOptions): json2md.DataObject[] {
    const { headingSize = defaultOptions.headingSize, hasHeading = defaultOptions.hasHeading } = options;
    const parameters = this._getParametersList();

    if (parameters?.length) {
      const output: json2md.DataObject[] = [];

      const headers = this.pluginOptions.texts?.paramTableHeaders ?? defaultTextsOptions.paramTableHeaders;
      let namedParameterCount = 0;
      const params = parameters.map((parameter) => {
        const name = getParamName(parameter, namedParameterCount);

        if (parameter.name === "__namedParameters") {
          namedParameterCount++;
        }

        return {
          value: [
            getMdBoldText(name),
            this._getLinkedType(parameter?.type, true) || "-",
            parameter.defaultValue || "-",
            parameter?.comment?.shortText || "-",
          ],
        };
      });

      if (hasHeading) {
        output.unshift({ [headingSize]: this.pluginOptions.texts?.parameters ?? defaultTextsOptions.parameters });
      }

      output.push({
        p: getMdTable(headers, params),
      });

      return output;
    }

    return [];
  }

  getParameter(name: string, options: ParamOptions = defaultParamOptions) {
    const {
      type = defaultParamOptions.type,
      headingSize = defaultOptions.headingSize,
      descriptionSize = defaultOptions.descriptionSize,
    } = options;
    const param = this._getParameter(name);
    const parametersHeading = this.pluginOptions.texts?.parameters ?? defaultTextsOptions.parameters;
    const parametersLink = `${this.baseLink}#${parametersHeading}`;
    const paramType = this._getLinkedType(param?.type, true);
    const returnsText = this.pluginOptions.texts?.returns ?? defaultTextsOptions.returns;

    const getReturnResponse = (value: string) => `${returnsText} ${value}`;

    if (!param) {
      return [];
    }

    if (type === "link") {
      return [{ [descriptionSize]: `[${param.name}](${parametersLink})` }];
    }

    if (type === "preview") {
      return [{ [descriptionSize]: `${param.name}: ${paramType}` }];
    }

    if (type === "simple") {
      let output: json2md.DataObject[] = [];
      const description = param?.comment?.shortText;
      const returns = getReturnResponse(paramType);

      output.push({
        [headingSize]: param.name,
      });

      if (description?.length) {
        output.push({ [descriptionSize]: description });
      }
      output.push({ [descriptionSize]: returns });

      return output;
    }

    if (type === "complex") {
      let output: json2md.DataObject[] = [];
      const description = param?.comment?.shortText;
      const longDescription = param?.comment?.text;
      const returns = getReturnResponse(paramType);

      output.push({
        [headingSize]: param.name,
      });

      output.push({
        code: {
          language: this._getLanguage(),
          content: [`${param.name}: ${paramType}`],
        },
      });
      if (description?.length) {
        output.push({ [descriptionSize]: description });
      }
      if (longDescription?.length) {
        output.push({ [descriptionSize]: longDescription });
      }
      output.push({ [descriptionSize]: returns });

      return output;
    }

    return [];
  }

  // Methods
  getMethods(
    options: Omit<MdOptions, "descriptionSize"> = defaultOptions,
    methodOptions: MethodOptions = defaultMethodOptions,
  ): json2md.DataObject[] {
    const { headingSize = defaultOptions.headingSize, hasHeading = defaultOptions.hasHeading } = options;
    let output: Array<Record<string, unknown>> = [];

    const methods = this._getMethodsList();

    if (methods.length) {
      if (hasHeading) {
        output.push({ [headingSize]: this.pluginOptions.texts?.methods ?? defaultTextsOptions.methods });
      }

      methods.forEach((method, index) => {
        const isLast = methods.length === index + 1;
        const methodOutput = this.getMethod(method.name, { ...methodOptions, type: "complex" });

        output = output.concat(methodOutput);
        !isLast && output.push({ p: getMdLine() });
      });
    }

    return output;
  }

  getMethod(name: string, options: MethodOptions = defaultMethodOptions) {
    const {
      type = defaultMethodOptions.type,
      headingSize = defaultMethodOptions.headingSize,
      paramsHeadingSize = defaultMethodOptions.paramsHeadingSize,
      descriptionSize = defaultMethodOptions.descriptionSize,
    } = options;
    const method = this._getMethod(name);
    const methodLink = `${this.baseLink}#${method?.name || ""}`;

    if (!method) {
      return [];
    }

    if (type === "link") {
      return [{ [descriptionSize]: `[${method.name}](${methodLink})` }];
    }

    if (type === "preview") {
      let output: json2md.DataObject[] = [];
      const methodTransformer = new MdTransformer(
        method,
        this.pluginOptions,
        this.npmName,
        this.packageName,
        this.reflectionTree,
      );
      const preview = methodTransformer._getCallPreview();

      output.push({
        code: {
          language: this._getLanguage(),
          content: [preview],
        },
      });
      return output;
    }

    if (type === "simple") {
      let output: json2md.DataObject[] = [];
      const methodTransformer = new MdTransformer(
        method,
        this.pluginOptions,
        this.npmName,
        this.packageName,
        this.reflectionTree,
      );
      const description = methodTransformer.getDescription({ descriptionSize, hasHeading: false });
      const returns = methodTransformer._getReturnType();
      const preview = methodTransformer._getCallPreview();

      output.push({ [headingSize]: getMdCodeQuote(method.name + "()") });
      output.push({
        code: {
          language: this._getLanguage(),
          content: [preview],
        },
      });
      output.push({ [descriptionSize]: returns });
      output = output.concat(description);
      return output;
    }

    if (type === "complex") {
      let output: json2md.DataObject[] = [];
      const methodTransformer = new MdTransformer(
        method,
        this.pluginOptions,
        this.npmName,
        this.packageName,
        this.reflectionTree,
      );
      const description = methodTransformer.getDescription({ descriptionSize, hasHeading: false });
      const parameters = methodTransformer.getParameters({ headingSize: paramsHeadingSize });
      const returns = methodTransformer._getReturnType();
      const preview = methodTransformer._getCallPreview();
      const admonitions = methodTransformer.getAdmonitions();

      output.push({ [headingSize]: getMdCodeQuote(method.name + "()") });
      output.push({
        code: {
          language: this._getLanguage(),
          content: [preview],
        },
      });
      output.push({ [descriptionSize]: returns });
      output = output.concat(description);
      output = output.concat(parameters);
      output = output.concat(admonitions);
      return output;
    }

    return [];
  }

  // Types
  getTypeReferences(options: Omit<MdOptions, "descriptionSize"> = defaultOptions) {
    const { headingSize = defaultOptions.headingSize, hasHeading = defaultOptions.hasHeading } = options;

    const types = this._getTypesReferencesList();
    let output: json2md.DataObject[] = [];

    if (types.length) {
      output.push({
        p: getMdRow(
          types
            .map((ref) => {
              if (!ref.kindString) {
                return "";
              }
              const link = this.packageLink + `/${ref.kindString}/${ref.name}`;
              return getMdBlockLink(link, ref.kindString, ref.name);
            })
            .join(""),
        ),
      });
    }

    if (hasHeading && output.length) {
      output.unshift({ [headingSize]: this.pluginOptions.texts?.reference ?? defaultTextsOptions.reference });
    }

    return output;
  }

  // Additional links
  getAdditionalLinks(options: MdOptions = defaultOptions) {
    const { headingSize = defaultOptions.headingSize, hasHeading = defaultOptions.hasHeading } = options;
    let output: json2md.DataObject[] = [];
    const tags = this._getTags().filter((tag) => tag.tag === "see");

    if (hasHeading && tags.length) {
      output.unshift({
        [headingSize]: this.pluginOptions.texts?.additionalResources ?? defaultTextsOptions.additionalResources,
      });
    }

    tags.forEach((tag) => {
      output.push({ link: { title: tag.text, source: tag.text } });
    });

    return output;
  }

  // ***************
  // ***************
  // Private methods
  // ***************
  // ***************

  // Methods
  _getMethodsList() {
    let methods: JSONOutput.DeclarationReflection[] = [];
    if (this.reflection.children) {
      const methodKinds = [KindTypes.method];
      methods = this.reflection.children
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

  _getMethod(name: string) {
    const methods = this._getMethodsList();
    return methods.find((m) => m.name === name);
  }

  // Parameters
  _getParametersList() {
    const signature = this._getCallSignature();
    return signature?.parameters || [];
  }

  _getParameter(name: string) {
    const parameters = this._getParametersList();
    return parameters.find((p) => p.name === name);
  }

  // Signature
  _getCallSignature() {
    const parametersKinds = ["Call", "Constructor"];

    // Methods
    if (this.reflection.signatures) {
      return this.reflection.signatures?.find((signature) => !!signature);
    }

    // Class / Function
    if (this.reflection.children) {
      return this.reflection.children
        ?.find((child) => parametersKinds.includes(child.kindString || ""))
        ?.signatures?.find((signature) => !!signature);
    }
    return this.reflection as JSONOutput.SignatureReflection;
  }

  // Source
  _getSource() {
    return this.reflection.sources?.find((signature) => !!signature) || undefined;
  }

  // Tags
  _getTags() {
    return this.reflection.comment?.tags || [];
  }

  // Language
  _getLanguage() {
    const source = this._getSource();
    return source?.fileName?.split(".").pop() || "tsx";
  }

  // Types
  _getTypesReferencesList() {
    const methods = this._getMethodsList();
    const methodTypeRefs = methods
      .map((method) => method.type)
      .filter((typeObj) => typeObj?.type === "reference" && "name" in typeObj && "id" in typeObj);

    const parameters = this._getParametersList();
    const paramTypeRefs = parameters
      .map((param) => param.type)
      .filter((typeObj) => typeObj?.type === "reference" && "name" in typeObj && "id" in typeObj);

    return [...methodTypeRefs, ...paramTypeRefs]
      .map((type) => {
        if (type && "id" in type) {
          return this.reflectionTree.find((reflection) => reflection.id === type.id);
        }
        return undefined;
      })
      .filter((ref) => !!ref) as Pick<JSONOutput.DeclarationReflection, "id" | "name" | "kind" | "kindString">[];
  }

  _getTypeReference(
    type:
      | JSONOutput.ParameterReflection["type"]
      | JSONOutput.ReflectionType
      | JSONOutput.SomeType
      | JSONOutput.SignatureReflection
      | undefined,
  ) {
    if (type && "id" in type && type.id !== this.reflection.id) {
      return this.reflectionTree.find((reflection) => reflection.id === type.id);
    }
    return undefined;
  }

  _getLinkedType(
    type:
      | JSONOutput.ParameterReflection["type"]
      | JSONOutput.ReflectionType
      | JSONOutput.SomeType
      | JSONOutput.SignatureReflection
      | undefined,
    isQuote?: boolean,
  ): string {
    const name = getType(type, this.packageLink, this.reflectionTree);

    if (isQuote) {
      return getMdQuoteText(name);
    }
    return name;
  }

  // Variable, Enum, Type
  _getStructureView() {
    const value = this.reflection;
    const type = value?.type;
    if (type && "declaration" in type && type.declaration?.children?.length) {
      return type.declaration.children.map<[string, string]>((child) => {
        const signature = child?.signatures?.[0];

        return [child.name, unSanitizeHtml(getType(signature || child.type, "", [], true, false))];
      });
    }
    if (value && "children" in value && value?.children?.length) {
      return value.children.map<[string, string]>((child) => [
        child.name,
        child.defaultValue || unSanitizeHtml(getType(child.type, "", [], true, false)),
      ]);
    }
    if (this.reflection.name === "ExtractError") {
      console.log(1, value);
      console.log(2, type);
    }

    return unSanitizeHtml(getType(type, "", [], true, false));
  }

  // Content
  _getReturnType(): json2md.DataObject[] {
    const signature = this._getCallSignature();
    const tags = this._getTags();
    const returnTag = tags?.find(({ tag }) => tag === "returns");
    const type = this._getLinkedType(signature?.type, true);
    const returnsText = this.pluginOptions.texts?.returns ?? defaultTextsOptions.returns;

    const getReturnResponse = (value: string) => `${returnsText} ${value}`;

    if (returnTag && returnTag.text) {
      return [{ p: getReturnResponse(returnTag.text) }];
    }

    return [{ p: getReturnResponse(type) }];
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
}
