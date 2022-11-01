import { PagePropsType } from "types/page.types";

export const getPosition = ({ reflection }: PagePropsType) => {
  const { comment } = reflection;
  const tags = comment?.blockTags || [];
  const position = tags.find((blockTag) => blockTag.tag === "@position");

  if (!position?.content || Number.isNaN(Number(position?.content?.[0]?.text))) return null;

  return Number(position.content[0].text);
};
