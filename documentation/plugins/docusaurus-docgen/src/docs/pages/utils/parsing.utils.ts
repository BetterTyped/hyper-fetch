import { JSONOutput } from "typedoc";

export const getCallPreview = (signature: JSONOutput.SignatureReflection) => {
  const { name } = signature;

  const typeSignatures =
    signature.typeParameter?.length && signature.typeParameter.map((param) => param.name);
  const typeSignature = typeSignatures ? `<${typeSignatures.join(", ")}>` : "";

  const callSignatures =
    signature.parameters?.length &&
    signature.parameters.map((param, index) =>
      // eslint-disable-next-line no-nested-ternary
      param.flags?.isRest
        ? `...${param.name}`
        : param.name === "__namedParameter"
        ? `params$${index}`
        : param.name,
    );
  const callSignature = callSignatures ? callSignatures.join(", ") : "";

  return [name, typeSignature, callSignature];
};
