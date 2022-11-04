import { JSONOutput } from "typedoc";

export const getStatusIcon = (reflection: JSONOutput.DeclarationReflection) => {
  const { comment } = reflection;

  if (!comment) return "";

  const tags = (comment.blockTags || []).map((blockTag) => blockTag.tag);

  if (tags.includes("@alpha")) {
    return "⚠️ ";
  }
  if (tags.includes("@beta")) {
    return "🚧 ";
  }
  if (tags.includes("@experimental")) {
    return "🧪 ";
  }
  if (tags.includes("@deprecated")) {
    return "⛔️ ";
  }

  return ``;
};
