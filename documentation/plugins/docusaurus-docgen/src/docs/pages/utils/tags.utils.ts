import { JSONOutput } from "typedoc";

export const parseTag = (
  tag: JSONOutput.CommentTag,
  hasTitle?: boolean,
): { description: string; title: string; raw: JSONOutput.CommentTag } => {
  const content = tag.content
    .map(({ kind, text }) => {
      if (kind === "code") {
        return `\n${text}\n`;
      }
      return text;
    })
    .join("");

  if (hasTitle) {
    const [title, ...description] = content.split("\n");
    return {
      title,
      description: description.join("\n"),
      raw: tag,
    };
  }
  return {
    title: "",
    description: content,
    raw: tag,
  };
};

export const getTag = (
  comment: JSONOutput.DeclarationReflection["comment"],
  name: `@${string}`,
  hasTitle?: boolean,
) => {
  const tags = comment?.blockTags?.filter((blockTag) => blockTag.tag === name) || [];

  return tags.map((tag) => parseTag(tag, hasTitle));
};
