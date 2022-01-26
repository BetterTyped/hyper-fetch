import { JSONOutput } from "typedoc";
import { trace } from "../../utils/log.utils";

export const getDocumentation = (data: JSONOutput.DeclarationReflection): string | null => {
  switch (data.kindString) {
    case "array":
      return "";
    default:
      trace(`Cannot generate documentation for ${data.name}.`);
      trace(data);
      return null;
  }
};
